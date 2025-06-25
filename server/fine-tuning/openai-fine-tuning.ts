/**
 * OpenAI fine-tuning integration for dermatology image analysis
 */

import fs from "fs";
import OpenAI from "openai";
import { fileURLToPath } from 'url';
import path from 'path';
import { AnalysisResult } from "@shared/schema";
import {
  getFineTunedModelId,
  shouldFallbackToDefaultModel,
  handleFineTuningError
} from "./integrate";

// Get dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Analyzes a medical image using a fine-tuned OpenAI model
 * @param imagePath Path to the image file
 * @param imageType Type of image (only skin is supported)
 * @param bodyPart Optional body part or region
 * @returns Array of analysis results or null if analysis fails
 */
export async function analyzeMedicalImageWithFineTuned(
  imagePath: string,
  imageType: string = "skin",
  bodyPart?: string
): Promise<AnalysisResult[] | null> {
  // Check if OpenAI client is available
  if (!openai) {
    console.error("OpenAI client not initialized. Cannot use fine-tuned model.");
    return null;
  }

  // Get the fine-tuned model ID
  const modelId = getFineTunedModelId();
  if (!modelId) {
    console.error("No fine-tuned model ID provided.");
    return null;
  }

  try {
    // Read the image file as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    // Use a similar prompt as the standard analysis but with some modifications
    // for the fine-tuned model
    const systemPrompt = `
      You are an AI dermatology assistant fine-tuned to analyze skin conditions.
      Analyze the skin condition in the provided image and identify potential dermatological conditions.
      
      Reply with a JSON object in this exact format:
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
            "bestPractices": ["Practice 1", "Practice 2", "Practice 3"],
            "treatmentOptions": ["Treatment 1", "Treatment 2", "Treatment 3"]
          }
        ]
      }
      
      Severity must be one of: "Mild", "Moderate", or "Severe".
      Type must be one of: "primary", "secondary", or "incidental".
      Confidence should be a decimal between 0.1 and 1.0.
    `;

    console.log(`Analyzing skin image at ${imagePath} with fine-tuned model ${modelId}...`);
    
    // Make request to OpenAI API with the fine-tuned model
    const response = await openai.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this dermatological condition visible in the image${
                bodyPart ? ` in the ${bodyPart} area` : ""
              } and identify any potential findings. Return a JSON object with the specified fields.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      // Force JSON object format
      response_format: { type: "json_object" }
    });

    // Parse and return the results
    if (!response.choices || response.choices.length === 0) {
      console.error("Fine-tuned model returned empty choices array:", response);
      return null;
    }

    const message = response.choices[0].message;
    if (!message || !message.content) {
      console.error("Fine-tuned model returned empty content:", response);
      return null;
    }

    console.log("Fine-tuned model response:", message.content);

    try {
      const parsedContent = JSON.parse(message.content);

      // Process the response similarly to the standard analysis function
      if (Array.isArray(parsedContent)) {
        return parsedContent;
      } else if (parsedContent.results && Array.isArray(parsedContent.results)) {
        return parsedContent.results;
      } else if (parsedContent.analysis && Array.isArray(parsedContent.analysis)) {
        return parsedContent.analysis;
      } else if (parsedContent.conditions && Array.isArray(parsedContent.conditions)) {
        // If the model returns an empty conditions array, return null to trigger fallback
        if (parsedContent.conditions.length === 0) {
          console.warn("Fine-tuned model returned empty conditions array");
          return null;
        }
        return parsedContent.conditions;
      } else {
        // If we have a single object with the expected properties, wrap it in an array
        if (
          parsedContent.condition &&
          parsedContent.confidence &&
          parsedContent.severity &&
          parsedContent.description &&
          parsedContent.type
        ) {
          return [parsedContent];
        }

        // Try to extract an array from any property that might contain our results
        for (const key in parsedContent) {
          if (Array.isArray(parsedContent[key])) {
            const firstItem = parsedContent[key][0];
            if (firstItem && firstItem.condition && firstItem.confidence) {
              return parsedContent[key];
            }
          }
        }

        // If we can't extract expected data, return null to trigger fallback
        console.warn(
          "Unexpected response format from fine-tuned model:",
          parsedContent
        );
        return null;
      }
    } catch (error) {
      console.error(
        "Error parsing fine-tuned model response:",
        error,
        "Content:",
        message.content
      );
      return null;
    }
  } catch (error) {
    console.error(`Error analyzing skin image with fine-tuned model:`, error);

    // Check if we should fallback to the default model
    if (shouldFallbackToDefaultModel() && handleFineTuningError(error)) {
      console.log("Fine-tuned model error, triggering fallback");
      return null;
    }

    // Re-throw the error if we shouldn't fallback
    throw error;
  }
}