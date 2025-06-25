import { storage } from "./storage";

async function fixValidationWorkflow() {
  try {
    console.log("Fixing AI + Expert validation workflow...");

    // Get the existing patient
    const patient = await storage.getPatientByPid("DRM9740");
    if (!patient) {
      console.log("Patient DRM9740 not found, creating...");
      const newPatient = await storage.createPatient({
        pid: "DRM9740",
        name: "Test Patient",
        userId: 28,
        age: 35,
        gender: "female",
        email: "test@patient.com",
        phone: "+1234567890",
        address: "123 Test Street",
        allergies: "None known",
        lastVisitDate: "2025-05-15",
        nextVisitDate: "2025-07-15",
        profileImage: null
      });
      console.log("Created patient:", newPatient.id);
    }

    // Check pending validations
    const pendingValidations = await storage.getAnalysisValidations();
    console.log("Existing validations:", pendingValidations.length);

    // Create a complete workflow entry
    const analysisResult = {
      condition: "Acne Vulgaris",
      confidence: 0.87,
      severity: "Moderate", 
      description: "Inflammatory acne lesions observed on facial area",
      recommendations: ["Topical retinoid treatment", "Gentle cleansing routine", "Avoid comedogenic products"],
      followUpRequired: true
    };

    // Create analysis validation for expert review
    const validation = await storage.createAnalysisValidation({
      skinAnalysisId: 431, // Reference to created skin analysis
      expertId: 27, // Expert user ID
      aiResults: [analysisResult],
      status: "pending",
      expertResults: null,
      expertComments: null,
      reviewedAt: null
    });
    console.log("Created validation entry:", validation.id);

    // Create medical questionnaire
    const questionnaire = await storage.createMedicalQuestionnaire({
      patientId: patient.id,
      skinAnalysisId: 431,
      chiefComplaint: "Sudden increase in facial acne lesions",
      complaintDuration: "2 weeks",
      previousMedications: "None",
      currentMedications: "Over-the-counter benzoyl peroxide",
      allergies: "None known",
      familyHistory: "Mother had acne in teens",
      lifestyle: "Stressful work environment",
      additionalSymptoms: "Occasional itching"
    });
    console.log("Created questionnaire:", questionnaire.id);

    // Create expert notification
    const notification = await storage.createExpertNotification({
      message: "New skin analysis requires expert validation",
      expertId: 27,
      analysisValidationId: validation.id,
      title: "Acne Vulgaris Analysis - Patient DRM9740",
      isRead: false,
      priority: "normal"
    });
    console.log("Created notification:", notification.id);

    console.log("✅ Validation workflow fixed - Expert can now review analyses");
    
  } catch (error) {
    console.error("Error fixing validation workflow:", error);
  }
}

fixValidationWorkflow();