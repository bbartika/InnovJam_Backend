const express = require("express");
const router = express.Router();

const {
    assignAssessment,
    reassignAssessment,
    removeAssignedAssessment,
    udpateAssignedAssessment,
    getAssignAssessmentByUserIdAndAssessmentId,
    getAllAssignedAssessmentByAssessmentId,
    getAssignedAssessmentsByUserIdAndCourseId,
    checkAllInProgressAssessments
} = require("../controllers/assignAssessmentControllers");
const validateObjectIdMiddleware = require('../middleware/mongoIdVerification');

router.post('/assignassessment', assignAssessment);
router.put('/reassignassessment', reassignAssessment);
router.get('/get-assessmentbycourse', getAssignedAssessmentsByUserIdAndCourseId);
router.get('/get-assessment', getAssignAssessmentByUserIdAndAssessmentId);
router.get('/get-assessment-by-assessmentId/:assessmentId', getAllAssignedAssessmentByAssessmentId);
router.put('/update-assessment/:id', validateObjectIdMiddleware, udpateAssignedAssessment);
router.put("/update-remaining-time", checkAllInProgressAssessments); // assigning id 
router.delete('/remove-assessment/:id', validateObjectIdMiddleware, removeAssignedAssessment);


module.exports = router;