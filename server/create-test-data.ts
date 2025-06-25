import { db } from "./db";
import { skinAnalyses, analysisValidations, medicalQuestionnaires, expertNotifications } from "@shared/schema";

async function createTestValidationData() {
  console.log("Creating test data for AI + Expert validation workflow...");

  try {
    // Create a test skin analysis
    const [skinAnalysis] = await db.insert(skinAnalyses).values({
      patientId: 8, // Existing patient
      imageUrl: "/uploads/test-skin-analysis.jpg",
      processedImageUrl: "/uploads/processed-test-skin-analysis.jpg",
      imageType: "skin",
      bodyPart: "face",
      results: [
        {
          condition: "Acne Vulgaris",
          confidence: 0.87,
          severity: "Moderate",
          description: "Inflammatory acne lesions observed on facial area",
          recommendations: [
            "Topical retinoid treatment",
            "Gentle cleansing routine",
            "Avoid comedogenic products"
          ],
          followUpRequired: true
        },
        {
          condition: "Post-inflammatory Hyperpigmentation",
          confidence: 0.72,
          severity: "Mild",
          description: "Dark spots following previous acne lesions",
          recommendations: [
            "Vitamin C serum",
            "Sunscreen daily",
            "Consider chemical peeling"
          ],
          followUpRequired: false
        }
      ],
      notes: "Patient reports recent flare-up, requesting expert validation"
    }).returning();

    console.log("Created skin analysis:", skinAnalysis.id);

    // Create a medical questionnaire for this analysis
    const [questionnaire] = await db.insert(medicalQuestionnaires).values({
      skinAnalysisId: skinAnalysis.id,
      patientId: 8,
      chiefComplaint: "Sudden increase in facial acne lesions",
      complaintDuration: "2 weeks",
      previousMedications: "Benzoyl peroxide wash (discontinued 1 month ago)",
      currentMedications: "None",
      comorbidities: "None",
      familyHistory: "Mother had acne in teenage years",
      smokingHistory: false,
      alcoholHistory: false,
      additionalSymptoms: "Mild itching and redness"
    }).returning();

    console.log("Created medical questionnaire:", questionnaire.id);

    // Create analysis validation record for expert review
    const [validation] = await db.insert(analysisValidations).values({
      skinAnalysisId: skinAnalysis.id,
      expertId: 27, // Expert user
      aiResults: [
        {
          condition: "Acne Vulgaris",
          confidence: 0.87,
          severity: "Moderate",
          description: "Inflammatory acne lesions observed on facial area",
          recommendations: [
            "Topical retinoid treatment",
            "Gentle cleansing routine",
            "Avoid comedogenic products"
          ],
          followUpRequired: true
        }
      ],
      status: "pending",
      expertComments: null
    }).returning();

    console.log("Created analysis validation:", validation.id);

    // Create expert notification
    const [notification] = await db.insert(expertNotifications).values({
      expertId: 27,
      analysisValidationId: validation.id,
      title: "New Analysis Awaiting Validation",
      message: `Skin analysis #${skinAnalysis.id} for patient DRM9740 requires expert review. AI detected moderate acne vulgaris with 87% confidence.`,
      priority: "normal"
    }).returning();

    console.log("Created expert notification:", notification.id);

    console.log("\nTest data creation completed successfully!");
    console.log("Expert can now validate analysis ID:", skinAnalysis.id);
    
  } catch (error) {
    console.error("Error creating test data:", error);
  }
}

createTestValidationData().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});