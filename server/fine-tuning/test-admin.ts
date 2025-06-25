import { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

// Get dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
// Original location (data/images directory - where test images are stored)
const testImagesDir = path.join(__dirname, 'data', 'images');
// Production location (where all uploaded images are stored)
const imagesDir = path.join(process.cwd(), 'uploads', 'fine-tuning', 'images');
// Deploy directory (where newly uploaded images are stored)
const deployImagesDir = path.join(process.cwd(), 'deploy', 'uploads');
const casesPath = path.join(__dirname, 'data', 'dermatology_cases.json');

// Configure multer for file uploads
const storage = multer.memoryStorage();
// Create images directory if it doesn't exist
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('Created images directory:', imagesDir);
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    try {
      if (
        file.mimetype == "image/png" ||
        file.mimetype == "image/webp" ||
        file.mimetype == "image/jpg" ||
        file.mimetype == "image/jpeg"
      ) {
        // Check if a filename exists
        if (!file.originalname || file.originalname.trim() === '') {
          return cb(new Error("Image filename is required"));
        }
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error("Only .png, .jpg, .webp and .jpeg format allowed!"));
      }
    } catch (error) {
      console.error("File upload error:", error);
      cb(null, false);
      return cb(new Error("File upload error. Please try again."));
    }
  },
});

// Define router
export const testRouter = Router();

// Middleware to skip authentication for all routes in this router
testRouter.use((req, res, next) => {
  // Allow all requests without authentication
  next();
});

