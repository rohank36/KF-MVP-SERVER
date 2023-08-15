const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const userRouter = require("./routes/userRoutes");
const videoRouter = require("./routes/videoRoutes");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const cors = require("cors");

const app = express();

//To Parse Cookies for authenticated user's JWTs
app.use(cookieParser());

//Log API Calls
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//Define data format - JSON
app.use(express.json());

//Routes
app.use("/api/users", userRouter);
app.use("/api/videos", videoRouter);

//For unhandled routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//Global error handler
app.use(globalErrorHandler);

module.exports = app;
