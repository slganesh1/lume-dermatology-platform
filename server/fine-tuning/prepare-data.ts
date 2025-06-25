import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { AnalysisResult } from '@shared/schema';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Prepares dermatological image data for OpenAI fine-tuning
 * 
 * This utility converts your image dataset and clinical diagnoses into
 * a format suitable for OpenAI fine-tuning.
 */

interface DermatologyCase {
  imageFileName: string;
  diagnosis: string;
  severity: string;
  bodyPart?: string;
  patientInfo?: {
    age?: number;
    gender?: string;
    skinType?: string;
  };
  treatments?: string[];
  description?: string;
}

interface FineTuningExample {
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }[];
}

/**
 * Converts your dermatology cases into OpenAI fine-tuning format
 * @param sourceCasesPath Path to JSON file containing dermatology cases
 * @param outputPath Path to save the JSONL file for OpenAI fine-tuning
 * @param imageBasePath Base directory where images are stored
 */
export async function convertCasesToFineTuningFormat(
  sourceCasesPath: string,
  outputPath: string,
  imageBasePath: string
): Promise<void> {
  try {
    // Load your cases
    const rawData = fs.readFileSync(sourceCasesPath, 'utf-8');
    const cases: DermatologyCase[] = JSON.parse(rawData);
    
    // Create fine-tuning examples
    const examples: FineTuningExample[] = [];
    
    for (const dermCase of cases) {
      const imagePath = path.join(imageBasePath, dermCase.imageFileName);
      
      // Check if image exists
      if (!fs.existsSync(imagePath)) {
        console.warn(`Warning: Image not found at ${imagePath}. Skipping case.`);
        continue;
      }
      
      // Convert image to base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const imageType = path.extname(dermCase.imageFileName).toLowerCase() === '.png' ? 'png' : 'jpeg';
      
      // Create the expected analysis result
      const analysisResult: AnalysisResult = {
        condition: dermCase.diagnosis,
        confidence: 0.95, // High confidence since these are confirmed cases
        severity: dermCase.severity as "Mild" | "Moderate" | "Severe",
        description: dermCase.description || `${dermCase.diagnosis} affecting the ${dermCase.bodyPart || 'skin'}.`,
        type: "primary",
        possibleCauses: dermCase.treatments ? 
          ["Various factors can contribute to this condition"] : undefined,
        recommendations: dermCase.treatments ?
          dermCase.treatments.map(t => `Consider ${t}`) : undefined,
        bestPractices: [
          "Regular dermatologist consultations",
          "Maintain skin hygiene",
          "Avoid known irritants"
        ],
        treatmentOptions: dermCase.treatments || [
          "Consult a dermatologist for specific treatments"
        ]
      };
      
      // Create the example
      const example: FineTuningExample = {
        messages: [
          {
            role: 'system',
            content: `You are an AI medical assistant trained to analyze dermatological conditions in anonymous, de-identified medical images of skin. 
            You are NOT analyzing or identifying any person - you are ONLY providing information about potential skin conditions visible in medical images.
            
            These images are provided in a secure healthcare environment for educational and preliminary screening purposes only. 
            No facial features or identifying information should be mentioned or considered in your analysis.
            
            Analyze only the skin condition visible in the image and identify one potential dermatological condition based solely on the visible symptoms and characteristics.
            
            Reply with a JSON object containing detailed analysis of the skin condition shown.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `This is a de-identified, anonymous medical image for skin condition analysis only. 
                Please analyze this dermatological condition visible in the image${dermCase.bodyPart ? ` in the ${dermCase.bodyPart} area` : ''} 
                and identify any potential findings. Focus only on skin characteristics and not on identifying any person.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/${imageType};base64,${base64Image}`
                }
              }
            ]
          },
          {
            role: 'assistant',
            content: JSON.stringify({
              conditions: [analysisResult]
            }, null, 2)
          }
        ]
      };
      
      examples.push(example);
    }
    
    // Write to JSONL file (one JSON object per line)
    const jsonlContent = examples.map(ex => JSON.stringify(ex)).join('\n');
    fs.writeFileSync(outputPath, jsonlContent);
    
    console.log(`Successfully converted ${examples.length} cases to fine-tuning format at ${outputPath}`);
  } catch (error) {
    console.error('Error converting cases to fine-tuning format:', error);
    throw error;
  }
}

// Example structure for your dermatology cases JSON file:
/*
[
  {
    "imageFileName": "eczema_case1.jpg",
    "diagnosis": "Atopic Dermatitis",
    "severity": "Moderate",
    "bodyPart": "Elbow",
    "patientInfo": {
      "age": 32,
      "gender": "Female",
      "skinType": "Dry"
    },
    "treatments": [
      "Topical corticosteroids",
      "Moisturizers",
      "Avoid irritants"
    ],
    "description": "Atopic dermatitis presenting with redness, scaling, and small fluid-filled blisters."
  }
]
*/