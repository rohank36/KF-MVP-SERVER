const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");
const whitelistChecker = require("../utils/whitelistChecker");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//Create and assign JWT token to user for authentication
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 //converting to miliseconds
    ),
    httpOnly: true,
    //sameSite: "Strict",
    secure: process.env.NODE_ENV === "production" ? true : false, //cookie only sent on https when NODE_ENV === prod
  };

  //if (process.env.NODE_ENV === "production") cookie.options.secure = true;

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.betaUserCheck = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const isBetaUser = await whitelistChecker.isEmailWhitelisted(email);

  if (!isBetaUser) {
    return next(new AppError("KaizenFlo only open for beta users", 401));
  }
  next();
});

exports.signUp = catchAsync(async (req, res, next) => {
  //Create user in DB based on necessary fields from client req
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    gym: req.body.gym,
  });

  //Send JWT to user for auth
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check if email and password exist in DB
  if (!email || !password) {
    return next(new AppError("Email or password does not exist", 400));
  }

  //find user based on unique email
  const user = await User.findOne({ email: email }).select("+password");

  //Verify that user exists and password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect Email or Password", 401));
  }

  //Send JWT to user for login auth
  createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //Get token associated with authenticated user
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  //If no token exists, user not logged in
  if (!token) {
    return next(
      new AppError(
        "You are not logged in. Please login to access this page",
        401
      )
    );
  }

  //Verify token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(
        new AppError("Your token has expired! Please log in again", 401)
      );
    }
  }

  //Get user associated with the ID in the package of the token
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("Your user does not exist", 401));
  }

  //Check if user changed password JWT was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "You recently changed your password! Please log in again",
        401
      )
    );
  }

  req.user = currentUser;
  next();
});
