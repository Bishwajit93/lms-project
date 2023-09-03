import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { isUsernameAvailable, generateSuggestedUsername } from '../utils/userNameUtils.js';
import authenticateUser from '../middleware/authMiddleware.js'; // Import the auth middleware

const router = express.Router();

// Get user profile
router.get('/api/v1/profile/:userId', authenticateUser, async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userProfile = {
      id: user.rows[0].id,
      first_name: user.rows[0].first_name,
      last_name: user.rows[0].last_name,
      username: user.rows[0].username,
      email: user.rows[0].email,
      // Include other profile information here
    };

    res.status(200).json(userProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update user profile
router.put('/api/v1/profile/:userId', authenticateUser, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { first_name, last_name, username, email /* other fields */ } = req.body;

    const isAvailable = await isUsernameAvailable(username, userId);

    if (!isAvailable) {
      const suggestedUsername = await generateSuggestedUsername(username);
      return res.status(400).json({ message: 'Username is already taken', suggestedUsername });
    }

    // Add email validation here:
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    const updatedUser = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, username = $3, email = $4 WHERE id = $5 RETURNING *',
      [first_name, last_name, username, email, userId]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userProfile = {
      id: updatedUser.rows[0].id,
      first_name: updatedUser.rows[0].first_name,
      last_name: updatedUser.rows[0].last_name,
      username: updatedUser.rows[0].username,
      email: updatedUser.rows[0].email,
      // Include other profile information here
    };

    res.status(200).json(userProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete user profile
router.delete('/api/v1/profile/:userId', authenticateUser, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { username, email, password } = req.body;

    const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'The user not found' });
    }

    const storedUsername = user.rows[0].username;
    const storedEmail = user.rows[0].email;

    const isUsernameMatch = storedUsername === username;
    const isEmailMatch = storedEmail === email;
    const isPasswordMatch = await bcrypt.compare(password, user.rows[0].password);

    if (!isUsernameMatch || !isEmailMatch || !isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Please provide correct username, email, and password.' });
    }

    const deletedUser = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);

    res.status(200).json({ message: 'User profile deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
