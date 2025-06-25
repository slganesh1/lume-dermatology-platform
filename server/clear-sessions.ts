import { pool } from "./db";

async function clearAllSessions() {
  try {
    // Clear all session data from the database
    await pool.query('DELETE FROM session');
    console.log('All sessions cleared from database');
  } catch (error) {
    console.error('Error clearing sessions:', error);
  }
}

clearAllSessions().then(() => {
  console.log('Session cleanup complete');
  process.exit(0);
});