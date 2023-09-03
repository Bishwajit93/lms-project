import express from 'express';
import pool from '../config/database.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import upload from './multerConfig.js'; // Import the multer configuration

const router = express.Router();

// Create a new post (Instructors, TAs, Student Body, and Students)
router.post('/api/v1/posts', authenticateUser, upload.single('file'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const course_id = req.body.course_id; // Assuming you provide the course ID in the request body
    const user_id = req.user.id; // Get user ID from authentication

    // Check if a file was uploaded
    let file_url = null;
    if (req.file) {
      file_url = req.file.path; // Store the file path in the database
    }

    // Insert the post data into the database
    const newPost = await pool.query(
      `INSERT INTO posts (title, content, file_url, user_id, course_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, content, file_url, user_id, course_id]
    );

    res.status(201).json(newPost.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all posts in a course (Authenticated users)
router.get('/api/v1/posts/:courseId', authenticateUser, async (req, res) => {
  try {
    const courseId = req.params.courseId;

    // Query the database to retrieve posts in the specified course
    const posts = await pool.query(`SELECT * FROM posts WHERE course_id = $1`, [courseId]);

    res.status(200).json(posts.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get a specific post (Authenticated users)
router.get('/api/v1/posts/:postId', authenticateUser, async (req, res) => {
  try {
    const postId = req.params.postId;

    // Query the database to retrieve the specified post
    const post = await pool.query(`SELECT * FROM posts WHERE id = $1`, [postId]);

    if (post.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json(post.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a post (Post author only)
router.put('/api/v1/posts/:postId', authenticateUser, async (req, res) => {
  try {
    const postId = req.params.postId;
    const { title, content } = req.body;
    const user_id = req.user.id; // Get user ID from authentication

    // Query the database to retrieve the specified post
    const post = await pool.query(`SELECT * FROM posts WHERE id = $1`, [postId]);

    if (post.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const postAuthorId = post.rows[0].user_id;

    // Check if the user is authorized to update the post (only the author)
    if (user_id !== postAuthorId) {
      return res.status(403).json({ message: 'Access denied. Not authorized to update this post.' });
    }

    // Update the post in the database
    const updatedPost = await pool.query(
      `UPDATE posts SET title = $1, content = $2 WHERE id = $3 RETURNING *`,
      [title, content, postId]
    );

    res.status(200).json(updatedPost.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a post (Authors, TAs, Instructors)
router.delete('/api/v1/posts/:postId', authenticateUser, async (req, res) => {
  try {
    const postId = req.params.postId;
    const user_id = req.user.id; // Get user ID from authentication

    // Query the database to retrieve the specified post
    const post = await pool.query(`SELECT * FROM posts WHERE id = $1`, [postId]);

    if (post.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const postAuthorId = post.rows[0].user_id;

    // Check if the user is authorized to delete the post
    if (user_id === postAuthorId || req.user.role === 'TA' || req.user.role === 'Instructor') {
      // Delete the post from the database
      await pool.query(`DELETE FROM posts WHERE id = $1`, [postId]);

      // Send a notification (message) to the post author if deleted by TA or Instructor
      if (user_id !== postAuthorId) {
        const notificationMessage = `Your post was deleted by ${req.user.role} for the following reason: ${req.body.reason}`;
        // Send the notification as needed (e.g., via email or within your application)
      }

      res.status(200).json({ message: 'Post deleted successfully' });
    } else {
      return res.status(403).json({ message: 'Access denied. Not authorized to delete this post.' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
