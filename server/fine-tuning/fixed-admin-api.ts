import { Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireRole } from '../auth';
import { db } from '../db';
import OpenAI from 'openai';

// Get dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const dataDir = path.join(__dirname, 'data');
const imagesDir = path.join(dataDir, 'images');
const configFile = path.join(__dirname, 'config.json');
const casesFile = path.join(dataDir, 'dermatology_cases.json');

// Create directories if they don't exist
for (const dir of [dataDir, imagesDir]) {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log('Created directory:', dir);
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  }
}

// Configure storage for uploaded images
const uploadDir = imagesDir;
console.log('Image upload directory:', uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Sanitize the filename to prevent issues
    const filename = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    // Add timestamp to prevent duplicates but keep original name for readability
    const timestamp = Date.now();
    cb(null, timestamp + '-' + filename);
  }
});

// Set up multer for handling file uploads
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  fileFilter: (req, file, cb) => {
    // Accept image files based on mimetype or filename extension
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      // Check for common image extensions in case mimetype is wrong
      const filename = file.originalname.toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
      
      // Handle WhatsApp images which might have unusual extensions or mimetypes
      if (
        validExtensions.some(ext => filename.endsWith(ext)) || 
        filename.includes('whatsapp') || 
        filename.includes('wa')
      ) {
        console.log('Allowing file with image-like name but non-image mimetype:', filename, file.mimetype);
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  }
});

// Load config
function loadConfig() {
  if (fs.existsSync(configFile)) {
    try {
      const data = fs.readFileSync(configFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }
  return { enabled: false, modelId: '' };
}

// Save config
function saveConfig(config: any) {
  try {
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

// Load cases data
function loadCases() {
  if (fs.existsSync(casesFile)) {
    try {
      const data = fs.readFileSync(casesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  }
  return [];
}

// Save cases data
function saveCases(cases: any[]) {
  try {
    fs.writeFileSync(casesFile, JSON.stringify(cases, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving cases:', error);
    return false;
  }
}

// Initialize OpenAI client
function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Create router for fine-tuning API
const finetuningRouter = Router();

// Default export for compatibility with existing route imports
export default finetuningRouter;

// Get status of fine-tuning
finetuningRouter.get('/status', (req: Request, res: Response) => {
  const config = loadConfig();
  
  // Get list of images in the directory
  let images: string[] = [];
  if (fs.existsSync(imagesDir)) {
    images = fs.readdirSync(imagesDir)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
  }
  
  // Load the cases data
  const cases = loadCases();
  
  // Add job status information
  const jobStatus = {
    id: config.jobId || null,
    status: config.jobStatus || 'none',
    startTime: config.jobStartTime || null,
    model: config.modelId || null
  };

  res.json({
    config,
    jobStatus,
    stats: {
      totalCases: cases.length,
      totalImages: images.length,
      imagesWithoutCases: images.filter(img => 
        !cases.some((c: any) => c.imageFileName === img)
      ).length,
      casesWithoutImages: cases.filter((c: any) => 
        !images.includes(c.imageFileName)
      ).length
    }
  });
});

// Get list of images for the dropdown
finetuningRouter.get('/images', (req: Request, res: Response) => {
  // Get list of images in the directory
  let images: string[] = [];
  if (fs.existsSync(imagesDir)) {
    images = fs.readdirSync(imagesDir)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
  }
  
  res.json(images);
});

// Serve image file
finetuningRouter.get('/image/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const imagePath = path.join(imagesDir, filename);
  
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).send('Image not found');
  }
});

// Upload images for fine-tuning
finetuningRouter.post('/upload-image', (req: Request, res: Response) => {
  try {
    upload.array('images', 50)(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        
        if (err.name === 'MulterError') {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
              error: 'File too large', 
              message: 'Maximum file size is 50MB. Please use a smaller file.'
            });
          }
        }
        
        return res.status(400).json({ 
          error: 'File upload error', 
          message: err.message
        });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
      
      // Process uploaded files to ensure compatibility
      let errorDuringProcess = false;
      const processedFiles = await Promise.all(files.map(async file => {
        try {
          // Check for special file types that might need processing
          const originalName = file.originalname.toLowerCase();
          const isWhatsApp = originalName.includes('whatsapp') || 
                             originalName.includes('wa') || 
                             (file.path && file.path.toLowerCase().includes('whatsapp'));
          
          // Log all image details for debugging
          console.log(`Image details: 
            Name: ${file.originalname}
            Path: ${file.path}
            Mimetype: ${file.mimetype}
            Size: ${file.size} bytes
            Is WhatsApp: ${isWhatsApp}
          `);
          
          // For WhatsApp images, we'd ideally convert them here using Sharp
          // but for now we'll just provide more detailed logging
          if (isWhatsApp) {
            console.log(`WhatsApp image detected: ${file.originalname}`);
            console.log(`This may require special handling if uploads fail`);
          }
          
          return file;
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          errorDuringProcess = true;
          return file;
        }
      }));
      
      console.log('Files uploaded and processed:', processedFiles.length);
      
      return res.status(200).json({
        message: `${processedFiles.length} files uploaded successfully`,
        files: processedFiles.map(file => ({
          originalname: file.originalname,
          filename: file.filename,
          size: file.size,
        }))
      });
    });
  } catch (error) {
    console.error('Unexpected error in upload handler:', error);
    res.status(500).json({ error: 'Server error', message: 'An unexpected error occurred' });
  }
});

// Get training data in JSONL format for the fine-tuning API
finetuningRouter.get('/training-data', (req: Request, res: Response) => {
  const cases = loadCases();
  
  if (cases.length === 0) {
    return res.status(404).json({ error: 'No training data available' });
  }
  
  // Helper function to convert image to base64
  function imageToBase64(imagePath: string) {
    try {
      const image = fs.readFileSync(imagePath);
      return image.toString('base64');
    } catch (error) {
      console.error('Error loading image:', imagePath, error);
      return '';
    }
  }
  
  const formattedData = cases.map((c: any) => {
    const imagePath = path.join(imagesDir, c.imageFileName);
    const imageBase64 = imageToBase64(imagePath);
    
    if (!imageBase64) {
      return null; // Skip if image couldn't be loaded
    }
    
    return {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this dermatological image and provide a detailed assessment.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: `Based on the image, I can identify the following:
- Diagnosis: ${c.diagnosis || 'Unknown'}
- Severity: ${c.severity || 'Moderate'}
${c.bodyPart ? '- Body part: ' + c.bodyPart : ''}
${c.treatments ? '- Recommended treatments: ' + (Array.isArray(c.treatments) ? c.treatments.join(', ') : c.treatments) : ''}
${c.description ? '- Additional notes: ' + c.description : ''}`
        }
      ]
    };
  }).filter(Boolean);
  
  res.setHeader('Content-Type', 'application/json');
  res.json(formattedData);
});

