import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

const createToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate required fields (check for empty strings too)
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Validate password length
    if (password.trim().length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const user = await User.create({ 
      name: name.trim(), 
      email: email.trim().toLowerCase(), 
      passwordHash 
    });
    const token = createToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: err.message || 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password.trim(), user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = createToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || 'Login failed' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  res.json({ user: req.user });
});

// Update user profile
router.put('/profile', authRequired, async (req, res) => {
  try {
    const { name, subjects, classes, phone, age, qualification, teacherId } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (subjects !== undefined) updateData.subjects = subjects;
    if (classes !== undefined) updateData.classes = classes;
    if (phone !== undefined) updateData.phone = phone;
    if (age !== undefined) updateData.age = age;
    if (qualification !== undefined) updateData.qualification = qualification;
    if (teacherId !== undefined) updateData.teacherId = teacherId;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    res.json({ user });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: err.message || 'Failed to update profile' });
  }
});

export default router;


