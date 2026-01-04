const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, adminCreateUser } = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validate');

const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);

router.get('/me', protect, getMe);

router.post('/create-user', protect, authorize('Admin'), adminCreateUser);

module.exports = router;