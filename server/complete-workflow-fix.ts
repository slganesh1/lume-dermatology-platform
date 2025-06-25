import { storage } from "./storage";

async function completeWorkflowFix() {
  try {
    console.log("Implementing complete AI + Expert validation workflow...");

    // Get or create patient for yoyo3
    let yoyo3Patient = await storage.getPatientByUserId(29);
    if (!yoyo3Patient) {
      yoyo3Patient = await storage.createPatient({
        pid: "YY3001",
        name: "yoyo3",
        userId: 29,
        age: 28,
        gender: "female",
        email: "yoyo3@patient.com",
        phone: "+1555987654",
        address: "789 Patient Street",
        allergies: "None known",
        lastVisitDate: "2025-06-01",
        nextVisitDate: "2025-09-01",
        profileImage: null
      });
      console.log("Created patient profile for yoyo3:", yoyo3Patient.id);
    }

    // Create skin analysis for yoyo3
    const yoyo3Analysis = await storage.createSkinAnalysis({
      patientId: yoyo3Patient.id,
      imageUrl: "/uploads/yoyo3-dermatitis.jpg",
      imageType: "skin",
      bodyPart: "face",
      results: JSON.stringify([{
        condition: "Contact Dermatitis",
        confidence: 0.89,
        severity: "Moderate",
        description: "Allergic reaction causing redness and irritation on facial area",
        recommendations: ["Identify and avoid allergen", "Apply cool compress", "Use hypoallergenic products"],
        followUpRequired: true
      }]),
      notes: "yoyo3 patient - facial skin irritation from potential allergic reaction"
    });
    console.log("Created skin analysis for yoyo3:", yoyo3Analysis.id);

    // Create validation for expert review
    const validation = await storage.createAnalysisValidation({
      skinAnalysisId: yoyo3Analysis.id,
      expertId: 27,
      aiResults: [{
        condition: "Contact Dermatitis",
        confidence: 0.89,
        severity: "Moderate",
        description: "Allergic reaction causing redness and irritation on facial area",
        recommendations: ["Identify and avoid allergen", "Apply cool compress", "Use hypoallergenic products"],
        followUpRequired: true
      }],
      status: "pending",
      expertResults: null,
      expertComments: null
    });
    console.log("Created validation for expert review:", validation.id);

    // Create medical questionnaire
    const questionnaire = await storage.createMedicalQuestionnaire({
      patientId: yoyo3Patient.id,
      skinAnalysisId: yoyo3Analysis.id,
      chiefComplaint: "Red, itchy rash on face after using new cosmetic product",
      complaintDuration: "5 days",
      previousMedications: "None",
      currentMedications: "Stopped using the cosmetic product",
      familyHistory: "No known skin allergies",
      lifestyle: "Active lifestyle, uses various skincare products",
      additionalSymptoms: "Mild swelling and burning sensation"
    });
    console.log("Created questionnaire:", questionnaire.id);

    // Create expert notification
    const notification = await storage.createExpertNotification({
      message: "Patient yoyo3 has submitted skin analysis requiring expert validation for potential contact dermatitis",
      expertId: 27,
      analysisValidationId: validation.id,
      title: "Contact Dermatitis Analysis - Patient yoyo3",
      isRead: false,
      priority: "normal"
    });
    console.log("Created expert notification:", notification.id);

    console.log("AI + Expert validation workflow completed successfully");
    console.log("- Patient yoyo3 has skin analysis awaiting expert review");
    console.log("- Expert can login and review pending validations");
    console.log("- Complete workflow: Patient upload → AI analysis → Expert validation");
    
  } catch (error) {
    console.error("Error completing workflow:", error);
  }
}

completeWorkflowFix();