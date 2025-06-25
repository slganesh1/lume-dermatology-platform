#!/usr/bin/env node

/**
 * Test script for fine-tuning dermatology images with OpenAI
 * 
 * This script demonstrates how to use the OpenAI fine-tuning functionality
 * to analyze dermatological images.
 * 
 * Usage:
 * 1. Make sure OPENAI_API_KEY is set in your environment
 * 2. Run: node scripts/test-fine-tuning.js [command]
 * 
 * Available commands:
 * - setup: Initialize the fine-tuning environment
 * - prepare: Prepare training data for fine-tuning
 * - start-job: Start a fine-tuning job
 * - check-job [jobId]: Check the status of a fine-tuning job
 * - enable [modelId]: Enable fine-tuning with a specific model ID
 * - disable: Disable fine-tuning
 * - test [imagePath] [modelId]: Test a fine-tuned model with an image
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Base directory for fine-tuning data
const baseDir = path.join(__dirname, '..', 'server', 'fine-tuning');
const dataDir = path.join(baseDir, 'data');
const imagesDir = path.join(dataDir, 'images');
const configPath = path.join(baseDir, 'config.json');

// Create directories if they don't exist
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Default configuration
const defaultConfig = {
  enabled: false,
  modelId: '',
  fallbackToDefaultModel: true
};

// Load configuration
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
  return defaultConfig;
}

// Save configuration
function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Configuration saved.');
  } catch (error) {
    console.error('Error saving configuration:', error);
  }
}

// Example case
const exampleCase = {
  imageFileName: "example.jpg",
  diagnosis: "Atopic Dermatitis",
  severity: "Moderate",
  bodyPart: "Elbow",
  patientInfo: {
    age: 32,
    gender: "Female",
    skinType: "Dry"
  },
  treatments: [
    "Topical corticosteroids",
    "Moisturizers",
    "Avoid irritants"
  ],
  description: "Atopic dermatitis presenting with redness, scaling, and small fluid-filled blisters."
};

// Initialize the cases file
function initCasesFile() {
  const casesFilePath = path.join(dataDir, 'dermatology_cases.json');
  if (!fs.existsSync(casesFilePath)) {
    fs.writeFileSync(casesFilePath, JSON.stringify([exampleCase], null, 2));
    console.log(`Created example cases file at ${casesFilePath}`);
  } else {
    console.log(`Cases file already exists at ${casesFilePath}`);
  }
}

// Run TypeScript file with tsx
function runTsx(filePath, ...args) {
  const command = `npx tsx ${filePath} ${args.join(' ')}`;
  console.log(`Running: ${command}`);
  try {
    return execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error running tsx: ${error.message}`);
    process.exit(1);
  }
}

// Main function
async function main() {
  const command = process.argv[2] || 'help';
  
  // Check if OPENAI_API_KEY is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is not set.');
    console.error('Please set it before running this script.');
    process.exit(1);
  }
  
  switch (command) {
    case 'setup':
      // Initialize the fine-tuning environment
      initCasesFile();
      saveConfig(defaultConfig);
      console.log('Fine-tuning environment initialized.');
      break;
      
    case 'prepare':
      // Prepare training data for fine-tuning
      console.log('Preparing training data...');
      // TODO: Implement prepare command
      console.log('To prepare data, add dermatology cases to the cases file and run the CLI tool:');
      console.log(`npx tsx ${path.join(baseDir, 'cli.ts')}`);
      break;
      
    case 'start-job':
      // Start a fine-tuning job
      console.log('Starting fine-tuning job...');
      // TODO: Implement start-job command
      console.log('To start a job, run the CLI tool:');
      console.log(`npx tsx ${path.join(baseDir, 'cli.ts')}`);
      break;
      
    case 'check-job':
      // Check the status of a fine-tuning job
      const jobId = process.argv[3];
      if (!jobId) {
        console.error('Error: Job ID is required.');
        process.exit(1);
      }
      console.log(`Checking status of job ${jobId}...`);
      // TODO: Implement check-job command
      console.log('To check job status, run the CLI tool:');
      console.log(`npx tsx ${path.join(baseDir, 'cli.ts')}`);
      break;
      
    case 'enable':
      // Enable fine-tuning with a specific model ID
      const modelId = process.argv[3];
      if (!modelId) {
        console.error('Error: Model ID is required.');
        process.exit(1);
      }
      const config = loadConfig();
      config.enabled = true;
      config.modelId = modelId;
      saveConfig(config);
      console.log(`Fine-tuning enabled with model ${modelId}.`);
      break;
      
    case 'disable':
      // Disable fine-tuning
      const disableConfig = loadConfig();
      disableConfig.enabled = false;
      saveConfig(disableConfig);
      console.log('Fine-tuning disabled.');
      break;
      
    case 'test':
      // Test a fine-tuned model with an image
      const imagePath = process.argv[3];
      const testModelId = process.argv[4];
      if (!imagePath || !testModelId) {
        console.error('Error: Image path and model ID are required.');
        process.exit(1);
      }
      if (!fs.existsSync(imagePath)) {
        console.error(`Error: Image file does not exist at ${imagePath}.`);
        process.exit(1);
      }
      console.log(`Testing model ${testModelId} with image ${imagePath}...`);
      // TODO: Implement test command
      console.log('To test a model, run the CLI tool:');
      console.log(`npx tsx ${path.join(baseDir, 'cli.ts')}`);
      break;
      
    case 'help':
    default:
      console.log('Usage: node scripts/test-fine-tuning.js [command]');
      console.log('');
      console.log('Available commands:');
      console.log('  setup              Initialize the fine-tuning environment');
      console.log('  prepare            Prepare training data for fine-tuning');
      console.log('  start-job          Start a fine-tuning job');
      console.log('  check-job [jobId]  Check the status of a fine-tuning job');
      console.log('  enable [modelId]   Enable fine-tuning with a specific model ID');
      console.log('  disable            Disable fine-tuning');
      console.log('  test [imagePath] [modelId]  Test a fine-tuned model with an image');
      console.log('  help               Show this help message');
      break;
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});