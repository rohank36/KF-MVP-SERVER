const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const slugify = require("slugify");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    required: [true, "First Name Required"],
  },
  lastName: {
    type: String,
    trim: true,
    required: [true, "Last Name Required"],
  },
  fullName: String,
  email: {
    type: String,
    unique: true,
    required: [true, "Email Required"],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, "Email is not in a valid format"],
  },
  gym: {
    type: String,
    default: "unknown",
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Password Required"],
    minLength: [8, "Passowrd has to be at least 8 characters"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Password Confirm Required"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  activeSubscription: {
    type: Boolean,
    default: false,
  },
  videos: {
    type: [String],
  },
});

//Fix fields
userSchema.pre("save", function (next) {
  this.gym = slugify(this.gym);
  this.fullName = this.firstName + " " + this.lastName;
  next();
});

//Encrypt password for data security in DB
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

//If password was updated
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 5000;
  next();
});

//Don't find inactive users
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//Verify Password method

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//Check User.changedPasswordAt vs JWT timing for authentication security
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimeStamp;
  }
  return false;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  console.log({ resetToken }, this.passwordResetToken);

  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
