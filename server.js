const dotenv = require("dotenv");
//Load environment variables first before other modules
dotenv.config({ path: "./config.env" });

const mongoose = require("mongoose");
const app = require("./app");

//For uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log("UNHANDLED EXCEPTION");
  console.log(err.name, err.message);
  process.exit(1);
});

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

//Connect to DB
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log("DB Connection Successful");
  });

//Listen for requests
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${process.env.PORT}...`);
});

//For unhandled rejection promises
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION");
  console.log(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});
