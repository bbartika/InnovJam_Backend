const express = require('express');
const router = express.Router();

const { createGradeRange, getGradeRangeByGradeId, removeGradeRange, updateGradeRange } = require('../controllers/gradeRangeControllers');
const validateObjectIdMiddleware = require('../middleware/mongoIdVerification')

router.post('/create', createGradeRange);
router.get('/getgrade/:grade_id', getGradeRangeByGradeId);
router.put('/update/:id', validateObjectIdMiddleware, updateGradeRange);
router.delete('/remove/:id', validateObjectIdMiddleware, removeGradeRange);

module.exports = router