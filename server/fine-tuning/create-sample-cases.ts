import fs from 'fs';
import path from 'path';

const casesPath = path.join(__dirname, 'data', 'dermatology_cases.json');

// Common dermatological conditions for training
const sampleConditions = [
  {
    diagnosis: "Acne Vulgaris",
    severity: "Moderate",
    bodyPart: "Face",
    treatments: ["Benzoyl peroxide", "Tretinoin", "Oral antibiotics", "Salicylic acid"],
    description: "Inflammatory acne with multiple papules and pustules concentrated on the cheeks and forehead, with some comedones. Mild scarring present from previous lesions."
  },
  {
    diagnosis: "Atopic Dermatitis",
    severity: "Mild",
    bodyPart: "Arms",
    treatments: ["Topical corticosteroids", "Moisturizers", "Antihistamines", "Calcineurin inhibitors"],
    description: "Chronic inflammatory skin condition with red, itchy, and scaly patches. Often associated with allergies and asthma."
  },
  {
    diagnosis: "Psoriasis",
    severity: "Moderate",
    bodyPart: "Elbows",
    treatments: ["Topical corticosteroids", "Vitamin D analogues", "Methotrexate", "Phototherapy"],
    description: "Chronic autoimmune condition characterized by thick, silvery scales and itchy, dry, red patches."
  },
  {
    diagnosis: "Seborrheic Dermatitis",
    severity: "Mild",
    bodyPart: "Scalp",
    treatments: ["Antifungal shampoos", "Topical corticosteroids", "Selenium sulfide", "Ketoconazole"],
    description: "Inflammatory skin condition affecting oil-rich areas, characterized by red, scaly, and itchy patches."
  },
  {
    diagnosis: "Contact Dermatitis",
    severity: "Moderate",
    bodyPart: "Hands",
    treatments: ["Topical corticosteroids", "Antihistamines", "Cool compresses", "Barrier creams"],
    description: "Inflammatory reaction caused by direct contact with allergens or irritants, resulting in red, itchy, and sometimes blistered skin."
  },
  {
    diagnosis: "Melanoma",
    severity: "Severe",
    bodyPart: "Back",
    treatments: ["Surgical excision", "Immunotherapy", "Targeted therapy", "Radiation therapy"],
    description: "Malignant skin cancer arising from melanocytes, requiring immediate medical attention and treatment."
  },
  {
    diagnosis: "Basal Cell Carcinoma",
    severity: "Moderate",
    bodyPart: "Nose",
    treatments: ["Mohs surgery", "Excisional surgery", "Topical chemotherapy", "Radiation therapy"],
    description: "Most common form of skin cancer, typically appearing as a pearly or waxy bump on sun-exposed areas."
  },
  {
    diagnosis: "Rosacea",
    severity: "Mild",
    bodyPart: "Face",
    treatments: ["Topical metronidazole", "Oral antibiotics", "Laser therapy", "IPL treatment"],
    description: "Chronic inflammatory condition causing facial redness, visible blood vessels, and sometimes pustules."
  }
];

function createSampleCases(imageList: string[]) {
  const cases = [];
  
  // Create cases for available images
  imageList.forEach((imageName, index) => {
    const conditionIndex = index % sampleConditions.length;
    const condition = sampleConditions[conditionIndex];
    
    const caseData = {
      imageFileName: imageName,
      diagnosis: condition.diagnosis,
      severity: condition.severity,
      bodyPart: condition.bodyPart,
      treatments: condition.treatments,
      description: condition.description,
      dateCreated: new Date().toISOString()
    };
    
    cases.push(caseData);
  });
  
  // Ensure directory exists
  const dir = path.dirname(casesPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Save cases
  fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2), 'utf8');
  
  console.log(`Created ${cases.length} diagnostic cases`);
  return cases.length;
}

export { createSampleCases, sampleConditions };