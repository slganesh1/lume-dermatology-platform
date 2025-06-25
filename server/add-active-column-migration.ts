import { sql } from 'drizzle-orm';
import { db, pool } from './db';

async function addActiveColumn() {
  try {
    console.log('Checking if active column exists in users table...');
    
    // Check if the column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'active'
    `);
    
    if (result.rows.length === 0) {
      console.log('Adding active column to users table...');
      
      // Add the active column with default value true
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE
      `);
      
      console.log('Successfully added active column to users table');
    } else {
      console.log('Active column already exists in users table');
    }
    
    // Update any existing users to ensure they have active = true
    const updateResult = await db.execute(sql`
      UPDATE users 
      SET active = TRUE 
      WHERE active IS NULL
    `);
    
    console.log(`Updated ${updateResult.rowCount} users with active = true`);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

addActiveColumn();