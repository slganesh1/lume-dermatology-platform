import Anthropic from '@anthropic-ai/sdk';
import fs from "fs";
import { AnalysisResult } from "@shared/schema";

// Initialize the Anthropic client
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("ANTHROPIC_API_KEY is not set. Claude skin analysis will not work properly.");
}

// Create Anthropic client
const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const CLAUDE_MODEL = "claude-3-7-sonnet-20250219";

/**
 * Analyzes a skin image using Anthropic Claude and returns detailed assessment
 * @param imagePath Path to the image file
 * @param imageType Type of image (only skin is supported)
 * @param bodyPart Optional body part or region
 * @returns Array of analysis results with condition details
 */
export async function analyzeMedicalImageWithClaude(
  imagePath: string, 
  imageType: string = 'skin',
  bodyPart?: string
): Promise<AnalysisResult[]> {
  // Check if API key is available
  if (!process.env.ANTHROPIC_API_KEY || !anthropic) {
    console.error("ANTHROPIC_API_KEY is not set. Cannot perform medical image analysis with Claude.");
    return [{
      condition: "API Key Required",
      confidence: 0.99,
      severity: "N/A",
      description: "Please set up your Anthropic API key to enable skin analysis with Claude.",
      type: "primary"
    }];
  }
  
  try {
    // Read the image file as buffer and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");
    
    console.log(`Analyzing skin image at ${imagePath} with Anthropic Claude...`);
    
    // Create system prompt for skin condition analysis
    const systemPrompt = `
      You are an AI medical assistant trained to analyze dermatological conditions in anonymous, de-identified medical images of skin. You are NOT analyzing or identifying any person - you are ONLY providing information about potential skin conditions visible in medical images.
      
      These images are provided in a secure healthcare environment for educational and preliminary screening purposes only. No facial features or identifying information should be mentioned or considered in your analysis.
      
      Analyze only the skin condition visible in the image and identify one potential dermatological condition based solely on the visible symptoms and characteristics.
      
      You will respond with structured output containing the following information:
      - Condition name
      - Confidence level (decimal between 0.1 and 1.0)
      - Severity (Mild, Moderate, or Severe)
      - Detailed description of the condition
      - Type (primary, secondary, or incidental)
      - Possible causes (2-4 items)
      - Recommendations (2-4 practical suggestions)
      - Best practices (2-4 specific items for this condition)

      
      Format your response as JSON precisely like this:
      {
        "conditions": [
          {
            "condition": "Name of Condition",
            "confidence": 0.9, 
            "severity": "Moderate", 
            "description": "Detailed description of the skin condition, its appearance, and common symptoms.",
            "type": "primary",
            "possibleCauses": ["Cause 1", "Cause 2", "Cause 3"],
            "recommendations": ["Clear recommendation 1", "Clear recommendation 2"],
            "bestPractices": ["Practice 1", "Practice 2", "Practice 3"]
          }
        ]
      }
      
      IMPORTANT: This is a preliminary analysis only and should not be considered a medical diagnosis. Patients should always consult with a qualified healthcare professional for proper diagnosis and treatment.
    `;
    
    // Make request to Anthropic Claude
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This is a de-identified, anonymous medical image for skin condition analysis only. Please analyze this dermatological condition visible in the image${bodyPart ? ` in the ${bodyPart} area` : ''} and identify any potential findings. Focus only on skin characteristics and not on identifying any person.`
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ]
    });
    
    // Log the response for debugging
    const responseText = response.content[0].type === 'text' 
      ? (response.content[0] as { type: 'text', text: string }).text 
      : 'No text content found';
    
    console.log("Claude response text:", responseText);
    
    try {
      // Extract JSON from the response
      let jsonText = responseText;
      
      // Sometimes Claude includes markdown code blocks or additional text
      // Try to extract just the JSON part
      const jsonPattern = /```json\s*([\s\S]*?)\s*```|{[\s\S]*}/;
      const jsonMatch = jsonPattern.exec(jsonText);
      
      if (jsonMatch) {
        // Use the content of the code block if found, otherwise use the full match
        jsonText = jsonMatch[1] || jsonMatch[0];
      }
      
      // Parse the JSON
      const parsedResponse = JSON.parse(jsonText);
      
      // Handle different possible response formats
      if (parsedResponse.conditions && Array.isArray(parsedResponse.conditions)) {
        return parsedResponse.conditions;
      } else if (Array.isArray(parsedResponse)) {
        return parsedResponse;
      } else if (parsedResponse.condition && parsedResponse.confidence) {
        // Single condition object, wrap in array
        return [parsedResponse];
      } else {
        // Create a fallback response if format doesn't match expectations
        console.warn("Unexpected response format from Claude:", parsedResponse);
        return [{
          condition: "Analysis Incomplete",
          confidence: 0.5,
          severity: "Unknown",
          description: "The Claude AI analysis returned an unexpected format. Please try again.",
          type: "primary"
        }];
      }
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
      
      // Even if JSON parsing fails, try to extract condition details from text
      // Safely access the text content
      const responseText = response.content[0].type === 'text' 
        ? (response.content[0] as { type: 'text', text: string }).text 
        : '';
      
      // Create a best-effort analysis from text
      const condition = extractValueFromText(responseText, "condition") || "Unidentified Condition";
      const severity = extractValueFromText(responseText, "severity") || "Unknown";
      const description = extractValueFromText(responseText, "description") || 
                           "A detailed assessment by a healthcare professional is recommended.";
      const confidenceStr = extractValueFromText(responseText, "confidence");
      const confidence = confidenceStr ? parseFloat(confidenceStr) : 0.5;
      
      return [{
        condition,
        confidence,
        severity,
        description,
        type: "primary",
        possibleCauses: extractListFromText(responseText, "possible causes", "cause"),
        recommendations: extractListFromText(responseText, "recommendations", "recommendation"),
        bestPractices: extractListFromText(responseText, "best practices", "practice"),
        treatmentOptions: extractListFromText(responseText, "treatment options", "treatment")
      }];
    }
  } catch (error: any) {
    console.error(`Error analyzing skin image with Claude:`, error);
    
    // Provide more helpful information based on the specific error
    let errorMessage = error?.message || "Unknown error";
    let helpfulDescription = "Please try again or contact support.";
    
    // Check for common Anthropic API errors
    if (errorMessage.includes("rate limit") || errorMessage.includes("Too many requests")) {
      errorMessage = "Rate limit exceeded";
      helpfulDescription = "Our AI service is currently experiencing high demand. Please try again in a few minutes.";
    } else if (errorMessage.includes("invalid API key") || errorMessage.includes("authentication")) {
      errorMessage = "Authentication error";
      helpfulDescription = "There appears to be an issue with our AI service credentials. Please try another analysis service or contact support.";
    } else if (errorMessage.includes("content policy") || errorMessage.includes("moderation")) {
      errorMessage = "Content policy violation";
      helpfulDescription = "The image may contain content that cannot be analyzed by our AI service. Please ensure you're uploading appropriate medical skin images.";
    }
    
    // Create a more meaningful API error response
    return [{
      condition: "Claude Analysis Error",
      confidence: 0.5,
      severity: "Unknown",
      description: `${errorMessage}. ${helpfulDescription}`,
      type: "primary",
      recommendations: [
        "Try using a different analysis service (OpenAI or Hugging Face)",
        "Ensure your image is clear and well-lit",
        "If the issue persists, please contact technical support"
      ]
    }];
  }
}

/**
 * Helper function to extract values from text when JSON parsing fails
 */
function extractValueFromText(text: string, key: string): string | null {
  const pattern = new RegExp(`${key}\\s*:?\\s*["']?([^"',\\n]+)["']?`, 'i');
  const match = pattern.exec(text);
  return match ? match[1].trim() : null;
}

/**
 * Helper function to extract lists from text when JSON parsing fails
 */
function extractListFromText(text: string, sectionName: string, itemPattern: string): string[] {
  // Try to find a section with the given name
  const sectionPattern = new RegExp(`${sectionName}[:\\s]*([\\s\\S]*?)(?:##|$)`, 'i');
  const sectionMatch = sectionPattern.exec(text);
  
  if (!sectionMatch) return [];
  
  const sectionText = sectionMatch[1];
  
  // Look for bullet points or numbered lists
  const items: string[] = [];
  const listItemPattern = /[-*•]|\d+\.\s+([^\n]+)/g;
  let match;
  
  while ((match = listItemPattern.exec(sectionText)) !== null) {
    items.push(match[1].trim());
  }
  
  // If no list items found, try to find items based on the item pattern
  if (items.length === 0) {
    const itemRegex = new RegExp(`${itemPattern}\\s*\\d*\\s*:?\\s*["']?([^"',\\n]+)["']?`, 'gi');
    let itemMatch;
    while ((itemMatch = itemRegex.exec(sectionText)) !== null) {
      items.push(itemMatch[1].trim());
    }
  }
  
  // Return at most 5 items
  return items.slice(0, 5);
}