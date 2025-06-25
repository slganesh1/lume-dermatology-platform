import { storage } from "./storage";

async function createYoyo3Analyses() {
  try {
    console.log("Creating skin analyses for patient yoyo3...");

    // Get yoyo3's patient profile
    const patient = await storage.getPatientByUserId(29);
    if (!patient) {
      console.log("No patient profile found for yoyo3");
      return;
    }

    console.log("Found patient profile:", patient.id);

    // Create skin analysis for yoyo3
    const analysis = await storage.createSkinAnalysis({
      patientId: patient.id,
      imageUrl: "/uploads/yoyo3-skin-analysis.jpg",
      imageType: "skin",
      bodyPart: "face",
      results: JSON.stringify([{
        condition: "Seborrheic Dermatitis",
        confidence: 0.84,
        severity: "Mild",
        description: "Inflammatory skin condition with scaling and redness around nose area",
        recommendations: ["Use antifungal cream", "Gentle cleansing routine", "Avoid oil-based products"],
        followUpRequired: true
      }]),
      notes: "Patient yoyo3 reports persistent skin irritation",
      date: new Date().toISOString().split('T')[0]
    });
    console.log("Created skin analysis:", analysis.id);

    // Create validation for expert review
    const validation = await storage.createAnalysisValidation({
      skinAnalysisId: analysis.id,
      expertId: 27,
      aiResults: [{
        condition: "Seborrheic Dermatitis",
        confidence: 0.84,
        severity: "Mild",
        description: "Inflammatory skin condition with scaling and redness around nose area",
        recommendations: ["Use antifungal cream", "Gentle cleansing routine", "Avoid oil-based products"],
        followUpRequired: true
      }],
      status: "pending",
      expertResults: null,
      expertComments: null,
      reviewedAt: null
    });
    console.log("Created validation entry:", validation.id);

    // Create medical questionnaire
    const questionnaire = await storage.createMedicalQuestionnaire({
      patientId: patient.id,
      skinAnalysisId: analysis.id,
      chiefComplaint: "Persistent red, scaly patches around nose",
      complaintDuration: "3 weeks",
      previousMedications: "Over-the-counter moisturizers",
      currentMedications: "None",
      allergies: "Shellfish",
      familyHistory: "Father had similar skin issues",
      lifestyle: "Works from home, moderate stress",
      additionalSymptoms: "Mild itching, occasional flaking"
    });
    console.log("Created questionnaire:", questionnaire.id);

    console.log("✅ Complete analysis workflow created for patient yoyo3");
    
  } catch (error) {
    console.error("Error creating yoyo3 analyses:", error);
  }
}

createYoyo3Analyses();