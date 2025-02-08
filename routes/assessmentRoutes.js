const express = require("express");
const router = express.Router();
const { removeAssessment,
  getQuestionsBasedOnAssessmentId,
  getAllAssessments,
  createAssessment } = require('../controllers/createExamController');
const validateObjectIdMiddleware = require('../middleware/mongoIdVerification')

router.post('/createassesment', createAssessment);
router.get('/getquestions/:id', validateObjectIdMiddleware, getQuestionsBasedOnAssessmentId);
router.get('/getallassessments/:course_id', getAllAssessments);
router.delete('/removeassessment/:id', validateObjectIdMiddleware, removeAssessment);

module.exports = router;
