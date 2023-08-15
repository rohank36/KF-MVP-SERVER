const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const slugify = require("slugify");
const { default: isEmail } = require("validator/lib/isEmail");

const videoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  url: {
    type: String,
  },
  s3ObjectKey: {
    type: String,
  },
  videoTitle: {
    type: String,
    required: [true, "Video Title Required"],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  compName: String,
  round: String,
  opponentName: String,
  isReviewed: {
    type: Boolean,
    default: false,
  },
  coachEmail: {
    type: String,
    required: [true, "Coach's Required"],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, "Email is not in a valid format"],
  },
  annotations: [
    {
      timestamp: Number,
      content: String,
    },
  ],
  //@TODO: Include other metadeta requirements as fields later on...
});

videoSchema.pre("save", function (next) {
  if (this.opponentName) {
    this.opponentName = this.opponentName.toLowerCase();
  }

  next();
});

const Video = mongoose.model("Video", videoSchema);
module.exports = Video;
