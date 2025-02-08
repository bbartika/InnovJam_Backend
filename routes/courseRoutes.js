const express = require('express');
const router = express.Router();

const { createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    getCoursesByUserId,
    getAllLearnersByCourse
} = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');
const validateObjectIdMiddleware = require('../middleware/mongoIdVerification')

router.post('/create', createCourse);
router.get('/getcourses', getAllCourses);
router.get('/courses/:id', validateObjectIdMiddleware, getCourseById);
router.get('/courses/user/:userId', getCoursesByUserId);
router.get('/learners/:id', validateObjectIdMiddleware, getAllLearnersByCourse);
router.put('/update/:id', validateObjectIdMiddleware, updateCourse);
router.delete('/remove/:id', validateObjectIdMiddleware, deleteCourse);


module.exports = router;
