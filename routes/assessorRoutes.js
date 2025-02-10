const express = require('express');
const router = express.Router()
const { getStudentAndAssessmentDetails, getStudentScore, getStudentAnswerResponse } = require('../controllers/assessorControlles');

router.get('/getstudentandassessmentdetails', getStudentAndAssessmentDetails)
router.get('/getstudentscore', getStudentScore)
router.get('/getstudentanswerresponse', getStudentAnswerResponse)

module.exports = router;