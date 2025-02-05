const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', authController.loginUser);
router.get('/verify-token', authMiddleware, authController.verifyToken);

module.exports = router;
