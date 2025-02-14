const express = require('express');
const router = express.Router();

const { createAiModel, updateAiModel, getAiModelById, getAllAiModel, removeAiModel } = require('../controllers/aiModelControllers');
const validateObjectIdMiddleware = require('../middleware/mongoIdVerification');

router.post('/create', createAiModel);
router.put('/update/:id', validateObjectIdMiddleware, updateAiModel);
router.get('/get/:id',validateObjectIdMiddleware, getAiModelById);
router.get('/getall', getAllAiModel);
router.delete('/remove/:id', validateObjectIdMiddleware, removeAiModel);

module.exports = router;