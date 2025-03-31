const express = require("express");
const router = express.Router();


const { removeAssessment,
  getQuestionsBasedOnAssessmentId,
  getAllAssessments,
  getAssessmentById,
  getQuestionsForAssessment,
  updateQuestion_Temperature,
  createAssessment,
  updateAssessmentStatus } = require('../controllers/createExamController');
const validateObjectIdMiddleware = require('../middleware/mongoIdVerification')

router.post('/createassesment', createAssessment);
router.get('/getassessment/:id', validateObjectIdMiddleware, getAssessmentById);
router.get('/getquestions/:id', validateObjectIdMiddleware, getQuestionsBasedOnAssessmentId);
router.get('/getquestionsforassessment/:id', validateObjectIdMiddleware, getQuestionsForAssessment);
router.get('/getallassessments/:course_id', getAllAssessments);
router.put('/updatequestiontemperature', updateQuestion_Temperature);
router.put('/updateassessmentstatus/:id', validateObjectIdMiddleware, updateAssessmentStatus); //assessment id
router.delete('/removeassessment/:id', validateObjectIdMiddleware, removeAssessment);

module.exports = router;
