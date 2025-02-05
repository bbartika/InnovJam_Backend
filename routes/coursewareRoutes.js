const express = require('express');
const router = express.Router();
const coursewareController = require('../controllers/coursewareController');
const upload = require('../config/multer');

// Route for uploading courseware
router.post('/upload', upload.single('file'), coursewareController.uploadCourseware);

// Route for fetching all courseware
router.get('/', coursewareController.getAllCourseware);

// Route for fetching courseware by ID
router.get('/:id', coursewareController.getCoursewareById);

// Route for fetching courseware by course name
router.get('/course/:courseName', coursewareController.getCoursewareByCourseName);

module.exports = router;
