const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateToken = (id, role) => {
  return jwt.sign({ userId: id, role }, process.env.JWT_SECRET || 'secret_key', {
    expiresIn: '1d',
  });
};

exports.register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    
    const user = await User.create({
      fullName,
      email,
      password,
      role: 'Customer'
    });

    const token = generateToken(user._id, user.role);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // pass check
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Admin Create User (Internal)
exports.adminCreateUser = async (req, res) => {
  try {
    const { fullName, email, password, role, specialty } = req.body;

    // 1. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Create user
    const user = await User.create({
      fullName,
      email,
      password,
      role: role || 'Customer',
      specialty: role === 'Technician' ? specialty : null 
    });

    res.status(201).json({
      success: true,
      message: `User ${user.fullName} created as ${user.role}`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        specialty: user.specialty
      }
    });

  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ message: 'Server error creating user' });
  }
};

// Get All Users (Admin Only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Delete User (Admin & Manager)
exports.deleteUser = async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);

    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToDelete._id.toString() === req.user.userId) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    if (req.user.role === 'Manager' && userToDelete.role === 'Admin') {
        return res.status(403).json({ message: 'Managers cannot delete Administrators' });
    }

    await userToDelete.deleteOne();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// Update User (Admin & Manager)
exports.updateUser = async (req, res) => {
  try {
    const { fullName, email, role, specialty } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: 'Email already exists' });
        }
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.role = role || user.role;
    
    if (user.role === 'Technician') {
        user.specialty = specialty;
    } else {
        user.specialty = null;
    }

    await user.save();

    res.status(200).json({ 
        success: true, 
        message: 'User updated successfully',
        user: {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            specialty: user.specialty
        }
    });

  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};