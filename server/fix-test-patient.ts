import { storage } from "./storage";
import { hashPassword } from "./auth";

async function fixTestPatient() {
  try {
    console.log("Fixing test patient credentials...");

    // Get the test patient user
    const testUser = await storage.getUserByUsername("patient_test");
    if (testUser) {
      // Update with properly hashed password
      const hashedPassword = await hashPassword("patient123");
      await storage.updateUser(testUser.id, {
        password: hashedPassword
      });
      console.log("Updated patient_test password");
    }

    // Also ensure we have a working demo patient
    let demoPatient = await storage.getPatientByPid("DRM9740");
    if (!demoPatient) {
      // Create demo patient user first
      const demoHashedPassword = await hashPassword("demo123");
      const demoUser = await storage.createUser({
        username: "demo_patient",
        password: demoHashedPassword,
        role: "patient",
        name: "Demo Patient",
        active: true
      });

      // Create demo patient profile
      demoPatient = await storage.createPatient({
        pid: "DRM9740",
        name: "Demo Patient",
        userId: demoUser.id,
        age: 42,
        gender: "female",
        email: "demo@patient.com",
        phone: "+1555000000",
        address: "456 Demo Avenue",
        allergies: "Pollen",
        lastVisitDate: "2025-04-15",
        nextVisitDate: "2025-07-15",
        profileImage: null
      });
      console.log("Created demo patient:", demoPatient.id);

      // Create analysis for demo patient
      const demoAnalysis = await storage.createSkinAnalysis({
        patientId: demoPatient.id,
        imageUrl: "/uploads/demo-skin-condition.jpg",
        imageType: "skin",
        bodyPart: "hand",
        results: JSON.stringify([{
          condition: "Dry Skin",
          confidence: 0.75,
          severity: "Mild",
          description: "Mild dryness on hands, likely from environmental factors",
          recommendations: ["Use moisturizer regularly", "Wear gloves in cold weather"],
          followUpRequired: false
        }]),
        notes: "Demo patient - routine skin check"
      });
      console.log("Created demo analysis:", demoAnalysis.id);
    }

    console.log("Patient accounts ready for testing:");
    console.log("- yoyo3 / techtez@123 (existing patient with analyses)");
    console.log("- patient_test / patient123 (test patient)");
    console.log("- demo_patient / demo123 (demo patient)");
    
  } catch (error) {
    console.error("Error fixing test patients:", error);
  }
}

fixTestPatient();