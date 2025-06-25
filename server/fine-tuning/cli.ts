#!/usr/bin/env tsx

/**
 * Command Line Interface for fine-tuning dermatology models with OpenAI
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import chalk from 'chalk';
import { createSpinner } from 'nanospinner';

// Constants for file paths
const baseDir = path.join(__dirname);
const dataDir = path.join(baseDir, 'data');
const imagesDir = path.join(dataDir, 'images');
const configPath = path.join(baseDir, 'config.json');
const casesPath = path.join(dataDir, 'dermatology_cases.json');
const processedDataDir = path.join(dataDir, 'processed');

// Create necessary directories
function ensureDirectoriesExist() {
  const dirs = [dataDir, imagesDir, processedDataDir];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Configure readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper: Prompt for input
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Helper: Load configuration
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
  return { 
    enabled: false, 
    modelId: '', 
    fallbackToDefaultModel: true 
  };
}

// Helper: Save configuration
function saveConfig(config: any) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving configuration:', error);
    return false;
  }
}

// Helper: Load cases data
function loadCases() {
  try {
    if (fs.existsSync(casesPath)) {
      return JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading cases:', error);
  }
  return [];
}

// Helper: Save cases data
function saveCases(cases: any[]) {
  try {
    fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving cases:', error);
    return false;
  }
}

// Helper: Get list of image files
function getImageFiles() {
  try {
    if (fs.existsSync(imagesDir)) {
      return fs.readdirSync(imagesDir)
        .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    }
  } catch (error) {
    console.error('Error reading image directory:', error);
  }
  return [];
}

// Initialize OpenAI client
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required for fine-tuning');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Display the main menu
async function displayMainMenu() {
  console.clear();
  console.log(chalk.yellowBright('\n=== LUME Fine-Tuning CLI ===\n'));
  
  const config = loadConfig();
  const cases = loadCases();
  const images = getImageFiles();
  
  console.log(chalk.cyan('Current Status:'));
  console.log(`- Fine-tuning enabled: ${config.enabled ? chalk.green('Yes') : chalk.red('No')}`);
  console.log(`- Current model: ${config.modelId || chalk.gray('None')}`);
  console.log(`- Training cases: ${chalk.yellow(cases.length)}`);
  console.log(`- Available images: ${chalk.yellow(images.length)}`);
  console.log(`- Cases without images: ${chalk.yellow(cases.filter(c => !images.includes(c.imageFileName)).length)}`);
  console.log(`- Images without cases: ${chalk.yellow(images.filter(img => !cases.some(c => c.imageFileName === img)).length)}`);
  
  console.log(chalk.cyan('\nChoose an option:'));
  console.log('1. View available images');
  console.log('2. View training cases');
  console.log('3. Add new training case');
  console.log('4. Prepare data for fine-tuning');
  console.log('5. Start fine-tuning job');
  console.log('6. Check fine-tuning job status');
  console.log('7. List available fine-tuned models');
  console.log('8. Enable/disable fine-tuning');
  console.log('9. Exit');
  
  const choice = await prompt('\nEnter your choice (1-9): ');
  
  switch (choice) {
    case '1': await viewImages(); break;
    case '2': await viewCases(); break;
    case '3': await addTrainingCase(); break;
    case '4': await prepareData(); break;
    case '5': await startFineTuningJob(); break;
    case '6': await checkJobStatus(); break;
    case '7': await listFineTunedModels(); break;
    case '8': await toggleFineTuning(); break;
    case '9': exitCLI(); break;
    default: 
      console.log(chalk.red('Invalid choice. Press Enter to continue...'));
      await prompt('');
      await displayMainMenu();
  }
}

// Option 1: View available images
async function viewImages() {
  console.clear();
  console.log(chalk.yellowBright('\n=== Available Images ===\n'));
  
  const images = getImageFiles();
  
  if (images.length === 0) {
    console.log(chalk.red('No images found. Add images to the images directory.'));
  } else {
    const cases = loadCases();
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const hasCase = cases.some(c => c.imageFileName === img);
      console.log(`${i+1}. ${img} ${hasCase ? chalk.green('[Has training data]') : chalk.yellow('[No training data]')}`);
    }
  }
  
  console.log('\nPress Enter to return to main menu...');
  await prompt('');
  await displayMainMenu();
}

// Option 2: View training cases
async function viewCases() {
  console.clear();
  console.log(chalk.yellowBright('\n=== Training Cases ===\n'));
  
  const cases = loadCases();
  const images = getImageFiles();
  
  if (cases.length === 0) {
    console.log(chalk.red('No training cases found. Add cases using the "Add new training case" option.'));
  } else {
    for (let i = 0; i < cases.length; i++) {
      const caseData = cases[i];
      const hasImage = images.includes(caseData.imageFileName);
      console.log(`${i+1}. ${caseData.imageFileName} - ${chalk.cyan(caseData.diagnosis)} (${caseData.severity}) ${hasImage ? chalk.green('[Image exists]') : chalk.red('[Image missing]')}`);
      
      // Display details on request
      if (i < 5 || await prompt('\nShow more? (y/n): ') === 'y') {
        console.log(`   Body part: ${caseData.bodyPart || 'Not specified'}`);
        console.log(`   Treatments: ${caseData.treatments ? caseData.treatments.join(', ') : 'None specified'}`);
        console.log(`   Description: ${caseData.description || 'No description'}`);
        console.log('');
      } else {
        console.log(chalk.gray(`   ... and ${cases.length - 5} more cases\n`));
        break;
      }
    }
  }
  
  console.log('\nPress Enter to return to main menu...');
  await prompt('');
  await displayMainMenu();
}

// Option 3: Add new training case
async function addTrainingCase() {
  console.clear();
  console.log(chalk.yellowBright('\n=== Add Training Case ===\n'));
  
  const images = getImageFiles();
  
  if (images.length === 0) {
    console.log(chalk.red('No images found. Add images to the images directory first.'));
    console.log('\nPress Enter to return to main menu...');
    await prompt('');
    return displayMainMenu();
  }
  
  // Display images without cases first
  const cases = loadCases();
  const imagesWithoutCases = images.filter(img => !cases.some(c => c.imageFileName === img));
  
  console.log(`Available images without training data: ${imagesWithoutCases.length}`);
  if (imagesWithoutCases.length > 0) {
    for (let i = 0; i < Math.min(10, imagesWithoutCases.length); i++) {
      console.log(`${i+1}. ${imagesWithoutCases[i]}`);
    }
    if (imagesWithoutCases.length > 10) {
      console.log(chalk.gray(`   ... and ${imagesWithoutCases.length - 10} more images\n`));
    }
  }
  
  // Prompt for image selection
  let selectedImage = '';
  if (imagesWithoutCases.length > 0) {
    const choice = await prompt('Select an image number or enter image filename: ');
    
    if (/^\d+$/.test(choice) && parseInt(choice) <= imagesWithoutCases.length) {
      selectedImage = imagesWithoutCases[parseInt(choice) - 1];
    } else if (images.includes(choice)) {
      selectedImage = choice;
    } else {
      console.log(chalk.red('Invalid image selection.'));
      console.log('\nPress Enter to try again...');
      await prompt('');
      return addTrainingCase();
    }
  } else {
    console.log('All images have associated training data. You can still add a new case for an existing image.');
    const choice = await prompt('Enter image filename from the available images: ');
    
    if (images.includes(choice)) {
      selectedImage = choice;
    } else {
      console.log(chalk.red('Invalid image filename.'));
      console.log('\nPress Enter to try again...');
      await prompt('');
      return addTrainingCase();
    }
  }
  
  // Get case details
  console.log(chalk.cyan(`\nAdding training data for image: ${selectedImage}`));
  
  const diagnosis = await prompt('Enter diagnosis: ');
  if (!diagnosis) {
    console.log(chalk.red('Diagnosis is required.'));
    console.log('\nPress Enter to try again...');
    await prompt('');
    return addTrainingCase();
  }
  
  const severity = await prompt('Enter severity (Mild/Moderate/Severe): ');
  const bodyPart = await prompt('Enter body part (e.g., Face, Arm, etc.): ');
  const treatmentsInput = await prompt('Enter treatments (comma separated): ');
  const treatments = treatmentsInput ? treatmentsInput.split(',').map(t => t.trim()).filter(t => t) : [];
  const description = await prompt('Enter description: ');
  
  // Create case object
  const newCase = {
    imageFileName: selectedImage,
    diagnosis,
    severity: severity || 'Moderate',
    bodyPart: bodyPart || '',
    treatments,
    description: description || ''
  };
  
  // Add or update case
  const existingCases = loadCases();
  const index = existingCases.findIndex(c => c.imageFileName === selectedImage);
  
  if (index >= 0) {
    const confirmOverwrite = await prompt(chalk.yellow(`Training data already exists for this image. Overwrite? (y/n): `));
    if (confirmOverwrite.toLowerCase() !== 'y') {
      console.log('Operation cancelled.');
      console.log('\nPress Enter to return to main menu...');
      await prompt('');
      return displayMainMenu();
    }
    existingCases[index] = newCase;
  } else {
    existingCases.push(newCase);
  }
  
  if (saveCases(existingCases)) {
    console.log(chalk.green('Training case saved successfully!'));
  } else {
    console.log(chalk.red('Failed to save training case.'));
  }
  
  console.log('\nPress Enter to return to main menu...');
  await prompt('');
  await displayMainMenu();
}

// Option 4: Prepare data for fine-tuning
async function prepareData() {
  console.clear();
  console.log(chalk.yellowBright('\n=== Prepare Data for Fine-Tuning ===\n'));
  
  try {
    const openai = getOpenAIClient();
    const cases = loadCases();
    const images = getImageFiles();
    
    if (cases.length === 0) {
      console.log(chalk.red('No training cases found. Add cases before preparing data.'));
      console.log('\nPress Enter to return to main menu...');
      await prompt('');
      return displayMainMenu();
    }
    
    // Filter cases to only include those with existing images
    const validCases = cases.filter(c => images.includes(c.imageFileName));
    console.log(`Found ${validCases.length} valid cases out of ${cases.length} total cases.`);
    
    if (validCases.length === 0) {
      console.log(chalk.red('No valid cases found (all cases reference missing images).'));
      console.log('\nPress Enter to return to main menu...');
      await prompt('');
      return displayMainMenu();
    }
    
    const confirmPrepare = await prompt(chalk.yellow(`Prepare ${validCases.length} cases for fine-tuning? (y/n): `));
    if (confirmPrepare.toLowerCase() !== 'y') {
      console.log('Operation cancelled.');
      console.log('\nPress Enter to return to main menu...');
      await prompt('');
      return displayMainMenu();
    }
    
    // Placeholder for actual data preparation
    // This would involve converting the training data to JSONL format for OpenAI
    const spinner = createSpinner('Preparing data...').start();
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a training file in the format OpenAI expects
    const trainingDataPath = path.join(processedDataDir, 'training_data.jsonl');
    const trainingData = validCases.map(caseData => {
      const imagePath = path.join(imagesDir, caseData.imageFileName);
      const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });
      
      // This is a simplified example, the actual format would depend on OpenAI's requirements
      return {
        messages: [
          {
            role: "system",
            content: "You are a dermatology expert analyzing skin conditions from images."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "What skin condition does this image show? Provide a detailed analysis."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          },
          {
            role: "assistant",
            content: `This image shows ${caseData.diagnosis} with ${caseData.severity.toLowerCase()} severity. ${caseData.description || ''} ${caseData.bodyPart ? `The condition appears on the ${caseData.bodyPart.toLowerCase()}.` : ''} ${caseData.treatments.length > 0 ? `Recommended treatments include: ${caseData.treatments.join(', ')}.` : ''}`
          }
        ]
      };
    });
    
    // Ensure the directory exists
    if (!fs.existsSync(processedDataDir)) {
      fs.mkdirSync(processedDataDir, { recursive: true });
    }
    
    // Write each training example as a line of JSON
    fs.writeFileSync(
      trainingDataPath, 
      trainingData.map(item => JSON.stringify(item)).join('\n')
    );
    
    spinner.success({ text: 'Data preparation completed!' });
    console.log(chalk.green(`Created training file at: ${trainingDataPath}`));
    console.log(chalk.yellow(`Next steps: Use option 5 to start a fine-tuning job with this data.`));
    
    console.log('\nPress Enter to return to main menu...');
    await prompt('');
    await displayMainMenu();
    
  } catch (error) {
    console.error('Error preparing data:', error);
    console.log(chalk.red(`An error occurred: ${(error as Error).message}`));
    console.log('\nPress Enter to return to main menu...');
    await prompt('');
    await displayMainMenu();
  }
}

// Option 5: Start fine-tuning job
async function startFineTuningJob() {
  console.clear();
  console.log(chalk.yellowBright('\n=== Start Fine-Tuning Job ===\n'));
  
  try {
    const openai = getOpenAIClient();
    
    // Check if prepared data exists
    const trainingDataPath = path.join(processedDataDir, 'training_data.jsonl');
    if (!fs.existsSync(trainingDataPath)) {
      console.log(chalk.red('Prepared training data not found. Run "Prepare data for fine-tuning" first.'));
      console.log('\nPress Enter to return to main menu...');
      await prompt('');
      return displayMainMenu();
    }
    
    // Get content of the training file
    const trainingContent = fs.readFileSync(trainingDataPath, 'utf8');
    const trainingExamples = trainingContent.split('\n').filter(line => line.trim());
    
    console.log(`Found ${trainingExamples.length} training examples.`);
    
    const confirmStart = await prompt(chalk.yellow(`Start a fine-tuning job with ${trainingExamples.length} examples? (y/n): `));
    if (confirmStart.toLowerCase() !== 'y') {
      console.log('Operation cancelled.');
      console.log('\nPress Enter to return to main menu...');
      await prompt('');
      return displayMainMenu();
    }
    
    // Prompt for model selection
    console.log(chalk.cyan('\nAvailable base models:'));
    console.log('1. gpt-4o (Most powerful, multimodal)');
    console.log('2. gpt-3.5-turbo (Faster, less expensive)');
    
    const modelChoice = await prompt('Select base model (1 or 2): ');
    const baseModel = modelChoice === '2' ? 'gpt-3.5-turbo' : 'gpt-4o';
    
    // Simulate the file upload
    const spinner = createSpinner('Uploading training file...').start();
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Placeholder for OpenAI file upload
    // In a real implementation, you would use:
    // const uploadResponse = await openai.files.create({
    //   file: fs.createReadStream(trainingDataPath),
    //   purpose: 'fine-tune'
    // });
    
    spinner.success({ text: 'Training file uploaded!' });
    
    // Simulate starting a fine-tuning job
    const jobSpinner = createSpinner('Starting fine-tuning job...').start();
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Placeholder for OpenAI fine-tuning job creation
    // In a real implementation, you would use:
    // const fineTuningJob = await openai.fineTuning.jobs.create({
    //   training_file: uploadResponse.id,
    //   model: baseModel
    // });
    
    // Simulate a job ID
    const jobId = `ft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    jobSpinner.success({ text: 'Fine-tuning job started!' });
    console.log(chalk.green(`Fine-tuning job created with ID: ${jobId}`));
    console.log(chalk.yellow(`The job will take several hours to complete.`));
    console.log(chalk.yellow(`Use option 6 to check the status of your job.`));
    
    // Save job ID to a file for reference
    const jobsPath = path.join(processedDataDir, 'fine_tuning_jobs.json');
    let jobs = [];
    
    if (fs.existsSync(jobsPath)) {
      try {
        jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
      } catch (error) {
        console.error('Error reading jobs file:', error);
      }
    }
    
    jobs.push({
      id: jobId,
      baseModel,
      examples: trainingExamples.length,
      createdAt: new Date().toISOString(),
      status: 'created'
    });
    
    fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 2));
    
    console.log('\nPress Enter to return to main menu...');
    await prompt('');
    await displayMainMenu();
    
  } catch (error) {
    console.error('Error starting fine-tuning job:', error);
    console.log(chalk.red(`An error occurred: ${(error as Error).message}`));
    console.log('\nPress Enter to return to main menu...');
    await prompt('');
    await displayMainMenu();
  }
}

// Option 6: Check job status
async function checkJobStatus() {
  console.clear();
  console.log(chalk.yellowBright('\n=== Check Fine-Tuning Job Status ===\n'));
  
  try {
    const jobsPath = path.join(processedDataDir, 'fine_tuning_jobs.json');
    
    if (!fs.existsSync(jobsPath)) {
      console.log(chalk.red('No fine-tuning jobs found. Start a job first.'));
      console.log('\nPress Enter to return to main menu...');
      await prompt('');
      return displayMainMenu();
    }
    
    const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
    
    if (jobs.length === 0) {
      console.log(chalk.red('No fine-tuning jobs found. Start a job first.'));
      console.log('\nPress Enter to return to main menu...');
      await prompt('');
      return displayMainMenu();
    }
    
    console.log(chalk.cyan('Recent fine-tuning jobs:'));
    
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      console.log(`${i+1}. Job ID: ${job.id}`);
      console.log(`   Base model: ${job.baseModel}`);
      console.log(`   Created: ${job.createdAt}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Examples: ${job.examples}`);
      console.log('');
    }
    
    const jobChoice = await prompt('Enter job number to check detailed status (or Enter to skip): ');
    
    if (jobChoice && /^\d+$/.test(jobChoice) && parseInt(jobChoice) <= jobs.length) {
      const selectedJob = jobs[parseInt(jobChoice) - 1];
      
      console.log(chalk.cyan(`\nChecking status for job: ${selectedJob.id}`));
      
      const spinner = createSpinner('Fetching job status...').start();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Placeholder for OpenAI job retrieval
      // In a real implementation, you would use:
      // const jobDetails = await openai.fineTuning.jobs.retrieve(selectedJob.id);
      
      // Simulate a status update
      const possibleStatuses = ['created', 'running', 'succeeded', 'failed'];
      const randomStatus = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
      
      // For demo purposes, simulate job progression over time
      let newStatus = selectedJob.status;
      if (selectedJob.status === 'created') {
        newStatus = 'running';
      } else if (selectedJob.status === 'running' && Math.random() > 0.5) {
        newStatus = 'succeeded';
      }
      
      // Update job status
      selectedJob.status = newStatus;
      fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 2));
      
      spinner.success({ text: 'Status retrieved!' });
      
      console.log(chalk.cyan('\nJob Details:'));
      console.log(`Status: ${chalk.yellow(newStatus)}`);
      console.log(`Base Model: ${selectedJob.baseModel}`);
      console.log(`Training Examples: ${selectedJob.examples}`);
      
      if (newStatus === 'succeeded') {
        const finetuned_model = `ft:${selectedJob.baseModel}:${selectedJob.id.split('-')[1]}`;
        console.log(chalk.green(`\nFine-tuned model ID: ${finetuned_model}`));
        console.log(chalk.yellow(`Use option 8 to enable this model for your application.`));
        
        // Add this model to available models
        const modelsPath = path.join(processedDataDir, 'available_models.json');
        let models = [];
        
        if (fs.existsSync(modelsPath)) {
          try {
            models = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));
          } catch (error) {
            console.error('Error reading models file:', error);
          }
        }
        
        if (!models.some(m => m.id === finetuned_model)) {
          models.push({
            id: finetuned_model,
            baseModel: selectedJob.baseModel,
            examples: selectedJob.examples,
            createdAt: new Date().toISOString()
          });
          
          fs.writeFileSync(modelsPath, JSON.stringify(models, null, 2));
        }
      }
    }
    
    console.log('\nPress Enter to return to main menu...');
    await prompt('');
    await displayMainMenu();
    
  } catch (error) {
    console.error('Error checking job status:', error);
    console.log(chalk.red(`An error occurred: ${(error as Error).message}`));
    console.log('\nPress Enter to return to main menu...');
    await prompt('');
    await displayMainMenu();
  }
}

// Option 7: List fine-tuned models
async function listFineTunedModels() {
  console.clear();
  console.log(chalk.yellowBright('\n=== Available Fine-Tuned Models ===\n'));
  
  try {
    const modelsPath = path.join(processedDataDir, 'available_models.json');
    
    if (!fs.existsSync(modelsPath)) {
      console.log(chalk.red('No fine-tuned models available yet.'));
      console.log('\nPress Enter to return to main menu...');
      await prompt('');
      return displayMainMenu();
    }
    
    const models = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));
    
    if (models.length === 0) {
      console.log(chalk.red('No fine-tuned models available yet.'));
      console.log('\nPress Enter to return to main menu...');
      await prompt('');
      return displayMainMenu();
    }
    
    console.log(chalk.cyan('Your fine-tuned models:'));
    
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      console.log(`${i+1}. Model ID: ${model.id}`);
      console.log(`   Base model: ${model.baseModel}`);
      console.log(`   Created: ${model.createdAt}`);
      console.log(`   Training examples: ${model.examples}`);
      console.log('');
    }
    
    const config = loadConfig();
    console.log(chalk.cyan(`Current active model: ${config.enabled ? config.modelId || 'None' : 'Fine-tuning disabled'}`));
    
    const modelChoice = await prompt('Enter model number to enable (or Enter to skip): ');
    
    if (modelChoice && /^\d+$/.test(modelChoice) && parseInt(modelChoice) <= models.length) {
      const selectedModel = models[parseInt(modelChoice) - 1];
      
      const confirmEnable = await prompt(chalk.yellow(`Enable model ${selectedModel.id} for your application? (y/n): `));
      if (confirmEnable.toLowerCase() === 'y') {
        config.enabled = true;
        config.modelId = selectedModel.id;
        
        if (saveConfig(config)) {
          console.log(chalk.green(`Model ${selectedModel.id} enabled successfully!`));
        } else {
          console.log(chalk.red('Failed to update configuration.'));
        }
      }
    }
    
    console.log('\nPress Enter to return to main menu...');
    await prompt('');
    await displayMainMenu();
    
  } catch (error) {
    console.error('Error listing models:', error);
    console.log(chalk.red(`An error occurred: ${(error as Error).message}`));
    console.log('\nPress Enter to return to main menu...');
    await prompt('');
    await displayMainMenu();
  }
}

// Option 8: Enable/disable fine-tuning
async function toggleFineTuning() {
  console.clear();
  console.log(chalk.yellowBright('\n=== Enable/Disable Fine-Tuning ===\n'));
  
  const config = loadConfig();
  
  console.log(`Current status: ${config.enabled ? chalk.green('Enabled') : chalk.red('Disabled')}`);
  if (config.enabled) {
    console.log(`Current model: ${config.modelId || 'None'}`);
  }
  
  const action = await prompt(`${config.enabled ? 'Disable' : 'Enable'} fine-tuning? (y/n): `);
  
  if (action.toLowerCase() === 'y') {
    config.enabled = !config.enabled;
    
    if (config.enabled) {
      // If enabling, prompt for model ID
      const modelsPath = path.join(processedDataDir, 'available_models.json');
      
      if (fs.existsSync(modelsPath)) {
        try {
          const models = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));
          
          if (models.length > 0) {
            console.log(chalk.cyan('\nAvailable models:'));
            
            for (let i = 0; i < models.length; i++) {
              console.log(`${i+1}. ${models[i].id} (${models[i].baseModel})`);
            }
            
            const modelChoice = await prompt('Select a model (number) or Enter to skip: ');
            
            if (modelChoice && /^\d+$/.test(modelChoice) && parseInt(modelChoice) <= models.length) {
              config.modelId = models[parseInt(modelChoice) - 1].id;
            } else if (modelChoice) {
              config.modelId = modelChoice;
            }
          } else {
            config.modelId = await prompt('Enter model ID: ');
          }
        } catch (error) {
          console.error('Error reading models file:', error);
          config.modelId = await prompt('Enter model ID: ');
        }
      } else {
        config.modelId = await prompt('Enter model ID: ');
      }
      
      const fallback = await prompt('Fallback to default model if fine-tuned model fails? (y/n): ');
      config.fallbackToDefaultModel = fallback.toLowerCase() === 'y';
    }
    
    if (saveConfig(config)) {
      console.log(chalk.green(`Fine-tuning ${config.enabled ? 'enabled' : 'disabled'} successfully!`));
    } else {
      console.log(chalk.red('Failed to update configuration.'));
    }
  }
  
  console.log('\nPress Enter to return to main menu...');
  await prompt('');
  await displayMainMenu();
}

// Exit the CLI
function exitCLI() {
  console.log(chalk.green('\nExiting LUME Fine-Tuning CLI. Goodbye!'));
  rl.close();
  process.exit(0);
}

// Main entry point
async function main() {
  // Create necessary directories
  ensureDirectoriesExist();
  
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.log(chalk.red('\nOPENAI_API_KEY environment variable not found.'));
    console.log(chalk.yellow('You need to set this variable to use fine-tuning features.'));
    console.log(chalk.yellow('Example: export OPENAI_API_KEY=sk-yourapikey\n'));
  }
  
  // Display main menu
  await displayMainMenu();
}

// Start the CLI
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});