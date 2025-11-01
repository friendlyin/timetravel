/**
 * Google Gemini API Client Wrapper
 *
 * This module provides an interface for interacting with Google's Gemini API
 * for image generation using the Gemini 2.5 Flash Image (Nano Banana) model.
 */

import { GoogleGenAI } from "@google/genai";
import { ImageModelConfig } from "@/config/models.config";
import localConfig from "../../config.local";

/**
 * Initialize the Gemini client
 */
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    // Get API key from local config first, then fall back to environment variables
    const apiKey = localConfig.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured. " +
          "Please add it to config.local.ts (copy from config.local.example.ts) " +
          "or set it in your .env.local file."
      );
    }

    geminiClient = new GoogleGenAI({ apiKey });
  }

  return geminiClient;
}

/**
 * Generate an image using Google's Gemini API
 *
 * @param prompt - The text prompt describing the image to generate
 * @param modelConfig - Configuration for the image generation model
 * @returns Object with url and revisedPrompt
 */
export async function generateImage(
  prompt: string,
  modelConfig: ImageModelConfig
): Promise<{ url: string; revisedPrompt?: string }> {
  try {
    const ai = getGeminiClient();

    console.log(`   🎨 Calling Gemini API (${modelConfig.model})...`);

    // Generate image using Gemini 2.5 Flash Image model
    const response = await ai.models.generateContent({
      model: modelConfig.model,
      contents: prompt,
    });

    // Extract image data from response
    if (!response.candidates || !response.candidates[0]) {
      throw new Error("No candidates returned from Gemini API");
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      throw new Error("No content parts returned from Gemini API");
    }

    // Look for inline image data
    let imageUrl = "";
    let revisedPrompt: string | undefined;

    for (const part of candidate.content.parts) {
      if (part.text) {
        // Store any text response as revised prompt
        revisedPrompt = part.text;
      } else if (part.inlineData) {
        // Found image data - convert to data URL
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || "image/png";
        imageUrl = `data:${mimeType};base64,${imageData}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error("No image data found in Gemini API response");
    }

    console.log(`   ✅ Image generated successfully (${imageUrl.length} bytes)`);

    return {
      url: imageUrl,
      revisedPrompt,
    };
  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    throw new Error(
      `Failed to generate image with Gemini: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Test the Gemini API connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const ai = getGeminiClient();

    console.log("Testing Gemini API connection...");

    // Make a simple test request with a minimal prompt
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: "Test image generation",
    });

    if (response.candidates && response.candidates[0]) {
      console.log("Gemini API connection successful");
      return true;
    }

    console.error("Gemini API connection test failed: No response");
    return false;
  } catch (error) {
    console.error("Error testing Gemini API connection:", error);
    return false;
  }
}
