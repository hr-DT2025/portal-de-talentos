import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mood } from "../types";

const apiKey = import.meta.env.VITE_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const getEmotionalFeedback = async (mood: Mood, userName: string): Promise<string> => {
  // Si no hay API key configurada, retornar mensaje por defecto
  if (!genAI) {
    return "Tu bienestar es importante para nosotros. ¡Que tengas un buen día!";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      El usuario ${userName} ha registrado su estado de ánimo hoy como: "${mood}".
      Actúa como un coach empático de bienestar corporativo y "Salario Emocional".
      Genera un mensaje corto (máximo 2 frases) que sea motivador, comprensivo o que sugiera una pequeña pausa de bienestar.
      Si está feliz/emocionado, celebra con él. Si está estresado/cansado, ofrece apoyo.
      Responde en Español.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "¡Gracias por compartir! Recuerda tomar descansos activos.";
  } catch (error) {
    console.error("Error fetching AI feedback:", error);
    return "Tu bienestar es importante para nosotros. ¡Que tengas un buen día!";
  }
};
