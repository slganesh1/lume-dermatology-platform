import fs from 'fs';
import path from 'path';

// Define source and destination paths
const uploadDir = path.join(process.cwd(), 'uploads');
const fineTuningImagesDir = path.join(process.cwd(), 'uploads', 'fine-tuning', 'images');

// Ensure the destination directory exists
if (!fs.existsSync(fineTuningImagesDir)) {
  fs.mkdirSync(fineTuningImagesDir, { recursive: true });
  console.log('Created fine-tuning images directory:', fineTuningImagesDir);
}

// Function to find image files recursively
function findImageFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && file !== 'fine-tuning') {
      // Recursively search directories (except the fine-tuning directory to avoid duplicates)
      findImageFiles(filePath, fileList);
    } else if (stat.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(file)) {
      // Add image files to the list
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Find all image files
console.log('Searching for image files in uploads directory...');
const imageFiles = findImageFiles(uploadDir);
console.log(`Found ${imageFiles.length} image files.`);

// Migrate images to fine-tuning directory
let migratedCount = 0;
let skippedCount = 0;

imageFiles.forEach(filePath => {
  const fileName = path.basename(filePath);
  const destPath = path.join(fineTuningImagesDir, fileName);

  // Skip if the file is already in the fine-tuning directory
  if (filePath.includes('fine-tuning/images')) {
    skippedCount++;
    return;
  }

  // Check if file already exists in destination
  if (fs.existsSync(destPath)) {
    console.log(`Skipping ${fileName} (already exists in destination)`);
    skippedCount++;
    return;
  }

  try {
    // Copy the file to the fine-tuning images directory
    fs.copyFileSync(filePath, destPath);
    console.log(`Migrated: ${fileName}`);
    migratedCount++;
  } catch (error) {
    console.error(`Error migrating ${fileName}:`, error);
  }
});

console.log('\nMigration Summary:');
console.log(`Total images found: ${imageFiles.length}`);
console.log(`Images migrated: ${migratedCount}`);
console.log(`Images skipped: ${skippedCount}`);
console.log(`Fine-tuning images directory now contains ${fs.readdirSync(fineTuningImagesDir).length} images.`);