
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  /**
   * Summarizes medical history using gemini-3-flash-preview.
   */
  async summarizeMedicalHistory(patientName: string, history: string[]) {
    try {
      // Instantiate GoogleGenAI right before making an API call to ensure fresh key usage
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a concise clinical summary for ${patientName} with the following medical history: ${history.join(', ')}. Highlight potential risks.`,
        config: {
          systemInstruction: "You are a professional clinical assistant. Keep summaries strictly medical and objective."
        }
      });
      // Always access .text property directly from GenerateContentResponse
      return response.text || "Summary unavailable.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Failed to generate medical summary.";
    }
  }

  /**
   * Interprets lab results using gemini-3-flash-preview.
   */
  async interpretLabResults(testName: string, results: any[]) {
    try {
      // Instantiate GoogleGenAI right before making an API call to ensure fresh key usage
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const resultStr = results.map(r => `${r.parameter}: ${r.value} ${r.unit} (${r.flag})`).join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Interpret these ${testName} results: ${resultStr}. Explain what these mean for a patient in plain language and suggest next steps.`,
        config: {
          systemInstruction: "You are a friendly laboratory doctor. Explain medical terms simply but accurately. Do not give a final diagnosis, just interpret the trends."
        }
      });
      // Always access .text property directly from GenerateContentResponse
      return response.text || "Interpretation unavailable.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "AI interpretation failed.";
    }
  }

  /**
   * Provides diagnostic suggestions using gemini-3-pro-preview for complex clinical reasoning.
   */
  async getDiagnosticSuggestions(symptoms: string) {
    try {
      // Instantiate GoogleGenAI right before making an API call to ensure fresh key usage
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Based on these symptoms: "${symptoms}", suggest 3 potential clinical diagnoses and recommended laboratory tests. Format as JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diagnoses: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              recommendedTests: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["diagnoses", "recommendedTests"]
          }
        }
      });
      // Always access .text property directly and trim before parsing JSON
      const jsonStr = response.text?.trim() || '{}';
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Gemini Error:", error);
      return { diagnoses: [], recommendedTests: [] };
    }
  }
}

export const geminiService = new GeminiService();