// Post training data for a specific image
finetuningRouter.post('/training-data', (req: Request, res: Response) => {
  const { imageFileName, diagnosis, severity, bodyPart, treatments, description } = req.body;
  
  if (!imageFileName) {
    return res.status(400).json({ error: 'Image filename is required' });
  }
  
  // Get the cases data
  const cases = loadCases();
  
  // Check if we already have data for this image
  const existingIndex = cases.findIndex((c: any) => c.imageFileName === imageFileName);
  
  if (existingIndex >= 0) {
    // Update existing case
    cases[existingIndex] = {
      ...cases[existingIndex],
      diagnosis,
      severity,
      bodyPart,
      treatments,
      description,
      updatedAt: new Date().toISOString()
    };
  } else {
    // Add new case
    cases.push({
      imageFileName,
      diagnosis,
      severity,
      bodyPart,
      treatments,
      description,
      createdAt: new Date().toISOString()
    });
  }
  
  // Save the updated cases
  if (saveCases(cases)) {
    res.status(200).json({ message: 'Training data saved successfully' });
  } else {
    res.status(500).json({ error: 'Failed to save training data' });
  }
});

// Toggle fine-tuning
finetuningRouter.post('/toggle', (req: Request, res: Response) => {
  const { enabled, modelId } = req.body;
  
  const config = loadConfig();
  
  // Update config
  config.enabled = enabled;
  config.modelId = modelId;
  
  // Save updated config
  if (saveConfig(config)) {
    res.status(200).json({ 
      message: `Fine-tuning ${enabled ? 'enabled' : 'disabled'}`,
      config 
    });
  } else {
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// Prepare data for fine-tuning
finetuningRouter.post('/prepare-data', async (req: Request, res: Response) => {
  // Ensure we have cases and images
  const cases = loadCases();
  
  if (cases.length === 0) {
    return res.status(400).json({ error: 'No cases available for fine-tuning' });
  }
  
  // Create OpenAI client
  const openai = getOpenAIClient();
  
  if (!openai) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }
  
  try {
    // Helper function to convert image to base64
    const imageToBase64 = (imagePath: string) => {
      try {
        const image = fs.readFileSync(imagePath);
        return image.toString('base64');
      } catch (error) {
        console.error('Error loading image:', imagePath, error);
        return '';
      }
    }
    
    // Format data for fine-tuning
    interface Case {
      imageFileName: string;
      diagnosis?: string;
      severity?: string;
      bodyPart?: string;
      treatments?: string[] | string;
      description?: string;
    }
    
    interface TrainingExample {
      messages: {
        role: string;
        content: string | Array<{
          type: string;
          text?: string;
          image_url?: { url: string };
        }>;
      }[];
    }
    
    const formattedData: TrainingExample[] = cases.map((caseData: Case) => {
      const imagePath = path.join(imagesDir, caseData.imageFileName);
      const imageBase64 = imageToBase64(imagePath);
      
      if (!imageBase64) {
        return null; // Skip if image couldn't be loaded
      }
      
      return {
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this dermatological image and provide a detailed assessment.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          },
          {
            role: 'assistant',
            content: `Based on the image, I can identify the following:
- Diagnosis: ${caseData.diagnosis || 'Unknown'}
- Severity: ${caseData.severity || 'Moderate'}
${caseData.bodyPart ? '- Body part: ' + caseData.bodyPart : ''}
${caseData.treatments ? '- Recommended treatments: ' + (Array.isArray(caseData.treatments) ? caseData.treatments.join(', ') : caseData.treatments) : ''}
${caseData.description ? '- Additional notes: ' + caseData.description : ''}`
          }
        ]
      };
    }).filter(Boolean);
    
    if (formattedData.length === 0) {
      return res.status(400).json({ error: 'No valid training data could be prepared' });
    }
    
    // Convert to JSONL format
    const jsonlContent = formattedData.map((item: TrainingExample) => JSON.stringify(item)).join('\n');
    
    // Save the prepared data
    const preparedDataFile = path.join(dataDir, 'prepared-data.jsonl');
    fs.writeFileSync(preparedDataFile, jsonlContent);
    
    res.status(200).json({ 
      message: `Training data prepared successfully with ${formattedData.length} examples`,
      filePath: preparedDataFile
    });
  } catch (error) {
    console.error('Error preparing data:', error);
    res.status(500).json({ error: 'Error preparing training data' });
  }
});

