import fs from 'fs';
import path from 'path';

const casesPath = path.join(__dirname, 'data', 'dermatology_cases.json');
const outputPath = path.join(__dirname, 'data', 'prepared', 'training_data.jsonl');

function fixTrainingFormat() {
  try {
    // Read existing cases
    if (!fs.existsSync(casesPath)) {
      console.log('No cases file found');
      return;
    }

    const casesData = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
    const trainingExamples = [];

    // Convert each case to proper text-only format
    for (const caseData of casesData) {
      if (!caseData.diagnosis || !caseData.imageFileName) continue;

      // Create text-only training example (no images for fine-tuning)
      const trainingExample = {
        messages: [
          {
            role: "system",
            content: "You are a specialized dermatology diagnostic assistant. Analyze described skin conditions and provide detailed medical assessments including diagnosis, severity, body part, treatments, and description."
          },
          {
            role: "user",
            content: `Analyze this dermatological case: Patient presents with skin condition on ${caseData.bodyPart || 'skin'}. Provide detailed diagnosis and treatment recommendations.`
          },
          {
            role: "assistant",
            content: `Diagnosis: ${caseData.diagnosis}\nSeverity: ${caseData.severity || 'Moderate'}\nBody Part: ${caseData.bodyPart || 'skin'}\nRecommended Treatments: ${Array.isArray(caseData.treatments) ? caseData.treatments.join(', ') : caseData.treatments || 'Topical treatment'}\nDescription: ${caseData.description || 'Dermatological condition requiring medical attention'}`
          }
        ]
      };

      trainingExamples.push(trainingExample);
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write corrected training data
    const jsonlContent = trainingExamples
      .map(example => JSON.stringify(example))
      .join('\n');

    fs.writeFileSync(outputPath, jsonlContent, 'utf8');
    
    console.log(`Fixed training format! Generated ${trainingExamples.length} training examples`);
    console.log(`Output saved to: ${outputPath}`);
    
    return trainingExamples.length;
  } catch (error) {
    console.error('Error fixing training format:', error);
    throw error;
  }
}

export { fixTrainingFormat };