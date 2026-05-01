import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface EnhancedProduct {
  title: string;
  description: string;
  seoKeywords: string[];
  adCopy: string;
}

export async function enhanceProduct(productData: any): Promise<EnhancedProduct> {
  const prompt = `Enhance this e-commerce product for high conversion and SEO:
  Name: ${productData.name}
  Base Description: ${productData.description}
  Features: ${JSON.stringify(productData.features)}
  
  Provide a catchy title, a persuasive description, 5 top SEO keywords, and a high-converting ad copy.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          seoKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          adCopy: { type: Type.STRING }
        },
        required: ["title", "description", "seoKeywords", "adCopy"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateAdScript(product: any, platform: 'tiktok' | 'facebook') {
  const prompt = `Create a ${platform} UGC ad script for this product:
  Title: ${product.enhancedData.title}
  Description: ${product.enhancedData.description}
  
  The script should be high-energy, feature a viral hook, three key benefits, and a strong call to action.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: `You are an expert ${platform} marketing specialist. Write scripts that feel authentic and non-corporate.`
    }
  });

  return response.text;
}
