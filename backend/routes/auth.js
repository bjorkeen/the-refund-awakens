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
    const seedUsers = [
    { fullName: "Michael Scott", email: "manager@demo.com", password: "demo123!", role: "Manager" },

    // Technicians by specialty (match your ticket product types exactly)
    { fullName: "Tech Smartphone", email: "tech.smartphone@demo.com", password: "demo123!", role: "Technician", specialty: "Smartphone" },
    { fullName: "Tech Laptop", email: "tech.laptop@demo.com", password: "demo123!", role: "Technician", specialty: "Laptop" },
    { fullName: "Tech TV", email: "tech.tv@demo.com", password: "demo123!", role: "Technician", specialty: "TV" },
    { fullName: "Tech Other", email: "tech.other@demo.com", password: "demo123!", role: "Technician", specialty: "Other" },

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