const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads');
      //console.log('dir--->', uploadDir);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        //console.log('filename--->', file.originalname);
      const randomString = Math.random().toString(36).substring(2, 15);
      cb(null, Date.now()+ '_' + randomString + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

module.exports = upload

