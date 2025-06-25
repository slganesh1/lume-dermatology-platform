import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client for generating condition-specific information
const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export interface ConditionDetails {
  condition: string;
  severity: string;
  description: string;
  possibleCauses: string[];
  recommendations: string[];
  bestPractices: string[];
  confidence: number;
  type: string;
}

/**
 * Generates updated condition details when expert changes the main condition
 * @param newCondition The new skin condition name
 * @param currentSeverity The current severity level
 * @param bodyPart Optional body part information
 * @returns Updated condition details with appropriate causes, treatments, and recommendations
 */
export async function generateConditionDetails(
  newCondition: string,
  currentSeverity: string = "Moderate",
  bodyPart?: string
): Promise<ConditionDetails> {
  
  // Comprehensive knowledge base for common skin conditions
  const fallbackKnowledge: Record<string, Partial<ConditionDetails>> = {
    "Acne": {
      description: "A common skin condition characterized by clogged pores, inflammation, and bacterial infection affecting sebaceous follicles.",
      possibleCauses: ["Hormonal fluctuations", "Excess sebum production", "Propionibacterium acnes infection", "Genetic predisposition", "Comedogenic products"],
      recommendations: ["Use salicylic acid or benzoyl peroxide cleansers", "Apply topical retinoids (tretinoin, adapalene)", "Consider oral antibiotics for moderate-severe cases", "Avoid comedogenic skincare products"],
      bestPractices: ["Gentle twice-daily cleansing", "Use non-comedogenic moisturizers", "Apply broad-spectrum SPF daily", "Avoid picking or squeezing lesions"]
    },
    "Eczema": {
      description: "A chronic inflammatory skin condition causing red, itchy, and dry patches.",
      possibleCauses: ["Genetic predisposition", "Environmental allergens", "Stress", "Dry skin"],
      recommendations: ["Use fragrance-free moisturizers", "Apply topical corticosteroids", "Identify and avoid triggers", "Consider antihistamines"],
      bestPractices: ["Keep skin moisturized", "Use gentle soaps", "Wear soft fabrics", "Manage stress levels"]
    },
    "Psoriasis": {
      description: "An autoimmune condition causing rapid skin cell turnover and scaly patches.",
      possibleCauses: ["Autoimmune dysfunction", "Genetic factors", "Stress", "Infections"],
      recommendations: ["Apply topical treatments", "Consider phototherapy", "Use moisturizers regularly", "Consult dermatologist for systemic therapy"],
      bestPractices: ["Avoid known triggers", "Maintain healthy lifestyle", "Regular dermatological follow-up"]
    },
    "Seborrheic Keratosis": {
      description: "Benign skin growths that appear as waxy, scaly, slightly raised lesions.",
      possibleCauses: ["Aging", "Genetic factors", "Sun exposure", "Hormonal changes"],
      recommendations: ["Monitor for changes", "Consider removal if irritated", "Protect from sun damage", "Regular dermatological check-ups"],
      bestPractices: ["Use sunscreen daily", "Avoid scratching", "Keep area clean and dry"]
    },
    "Melanoma": {
      description: "A serious form of skin cancer that develops in melanocytes.",
      possibleCauses: ["UV radiation exposure", "Genetic mutations", "Family history", "Multiple moles"],
      recommendations: ["Immediate dermatological evaluation", "Biopsy confirmation", "Staging workup", "Surgical excision"],
      bestPractices: ["Regular skin self-examinations", "Annual dermatology screening", "Sun protection", "Avoid tanning beds"]
    },
    "Basal Cell Carcinoma": {
      description: "The most common type of skin cancer, typically appearing as a pearly bump or flat lesion.",
      possibleCauses: ["Chronic sun exposure", "UV radiation", "Fair skin", "Age"],
      recommendations: ["Surgical removal", "Mohs surgery if indicated", "Regular follow-up", "Sun protection"],
      bestPractices: ["Daily sunscreen use", "Protective clothing", "Regular skin checks", "Avoid peak sun hours"]
    },
    "Rosacea": {
      description: "A chronic inflammatory condition causing redness and visible blood vessels on the face.",
      possibleCauses: ["Genetic predisposition", "Environmental triggers", "Vascular abnormalities", "Demodex mites"],
      recommendations: ["Identify and avoid triggers", "Use gentle skincare", "Apply topical antibiotics", "Consider laser therapy"],
      bestPractices: ["Use mineral sunscreen", "Avoid harsh products", "Keep diary of triggers", "Gentle cleansing routine"]
    }
  };

  // Try to use AI for more accurate and detailed information
  if (anthropic && process.env.ANTHROPIC_API_KEY) {
    try {
      const prompt = `Generate detailed medical information for the skin condition "${newCondition}" ${bodyPart ? `affecting ${bodyPart}` : ''}. 
      
      Severity level: ${currentSeverity}
      
      Provide a JSON response with the following structure:
      {
        "description": "Detailed medical description of the condition",
        "possibleCauses": ["cause1", "cause2", "cause3", "cause4"],
        "recommendations": ["treatment1", "treatment2", "treatment3", "treatment4"],
        "bestPractices": ["practice1", "practice2", "practice3"]
      }
      
      Make sure the information is:
      - Medically accurate and professional
      - Appropriate for the specified severity level
      - Practical and actionable
      - Suitable for dermatological context`;

      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          const aiData = JSON.parse(content.text);
          return {
            condition: newCondition,
            severity: currentSeverity,
            description: aiData.description,
            possibleCauses: aiData.possibleCauses || [],
            recommendations: aiData.recommendations || [],
            bestPractices: aiData.bestPractices || [],
            confidence: 0.9,
            type: "primary"
          };
        } catch (parseError) {
          console.warn("Failed to parse AI response, using fallback knowledge");
        }
      }
    } catch (error) {
      console.warn("AI condition lookup failed, using fallback knowledge:", error);
    }
  }

  // Use fallback knowledge base
  const fallbackData = fallbackKnowledge[newCondition] || fallbackKnowledge["Acne"]; // Default to acne if condition not found
  
  return {
    condition: newCondition,
    severity: currentSeverity,
    description: fallbackData.description || `${newCondition} is a skin condition requiring professional evaluation.`,
    possibleCauses: fallbackData.possibleCauses || ["Unknown etiology", "Genetic factors", "Environmental factors"],
    recommendations: fallbackData.recommendations || ["Consult dermatologist", "Follow prescribed treatment", "Monitor condition"],
    bestPractices: fallbackData.bestPractices || ["Maintain good skin hygiene", "Follow medical advice", "Regular follow-up"],
    confidence: 0.8,
    type: "primary"
  };
}

/**
 * Updates an existing analysis result with new condition details
 */
export async function updateAnalysisWithNewCondition(
  originalResult: any,
  newCondition: string
): Promise<any> {
  const updatedDetails = await generateConditionDetails(
    newCondition,
    originalResult.severity || "Moderate",
    originalResult.bodyPart
  );

  return {
    ...originalResult,
    condition: updatedDetails.condition,
    description: updatedDetails.description,
    possibleCauses: updatedDetails.possibleCauses,
    recommendations: updatedDetails.recommendations,
    bestPractices: updatedDetails.bestPractices
  };
}