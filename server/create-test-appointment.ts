import { db } from "./db";
import { appointments, patients, hospitals, doctors } from "../shared/schema";

async function createTestAppointment() {
  try {
    console.log("Creating test appointment...");
    
    // Get first patient, hospital, and doctor
    const [patient] = await db.select().from(patients).limit(1);
    const [hospital] = await db.select().from(hospitals).limit(1);
    const [doctor] = await db.select().from(doctors).limit(1);
    
    if (!patient || !hospital || !doctor) {
      console.error("Missing required data: patient, hospital, or doctor");
      return;
    }
    
    // Create test appointment for patient ID 11 (TEST001)
    const [appointment] = await db.insert(appointments).values({
      patientId: 11, // TEST001 patient
      hospitalId: hospital.id,
      doctorId: doctor.id,
      date: "2025-06-18",
      time: "10:00:00",
      type: "Consultation",
      status: "Pending",
      notes: "Test appointment for debugging patient TEST001"
    }).returning();
    
    console.log("Test appointment created:", appointment);
    
  } catch (error) {
    console.error("Error creating test appointment:", error);
  }
  
  process.exit(0);
}

createTestAppointment();