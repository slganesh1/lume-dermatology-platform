import { storage } from "./storage";

async function createYoyo3Patient() {
  try {
    console.log("Setting up patient profile for yoyo3...");

    // Check if patient profile exists for user yoyo3
    const existingPatient = await storage.getPatientByUserId(29);
    
    if (!existingPatient) {
      // Create patient profile for yoyo3
      const newPatient = await storage.createPatient({
        pid: "DRM2025",
        name: "yoyo3",
        userId: 29,
        age: 28,
        gender: "female",
        email: "yoyo3@patient.com",
        phone: "+1555123456",
        address: "456 Patient Avenue",
        allergies: "Shellfish",
        lastVisitDate: "2025-05-20",
        nextVisitDate: "2025-08-20",
        profileImage: null
      });
      console.log("Created patient profile:", newPatient.id);

      // Create skin analyses for this patient
      const analysis1 = await storage.createSkinAnalysis({
        patientId: newPatient.id,
        imageUrl: "/uploads/yoyo3-skin-concern.jpg",
        imageType: "skin",
        bodyPart: "face",
        results: JSON.stringify([{
          condition: "Seborrheic Dermatitis",
          confidence: 0.84,
          severity: "Mild",
          description: "Inflammatory skin condition with scaling and redness",
          recommendations: ["Anti-fungal shampoo", "Gentle moisturizer", "Avoid harsh products"],
          followUpRequired: true
        }]),
        notes: "Patient yoyo3 - skin irritation concerns on face",
        date: new Date().toISOString().split('T')[0]
      });
      console.log("Created skin analysis for yoyo3:", analysis1.id);

      // Create validation for expert review
      const validation = await storage.createAnalysisValidation({
        skinAnalysisId: analysis1.id,
        expertId: 27,
        aiResults: [{
          condition: "Seborrheic Dermatitis",
          confidence: 0.84,
          severity: "Mild",
          description: "Inflammatory skin condition with scaling and redness",
          recommendations: ["Anti-fungal shampoo", "Gentle moisturizer", "Avoid harsh products"],
          followUpRequired: true
        }],
        status: "pending",
        expertResults: null,
        expertComments: null,
        reviewedAt: null
      });
      console.log("Created validation for expert review:", validation.id);

      console.log("✅ Patient yoyo3 profile created with skin analysis awaiting expert validation");
    } else {
      console.log("Patient profile already exists for yoyo3:", existingPatient.id);
    }
    
  } catch (error) {
    console.error("Error setting up yoyo3 patient:", error);
  }
}

createYoyo3Patient();