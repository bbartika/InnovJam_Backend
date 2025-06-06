const express = require('express');
const router = express.Router();

const { createGrade,
    updateGrade,
    removeGrade,
    getAllGrades,
    getGradeById,
    getAllGradesStatusTrue } = require('../controllers/gradeControllers');
const validateObjectIdMiddleware = require('../middleware/mongoIdVerification')

router.post('/create', createGrade);
router.put('/update/:id', validateObjectIdMiddleware, updateGrade);
router.delete('/remove/:id', validateObjectIdMiddleware, removeGrade);
router.get('/getgrades', getAllGrades);
router.get('/getgrade/:id', validateObjectIdMiddleware, getGradeById);
router.get('/getgradesstatus', getAllGradesStatusTrue);

module.exports = router;