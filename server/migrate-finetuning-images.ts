import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const oldImagesDir = path.join(__dirname, 'fine-tuning', 'data', 'images');
const newImagesDir = path.join(process.cwd(), 'uploads', 'fine-tuning', 'images');
const oldCasesPath = path.join(__dirname, 'fine-tuning', 'data', 'dermatology_cases.json');
const newCasesPath = path.join(process.cwd(), 'uploads', 'fine-tuning', 'dermatology_cases.json');

// Create directories if they don't exist
if (!fs.existsSync(newImagesDir)) {
  fs.mkdirSync(newImagesDir, { recursive: true });
  console.log('Created new images directory:', newImagesDir);
}

// Migrate images
function migrateImages() {
  if (fs.existsSync(oldImagesDir)) {
    try {
      const files = fs.readdirSync(oldImagesDir);
      console.log(`Found ${files.length} files in old directory to migrate`);
      
      files.forEach(file => {
        const sourcePath = path.join(oldImagesDir, file);
        const destPath = path.join(newImagesDir, file);
        
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`Migrated image: ${file}`);
        } else {
          console.log(`Skipped image (already exists): ${file}`);
        }
      });
      
      console.log('Image migration completed');
    } catch (error) {
      console.error('Error migrating images:', error);
    }
  } else {
    console.log('No old images directory found, skipping image migration');
  }
}

// Migrate cases file
function migrateCases() {
  if (fs.existsSync(oldCasesPath)) {
    try {
      // Create cases file if it doesn't exist
      if (!fs.existsSync(newCasesPath)) {
        const casesDir = path.dirname(newCasesPath);
        if (!fs.existsSync(casesDir)) {
          fs.mkdirSync(casesDir, { recursive: true });
        }
        
        // Copy the cases file
        fs.copyFileSync(oldCasesPath, newCasesPath);
        console.log('Migrated cases file');
      } else {
        console.log('Cases file already exists in the new location, skipping');
      }
    } catch (error) {
      console.error('Error migrating cases file:', error);
    }
  } else {
    console.log('No old cases file found, creating empty one');
    fs.writeFileSync(newCasesPath, JSON.stringify([], null, 2));
  }
}

// Run migrations
console.log('Starting fine-tuning data migration...');
migrateImages();
migrateCases();
console.log('Fine-tuning data migration completed');