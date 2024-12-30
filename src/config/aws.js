const AWS = require("aws-sdk");
require('dotenv').config();
// Adjust the time offset to mitigate the time skew
AWS.config.correctClockSkew = true;
AWS.config.update({
  accessKeyId: process.env.AMZ_ACCESS_KEY,
  secretAccessKey: process.env.AMZ_SECRET_ACCESS_KEY,
  region: process.env.AMZ_REGION,
});
module.exports = {
  s3: new AWS.S3(),
};
