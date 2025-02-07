// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Define storage options for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const filesDirectory = path.join(__dirname, '..', 'files');
    if (!fs.existsSync(filesDirectory)) {
      fs.mkdirSync(filesDirectory);  
    }
    cb(null, filesDirectory);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).single('file');  

module.exports = upload;
