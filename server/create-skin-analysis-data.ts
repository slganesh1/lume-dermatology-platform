import { storage } from "./storage";

async function createSkinAnalysisTestData() {
  try {
    console.log("Creating skin analysis test data for expert validation...");

    // Get the existing patient
    const patient = await storage.getPatientByPid("DRM9740");
    if (!patient) {
      console.log("Patient DRM9740 not found");
      return;
    }

    // Create skin analysis entries that experts can review
    const skinAnalysis1 = await storage.createSkinAnalysis({
      patientId: patient.id,
      imageUrl: "/uploads/test-acne-face.jpg",
      imageType: "skin",
      bodyPart: "face", 
      results: JSON.stringify([{
        condition: "Acne Vulgaris",
        confidence: 0.87,
        severity: "Moderate",
        description: "Inflammatory acne lesions observed on facial area with comedones and papules",
        recommendations: ["Topical retinoid treatment", "Gentle cleansing routine", "Avoid comedogenic products"],
        followUpRequired: true
      }]),
      notes: "Patient reports sudden increase in facial acne lesions",
      date: new Date().toISOString().split('T')[0]
    });
    console.log("Created skin analysis 1:", skinAnalysis1.id);

    const skinAnalysis2 = await storage.createSkinAnalysis({
      patientId: patient.id,
      imageUrl: "/uploads/test-eczema-arm.jpg", 
      imageType: "skin",
      bodyPart: "arm",
      results: JSON.stringify([{
        condition: "Atopic Dermatitis", 
        confidence: 0.92,
        severity: "Mild",
        description: "Characteristic eczematous patches with erythema and scaling",
        recommendations: ["Moisturize regularly", "Use fragrance-free products", "Consider topical corticosteroids"],
        followUpRequired: false
      }]),
      notes: "Recurring eczema flare-up on left forearm",
      date: new Date().toISOString().split('T')[0]
    });
    console.log("Created skin analysis 2:", skinAnalysis2.id);

    const skinAnalysis3 = await storage.createSkinAnalysis({
      patientId: patient.id,
      imageUrl: "/uploads/test-mole-back.jpg",
      imageType: "skin", 
      bodyPart: "back",
      results: JSON.stringify([{
        condition: "Benign Nevus",
        confidence: 0.78,
        severity: "Monitor",
        description: "Pigmented lesion with regular borders and uniform coloration",
        recommendations: ["Continue monitoring", "Annual dermatological check-up", "Watch for changes in size or color"],
        followUpRequired: true
      }]),
      notes: "Patient noticed new mole, requests evaluation",
      date: new Date().toISOString().split('T')[0]
    });
    console.log("Created skin analysis 3:", skinAnalysis3.id);

    console.log("Successfully created skin analysis test data for expert review");
    
  } catch (error) {
    console.error("Error creating skin analysis test data:", error);
  }
}

createSkinAnalysisTestData();