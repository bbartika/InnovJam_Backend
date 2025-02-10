const express = require('express');
const router = express.Router()
const { getStudentAndAssessmentDetails, getStudentScore, getStudentAnswerResponse , getAIScoreReport } = require('../controllers/assessorControlles');

router.get('/getstudentandassessmentdetails', getStudentAndAssessmentDetails)
router.get('/getstudentscore', getStudentScore)
router.get('/getstudentanswerresponse', getStudentAnswerResponse)
router.get('/getaiscorereport', getAIScoreReport)

module.exports = router;