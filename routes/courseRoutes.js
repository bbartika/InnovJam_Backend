const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Route to create a new course
router.post('/create-new-course', courseController.createCourse);

// Route to get all courses details
router.get('/courses', courseController.getAllCourses);

// Route to get a course by its ID
router.get('/courses/:courseId', courseController.getCourseById); // Added the new route



// Route to edit a course assessment
router.put('/courses/assessment', courseController.editAssessment);

// Route to delete a course
router.delete('/courses/:courseId', courseController.deleteCourse);

module.exports = router;
