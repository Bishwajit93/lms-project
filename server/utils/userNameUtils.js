import pool from '../config/database.js';

// Function to check if a username is available
export async function isUsernameAvailable(username) {
  const existingUser = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
  return existingUser.rows.length === 0;
}

// Function to generate suggested usernames
export async function generateSuggestedUsername(originalUsername) {
  let suggestedUsername = originalUsername;
  let counter = 1;

  while (true) {
    // Check if the suggested username is available
    const isAvailable = await isUsernameAvailable(suggestedUsername);

    if (isAvailable) {
      return suggestedUsername;
    }

    counter++;
    suggestedUsername = `${originalUsername}${counter}`;
  }
}
