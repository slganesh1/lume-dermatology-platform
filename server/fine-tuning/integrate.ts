/**
 * Integration module for fine-tuning functionality
 * 
 * This module allows the application to use fine-tuned models for dermatology analysis
 * when they are available, while falling back to the default models if needed.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration path
const configPath = path.join(__dirname, 'config.json');

// Default configuration
const defaultConfig = {
  enabled: false,
  modelId: '',
  fallbackToDefaultModel: true
};

/**
 * Load fine-tuning configuration
 * @returns Configuration object with fine-tuning settings
 */
export function getFineTuningConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading fine-tuning configuration:', error);
  }
  return defaultConfig;
}

/**
 * Check if fine-tuning is enabled and a model is available
 * @returns Boolean indicating if fine-tuning should be used
 */
export function isFineTuningEnabled() {
  const config = getFineTuningConfig();
  return !!config.enabled && !!config.modelId;
}

/**
 * Get the fine-tuned model ID to use for analysis
 * @returns The model ID to use, or null if fine-tuning is disabled
 */
export function getFineTunedModelId() {
  const config = getFineTuningConfig();
  return (config.enabled && config.modelId) ? config.modelId : null;
}

/**
 * Determine whether to fall back to the default model if the fine-tuned model fails
 * @returns Boolean indicating if fallback is enabled
 */
export function shouldFallbackToDefaultModel() {
  const config = getFineTuningConfig();
  return !!config.fallbackToDefaultModel;
}

/**
 * Check if the given model ID is a fine-tuned model
 * @param modelId The model ID to check
 * @returns Boolean indicating if the model is fine-tuned
 */
export function isFineTunedModel(modelId: string): boolean {
  return modelId.startsWith('ft:');
}

/**
 * Handle errors when using fine-tuned models
 * @param error The error that occurred
 * @returns Boolean indicating if the error should trigger a fallback
 */
export function handleFineTuningError(error: any): boolean {
  // Check for specific error types that should trigger fallback
  const errorMessage = error?.message || '';
  
  // Check for errors that indicate the model is not available
  const modelNotAvailableErrors = [
    'The model does not exist',
    'Invalid model',
    'Model not found',
    'Resource not found'
  ];
  
  // Return true if we should fallback to the default model
  return modelNotAvailableErrors.some(msg => errorMessage.includes(msg));
}