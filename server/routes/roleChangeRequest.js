// routes/roleChangeRequests.js
import express from 'express';
import pool from '../config/database.js';
import { isStudent, isStudentBody, isTA, isInstructor } from '../middleware/rbacMiddleware.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a role change request (Students and Student Body)
router.post('/api/v1/role-change-requests', authenticateUser, async (req, res) => {
  try {
    const { course_id, from_role, to_role } = req.body;

    // Ensure that the user's current role is either "Student" or "Student Body"
    if (!isStudent(req.user) && !isStudentBody(req.user)) {
      return res.status(403).json({ message: 'Access denied. Requires Student or Student Body role.' });
    }

    // Validate the desired role (to_role)
    if (to_role !== 'TA' && to_role !== 'Instructor') {
      return res.status(400).json({ message: 'Invalid desired role. Must be "TA" or "Instructor".' });
    }

    // Check if a request for the same user and course already exists
    const existingRequest = await pool.query(
      `SELECT * FROM role_change_requests
      WHERE user_id = $1 AND course_id = $2 AND request_status = 'Pending'`,
      [req.user.id, course_id]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(409).json({ message: 'Request already pending for this user and course.' });
    }

    // Insert the role change request into the database
    const newRequest = await pool.query(
      `INSERT INTO role_change_requests (user_id, course_id, from_role, to_role, request_status)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, course_id, from_role, to_role, 'Pending']
    );

    // Your existing logic for role change can go here if needed

    return res.status(201).json(newRequest.rows[0]);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});


// Get a list of pending role change requests (Instructors only)
router.get('/api/v1/role-change-requests/pending', authenticateUser, isInstructor, async (req, res) => {
  try {
    // Query the database to retrieve pending requests
    const pendingRequests = await pool.query(
      `SELECT * FROM role_change_requests WHERE request_status = 'Pending'`
    );

    return res.status(200).json(pendingRequests.rows);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});


// Approve a role change request (Instructors only)
router.put('/api/v1/role-change-requests/approve/:requestId', authenticateUser, isInstructor, async (req, res) => {
  try {
    const requestId = req.params.requestId;

    // Query the database to update the request status to 'Approved'
    const updatedRequest = await pool.query(
      `UPDATE role_change_requests SET request_status = 'Approved' WHERE request_id = $1 RETURNING *`,
      [requestId]
    );

    if (updatedRequest.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Implement logic to update the user's role here

    return res.status(200).json(updatedRequest.rows[0]);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});


// Deny a role change request (Instructors only)
router.put('/api/v1/role-change-requests/deny/:requestId', authenticateUser, isInstructor, async (req, res) => {
  try {
    const requestId = req.params.requestId;

    // Query the database to update the request status to 'Denied'
    const updatedRequest = await pool.query(
      `UPDATE role_change_requests SET request_status = 'Denied' WHERE request_id = $1 RETURNING *`,
      [requestId]
    );

    if (updatedRequest.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    return res.status(200).json(updatedRequest.rows[0]);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

export default router;
