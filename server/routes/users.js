import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { isUsernameAvailable, generateSuggestedUsername } from '../utils/userNameUtils.js';
import authenticateUser from '../middleware/authMiddleware.js'; // Import the auth middleware
import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const router = express.Router();

// User Registration
router.post('/api/v1/users/register', async (req, res) => {
  try {
    const { first_name, last_name, username, email, password, role } = req.body;
    const defaultRole = 'Student';

    // Check if the user already exists in the database
    const existingUser = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);

    if (existingUser.rows.length !== 0) {
      const suggestedUsername = await generateSuggestedUsername(username);
      return res.status(400).json({ message: 'Username already taken', suggestedUsername });
    }

    // Check if a password is provided
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Check if the username is available
    const isAvailable = await isUsernameAvailable(username);
    if (!isAvailable) {
      const suggestedUsername = await generateSuggestedUsername(username);
      return res.status(400).json({ message: 'Username already taken', suggestedUsername });
    }

    // Hash the password before storing it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the user data into the database
    const newUser = await pool.query(
      `INSERT INTO users (first_name, last_name, username, email, password, role)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [first_name, last_name, username, email, hashedPassword, defaultRole]
    );

    res.status(201).json(newUser.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// User Login
router.post('/api/v1/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists in the database
    const user = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }

    // Create a JWT token with user information
    const tokenPayload = {
      userID: user.rows[0].id,
      email: user.rows[0].email,
      role: user.rows[0].role,
    };

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' });

    // Set the token as an HTTP-only cookie
    res.cookie('token', token, { httpOnly: true });

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// User Logout
router.post('/api/v1/users/logout', authenticateUser, async (req, res) => {
  try {
    // Clear the JWT token on the client-side (for example, by deleting the token cookie)
    res.clearCookie('token'); // This will remove the 'token' cookie from the client

    res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



// More user-related routes can be added here

export default router;
