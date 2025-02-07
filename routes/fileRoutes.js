const express = require('express');
const router = express.Router();

const upload = require('../middleware/uploadMiddleware');
const { uploadFile, getFilesByClass, deleteFileById, updateFile } = require('../controllers/fileController');
const { createExam } = require('../controllers/createExamController');
const validateObjectIdMiddleware = require('../middleware/mongoIdVerification')

router.post('/upload-assesmentFiles', upload, uploadFile);
router.get('/getfiles/:courseId', getFilesByClass)
router.delete('/remove/:id', validateObjectIdMiddleware, deleteFileById);
router.put('/update-file/:fileId', updateFile);
router.post('/create-exam/:id', validateObjectIdMiddleware, createExam);

module.exports = router;
