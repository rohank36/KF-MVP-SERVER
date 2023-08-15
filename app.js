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
const path = require("path");

const app = express();

//CORS Handling
const corsOptions = {
  origin: "https://kf-mvp-client.vercel.app/login",
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

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

app.get("/", (req, res) => {
  res.send("KaizenFlo MVP-V1 Server");
});

app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "favicon.ico"));
});

//For unhandled routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//Global error handler
app.use(globalErrorHandler);

module.exports = app;
