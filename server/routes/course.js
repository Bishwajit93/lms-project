import express from 'express';
import pool from '../config/database.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// A function to get the user ID based on their role
function getUserIdByRole(req) {
  switch (req.user.role) {
    case 'Instructor':
    case 'TA':
    case 'Student Body':
      return req.user.id;
    default:
      return null; // Unknown or unauthorized role
  }
}

// Create a new course (Instructors, TAs, and Student Body)
router.post('/api/v1/courses', authenticateUser, async (req, res) => {
  try {
    // Extract course data from the request body
    const { title, description } = req.body;

    // Get the user's ID based on their role
    const userId = getUserIdByRole(req);

    if (!userId) {
      return res.status(403).json({ message: 'Access denied. Requires Instructor, TA, or Student Body role.' });
    }

    // Implement the course creation logic here, inserting course data into the 'courses' table
    const newCourse = await pool.query(
      `INSERT INTO courses (title, description, instructor_id) VALUES ($1, $2, $3) RETURNING *`,
      [title, description, userId]
    );

    return res.status(201).json(newCourse.rows[0]);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// Get all courses (Authenticated users)
router.get('/api/v1/courses', authenticateUser, async (req, res) => {
  try {
    // Implement the logic to fetch and return all courses here
    const courses = await pool.query('SELECT * FROM courses');
    return res.status(200).json(courses.rows);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// Get a single course by ID (Authenticated users)
router.get('/api/v1/courses/:courseId', authenticateUser, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Implement the logic to fetch and return the course by ID here
    const course = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);

    if (course.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json(course.rows[0]);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// Update a course by ID (Instructors, TAs, and Student Body)
router.put('/api/v1/courses/:courseId', authenticateUser, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { title, description } = req.body;

    // Get the user's ID based on their role
    const userId = getUserIdByRole(req);

    if (!userId) {
      return res.status(403).json({ message: 'Access denied. Requires Instructor, TA, or Student Body role.' });
    }

    // Implement the course update logic here
    const updatedCourse = await pool.query(
      'UPDATE courses SET title = $1, description = $2 WHERE id = $3 RETURNING *',
      [title, description, courseId]
    );

    if (updatedCourse.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json(updatedCourse.rows[0]);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// Delete a course by ID (Instructors, TAs, and Student Body)
router.delete('/api/v1/courses/:courseId', authenticateUser, async (req, res) => {
  try {
    const courseId = req.params.courseId;

    // Get the user's ID based on their role
    const userId = getUserIdByRole(req);

    if (!userId) {
      return res.status(403).json({ message: 'Access denied. Requires Instructor, TA, or Student Body role.' });
    }

    // Implement the course deletion logic here
    const deletedCourse = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING *', [courseId]);

    if (deletedCourse.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

export default router;
