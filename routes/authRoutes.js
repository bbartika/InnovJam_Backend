const express = require('express');
const { loginUser, verifyToken } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginUser);
router.get('/verify-token',  verifyToken);

module.exports = router;
