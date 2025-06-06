const express = require('express');
const router = express.Router();

const { studentAnswerResponse, updateStudentAnswer, getAllStudentAnswers, getStudentAnswerById, feebackByAssessor, getStudentAnswerByQuestionId } = require('../controllers/studentAnswerControllers');
const validateObjectIdMiddleware = require('../middleware/mongoIdVerification');

router.post('/create', studentAnswerResponse);
router.put('/update/:id', validateObjectIdMiddleware, updateStudentAnswer);
router.get('/getanswers', getAllStudentAnswers);
router.get('/getanswerbyquestion', getStudentAnswerByQuestionId);
router.get('/getanswer/:id', validateObjectIdMiddleware, getStudentAnswerById);
router.put('/feedbackbyassessor', feebackByAssessor);

module.exports = router;