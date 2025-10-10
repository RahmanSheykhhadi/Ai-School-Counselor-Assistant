import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const clients = new Map<string, GoogleGenAI>();

const getAiClient = (apiKey: string): GoogleGenAI => {
    if (!clients.has(apiKey)) {
        const newClient = new GoogleGenAI({ apiKey });
        clients.set(apiKey, newClient);
    }
    return clients.get(apiKey)!;
}

export const summarizeNotes = async (notes: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    return "کلید API هوش مصنوعی در تنظیمات وارد نشده است.";
  }
  if (!notes.trim()) {
    return "یادداشتی برای خلاصه‌سازی وجود ندارد.";
  }
  try {
    const prompt = `Summarize the following counseling session notes into a few key bullet points in Persian. Focus on the main issues and agreed-upon actions:\n\n---\n${notes}\n---`;
    
    const gemini = getAiClient(apiKey);
    const response: GenerateContentResponse = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("Error summarizing notes:", error);
    return "خطا در ارتباط با سرویس هوش مصنوعی. کلید API خود را بررسی کنید.";
  }
};

export const suggestActionItems = async (notes: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    return "کلید API هوش مصنوعی در تنظیمات وارد نشده است.";
  }
  if (!notes.trim()) {
    return "یادداشتی برای ارائه پیشنهاد وجود ندارد.";
  }
  try {
    const prompt = `Based on the counseling session notes below, suggest 3 actionable, concrete next steps for the student in a numbered list format in Persian:\n\n---\n${notes}\n---`;

    const gemini = getAiClient(apiKey);
    const response: GenerateContentResponse = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    
    return response.text;
  } catch (error) {
    console.error("Error suggesting action items:", error);
    return "خطا در ارتباط با سرویس هوش مصنوعی. کلید API خود را بررسی کنید.";
  }
};