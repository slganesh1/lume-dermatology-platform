import { sql } from 'drizzle-orm';
import { db, pool } from './db';
import * as schema from '@shared/schema';

async function recreateSchema() {
  console.log('Setting up database schema...');
  
  // Drops all tables if they exist
  await db.execute(sql`
    DROP TABLE IF EXISTS questionnaires CASCADE;
    DROP TABLE IF EXISTS skin_analyses CASCADE;
    DROP TABLE IF EXISTS prescription_items CASCADE;
    DROP TABLE IF EXISTS prescriptions CASCADE;
    DROP TABLE IF EXISTS medications CASCADE;
    DROP TABLE IF EXISTS appointments CASCADE;
    DROP TABLE IF EXISTS patients CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS session CASCADE;
  `);
  
  // Create tables based on schema
  // Users table
  await db.execute(sql`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'patient',
      name TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Patients table
  await db.execute(sql`
    CREATE TABLE patients (
      id SERIAL PRIMARY KEY,
      pid TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      allergies TEXT,
      last_visit_date TEXT,
      next_visit_date TEXT,
      profile_image TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Appointments table
  await db.execute(sql`
    CREATE TABLE appointments (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id),
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      duration INTEGER NOT NULL,
      type TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Medications table
  await db.execute(sql`
    CREATE TABLE medications (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      dosage TEXT,
      side_effects TEXT,
      price TEXT,
      in_stock BOOLEAN DEFAULT TRUE,
      image TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Prescriptions table
  await db.execute(sql`
    CREATE TABLE prescriptions (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id),
      date TEXT NOT NULL,
      items JSONB NOT NULL,
      remarks TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Prescription Items table
  await db.execute(sql`
    CREATE TABLE prescription_items (
      id SERIAL PRIMARY KEY,
      prescription_id INTEGER NOT NULL REFERENCES prescriptions(id),
      medication_id INTEGER NOT NULL REFERENCES medications(id),
      dosage TEXT NOT NULL,
      instructions TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Skin Analyses table
  await db.execute(sql`
    CREATE TABLE skin_analyses (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id),
      image_url TEXT NOT NULL,
      processed_image_url TEXT,
      image_type TEXT NOT NULL DEFAULT 'skin',
      body_part TEXT,
      results JSONB NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Questionnaires table
  await db.execute(sql`
    CREATE TABLE questionnaires (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id),
      questionnaire_type TEXT NOT NULL,
      age TEXT NOT NULL,
      gender TEXT NOT NULL,
      concerns JSONB NOT NULL,
      routine_level TEXT NOT NULL,
      allergies TEXT,
      has_allergies BOOLEAN DEFAULT FALSE,
      current_products JSONB NOT NULL,
      wash_frequency TEXT,
      heat_styling BOOLEAN,
      chemical_treatments BOOLEAN,
      diet_type TEXT NOT NULL,
      exercise_frequency TEXT NOT NULL,
      stress_level TEXT NOT NULL,
      urban_environment BOOLEAN DEFAULT FALSE,
      smoker BOOLEAN DEFAULT FALSE,
      product_preferences TEXT NOT NULL,
      budget_range TEXT NOT NULL,
      additional_info TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Create session table for express-session with connect-pg-simple
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    )
  `);
  
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
  `);
  
  console.log('Database schema setup complete!');
}

// Create admin user
async function createAdminUser() {
  const [existingAdmin] = await db.select().from(schema.users)
    .where(sql`${schema.users.username} = 'admin'`);
  
  if (!existingAdmin) {
    await db.insert(schema.users).values({
      username: 'admin',
      password: 'b14361404c078ffd549c03db443c3fede2f3e534d73f78f77301ed97d4a436a9fd9db05ee8b325c0ad36438b43fec8510c204fc1c1edb21d0941c00e9e2c1ce2.a873d8f8f0c7a5d1',
      role: 'doctor',
      name: 'Dr. AriHariSudhan'
    });
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists');
  }
}

async function main() {
  try {
    await recreateSchema();
    await createAdminUser();
    
    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Error during database migration:', error);
  } finally {
    await pool.end();
  }
}

main();