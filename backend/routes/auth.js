const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validate');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);

router.get('/seed-users', async (req, res) => {
    const User = require('../models/User');
    
    const seedUsers = [
        { fullName: "Michael Scott", email: "manager@demo.com", password: "demo123!", role: "Manager" },
        { fullName: "Bob Builder", email: "tech@demo.com", password: "demo123!", role: "Technician" },
        { fullName: "John Employee", email: "staff@demo.com", password: "demo123!", role: "Employee" },
        { fullName: "Karen Karenopoulou", email: "customer@demo.com", password: "demo123!", role: "Customer" }
    ];

    try {
        let report = [];
        for (const user of seedUsers) {
            const exists = await User.findOne({ email: user.email });
            if (!exists) {
                await User.create(user); // Password hashing happens in Model
                report.push(`Created: ${user.email}`);
            } else {
                report.push(`Skipped: ${user.email}`);
            }
        }
        res.send(`<pre>${report.join('\n')}</pre>`);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;