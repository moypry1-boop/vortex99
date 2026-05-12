import { GoogleGenAI, Type } from "@google/genai";
import { AdminConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function processHonorCommand(prompt: string, currentConfig: AdminConfig) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an AI Orchestrator for a game hosting website. 
      The user (the "Honor") wants to modify the site configuration.
      
      Current Configuration: ${JSON.stringify(currentConfig)}
      User Request: ${prompt}
      
      Your task is to return a NEW AdminConfig object that reflects the user's request.
      Also provide a short explanation in Arabic of what you changed.
      
      Capabilities:
      - Change site name, logo, and password.
      - Update payment numbers (Vodafone/Etisalat).
      - Manage social links (add, remove, edit).
      - Configure the support bot (name, enabled subjects, welcome messages).
      - You can interpret vague requests like "make the site more professional" by updating the bot messages or site name.
      
      Rules:
      1. Only change fields requested by the user.
      2. Keep all other fields as they are.
      3. If the user asks for something impossible or dangerous, return the current config and an error message.
      4. The response must be valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN },
            newConfig: { type: Type.OBJECT, properties: {
              siteName: { type: Type.STRING },
              siteLogo: { type: Type.STRING },
              sitePassword: { type: Type.STRING },
              vodafoneNumber: { type: Type.STRING },
              etisalatNumber: { type: Type.STRING },
              socialLinks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                url: { type: Type.STRING },
                iconUrl: { type: Type.STRING }
              }}},
              botName: { type: Type.STRING },
              botEnabledSubjects: { type: Type.ARRAY, items: { type: Type.STRING }},
              botMessages: { type: Type.OBJECT, properties: {
                paymentApproved: { type: Type.STRING },
                welcomeMessage: { type: Type.STRING }
              }}
            }},
            explanation: { type: Type.STRING },
            error: { type: Type.STRING }
          },
          required: ["success"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Honor Error:", error);
    return { success: false, error: "حدث خطأ في معالجة طلب الهونر" };
  }
}

export async function generateTicketResponse(subject: string, message: string, siteName: string, botName: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an AI support assistant named ${botName} for a game hosting website called ${siteName}. 
      A user has opened a support ticket.
      Subject: ${subject}
      Message: ${message}
      
      Provide a helpful, professional, and concise response in Arabic. 
      If it's a payment confirmation, thank them and tell them the admin will review it shortly.
      If it's a technical issue, try to be helpful or tell them a support agent will be with them soon.
      Sign off as ${botName}.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "عذراً، حدث خطأ في معالجة طلبك. سيقوم أحد موظفي الدعم بالرد عليك قريباً.";
  }
}
