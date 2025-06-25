import { storage } from "./storage";

async function createPendingValidations() {
  try {
    console.log("Creating pending validations for expert review...");

    // Create validation for analysis 431 (Acne Vulgaris)
    const validation1 = await storage.createAnalysisValidation({
      skinAnalysisId: 431,
      expertId: 27,
      aiResults: [{
        condition: "Acne Vulgaris",
        confidence: 0.87,
        severity: "Moderate",
        description: "Inflammatory acne lesions observed on facial area",
        recommendations: ["Topical retinoid treatment", "Gentle cleansing routine", "Avoid comedogenic products"],
        followUpRequired: true
      }],
      status: "pending",
      expertResults: null,
      expertComments: null,
      reviewedAt: null
    });
    console.log("Created validation 1:", validation1.id);

    // Create validation for analysis 432 (Atopic Dermatitis)
    const validation2 = await storage.createAnalysisValidation({
      skinAnalysisId: 432,
      expertId: 27,
      aiResults: [{
        condition: "Atopic Dermatitis",
        confidence: 0.92,
        severity: "Mild",
        description: "Characteristic eczematous patches with erythema and scaling",
        recommendations: ["Moisturize regularly", "Use fragrance-free products", "Consider topical corticosteroids"],
        followUpRequired: false
      }],
      status: "pending",
      expertResults: null,
      expertComments: null,
      reviewedAt: null
    });
    console.log("Created validation 2:", validation2.id);

    // Create validation for analysis 433 (Benign Nevus)
    const validation3 = await storage.createAnalysisValidation({
      skinAnalysisId: 433,
      expertId: 27,
      aiResults: [{
        condition: "Benign Nevus",
        confidence: 0.78,
        severity: "Monitor",
        description: "Pigmented lesion with regular borders and uniform coloration",
        recommendations: ["Continue monitoring", "Annual dermatological check-up", "Watch for changes in size or color"],
        followUpRequired: true
      }],
      status: "pending",
      expertResults: null,
      expertComments: null,
      reviewedAt: null
    });
    console.log("Created validation 3:", validation3.id);

    console.log("✅ All pending validations created - Expert can now review analyses");
    
  } catch (error) {
    console.error("Error creating pending validations:", error);
  }
}

createPendingValidations();