// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginRateLimiter } = require('../middleware/loginRateLimiter');

router.get('/login', authController.renderLogin);
router.post('/login', loginRateLimiter, authController.login);
router.post('/logout', authController.logout);

module.exports = router;
