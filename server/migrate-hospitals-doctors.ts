import { db } from "./db";
import { hospitals, doctors, appointments } from "@shared/schema";
import { sql } from "drizzle-orm";

async function migrateHospitalsAndDoctors() {
  try {
    console.log("Creating hospitals and doctors tables...");
    
    // Create hospitals table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS hospitals (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create doctors table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        specialization TEXT DEFAULT 'Dermatologist' NOT NULL,
        hospital_id INTEGER REFERENCES hospitals(id) NOT NULL,
        phone TEXT,
        email TEXT,
        experience TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add hospital_id and doctor_id columns to appointments table
    await db.execute(sql`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS hospital_id INTEGER REFERENCES hospitals(id),
      ADD COLUMN IF NOT EXISTS doctor_id INTEGER REFERENCES doctors(id);
    `);

    // Remove duration column from appointments table
    await db.execute(sql`
      ALTER TABLE appointments DROP COLUMN IF EXISTS duration;
    `);

    // Update type column default to 'consultation'
    await db.execute(sql`
      ALTER TABLE appointments ALTER COLUMN type SET DEFAULT 'consultation';
    `);

    console.log("Tables created successfully");

    // Insert hospitals
    const hospitalData = [
      { name: "MV Skin Clinic", address: "123 Medical Drive", phone: "+1-555-0101", email: "info@mvskin.com" },
      { name: "Bhuvana Hospital", address: "456 Healthcare Ave", phone: "+1-555-0102", email: "contact@bhuvana.com" },
      { name: "Chandu Hospital", address: "789 Wellness Street", phone: "+1-555-0103", email: "info@chandu.com" }
    ];

    const insertedHospitals = await db.insert(hospitals).values(hospitalData).returning();
    console.log("Hospitals inserted:", insertedHospitals.length);

    // Insert doctors
    const doctorData = [
      { name: "Dr. Ariarasudhan", specialization: "Dermatologist", hospitalId: insertedHospitals[0].id, experience: "10+ years", phone: "+1-555-0201", email: "dr.aria@mvskin.com" },
      { name: "Dr. Bhuvana", specialization: "Dermatologist", hospitalId: insertedHospitals[1].id, experience: "15+ years", phone: "+1-555-0202", email: "dr.bhuvana@bhuvana.com" },
      { name: "Dr. Chandu", specialization: "Dermatologist", hospitalId: insertedHospitals[2].id, experience: "12+ years", phone: "+1-555-0203", email: "dr.chandu@chandu.com" },
      { name: "Dr. Ragav", specialization: "Dermatologist", hospitalId: insertedHospitals[0].id, experience: "8+ years", phone: "+1-555-0204", email: "dr.ragav@mvskin.com" },
      { name: "Dr. Tanya", specialization: "Dermatologist", hospitalId: insertedHospitals[1].id, experience: "7+ years", phone: "+1-555-0205", email: "dr.tanya@bhuvana.com" },
      { name: "Dr. Mahathi", specialization: "Dermatologist", hospitalId: insertedHospitals[2].id, experience: "9+ years", phone: "+1-555-0206", email: "dr.mahathi@chandu.com" }
    ];

    const insertedDoctors = await db.insert(doctors).values(doctorData).returning();
    console.log("Doctors inserted:", insertedDoctors.length);

    // Update existing appointments to have default hospital and doctor
    await db.execute(sql`
      UPDATE appointments 
      SET hospital_id = ${insertedHospitals[0].id}, 
          doctor_id = ${insertedDoctors[0].id},
          type = 'consultation'
      WHERE hospital_id IS NULL OR doctor_id IS NULL;
    `);

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

migrateHospitalsAndDoctors().catch(console.error);