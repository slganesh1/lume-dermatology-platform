import { db } from "./db";
import { sql } from "drizzle-orm";

async function addEmailVerificationFields() {
  try {
    console.log('Adding email verification fields to users table...');
    
    // Add email column
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email TEXT
    `);
    
    // Add email_verified column
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE NOT NULL
    `);
    
    // Add email_verification_token column
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verification_token TEXT
    `);
    
    console.log('Email verification fields added successfully!');
  } catch (error) {
    console.error('Error adding email verification fields:', error);
    throw error;
  }
}

// Run migration immediately
addEmailVerificationFields()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

export { addEmailVerificationFields };