const express = require('express');
const router = express.Router();

const { removeArchiveStudentResponse,
    getAllArchiveStudentResponseByAssessmentId,
    getArchiveStudentResponseByUserIdAndAssessentId , archiveStudentResponse} = require('../controllers/archiveStudentResponseControllers');
    
router.get('/getall', getAllArchiveStudentResponseByAssessmentId);
router.get('/getbyuserid', getArchiveStudentResponseByUserIdAndAssessentId);    
router.delete('/remove', removeArchiveStudentResponse);
router.get('/getarchive', archiveStudentResponse);

module.exports = router;