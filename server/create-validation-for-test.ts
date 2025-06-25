import { storage } from "./storage";

async function createValidationForTest() {
  try {
    console.log("Creating validation for patient_test analysis...");

    // Create validation for analysis ID 450 (patient_test's eczema analysis)
    const validation = await storage.createAnalysisValidation({
      skinAnalysisId: 450,
      expertId: 27,
      aiResults: [{
        condition: "Eczema",
        confidence: 0.85,
        severity: "Mild",
        description: "Mild eczematous condition on forearm",
        recommendations: ["Moisturize daily", "Use gentle soap", "Avoid harsh chemicals"],
        followUpRequired: false
      }],
      status: "pending",
      expertResults: null,
      expertComments: null
    });

    console.log(`Created validation ${validation.id} for analysis 450`);
    console.log("Validation ready for expert review");

  } catch (error) {
    console.error("Error creating validation:", error);
  }
}

createValidationForTest();