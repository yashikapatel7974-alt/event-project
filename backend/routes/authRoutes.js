const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateBody } = require('../validators/schemas');

const router = express.Router();

router.post('/register', validateBody('register'), authController.register);
router.post('/login', validateBody('login'), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
