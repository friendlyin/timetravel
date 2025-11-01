/**
 * Configuration for OpenAI models used in each step of the game
 * 
 * You can easily change which model is used for each generation step by
 * modifying the model names in this configuration file.
 * 
 * Available OpenAI models (as of 2025):
 * - Text Generation: gpt-4o, gpt-4-turbo, gpt-4, gpt-3.5-turbo
 * - Image Generation: dall-e-3, dall-e-2
 */

export interface ModelConfig {
  model: string;
  temperature?: number; // 0.0 to 2.0, controls randomness
  maxTokens?: number; // Maximum tokens in response
  topP?: number; // 0.0 to 1.0, nucleus sampling
}

export interface ImageModelConfig {
  model: 'dall-e-3' | 'dall-e-2';
  size?: '1024x1024' | '1792x1024' | '1024x1792'; // Available sizes vary by model
  quality?: 'standard' | 'hd'; // dall-e-3 only
  style?: 'vivid' | 'natural'; // dall-e-3 only
}

/**
 * Model configurations for each generation step
 */
export const MODELS = {
    /**
     * Historical Context Generation
     * Requires high accuracy and detailed knowledge
     */
    historicalContext: {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 2000
    } as ModelConfig,

    /**
     * Persona Generation
     * Needs creativity while maintaining historical accuracy
     */
    personaGeneration: {
        model: 'gpt-4o',
        temperature: 0.8,
        maxTokens: 2500
    } as ModelConfig,

    /**
     * Lifeline Generation
     * Requires narrative creativity and historical plausibility
     */
    lifelineGeneration: {
        model: 'gpt-4o',
        temperature: 0.8,
        maxTokens: 3000
    } as ModelConfig,

    /**
     * Pivotal Moment Generation
     * Needs drama and meaningful choices while staying historically accurate
     */
    pivotalMomentGeneration: {
        model: 'gpt-4o',
        temperature: 0.9,
        maxTokens: 2000
    } as ModelConfig,

    /**
     * Image Prompt Generation
     * Crafts detailed, historically accurate prompts for image generation
     */
    imagePromptGeneration: {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 1000
    } as ModelConfig,

    /**
     * Image Generation
     * Documentary-realistic historical visualization
     */
    imageGeneration: {
        model: 'dall-e-3',
        size: '1792x1024',
        quality: 'hd',
        style: 'natural'
    } as ImageModelConfig,

    /**
     * Location Resolution
     * Translates coordinates and a year into historical place names
     */
    locationResolution: {
        model: 'gpt-4o-mini',
        temperature: 0.2,
        maxTokens: 600
    } as ModelConfig
} as const

/**
 * Helper function to get model config for a specific step
 */
export function getModelConfig(step: keyof typeof MODELS): ModelConfig | ImageModelConfig {
  return MODELS[step];
}
