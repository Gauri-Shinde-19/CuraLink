const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const config = require('../config');

const router = express.Router();

// Register
router.post('/register', (req, res) => {
  const { email, password, fullName, phone, userType = 'patient' } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email, password, and full name are required' 
    });
  }

  // Check if user already exists
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (row) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, config.bcrypt.rounds);

    // Insert user
    db.run(
      `INSERT INTO users (email, password, full_name, phone, user_type)
       VALUES (?, ?, ?, ?, ?)`,
      [email, hashedPassword, fullName, phone, userType],
      function(err) {
        if (err) {
          return res.status(500).json({ success: false, message: 'Error creating user' });
        }

        const token = jwt.sign(
          { id: this.lastID, email, userType },
          config.jwt.secret,
          { expiresIn: config.jwt.expiresIn }
        );

        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          token,
          userId: this.lastID,
          userType
        });
      }
    );
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required' 
    });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Compare passwords
    const passwordMatch = bcrypt.compareSync(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.user_type },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      userId: user.id,
      userType: user.user_type,
      fullName: user.full_name
    });
  });
});

// Get current user
router.get('/me', (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ success: false, message: 'No token provided' });
  }

  const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;

  jwt.verify(tokenWithoutBearer, config.jwt.secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Failed to authenticate token' });
    }

    db.get('SELECT id, email, full_name, user_type, phone FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err || !user) {
        return res.status(500).json({ success: false, message: 'Error fetching user' });
      }

      res.json({
        success: true,
        user
      });
    });
  });
});

module.exports = router;