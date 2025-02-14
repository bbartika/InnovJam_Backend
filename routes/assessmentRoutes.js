const express = require("express");
const router = express.Router();
const { removeAssessment,
  getQuestionsBasedOnAssessmentId,
  getAllAssessments,
  getAssessmentById,
  getQuestionsForAssessment,
  updateQuestion_Temparature,
  createAssessment } = require('../controllers/createExamController');
const validateObjectIdMiddleware = require('../middleware/mongoIdVerification')

router.post('/createassesment', createAssessment);
router.get('/getassessment/:id', validateObjectIdMiddleware, getAssessmentById);
router.get('/getquestions/:id', validateObjectIdMiddleware, getQuestionsBasedOnAssessmentId);
router.get('/getquestionsforassessment/:id', validateObjectIdMiddleware, getQuestionsForAssessment);
router.get('/getallassessments/:course_id', getAllAssessments);
router.put('/updatequestiontemparature/:id', validateObjectIdMiddleware, updateQuestion_Temparature);
router.delete('/removeassessment/:id', validateObjectIdMiddleware, removeAssessment);

module.exports = router;
