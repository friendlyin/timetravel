/**
 * Local Configuration File (Example)
 *
 * This is an example configuration file.
 * Copy this file to config.local.ts and add your actual API keys.
 *
 * Usage:
 * 1. Copy this file: cp config.local.example.ts config.local.ts
 * 2. Add your API keys in config.local.ts
 * 3. The application will automatically use those values
 *
 * Get your OpenAI API key from: https://platform.openai.com/api-keys
 */

export const localConfig = {
  // OpenAI API Key - Required for text generation (and legacy image generation)
  openaiApiKey: "your-api-key-here",

  // Gemini API Key - Required for image generation using Gemini 2.5 Flash Image (Nano Banana)
  // Get your key from: https://aistudio.google.com/app/apikey
  geminiApiKey: "your-gemini-api-key-here",

  // Add other API keys here as needed
  // For example:
  // anthropicApiKey: 'your-anthropic-key-here',
} as const;

export default localConfig;
