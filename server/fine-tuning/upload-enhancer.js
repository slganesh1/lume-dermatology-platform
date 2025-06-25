/**
 * Upload Enhancer for LUME fine-tuning admin page
 * This file helps detect and convert problematic image files, particularly those from WhatsApp
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Enhances an uploaded image file to ensure compatibility
 * @param {Object} file - The uploaded file object from multer
 * @param {string} uploadDir - The directory where fixed files should be saved
 * @returns {Promise<Object>} - The enhanced file info or original if no changes needed
 */
async function enhanceImageFile(file, uploadDir) {
  // Return early if file doesn't exist
  if (!file || !file.path || !fs.existsSync(file.path)) {
    console.log('Invalid file or path:', file);
    return file;
  }

  // Check if file is a WhatsApp image or other problematic format
  let needsConversion = false;
  
  try {
    // Try to get image metadata to determine if conversion is needed
    const metadata = await sharp(file.path).metadata();
    
    // WhatsApp images often have these characteristics
    if (metadata.format === 'jpeg' && (
        file.originalname.includes('WhatsApp') || 
        file.originalname.includes('WA') ||
        file.mimetype !== 'image/jpeg'
      )) {
      needsConversion = true;
      console.log('WhatsApp image detected, will convert:', file.originalname);
    }
    
    // Sometimes images report one format but are actually another
    if (metadata.format !== 'jpeg' && metadata.format !== 'png' && metadata.format !== 'webp') {
      needsConversion = true;
      console.log('Unsupported format detected, will convert:', metadata.format);
    }
  } catch (err) {
    // If we can't read the metadata, the file might be corrupted or in an unsupported format
    console.error('Error analyzing image, will attempt conversion:', err.message);
    needsConversion = true;
  }
  
  // If no conversion needed, return original file
  if (!needsConversion) {
    return file;
  }
  
  // Create a new filename for the converted image
  const timestamp = Date.now();
  const newFilename = `converted-${timestamp}-${path.basename(file.originalname, path.extname(file.originalname))}.jpg`;
  const newPath = path.join(uploadDir, newFilename);
  
  try {
    // Convert the image to JPEG format
    await sharp(file.path)
      .jpeg({ quality: 90 })
      .toFile(newPath);
    
    // Delete the original file
    fs.unlinkSync(file.path);
    
    // Return info about the converted file
    return {
      ...file,
      filename: newFilename,
      path: newPath,
      mimetype: 'image/jpeg',
      size: fs.statSync(newPath).size
    };
  } catch (err) {
    console.error('Error converting image:', err);
    return file; // Return original on error
  }
}

/**
 * Process multiple files to ensure compatibility
 * @param {Array} files - Array of uploaded file objects
 * @param {string} uploadDir - The directory where enhanced files should be saved
 * @returns {Promise<Array>} - Array of enhanced file objects
 */
async function enhanceImageFiles(files, uploadDir) {
  if (!Array.isArray(files) || files.length === 0) {
    return files;
  }
  
  const enhancedFiles = [];
  
  for (const file of files) {
    try {
      const enhancedFile = await enhanceImageFile(file, uploadDir);
      enhancedFiles.push(enhancedFile);
    } catch (err) {
      console.error('Error enhancing file:', err);
      enhancedFiles.push(file); // Keep original on error
    }
  }
  
  return enhancedFiles;
}

module.exports = {
  enhanceImageFile,
  enhanceImageFiles
};