const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validate');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);

router.get('/seed-users', async(req, res) => {
    const User = require('../models/User');
    const bcrypt = require('bcrypt');

    try{
        await User.deleteMany({});
        console.log('Old Users deleted succesfully.');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('demo123!', salt);

        const users = [
            {
            fullName : "Michael Scott",
            email: "manager@demo.com",
            password: hashedPassword,
            role: "Manager"
            }, 
            
            {
            fullName: "Bob Builder",
            email: "tech@demo.com",
            password: hashedPassword,
            role: "Technician"
            },

            {
            fullName: "John Employee",
            email: "staff@demo.com",
            password: hashedPassword,
            role: "Employee"
            },

            {
            fullName: "Karen Karenopoulou",
            email: "customer@demo.com",
            password: hashedPassword,
            role: "Customer"
            }        
          ];

          await User.insertMany(users);
          console.log('New users created succesfully!');

          res.send(`
            <h1> Seeding Succesfull.</h1>
            <p> Users created: </p>
            <ul> 
            <li>Manager: manager@demo.com / demo123!</li>
            <li>Employee: staff@demo.com / demo123!</li>
            <li>Technician: tech@demo.com / demo123! </li>
            <li>Customer: customer@demo.com / demo123!</li>
            </ul>
            `);
    }

    catch (error){
        console.error(error);
        res.status(500).send('Error during seeding proccess: ' + error.message);
    }
})

module.exports = router;