// Start fine-tuning job
finetuningRouter.post('/start-job', async (req: Request, res: Response) => {
  // Create OpenAI client
  const openai = getOpenAIClient();
  
  if (!openai) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }
  
  try {
    // Ensure we have prepared data
    const preparedDataFile = path.join(dataDir, 'prepared-data.jsonl');
    
    if (!fs.existsSync(preparedDataFile)) {
      return res.status(400).json({ error: 'No prepared data found. Please prepare data first.' });
    }
    
    // Step 1: Create a file with the training data
    const file = await openai.files.create({
      file: fs.createReadStream(preparedDataFile),
      purpose: 'fine-tune',
    });
    
    console.log('File uploaded to OpenAI:', file.id);
    
    // Step 2: Create a fine-tuning job with the file
    const { modelName, baseModelId, epochs } = req.body;
    
    const jobConfig: any = {
      training_file: file.id,
      model: 'gpt-4o'
    };
    
    // If a base model ID is provided, use it for incremental fine-tuning
    if (baseModelId) {
      console.log(`Using base model for continued training: ${baseModelId}`);
      jobConfig.model = baseModelId;
    }
    
    // If epochs is specified, add it to the configuration
    if (epochs && Number.isInteger(epochs) && epochs > 0) {
      jobConfig.hyperparameters = {
        n_epochs: epochs
      };
    }
    
    // Create the fine-tuning job
    const job = await openai.fineTuning.jobs.create(jobConfig);
    
    console.log('Fine-tuning job created:', job.id);
    
    // Update the config with the job info
    const config = loadConfig();
    config.jobId = job.id;
    config.jobStatus = job.status;
    config.jobStartTime = new Date().toISOString();
    
    saveConfig(config);
    
    res.status(200).json({ 
      message: 'Fine-tuning job started successfully',
      job 
    });
  } catch (error) {
    console.error('Error starting fine-tuning job:', error);
    res.status(500).json({ 
      error: 'Error starting fine-tuning job', 
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Admin page for managing fine-tuning - just routes to the test admin page for now
// Redirect admin-page to our new test page which has better file handling
finetuningRouter.get('/admin-page', (req: Request, res: Response) => {
  res.redirect('/api/fine-tuning/test/test-page');
});

// Original admin page handling (no longer used, using the test page instead)
finetuningRouter.get('/admin-page-old', (req: Request, res: Response) => {
  res.redirect('/api/fine-tuning/test/test-page');
});