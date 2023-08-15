//Util file to configure and create an AWS S3 instance

const AWS = require("aws-sdk");

//Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

//Create an S3 instance
const s3 = new AWS.S3();

module.exports = s3;
