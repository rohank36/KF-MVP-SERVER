const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const paymentController = require("../controllers/paymentController");
const express = require("express");
const router = express.Router();

router.post("/signup", authController.betaUserCheck, authController.signUp);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

router.route("/dashboard").get(authController.protect, userController.getUser);

/*
router.post(
  "/create-subscription",
  authController.protect,
  paymentController.createSubscription
);
*/

module.exports = router;
