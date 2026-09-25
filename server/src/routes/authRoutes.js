const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout, getMe, updateProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
