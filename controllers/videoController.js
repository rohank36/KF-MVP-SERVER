const Video = require("../models/videoModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../utils/s3");
const Email = require("../utils/email");

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    //acl: "public-read",
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
  }),
});

const coachUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const videoTitle = req.body.videoTitle || "untitled";
      cb(null, Date.now().toString() + "-" + videoTitle + "-reviewed");
    },
  }),
});

exports.uploadUserVideo = upload.single("video");
exports.uploadCoachVideo = coachUpload.single("video");

exports.sendUserVideo = catchAsync(async (req, res, next) => {
  const user = req.user;

  if (!req.file) {
    return next(new AppError("You must upload a file", 400));
  }

  const newVideo = await Video.create({
    user: user.id,
    url: req.file.location,
    s3ObjectKey: req.file.key,
    ...req.body,
  });

  const coachEmail = req.body.coachEmail;
  let emailSubject = `${req.body.videoTitle} from ${user.fullName}`;
  emailSubject = emailSubject.toString();
  const link = `https://kf-mvp-client.vercel.app/coachDashboard`;
  const videoID = newVideo.id;
  const message = `Hello!\n\n${user.fullName} has sent you this video for review.\n\nClick the link to go to the coach's dashboard, record your annotations and commentary on their video, and send it back to ${user.firstName}.\n\nPlease note that you must allow the browser to record your screen and audio. Additionally, please use Google Chrome or Microsoft Edge as your browser.\n\nClick Here: ${link}\n\nVideo ID: ${videoID}\n\nOsss,\nKaizenFlo Team`;

  try {
    /*
    await sendEmail({
      email: coachEmail,
      subject: emailSubject,
      message,
    });
    */
    await new Email(
      coachEmail,
      link,
      user.fullName,
      message,
      emailSubject
    ).sendVideoToCoach();
  } catch (err) {
    alert("Error sending email to coach");
    console.log(err);
  }

  res.status(200).json({
    status: "success",
    newVideo,
  });
});

exports.sendCoachVideo = catchAsync(async (req, res, next) => {
  const video_id = req.body.video_id;

  const video = await Video.findById(video_id);

  if (!video) {
    return next(new AppError("No video found with that ID", 404));
  }

  const user = video.user;

  const newVideo = await Video.create({
    user: user,
    url: req.file.location,
    s3ObjectKey: req.file.key,
    isReviewed: true,
    videoTitle: video.videoTitle,
    coachEmail: video.coachEmail,
    compName: video.compName,
    round: video.round,
    opponentName: video.opponentName,
    ...req.body,
  });

  //Delete original video from s3 and mongo
  s3.deleteObject(
    {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: video.s3ObjectKey,
    },
    function (err, data) {
      if (err) {
        console.log(err, err.stack);
        alert(err);
      }
    }
  );

  await Video.deleteOne({ _id: video_id });

  res.status(200).json({
    status: "success",
    newVideo,
  });
});

exports.getUserVideo = catchAsync(async (req, res, next) => {
  const video_id = req.body.video_id;

  const video = await Video.findById(video_id);

  if (!video) {
    return next(new AppError("No video found with that ID", 404));
  }

  if (video.isReviewed) {
    return next(new AppError("This video has already been reviewed", 404));
  }

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: video.s3ObjectKey,
    Expires: 432000, //5 days in seconds
  };

  const signedUrl = s3.getSignedUrl("getObject", params);

  res.status(200).json({
    status: "success",
    video,
    signedUrl: signedUrl,
  });
});

exports.getUserVideos = catchAsync(async (req, res, next) => {
  const userID = req.user.id;

  const videos = await Video.find({
    user: userID,
    isReviewed: true,
  });

  if (!videos) {
    return next(new AppError("No videos found for this user", 404));
  }

  const videosWithSignedUrls = videos
    .map((video) => {
      if (video.s3ObjectKey && video.isReviewed) {
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: video.s3ObjectKey,
          Expires: 432000, //5 days in seconds
        };

        const signedUrl = s3.getSignedUrl("getObject", params);

        return {
          ...video._doc, // Spread all other video properties
          signedUrl, // Add the new signedUrl property
        };
      }
      return null;
    })
    .filter((video) => video !== null);

  res.status(200).json({
    status: "success",
    videos: videosWithSignedUrls,
  });
});
