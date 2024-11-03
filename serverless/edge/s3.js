const AWS = require('aws-sdk');
require('dotenv').config();
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_ENDPOINT,
  s3ForcePathStyle: true,
  region: 'us-east-1'
});

const fetchFileFromS3 = async (filename) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,  // Name of your S3 bucket from environment variable
    Key: filename                     // The file requested by the user
  };

  try {
    const data = await s3.getObject(params).promise();

    // Return only the file content as a Base64 encoded string
    return data.Body.toString();
  } catch (error) {
    console.error(`Error fetching file ${filename} from S3:`, error);
    throw new Error('Failed to fetch the file from S3');
  }
};

module.exports = { fetchFileFromS3 };
