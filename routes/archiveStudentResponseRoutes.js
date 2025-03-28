const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { removeArchiveStudentResponse,
    getAllArchiveStudentResponseByAssessmentId,
    getArchiveStudentResponseByUserIdAndAssessentId, archiveStudentResponse, getStudentArchivedScore } = require('../controllers/archiveStudentResponseControllers');

router.get('/getall', getAllArchiveStudentResponseByAssessmentId);
router.get('/getbyuserid', getArchiveStudentResponseByUserIdAndAssessentId);
router.delete('/remove', removeArchiveStudentResponse);
router.get('/getarchive', archiveStudentResponse);
router.get('/getstudentscore', getStudentArchivedScore)

module.exports = router;