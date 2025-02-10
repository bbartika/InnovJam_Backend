const express = require('express');
const router = express.Router()
const { getStudentAndAssessmentDetails } = require('../controllers/assessorControlles');

router.get('/getstudentandassessmentdetails', getStudentAndAssessmentDetails)

module.exports = router;