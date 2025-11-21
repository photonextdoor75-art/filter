import { GoogleGenAI, Modality } from "@google/genai";

// Ensure the API key is available
if (!process.env.API_KEY) {
  console.error("API_KEY environment variable is missing.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Edits an image using Gemini 2.5 Flash Image model.
 * @param base64Image The base64 string of the image (without data URI prefix usually, but helper handles logic).
 * @param mimeType The mime type of the image (e.g., 'image/jpeg').
 * @param prompt The text prompt describing the desired edit.
 * @returns The base64 data URI of the generated image.
 */
export const editImage = async (
  base64Image: string, 
  mimeType: string, 
  prompt: string
): Promise<string> => {
  
  // Strip the data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No image candidates returned by the model.");
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      throw new Error("No content parts returned.");
    }

    // Look for inlineData in parts
    const imagePart = parts.find(p => p.inlineData);
    
    if (imagePart && imagePart.inlineData) {
      const generatedBase64 = imagePart.inlineData.data;
      // Default assumption is png for generated images usually, but let's check if mimeType is provided or assume png
      const generatedMimeType = imagePart.inlineData.mimeType || 'image/png';
      return `data:${generatedMimeType};base64,${generatedBase64}`;
    } else {
      // Fallback: Sometimes models might refuse and return text explaining why (safety).
      const textPart = parts.find(p => p.text);
      if (textPart && textPart.text) {
        throw new Error(`Model response text: ${textPart.text}`);
      }
      throw new Error("Model did not return an image.");
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Enhance error message if it's a safety block or specific API error
    if (error.message?.includes("safety")) {
      throw new Error("The image generation was blocked by safety filters.");
    }
    throw error;
  }
};