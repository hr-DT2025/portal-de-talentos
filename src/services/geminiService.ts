import { GoogleGenAI } from "@google/genai";
import { Mood } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getEmotionalFeedback = async (mood: Mood, userName: string): Promise<string> => {
  try {
    const prompt = `
      El usuario ${userName} ha registrado su estado de ánimo hoy como: "${mood}".
      Actúa como un coach empático de bienestar corporativo y "Salario Emocional".
      Genera un mensaje corto (máximo 2 frases) que sea motivador, comprensivo o que sugiera una pequeña pausa de bienestar.
      Si está feliz/emocionado, celebra con él. Si está estresado/cansado, ofrece apoyo.
      Responde en Español.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "¡Gracias por compartir! Recuerda tomar descansos activos.";
  } catch (error) {
    console.error("Error fetching AI feedback:", error);
    return "Tu bienestar es importante para nosotros. ¡Que tengas un buen día!";
  }
};