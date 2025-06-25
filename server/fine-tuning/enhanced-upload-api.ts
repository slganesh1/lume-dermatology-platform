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
const casesFile = path.join(dataDir, 'cases.json');

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
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
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
export const finetuningRouter = Router();

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
      const processedFiles = files.map(file => {
        try {
          // Simple compatibility checks for WhatsApp images
          const originalName = file.originalname.toLowerCase();
          const isWhatsApp = originalName.includes('whatsapp') || originalName.includes('wa');
            
          // Convert WhatsApp image formats here if needed
          // For now, we're simply logging which images might need special handling
          if (isWhatsApp) {
            console.log(`WhatsApp image detected: ${file.originalname}`);
          }
          
          return file;
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          errorDuringProcess = true;
          return file;
        }
      });
      
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
    function imageToBase64(imagePath: string) {
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
    const job = await openai.fineTuning.jobs.create({
      training_file: file.id,
      model: 'gpt-4o'
    });
    
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

// Admin page for managing fine-tuning
finetuningRouter.get('/admin-page', (req: Request, res: Response) => {
  const config = loadConfig();
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LUME Fine-tuning Admin</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          color: #333;
        }
        .container {
          max-width: 1200px;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #6d4c41;
        }
        .logo {
          margin-bottom: 20px;
        }
        .card {
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          margin-bottom: 20px;
          border: none;
        }
        .card-header {
          background-color: #6d4c41;
          color: #fff;
          border-radius: 10px 10px 0 0;
          padding: 15px 20px;
        }
        .card-body {
          padding: 20px;
        }
        .btn-gold {
          background-color: #D4AF37;
          color: white;
          border: none;
        }
        .btn-gold:hover {
          background-color: #C5A028;
          color: white;
        }
        .thumbnail {
          width: 100px;
          height: 100px;
          object-fit: cover;
          margin: 5px;
          border-radius: 5px;
        }
        .dropzone {
          border: 2px dashed #ccc;
          border-radius: 5px;
          padding: 30px;
          text-align: center;
          margin-bottom: 20px;
          cursor: pointer;
        }
        .dropzone:hover {
          border-color: #D4AF37;
        }
        #preview {
          display: flex;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .form-label {
          font-weight: bold;
          margin-top: 10px;
        }
        .info-text {
          font-size: 0.9rem;
          color: #666;
        }
        .stats-card {
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>LUME Fine-tuning Administration</h1>
          <p>Configure and manage AI model fine-tuning for dermatological image analysis</p>
        </div>
        
        <div class="row">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h4>Configuration</h4>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="enableFinetuning" ${config.enabled ? 'checked' : ''}>
                    <label class="form-check-label" for="enableFinetuning">Enable fine-tuned model</label>
                  </div>
                  <p class="info-text">When enabled, skin analysis will use the fine-tuned model specified below.</p>
                </div>
                
                <div class="mb-3">
                  <label for="modelIdInput" class="form-label">Fine-tuned Model ID</label>
                  <input type="text" class="form-control" id="modelIdInput" value="${config.modelId || ''}">
                  <p class="info-text">Enter the OpenAI model ID of your fine-tuned model (e.g., ft:gpt-4o-2024-05-13-...).</p>
                </div>
                
                <div class="mb-3">
                  <label class="form-label">Fine-tuning Job Status</label>
                  <div class="stats-card">
                    <div class="row">
                      <div class="col-md-6">
                        <p><strong>Status:</strong> <span id="jobStatus">${config.jobStatus || 'None'}</span></p>
                      </div>
                      <div class="col-md-6">
                        <p><strong>Started:</strong> <span id="jobStartTime">${config.jobStartTime || 'N/A'}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button id="saveConfigBtn" class="btn btn-gold">Save Configuration</button>
              </div>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h4>Statistics</h4>
              </div>
              <div class="card-body">
                <div class="stats-card">
                  <p><strong>Total Images:</strong> <span id="totalImages">Loading...</span></p>
                  <p><strong>Total Cases:</strong> <span id="totalCases">Loading...</span></p>
                  <p><strong>Images without Cases:</strong> <span id="imagesWithoutCases">Loading...</span></p>
                  <p><strong>Cases without Images:</strong> <span id="casesWithoutImages">Loading...</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h4>Image Upload</h4>
            </div>
            <div class="card-body">
              <div id="uploadErrorContainer" class="alert alert-danger" style="display: none;">
                <h5>Upload Error</h5>
                <p id="uploadErrorMessage"></p>
                <div id="uploadErrorDetails" class="mt-2 small"></div>
              </div>

              <div id="dropzone" class="dropzone">
                <p>Drag & drop image files here or click to select files</p>
                <p class="small text-muted">Accepted formats: JPG, PNG, WebP - Max size: 50MB</p>
                <input type="file" id="fileInput" multiple accept="image/jpeg,image/png,image/webp" style="display: none;">
              </div>
              <div id="preview"></div>
              <div class="mt-3">
                <button id="uploadBtn" class="btn btn-gold" disabled>Upload Images</button>
                <span id="uploadStatus"></span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h4>Training Data Management</h4>
            </div>
            <div class="card-body">
              <p>Add or edit cases for the images you've uploaded. Each case should include diagnosis information.</p>
              
              <div id="noImagesMessage" class="alert alert-warning" style="display: none;">
                No images available. Please upload images first.
              </div>
              
              <div id="caseForm" style="display: none;">
                <div class="mb-3">
                  <label for="imageSelect" class="form-label">Select Image</label>
                  <select class="form-select" id="imageSelect"></select>
                </div>
                
                <div class="mb-3">
                  <label for="diagnosisInput" class="form-label">Diagnosis</label>
                  <input type="text" class="form-control" id="diagnosisInput" placeholder="e.g., Acne Vulgaris">
                </div>
                
                <div class="mb-3">
                  <label for="severityInput" class="form-label">Severity</label>
                  <select class="form-select" id="severityInput">
                    <option value="Mild">Mild</option>
                    <option value="Moderate" selected>Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
                
                <div class="mb-3">
                  <label for="bodyPartInput" class="form-label">Body Part</label>
                  <input type="text" class="form-control" id="bodyPartInput" placeholder="e.g., Face, Arms, Back">
                </div>
                
                <div class="mb-3">
                  <label for="treatmentsInput" class="form-label">Recommended Treatments</label>
                  <textarea class="form-control" id="treatmentsInput" rows="2" placeholder="e.g., Topical retinoids, Benzoyl peroxide"></textarea>
                </div>
                
                <div class="mb-3">
                  <label for="descriptionInput" class="form-label">Additional Description</label>
                  <textarea class="form-control" id="descriptionInput" rows="3" placeholder="Any additional information about the condition"></textarea>
                </div>
                
                <div class="mb-3">
                  <button id="saveDataBtn" class="btn btn-gold">Save Case Data</button>
                  <button id="viewAllDataBtn" class="btn btn-outline-secondary ms-2">View All Cases</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h4>Fine-tuning Operations</h4>
            </div>
            <div class="card-body">
              <p>Prepare data for fine-tuning and start fine-tuning jobs. This requires an OpenAI API key with fine-tuning permissions.</p>
              
              <div class="mb-3">
                <button id="prepareDataBtn" class="btn btn-gold">Prepare Data</button>
                <button id="startJobBtn" class="btn btn-gold ms-2">Start Fine-tuning</button>
              </div>
              
              <div id="operationResult" class="mt-3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal for showing all cases -->
    <div class="modal fade" id="allCasesModal" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">All Training Cases</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <pre id="allCasesContent"></pre>
          </div>
        </div>
      </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Elements
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileInput');
        const preview = document.getElementById('preview');
        const uploadBtn = document.getElementById('uploadBtn');
        const uploadStatus = document.getElementById('uploadStatus');
        const enableFinetuning = document.getElementById('enableFinetuning');
        const modelIdInput = document.getElementById('modelIdInput');
        const saveConfigBtn = document.getElementById('saveConfigBtn');
        const imageSelect = document.getElementById('imageSelect');
        const diagnosisInput = document.getElementById('diagnosisInput');
        const severityInput = document.getElementById('severityInput');
        const bodyPartInput = document.getElementById('bodyPartInput');
        const treatmentsInput = document.getElementById('treatmentsInput');
        const descriptionInput = document.getElementById('descriptionInput');
        const saveDataBtn = document.getElementById('saveDataBtn');
        const viewAllDataBtn = document.getElementById('viewAllDataBtn');
        const prepareDataBtn = document.getElementById('prepareDataBtn');
        const startJobBtn = document.getElementById('startJobBtn');
        const operationResult = document.getElementById('operationResult');
        const allCasesModal = new bootstrap.Modal(document.getElementById('allCasesModal'));
        const allCasesContent = document.getElementById('allCasesContent');
        
        // Data storage
        let selectedFiles = [];
        let cases = [];
        
        // Image selection handler
        imageSelect.addEventListener('change', function() {
          const selectedImage = this.value;
          if (!selectedImage) return;
          
          // Load case data if exists
          const existingCase = cases.find(c => c.imageFileName === selectedImage);
          if (existingCase) {
            diagnosisInput.value = existingCase.diagnosis || '';
            severityInput.value = existingCase.severity || 'Moderate';
            bodyPartInput.value = existingCase.bodyPart || '';
            treatmentsInput.value = existingCase.treatments || '';
            descriptionInput.value = existingCase.description || '';
          } else {
            // Clear the form for a new case
            diagnosisInput.value = '';
            severityInput.value = 'Moderate';
            bodyPartInput.value = '';
            treatmentsInput.value = '';
            descriptionInput.value = '';
          }
        });
        
        // Update stats from API
        async function updateStats() {
          try {
            const response = await fetch('/api/fine-tuning/status');
            const data = await response.json();
            
            document.getElementById('totalImages').textContent = data.stats.totalImages;
            document.getElementById('totalCases').textContent = data.stats.totalCases;
            document.getElementById('imagesWithoutCases').textContent = data.stats.imagesWithoutCases;
            document.getElementById('casesWithoutImages').textContent = data.stats.casesWithoutImages;
            document.getElementById('jobStatus').textContent = data.jobStatus.status || 'None';
            document.getElementById('jobStartTime').textContent = data.jobStatus.startTime || 'N/A';
          } catch (error) {
            console.error('Error updating stats:', error);
          }
        }
        
        // Load image options for dropdown
        async function loadImageOptions() {
          try {
            const response = await fetch('/api/fine-tuning/images');
            const images = await response.json();
            
            // Clear existing options
            imageSelect.innerHTML = '<option value="">Select an image...</option>';
            
            if (images.length === 0) {
              document.getElementById('noImagesMessage').style.display = 'block';
              document.getElementById('caseForm').style.display = 'none';
              return;
            }
            
            // Add options for each image
            images.forEach(image => {
              const option = document.createElement('option');
              option.value = image;
              option.textContent = image;
              imageSelect.appendChild(option);
            });
            
            // Hide message and show form
            document.getElementById('noImagesMessage').style.display = 'none';
            document.getElementById('caseForm').style.display = 'block';
            
            // Also fetch the cases data
            const casesResponse = await fetch('/api/fine-tuning/training-data');
            if (casesResponse.ok) {
              cases = await casesResponse.json();
            }
          } catch (error) {
            console.error('Error loading image options:', error);
          }
        }
        
        // File input handling with validation
        function handleFiles(files) {
          // Hide any previous error messages
          document.getElementById('uploadErrorContainer').style.display = 'none';
          
          selectedFiles = [];
          preview.innerHTML = '';
          
          // Validate each file before adding to selected files
          Array.from(files).forEach(file => {
            // Check file type
            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
              showFileError('File "' + file.name + '" is not a supported image type. Please use JPG, PNG, or WebP formats.');
              return;
            }
            
            // Check file size (50MB limit)
            const maxSize = 50 * 1024 * 1024;
            if (file.size > maxSize) {
              showFileError('File "' + file.name + '" exceeds the 50MB size limit. Please compress or resize the image.');
              return;
            }
            
            // File is valid, add to preview
            selectedFiles.push(file);
            const reader = new FileReader();
            reader.onload = e => {
              const img = document.createElement('img');
              img.src = e.target.result;
              img.classList.add('thumbnail');
              img.title = file.name;
              preview.appendChild(img);
            };
            reader.onerror = () => {
              showFileError('Failed to read file "' + file.name + '". The file may be corrupted.');
            };
            reader.readAsDataURL(file);
          });
          
          uploadBtn.disabled = selectedFiles.length === 0;
        }
        
        // Display file validation errors
        function showFileError(message) {
          const errorContainer = document.getElementById('uploadErrorContainer');
          const errorMessage = document.getElementById('uploadErrorMessage');
          
          errorContainer.style.display = 'block';
          errorMessage.textContent = message;
        }
        
        // Upload images
        uploadBtn.addEventListener('click', async () => {
          if (selectedFiles.length === 0) return;
          
          uploadStatus.textContent = 'Uploading...';
          const formData = new FormData();
          selectedFiles.forEach(file => {
            formData.append('images', file);
          });
          
          // Hide any previous error messages
          document.getElementById('uploadErrorContainer').style.display = 'none';
          
          try {
            const response = await fetch('/api/fine-tuning/upload-image', {
              method: 'POST',
              body: formData
            });
            
            const result = await response.json();
            if (response.ok) {
              uploadStatus.textContent = result.message;
              loadImageOptions();
              updateStats();
              // Clear preview and selected files after successful upload
              preview.innerHTML = '';
              selectedFiles = [];
              uploadBtn.disabled = true;
            } else {
              // Display detailed error information
              const errorContainer = document.getElementById('uploadErrorContainer');
              const errorMessage = document.getElementById('uploadErrorMessage');
              const errorDetails = document.getElementById('uploadErrorDetails');
              
              errorContainer.style.display = 'block';
              errorMessage.textContent = result.message || 'Upload failed';
              
              // Add more detailed information if available
              let detailsText = '';
              if (result.error) detailsText += 'Error: ' + result.error + '<br>';
              if (result.details) detailsText += 'Details: ' + result.details + '<br>';
              
              errorDetails.innerHTML = detailsText;
              uploadStatus.textContent = 'Error: ' + (result.error || 'Upload failed');
              
              console.error('Upload error:', result);
            }
          } catch (error) {
            // Display network or parsing errors
            const errorContainer = document.getElementById('uploadErrorContainer');
            const errorMessage = document.getElementById('uploadErrorMessage');
            
            errorContainer.style.display = 'block';
            errorMessage.textContent = 'Network or server error: ' + error.message;
            uploadStatus.textContent = 'Error: ' + error.message;
            
            console.error('Upload exception:', error);
          }
        });
        
        // Save configuration
        saveConfigBtn.addEventListener('click', async () => {
          try {
            const response = await fetch('/api/fine-tuning/toggle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                enabled: enableFinetuning.checked,
                modelId: modelIdInput.value.trim()
              })
            });
            
            const result = await response.json();
            
            if (response.ok) {
              alert('Configuration saved successfully');
            } else {
              alert('Error saving configuration: ' + result.error);
            }
          } catch (error) {
            alert('Error saving configuration: ' + error.message);
          }
        });
        
        // Save case data
        saveDataBtn.addEventListener('click', async () => {
          const imageFileName = imageSelect.value;
          
          if (!imageFileName) {
            alert('Please select an image');
            return;
          }
          
          try {
            const response = await fetch('/api/fine-tuning/training-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageFileName,
                diagnosis: diagnosisInput.value.trim(),
                severity: severityInput.value,
                bodyPart: bodyPartInput.value.trim(),
                treatments: treatmentsInput.value.trim(),
                description: descriptionInput.value.trim()
              })
            });
            
            const result = await response.json();
            
            if (response.ok) {
              alert('Case data saved successfully');
              updateStats();
              // Refresh cases data
              const casesResponse = await fetch('/api/fine-tuning/training-data');
              if (casesResponse.ok) {
                cases = await casesResponse.json();
              }
            } else {
              alert('Error saving case data: ' + result.error);
            }
          } catch (error) {
            alert('Error saving case data: ' + error.message);
          }
        });
        
        // View all cases
        viewAllDataBtn.addEventListener('click', async () => {
          try {
            const response = await fetch('/api/fine-tuning/training-data');
            const data = await response.json();
            
            allCasesContent.textContent = JSON.stringify(data, null, 2);
            allCasesModal.show();
          } catch (error) {
            alert('Error loading cases: ' + error.message);
          }
        });
        
        // Prepare data for fine-tuning
        prepareDataBtn.addEventListener('click', async () => {
          try {
            operationResult.innerHTML = 'Preparing data...';
            
            const response = await fetch('/api/fine-tuning/prepare-data', {
              method: 'POST'
            });
            
            const result = await response.json();
            
            if (response.ok) {
              operationResult.innerHTML = '<div class="alert alert-success">' + result.message + '</div>';
            } else {
              operationResult.innerHTML = '<div class="alert alert-danger">Error: ' + result.error + '</div>';
            }
          } catch (error) {
            operationResult.innerHTML = '<div class="alert alert-danger">Error: ' + error.message + '</div>';
          }
        });
        
        // Start fine-tuning job
        startJobBtn.addEventListener('click', async () => {
          try {
            operationResult.innerHTML = 'Starting fine-tuning job...';
            
            const response = await fetch('/api/fine-tuning/start-job', {
              method: 'POST'
            });
            
            const result = await response.json();
            
            if (response.ok) {
              operationResult.innerHTML = '<div class="alert alert-success">' + result.message + '</div>';
              updateStats();
            } else {
              operationResult.innerHTML = '<div class="alert alert-danger">Error: ' + result.error + '</div>';
            }
          } catch (error) {
            operationResult.innerHTML = '<div class="alert alert-danger">Error: ' + error.message + '</div>';
          }
        });
        
        // Initialize
        dropzone.addEventListener('click', () => fileInput.click());
        
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.style.borderColor = '#D4AF37';
        });
        
        dropzone.addEventListener('dragleave', () => {
          dropzone.style.borderColor = '#ccc';
        });
        
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.style.borderColor = '#ccc';
          handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', () => {
          handleFiles(fileInput.files);
        });
        
        // Load initial data
        updateStats();
        loadImageOptions();
      });
    </script>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});