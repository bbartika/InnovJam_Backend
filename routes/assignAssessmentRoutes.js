const express = require("express");
const router = express.Router();

const {
    assignAssessment,
    reassignAssessment,
    removeAssignedAssessment,
    udpateAssignedAssessment,
    getAssignAssessmentByUserIdAndAssessmentId,
    getAllAssignedAssessmentByAssessmentId
} = require("../controllers/assignAssessmentControllers");
const validateObjectIdMiddleware = require('../middleware/mongoIdVerification');

router.post('/assignassessment', assignAssessment);
router.post('/reassignassessment', reassignAssessment);
router.put('/update-assessment/:id', validateObjectIdMiddleware, udpateAssignedAssessment);
router.delete('/remove-assessment/:id', validateObjectIdMiddleware, removeAssignedAssessment);
router.get('/get-assessment', getAssignAssessmentByUserIdAndAssessmentId);
router.get('/get-assessment-by-assessmentId/:assessmentId', getAllAssignedAssessmentByAssessmentId);

module.exports = router;