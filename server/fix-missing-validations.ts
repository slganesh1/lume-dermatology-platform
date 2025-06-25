import { storage } from "./storage";

async function fixMissingValidations() {
  try {
    console.log("Creating missing validations for recent analyses...");

    // Create validation for analysis ID 458 (Rosacea)
    const validation458 = await storage.createAnalysisValidation({
      skinAnalysisId: 458,
      expertId: 27,
      aiResults: [{
        type: "primary",
        severity: "Moderate",
        condition: "Rosacea",
        confidence: 0.95,
        description: "Rosacea is characterized by facial redness, visible blood vessels, and sometimes acne-like bumps.",
        recommendations: ["Avoid known triggers such as spicy foods and alcohol", "Use gentle skin care products and sunscreen", "Consult a dermatologist for potential topical or oral treatments"]
      }],
      status: "pending",
      expertResults: null,
      expertComments: null
    });

    // Create validation for analysis ID 457 (Acne Vulgaris)
    const validation457 = await storage.createAnalysisValidation({
      skinAnalysisId: 457,
      expertId: 27,
      aiResults: [{
        type: "primary",
        severity: "Moderate", 
        condition: "Acne Vulgaris",
        confidence: 0.95,
        description: "Acne vulgaris is characterized by the presence of comedones, papules, pustules, and possibly nodules.",
        recommendations: ["Use a gentle cleanser twice daily", "Apply topical treatments containing benzoyl peroxide or salicylic acid", "Consult a dermatologist for prescription options"]
      }],
      status: "pending",
      expertResults: null,
      expertComments: null
    });

    // Create expert notifications
    await storage.createExpertNotification({
      message: "Patient submitted Rosacea analysis requiring expert validation",
      expertId: 27,
      analysisValidationId: validation458.id,
      title: "Rosacea Analysis - Expert Review Required",
      isRead: false,
      priority: "normal"
    });

    await storage.createExpertNotification({
      message: "Patient submitted Acne Vulgaris analysis requiring expert validation", 
      expertId: 27,
      analysisValidationId: validation457.id,
      title: "Acne Vulgaris Analysis - Expert Review Required",
      isRead: false,
      priority: "normal"
    });

    console.log(`Created validation ${validation458.id} for analysis 458 (Rosacea)`);
    console.log(`Created validation ${validation457.id} for analysis 457 (Acne)`);
    console.log("Expert validation workflow restored");

  } catch (error) {
    console.error("Error creating missing validations:", error);
  }
}

fixMissingValidations();