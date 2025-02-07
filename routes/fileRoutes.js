const express = require('express');
const router = express.Router();

const upload = require('../middleware/uploadMiddleware');
const { uploadFile, getFilesByClass, deleteFileById } = require('../controllers/fileController');
const { createExam } = require('../controllers/createExamController');

router.post('/upload-assesmentFiles', upload, uploadFile);
router.get('/getfiles/:courseId', getFilesByClass)
router.delete('/delete-file/:id', deleteFileById);
router.post('/create-exam/:id', createExam);

module.exports = router;
