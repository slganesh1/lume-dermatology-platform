import { storage } from "./storage";
import { hashPassword } from "./auth";

async function createAdditionalPatient() {
  try {
    console.log("Creating additional patient user for testing...");

    // Create user account
    const hashedPassword = await hashPassword("patient123");
    const newUser = await storage.createUser({
      username: "patient_test",
      password: hashedPassword,
      role: "patient",
      name: "Test Patient",
      active: true
    });
    console.log("Created user:", newUser.id);

    // Create patient profile
    const newPatient = await storage.createPatient({
      pid: "TEST001",
      name: "Test Patient",
      userId: newUser.id,
      age: 35,
      gender: "male",
      email: "test@patient.com",
      phone: "+1555123456",
      address: "123 Test Street",
      allergies: "None",
      lastVisitDate: "2025-05-01",
      nextVisitDate: "2025-08-01",
      profileImage: null
    });
    console.log("Created patient profile:", newPatient.id);

    // Create skin analysis for this patient
    const analysis = await storage.createSkinAnalysis({
      patientId: newPatient.id,
      imageUrl: "/uploads/test-patient-analysis.jpg",
      imageType: "skin",
      bodyPart: "arm",
      results: JSON.stringify([{
        condition: "Eczema",
        confidence: 0.85,
        severity: "Mild",
        description: "Mild eczematous condition on forearm",
        recommendations: ["Moisturize daily", "Use gentle soap", "Avoid harsh chemicals"],
        followUpRequired: false
      }]),
      notes: "Test patient - arm eczema analysis"
    });
    console.log("Created skin analysis:", analysis.id);

    console.log("Test patient created successfully");
    console.log("Login credentials: patient_test / patient123");
    
  } catch (error) {
    console.error("Error creating test patient:", error);
  }
}

createAdditionalPatient();