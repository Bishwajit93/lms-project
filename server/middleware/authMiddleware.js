// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const jwtSecret = process.env.JWT_SECRET;


export default function authenticateUser(req, res, next) {
  // Get the token from the request headers
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ message: 'Authorization denied. No token provided.' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user data to the request object
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid.' });
  }
}



export function generateToken(payload, expiresIn = '1h') {
  return jwt.sign(payload, jwtSecret, { expiresIn });
}


export function verifyToken(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Token not provided' });
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token is invalid' });
    } else {
      // Token is valid, store the decoded token data in the request object for later use
      req.user = decoded;
      next();
    }
  });
}
