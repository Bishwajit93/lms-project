import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const router = express.Router();

// Route for user login
router.post('/api/v1/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }

    const tokenPayload = {
      userID: user.rows[0].id,
      email: user.rows[0].email,
      role: user.rows[0].role,
    };

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' });

    res.cookie('token', token, { httpOnly: true });

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
