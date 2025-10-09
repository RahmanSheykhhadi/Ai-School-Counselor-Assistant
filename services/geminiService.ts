import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Lazily initialize GoogleGenAI to prevent app crash on load
// if process.env is not available in the execution environment.
// The client will be created only when an AI function is called.
let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        // This initialization will now happen on first use, not on module load.
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

export const summarizeNotes = async (notes: string): Promise<string> => {
  if (!notes.trim()) {
    return "یادداشتی برای خلاصه‌سازی وجود ندارد.";
  }
  try {
    const prompt = `Summarize the following counseling session notes into a few key bullet points in Persian. Focus on the main issues and agreed-upon actions:\n\n---\n${notes}\n---`;
    
    const gemini = getAiClient();
    const response: GenerateContentResponse = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    // @google/genai-sdk-rules: The `GenerateContentResponse` object has a property called `text` that directly provides the string output.
    // FIX: Access the .text property directly to get the response text.
    return response.text;
  } catch (error) {
    console.error("Error summarizing notes:", error);
    return "خطا در ارتباط با سرویس هوش مصنوعی.";
  }
};

export const suggestActionItems = async (notes: string): Promise<string> => {
  if (!notes.trim()) {
    return "یادداشتی برای ارائه پیشنهاد وجود ندارد.";
  }
  try {
    const prompt = `Based on the counseling session notes below, suggest 3 actionable, concrete next steps for the student in a numbered list format in Persian:\n\n---\n${notes}\n---`;

    const gemini = getAiClient();
    const response: GenerateContentResponse = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    
    // @google/genai-sdk-rules: The `GenerateContentResponse` object has a property called `text` that directly provides the string output.
    // FIX: Access the .text property directly to get the response text.
    return response.text;
  } catch (error) {
    console.error("Error suggesting action items:", error);
    return "خطا در ارتباط با سرویس هوش مصنوعی.";
  }
};