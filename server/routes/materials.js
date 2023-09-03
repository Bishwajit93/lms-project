import express from 'express';
import pool from '../config/database.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new material (Instructors and TAs)
router.post('/api/v1/materials', authenticateUser, async (req, res) => {
  try {
    const { title, description, file_url, course_id } = req.body;
    const user_id = req.user.id; // Get user ID from authentication
    const user_role = req.user.role; // Get user role from authentication

    // Check if the user is authorized to create a material (Instructor or TA)
    if (user_role !== 'Instructor' && user_role !== 'TA') {
      return res.status(403).json({ message: 'Access denied. Not authorized to create materials.' });
    }

    // Insert the material data into the database
    const newMaterial = await pool.query(
      `INSERT INTO materials (title, description, file_url, user_id, course_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, file_url, user_id, course_id]
    );

    res.status(201).json(newMaterial.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a material (Instructors and TAs)
router.put('/api/v1/materials/:materialId', authenticateUser, async (req, res) => {
  try {
    const materialId = req.params.materialId;
    const { title, description, file_url } = req.body;
    const user_id = req.user.id; // Get user ID from authentication
    const user_role = req.user.role; // Get user role from authentication

    // Check if the user is authorized to update the material (Instructor or TA)
    if (user_role !== 'Instructor' && user_role !== 'TA') {
      return res.status(403).json({ message: 'Access denied. Not authorized to update materials.' });
    }

    // Query the database to retrieve the specified material
    const material = await pool.query(`SELECT * FROM materials WHERE id = $1`, [materialId]);

    if (material.rows.length === 0) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Update the material in the database
    const updatedMaterial = await pool.query(
      `UPDATE materials SET title = $1, description = $2, file_url = $3 WHERE id = $4 RETURNING *`,
      [title, description, file_url, materialId]
    );

    res.status(200).json(updatedMaterial.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a material (Instructors and TAs)
router.delete('/api/v1/materials/:materialId', authenticateUser, async (req, res) => {
  try {
    const materialId = req.params.materialId;
    const user_id = req.user.id; // Get user ID from authentication
    const user_role = req.user.role; // Get user role from authentication

    // Check if the user is authorized to delete the material (Instructor or TA)
    if (user_role !== 'Instructor' && user_role !== 'TA') {
      return res.status(403).json({ message: 'Access denied. Not authorized to delete materials.' });
    }

    // Query the database to retrieve the specified material
    const material = await pool.query(`SELECT * FROM materials WHERE id = $1`, [materialId]);

    if (material.rows.length === 0) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Delete the material from the database
    await pool.query(`DELETE FROM materials WHERE id = $1`, [materialId]);

    res.status(200).json({ message: 'Material deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
