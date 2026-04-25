const multer = require('multer');
const path = require('path');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = multerS3({
  s3,
  bucket: process.env.AWS_S3_BUCKET,
  // contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const randomString = Math.random().toString(36).substring(2, 15);
    cb(null, Date.now() + '_' + randomString + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

module.exports = upload;

