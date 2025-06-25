import { db } from "./db";
import { medications } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedMedications() {
  try {
    // Check if medications already exist
    const existingMeds = await db.select().from(medications).limit(1);
    
    if (existingMeds.length > 0) {
      console.log(`Database already has medications. Skipping seeding.`);
      return;
    }
    
    console.log("Seeding medications to the database...");
    
    // Medications seed data
    const medicationsData = [
      {
        name: "Tretinoin",
        category: "Retinoid",
        description: "Topical medication that treats acne and reduces fine lines and wrinkles",
        dosage: "Cream",
        price: "$35.00",
        inStock: true,
        image: "/uploads/medicine-placeholder.jpg"
      },
      {
        name: "Hydrocortisone",
        category: "Corticosteroid",
        description: "Anti-inflammatory cream for minor skin irritations, itching, and rashes",
        dosage: "Cream",
        price: "$12.00",
        inStock: true,
        image: "/uploads/medicine-placeholder.jpg"
      },
      {
        name: "Clotrimazole",
        category: "Antifungal",
        description: "Treats fungal skin infections, including athlete's foot and ringworm",
        dosage: "Cream",
        price: "$15.00",
        inStock: true,
        image: "/uploads/medicine-placeholder.jpg"
      },
      {
        name: "Benzoyl Peroxide",
        category: "Antimicrobial",
        description: "Kills bacteria that cause acne and helps remove excess oil from the skin",
        dosage: "Gel",
        price: "$18.00",
        inStock: true,
        image: "/uploads/medicine-placeholder.jpg"
      },
      {
        name: "Salicylic Acid",
        category: "Beta Hydroxy Acid",
        description: "Exfoliates the skin and unclogs pores, effective for acne treatment",
        dosage: "Solution",
        price: "$20.00",
        inStock: true,
        image: "/uploads/medicine-placeholder.jpg"
      },
      {
        name: "Tacrolimus",
        category: "Immunomodulator",
        description: "For treating atopic dermatitis (eczema), particularly for sensitive areas",
        dosage: "Ointment",
        price: "$42.00",
        inStock: true,
        image: "/uploads/medicine-placeholder.jpg"
      },
      {
        name: "Azelaic Acid",
        category: "Dicarboxylic Acid",
        description: "For treating rosacea and acne, also helps with hyperpigmentation",
        dosage: "Cream",
        price: "$21.00",
        inStock: true,
        image: "/uploads/medicine-placeholder.jpg"
      },
      {
        name: "Adapalene",
        category: "Retinoid",
        description: "Topical retinoid that regulates skin cell turnover to prevent acne",
        dosage: "Gel",
        price: "$28.00",
        inStock: true,
        image: "/uploads/medicine-placeholder.jpg"
      },
      {
        name: "Ketoconazole",
        category: "Antifungal",
        description: "Treats fungal infections like seborrheic dermatitis and dandruff",
        dosage: "Cream",
        price: "$23.00",
        inStock: true,
        image: "/uploads/medicine-placeholder.jpg"
      },
      {
        name: "Metronidazole",
        category: "Antibiotic",
        description: "Topical antibiotic that reduces redness and inflammation in rosacea",
        dosage: "Gel",
        price: "$26.00",
        inStock: true,
        image: "/uploads/medicine-placeholder.jpg"
      }
    ];
    
    // Insert medications
    await db.insert(medications).values(medicationsData);
    
    console.log(`Successfully added ${medicationsData.length} medications to the database.`);
  } catch (error) {
    console.error("Error seeding medications:", error);
  }
}