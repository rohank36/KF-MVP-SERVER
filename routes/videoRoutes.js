const authController = require("../controllers/authController");
const videoController = require("../controllers/videoController");
const express = require("express");
const router = express.Router();

router.post(
  "/sendUserVideo",
  authController.protect,
  videoController.uploadUserVideo,
  videoController.sendUserVideo
);

router.post("/coachDashboard", videoController.getUserVideo);

router.post(
  "/sendCoachVideo",
  videoController.uploadCoachVideo,
  videoController.sendCoachVideo
);

router.get(
  "/getUserVideos",
  authController.protect,
  videoController.getUserVideos
);

module.exports = router;
