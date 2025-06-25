import { db } from './db';
import { sql } from 'drizzle-orm';

async function removeAppointmentColumns() {
  try {
    console.log('Removing type and notes columns from appointments table...');
    
    // Drop the type column
    await db.execute(sql`ALTER TABLE appointments DROP COLUMN IF EXISTS type;`);
    console.log('Dropped type column from appointments table');
    
    // Drop the notes column
    await db.execute(sql`ALTER TABLE appointments DROP COLUMN IF EXISTS notes;`);
    console.log('Dropped notes column from appointments table');
    
    console.log('Successfully removed type and notes columns from appointments table');
    process.exit(0);
  } catch (error) {
    console.error('Error removing columns:', error);
    process.exit(1);
  }
}

removeAppointmentColumns();