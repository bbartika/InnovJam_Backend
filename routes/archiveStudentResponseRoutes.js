const express = require('express');
const router = express.Router();

const { removeArchiveStudentResponse,
    getAllArchiveStudentResponseByAssessmentId,
    getArchiveStudentResponseByUserIdAndAssessentId} = require('../controllers/archiveStudentResponseControllers');
    
router.get('/getall', getAllArchiveStudentResponseByAssessmentId);
router.get('/getbyuserid', getArchiveStudentResponseByUserIdAndAssessentId);    
router.delete('/remove', removeArchiveStudentResponse);

module.exports = router;