// Static HTML test page
testRouter.get('/test-page', (req: Request, res: Response) => {
  // Get list of images from all directories
  let images: string[] = [];
  
  // Check the primary directory (uploads/fine-tuning/images)
  if (fs.existsSync(imagesDir)) {
    const mainImages = fs.readdirSync(imagesDir)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    images = [...images, ...mainImages];
  }
  
  // Check the deploy uploads directory for new images
  if (fs.existsSync(deployImagesDir)) {
    const deployImages = fs.readdirSync(deployImagesDir)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file) && file.startsWith('image-'));
    images = [...images, ...deployImages];
  }
  
  // Also check the test directory if needed
  if (fs.existsSync(testImagesDir)) {
    const testImages = fs.readdirSync(testImagesDir)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    images = [...images, ...testImages];
  }
  
  console.log(`Found ${images.length} images for fine-tuning in all directories`);
  
  // Build a simple HTML page
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fine-Tuning Test Page</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f0f0f0;
      }
      h1 {
        color: #333;
        text-align: center;
        margin-bottom: 30px;
        font-size: 28px;
      }
      h2 {
        color: #444;
        border-bottom: 1px solid #ddd;
        padding-bottom: 10px;
        margin-top: 20px;
        font-size: 20px;
      }
      h3 {
        font-size: 18px;
        margin-bottom: 10px;
        color: #555;
      }
      .container {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
      }
      .section {
        flex: 1;
        min-width: 300px;
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 20px;
      }
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: #555;
      }
      input, select, textarea {
        width: 100%;
        padding: 10px;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }
      button {
        padding: 12px 18px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.2s, transform 0.1s;
      }
      button:hover {
        background-color: #45a049;
      }
      button:active {
        transform: translateY(1px);
      }
      button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
      .image-preview {
        width: 100%;
        max-height: 300px;
        object-fit: contain;
        margin-top: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        display: none;
        background-color: #f9f9f9;
      }
      .button-group {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }
      .file-input-container {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }
      #uploadStatus {
        margin-top: 10px;
        padding: 10px;
        border-radius: 4px;
        display: none;
      }
      .success {
        background-color: #dff0d8;
        color: #3c763d;
        padding: 8px;
        border-radius: 4px;
        margin: 5px 0;
      }
      .error {
        background-color: #f2dede;
        color: #a94442;
        padding: 8px;
        border-radius: 4px;
        margin: 5px 0;
      }
      #trainingStatus, #modelsList {
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 15px;
        margin-top: 20px;
      }
      #statusContent, #modelsContent {
        line-height: 1.5;
      }
      #startTrainingBtn {
        background-color: #9c27b0;
      }
      #startTrainingBtn:hover {
        background-color: #7b1fa2;
      }
      #checkStatusBtn {
        background-color: #2196F3;
      }
      #checkStatusBtn:hover {
        background-color: #0b7dda;
      }
      #enableModelBtn {
        background-color: #4CAF50;
      }
      #enableModelBtn:hover {
        background-color: #45a049;
      }
      #disableModelBtn {
        background-color: #f44336;
      }
      #disableModelBtn:hover {
        background-color: #d32f2f;
      }
      #listModelsBtn {
        background-color: #607d8b;
      }
      #listModelsBtn:hover {
        background-color: #455a64;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      th, td {
        padding: 10px 8px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      th {
        background-color: #f2f2f2;
        font-weight: bold;
      }
      .image-container {
        margin-top: 20px;
        border: 1px solid #ddd;
        padding: 10px;
        border-radius: 4px;
      }
      img {
        max-width: 100%;
        max-height: 300px;
      }
    </style>
  </head>
  <body>
    <h1>Fine-Tuning Test Page</h1>
    
    <div class="section">
      <h2>Available Images</h2>
      <p>Total images: ${images.length}</p>
      
      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <div style="flex: 1;">
          <h3>Upload New Image</h3>
          <input type="file" id="fileUploadInput" accept="image/jpeg,image/png,image/webp" style="margin-bottom: 10px;" />
          <button id="uploadImageBtn" style="width: 100%;">Upload Image</button>
          <div id="uploadStatus" style="margin-top: 10px; font-size: 14px;"></div>
        </div>
        
        <div style="flex: 1; border-left: 1px solid #ddd; padding-left: 15px;">
          <h3>Or Select Existing Image</h3>
          <select id="imageSelect" style="width: 100%;">
            <option value="">Select an image...</option>
            ${images.map(img => `<option value="${img}">${img}</option>`).join('')}
          </select>
          <button id="refreshImagesBtn" style="width: 100%; margin-top: 10px; background-color: #2196F3;">Refresh Image List</button>
        </div>
      </div>
      
      <div class="image-container">
        <p>Image preview:</p>
        <img id="imagePreview" src="" alt="No image selected" style="display: none;">
        <p id="noImageText">No image selected</p>
      </div>
    </div>
    
    <div class="section">
      <h2>Training Data Form</h2>
      <form id="trainingForm">
        <div>
          <label for="diagnosis">Diagnosis:</label>
          <input type="text" id="diagnosis" name="diagnosis">
        </div>
        
        <div>
          <label for="severity">Severity:</label>
          <select id="severity" name="severity">
            <option value="Mild">Mild</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
          </select>
        </div>
        
        <div>
          <label for="bodyPart">Body Part:</label>
          <input type="text" id="bodyPart" name="bodyPart">
        </div>
        
        <div>
          <label for="treatments">Treatments (comma separated):</label>
          <input type="text" id="treatments" name="treatments">
        </div>
        
        <div>
          <label for="description">Description:</label>
          <textarea id="description" name="description" rows="3"></textarea>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 15px;">
          <button type="button" id="saveButton" style="flex: 1;">Save Training Data</button>
        </div>
      </form>
    </div>
    
    <div class="section">
      <h2>Fine-Tuning Controls</h2>
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <div style="flex: 2;">
          <label for="modelName">Model Name (optional):</label>
          <input type="text" id="modelName" name="modelName" placeholder="my-dermatology-model">
        </div>
        <div style="flex: 1;">
          <label for="epochs">Epochs:</label>
          <input type="number" id="epochs" name="epochs" value="5" min="1" max="20">
        </div>
      </div>
      <div style="margin-bottom: 15px;">
        <label for="baseModel">Base Model ID (for continued training):</label>
        <input type="text" id="baseModel" name="baseModel" placeholder="ft:dermatology-model-118690" style="width: 100%;">
        <p style="font-size: 12px; color: #666; margin-top: 5px;">Enter your existing model ID (e.g., ft:dermatology-model-118690) to continue training with new images</p>
      </div>
      
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button id="startTrainingBtn" style="flex: 1; background-color: #9c27b0; font-weight: bold;">Start Training</button>
        <button id="checkStatusBtn" style="flex: 1; background-color: #2196F3;">Check Status</button>
      </div>
      
      <div id="trainingStatus" style="margin-top: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; display: none;">
        <h3>Training Status</h3>
        <div id="statusContent">Not started</div>
      </div>
    </div>
    
    <div class="section">
      <h2>Manage Models</h2>
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <div style="flex: 2;">
          <label for="fineTunedModel">Fine-tuned Model ID:</label>
          <input type="text" id="fineTunedModel" name="fineTunedModel" placeholder="Enter model ID after training">
        </div>
      </div>
      
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button id="enableModelBtn" style="flex: 1; background-color: #4CAF50;">Enable Model</button>
        <button id="disableModelBtn" style="flex: 1; background-color: #f44336;">Disable Model</button>
        <button id="listModelsBtn" style="flex: 1; background-color: #607d8b;">List Models</button>
      </div>
      
      <div id="modelsList" style="margin-top: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; display: none;">
        <h3>Available Models</h3>
        <div id="modelsContent">No models available</div>
      </div>
    </div>
    
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Elements - Image Section
        const fileUploadInput = document.getElementById('fileUploadInput');
        const uploadImageBtn = document.getElementById('uploadImageBtn');
        const uploadStatus = document.getElementById('uploadStatus');
        const refreshImagesBtn = document.getElementById('refreshImagesBtn');
        const imageSelect = document.getElementById('imageSelect');
        const imagePreview = document.getElementById('imagePreview');
        const noImageText = document.getElementById('noImageText');
        
        // Elements - Training Data Form
        const saveButton = document.getElementById('saveButton');
        const diagnosisInput = document.getElementById('diagnosis');
        const severitySelect = document.getElementById('severity');
        const bodyPartInput = document.getElementById('bodyPart');
        const treatmentsInput = document.getElementById('treatments');
        const descriptionInput = document.getElementById('description');
        
        // Elements - Fine-tuning Controls
        const modelNameInput = document.getElementById('modelName');
        const epochsInput = document.getElementById('epochs');
        const startTrainingBtn = document.getElementById('startTrainingBtn');
        const checkStatusBtn = document.getElementById('checkStatusBtn');
        const trainingStatus = document.getElementById('trainingStatus');
        const statusContent = document.getElementById('statusContent');
        
        // Elements - Model Management
        const fineTunedModelInput = document.getElementById('fineTunedModel');
        const enableModelBtn = document.getElementById('enableModelBtn');
        const disableModelBtn = document.getElementById('disableModelBtn');
        const listModelsBtn = document.getElementById('listModelsBtn');
        const modelsList = document.getElementById('modelsList');
        const modelsContent = document.getElementById('modelsContent');
        
        // Image upload handler
        uploadImageBtn.addEventListener('click', async function() {
          if (!fileUploadInput.files || fileUploadInput.files.length === 0) {
            uploadStatus.innerHTML = '<span style="color:red">Please select a file first</span>';
            return;
          }
          
          const file = fileUploadInput.files[0];
          uploadStatus.innerHTML = '<span style="color:blue">Uploading...</span>';
          
          // Create FormData and append the file
          const formData = new FormData();
          formData.append('images', file);
          
          try {
            const response = await fetch('/api/fine-tuning/upload-image', {
              method: 'POST',
              body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
              uploadStatus.innerHTML = '<span style="color:green">Uploaded successfully!</span>';
              // Refresh the image list
              refreshImageList();
              // Preview the uploaded image
              if (result.files && result.files.length > 0) {
                const filename = result.files[0];
                imagePreview.src = '/api/fine-tuning/image/' + filename;
                imagePreview.style.display = 'block';
                noImageText.style.display = 'none';
                
                // Select the uploaded image in the dropdown
                setTimeout(() => {
                  if (imageSelect.querySelector(\`option[value="\${filename}"]\`)) {
                    imageSelect.value = filename;
                    saveButton.disabled = false;
                  }
                }, 500);
              }
            } else {
              uploadStatus.innerHTML = \`<span style="color:red">Error: \${result.error || 'Upload failed'}</span>\`;
            }
          } catch (error) {
            uploadStatus.innerHTML = \`<span style="color:red">Error: \${error.message}</span>\`;
          }
        });
        
        // Refresh image list handler
        refreshImagesBtn.addEventListener('click', function() {
          refreshImageList();
        });
        
        // Function to refresh the image list
        async function refreshImageList() {
          try {
            const response = await fetch('/api/fine-tuning/images');
            const images = await response.json();
            
            // Clear current options
            imageSelect.innerHTML = '<option value="">Select an image...</option>';
            
            // Add new options
            images.forEach(img => {
              const option = document.createElement('option');
              option.value = img;
              option.textContent = img;
              imageSelect.appendChild(option);
            });
          } catch (error) {
            console.error('Failed to refresh images:', error);
          }
        }
        
        // Image selection handler
        imageSelect.addEventListener('change', function() {
          const selectedImage = imageSelect.value;
          
          if (selectedImage) {
            // Show image preview
            imagePreview.src = '/api/fine-tuning/image/' + selectedImage;
            imagePreview.style.display = 'block';
            noImageText.style.display = 'none';
            
            // Enable the save button
            saveButton.disabled = false;
          } else {
            // Hide image preview
            imagePreview.style.display = 'none';
            noImageText.style.display = 'block';
            
            // Disable the save button
            saveButton.disabled = true;
          }
        });
        
        // Save button handler
        saveButton.addEventListener('click', async function() {
          const selectedImage = imageSelect.value;
          
          if (!selectedImage) {
            alert('Please select an image first.');
            return;
          }
          
          // Collect form data
          const formData = {
            imageFileName: selectedImage,
            diagnosis: diagnosisInput.value,
            severity: severitySelect.value,
            bodyPart: bodyPartInput.value,
            treatments: treatmentsInput.value.split(',').map(t => t.trim()),
            description: descriptionInput.value
          };
          
          // Send data to server
          try {
            const response = await fetch('/api/fine-tuning/training-data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
              alert('Training data saved successfully!');
              // Clear form
              imageSelect.value = '';
              diagnosisInput.value = '';
              severitySelect.value = 'Mild';
              bodyPartInput.value = '';
              treatmentsInput.value = '';
              descriptionInput.value = '';
              imagePreview.style.display = 'none';
              noImageText.style.display = 'block';
            } else {
              alert('Error: ' + (result.error || 'Failed to save training data'));
            }
          } catch (error) {
            alert('Error: ' + error.message);
          }
        });
        
        // Start Training button handler
        startTrainingBtn.addEventListener('click', async function() {
          if (confirm("Are you sure you want to start fine-tuning? This process may take several hours.")) {
            startTrainingBtn.disabled = true;
            startTrainingBtn.textContent = 'Starting...';
            
            try {
              // Show the status area
              trainingStatus.style.display = 'block';
              statusContent.innerHTML = '<p>Preparing training data...</p>';
              
              // First prepare the data
              const prepareResponse = await fetch('/api/fine-tuning/prepare-data', {
                method: 'POST'
              });
              
              if (!prepareResponse.ok) {
                const prepareError = await prepareResponse.json();
                throw new Error(prepareError.error || 'Failed to prepare data');
              }
              
              statusContent.innerHTML += '<p>Data prepared successfully!</p>';
              statusContent.innerHTML += '<p>Starting fine-tuning job...</p>';
              
              // Now start the fine-tuning job
              const startResponse = await fetch('/api/fine-tuning/start-job', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  modelName: modelNameInput.value || undefined,
                  baseModelId: baseModelInput.value || undefined,
                  epochs: parseInt(epochsInput.value) || 5
                })
              });
              
              const result = await startResponse.json();
              
              if (startResponse.ok) {
                statusContent.innerHTML += '<p class="success">✓ Fine-tuning job started successfully!</p>';
                statusContent.innerHTML += '<p>Job ID: <strong>' + result.jobId + '</strong></p>';
                statusContent.innerHTML += '<p>Click "Check Status" to monitor progress.</p>';
                
                // Store job ID in localStorage for later retrieval
                localStorage.setItem('lastFineTuningJobId', result.jobId);
              } else {
                throw new Error(result.error || 'Failed to start fine-tuning job');
              }
            } catch (error) {
              statusContent.innerHTML += '<p class="error">Error: ' + error.message + '</p>';
            } finally {
              startTrainingBtn.disabled = false;
              startTrainingBtn.textContent = 'Start Training';
            }
          }
        });
        
        // Check Status button handler
        checkStatusBtn.addEventListener('click', async function() {
          // Show the status area
          trainingStatus.style.display = 'block';
          
          // Try to get the job ID from localStorage
          const jobId = localStorage.getItem('lastFineTuningJobId');
          
          if (!jobId) {
            statusContent.innerHTML = '<p class="error">No recent fine-tuning job found. Start a new job first.</p>';
            return;
          }
          
          checkStatusBtn.disabled = true;
          checkStatusBtn.textContent = 'Checking...';
          
          try {
            statusContent.innerHTML = '<p>Checking status for job: ' + jobId + '</p>';
            
            const response = await fetch('/api/fine-tuning/check-job?jobId=' + encodeURIComponent(jobId));
            const result = await response.json();
            
            if (response.ok) {
              statusContent.innerHTML = '';
              statusContent.innerHTML += '<p><strong>Job ID:</strong> ' + result.id + '</p>';
              statusContent.innerHTML += '<p><strong>Status:</strong> ' + result.status + '</p>';
              
              if (result.fineTunedModel) {
                statusContent.innerHTML += '<p><strong>Fine-tuned Model:</strong> ' + result.fineTunedModel + '</p>';
                fineTunedModelInput.value = result.fineTunedModel;
              }
              
              if (result.status === 'succeeded') {
                statusContent.innerHTML += '<p class="success">✓ Training completed successfully!</p>';
                statusContent.innerHTML += '<p>You can now enable this model using the "Enable Model" button below.</p>';
              } else if (result.status === 'failed') {
                statusContent.innerHTML += '<p class="error">Training failed. Please check the logs.</p>';
              } else {
                // In progress
                statusContent.innerHTML += '<p>Training is still in progress. Check back later.</p>';
              }
            } else {
              throw new Error(result.error || 'Failed to check job status');
            }
          } catch (error) {
            statusContent.innerHTML += '<p class="error">Error: ' + error.message + '</p>';
          } finally {
            checkStatusBtn.disabled = false;
            checkStatusBtn.textContent = 'Check Status';
          }
        });
        
        // Enable Model button handler
        enableModelBtn.addEventListener('click', async function() {
          const modelId = fineTunedModelInput.value.trim();
          
          if (!modelId) {
            alert('Please enter a model ID.');
            return;
          }
          
          if (confirm("Are you sure you want to enable this model? This will make it the active model for all AI analysis.")) {
            enableModelBtn.disabled = true;
            enableModelBtn.textContent = 'Enabling...';
            
            try {
              const response = await fetch('/api/fine-tuning/enable', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ modelId })
              });
              
              const result = await response.json();
              
              if (response.ok) {
                alert('Model enabled successfully!');
              } else {
                throw new Error(result.error || 'Failed to enable model');
              }
            } catch (error) {
              alert('Error: ' + error.message);
            } finally {
              enableModelBtn.disabled = false;
              enableModelBtn.textContent = 'Enable Model';
            }
          }
        });
        
        // Disable Model button handler
        disableModelBtn.addEventListener('click', async function() {
          if (confirm("Are you sure you want to disable fine-tuning? This will revert to the default model.")) {
            disableModelBtn.disabled = true;
            disableModelBtn.textContent = 'Disabling...';
            
            try {
              const response = await fetch('/api/fine-tuning/disable', {
                method: 'POST'
              });
              
              const result = await response.json();
              
              if (response.ok) {
                alert('Fine-tuning disabled. Using default model now.');
              } else {
                throw new Error(result.error || 'Failed to disable fine-tuning');
              }
            } catch (error) {
              alert('Error: ' + error.message);
            } finally {
              disableModelBtn.disabled = false;
              disableModelBtn.textContent = 'Disable Model';
            }
          }
        });
        
        // List Models button handler
        listModelsBtn.addEventListener('click', async function() {
          // Show the models list area
          modelsList.style.display = 'block';
          
          listModelsBtn.disabled = true;
          listModelsBtn.textContent = 'Loading...';
          
          try {
            modelsContent.innerHTML = '<p>Loading models...</p>';
            
            const response = await fetch('/api/fine-tuning/list-models');
            const result = await response.json();
            
            if (response.ok) {
              if (result.models && result.models.length > 0) {
                let html = '<table style="width:100%; border-collapse: collapse;">';
                html += '<tr><th style="text-align:left; padding:8px; border-bottom:1px solid #ddd;">Model ID</th>';
                html += '<th style="text-align:left; padding:8px; border-bottom:1px solid #ddd;">Created</th>';
                html += '<th style="text-align:left; padding:8px; border-bottom:1px solid #ddd;">Status</th></tr>';
                
                result.models.forEach(model => {
                  html += '<tr>';
                  html += '<td style="padding:8px; border-bottom:1px solid #ddd;">' + model.id + '</td>';
                  html += '<td style="padding:8px; border-bottom:1px solid #ddd;">' + new Date(model.created * 1000).toLocaleString() + '</td>';
                  html += '<td style="padding:8px; border-bottom:1px solid #ddd;">' + (model.status || 'unknown') + '</td>';
                  html += '</tr>';
                });
                
                html += '</table>';
                modelsContent.innerHTML = html;
                
                // Add note about currently active model
                if (result.activeModel) {
                  modelsContent.innerHTML += '<p><strong>Currently active model:</strong> ' + result.activeModel + '</p>';
                } else {
                  modelsContent.innerHTML += '<p><strong>No active fine-tuned model.</strong> Using default model.</p>';
                }
              } else {
                modelsContent.innerHTML = '<p>No fine-tuned models available.</p>';
              }
            } else {
              throw new Error(result.error || 'Failed to list models');
            }
          } catch (error) {
            modelsContent.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
          } finally {
            listModelsBtn.disabled = false;
            listModelsBtn.textContent = 'List Models';
          }
        });
      });
    </script>
  </body>
  </html>
  `;
  
  res.send(html);
});

// API to get image
testRouter.get('/image/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  
  // First check primary directory
  const imagePath = path.join(imagesDir, filename);
  if (fs.existsSync(imagePath)) {
    return res.sendFile(imagePath);
  }
  
  // Then check deploy uploads directory for new images
  if (filename.startsWith('image-')) {
    const deployImagePath = path.join(deployImagesDir, filename);
    if (fs.existsSync(deployImagePath)) {
      return res.sendFile(deployImagePath);
    }
  }
  
  // Finally check test directory
  const testImagePath = path.join(testImagesDir, filename);
  if (fs.existsSync(testImagePath)) {
    return res.sendFile(testImagePath);
  }
  
  // Image not found in any location
  res.status(404).send('Image not found');
});

// API to get all images
testRouter.get('/images', (req: Request, res: Response) => {
  let allImages = [];
  
  // Get images from main directory
  if (fs.existsSync(imagesDir)) {
    const mainImages = fs.readdirSync(imagesDir)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    allImages = [...allImages, ...mainImages];
  }
  
  // Get images from deploy directory (new uploads)
  if (fs.existsSync(deployImagesDir)) {
    const deployImages = fs.readdirSync(deployImagesDir)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file) && file.startsWith('image-'));
    allImages = [...allImages, ...deployImages];
  }
  
  // Get images from test directory
  if (fs.existsSync(testImagesDir)) {
    const testImages = fs.readdirSync(testImagesDir)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    allImages = [...allImages, ...testImages];
  }
  
  console.log(`Returning ${allImages.length} images from all directories`);
  res.json(allImages);
});

// API to handle image upload
testRouter.post('/upload-image', (req: Request, res: Response) => {
  try {
    console.log('Received upload request');
    
    // Use multer without attaching it to the router
    upload.single('images')(req, res, (err: any) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ 
          error: 'File upload error', 
          details: err.message 
        });
      }
      
      // Check if multer handled the file
      if (!req.file) {
        console.error('No file in request');
        return res.status(400).json({ error: 'No files were uploaded' });
      }
      
      try {
        // Process the file
        const singleFile = req.file;
        console.log('File received:', {
          originalname: singleFile.originalname,
          mimetype: singleFile.mimetype,
          size: singleFile.size
        });
        
        // Generate a default name if none is provided
        let originalFilename = singleFile.originalname;
        if (!originalFilename || originalFilename.trim() === '') {
          const ext = singleFile.mimetype.split('/')[1] || 'jpg';
          originalFilename = `image-${Date.now()}.${ext}`;
          console.log('Generated filename:', originalFilename);
        }
        
        // Handle WhatsApp images which might have spaces and special characters
        const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9_.-]/g, '_');
        
        // Add timestamp to avoid duplication
        const timestamp = Date.now();
        const filename = `${timestamp}-${sanitizedFilename}`;
        console.log('Final filename:', filename);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true });
          console.log('Created directory:', imagesDir);
        }
        
        // Write the file to disk
        const targetPath = path.join(imagesDir, filename);
        fs.writeFileSync(targetPath, singleFile.buffer);
        
        console.log(`File saved to: ${targetPath}`);
        
        // Return success with processed file info
        return res.status(200).json({ 
          message: 'File uploaded successfully', 
          files: [filename],
          originalName: originalFilename,
          savedAs: filename,
          path: targetPath
        });
      } catch (innerError: any) {
        console.error('Error processing uploaded file:', innerError);
        return res.status(500).json({ 
          error: 'Error processing uploaded file', 
          details: innerError.message || 'Unknown error'
        });
      }
    });
  } catch (outerError: any) {
    console.error('Unexpected error in upload handler:', outerError);
    return res.status(500).json({ 
      error: 'Server error during file upload', 
      details: outerError.message || 'Unknown error'
    });
  }
});

// Export router
export default testRouter;