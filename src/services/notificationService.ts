// src/services/notificationService.ts
export const sendChatNotification = async (message: string) => {
  const webhookUrl = import.meta.env.VITE_GOOGLE_CHAT_WEBHOOK;
  
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ text: message })
    });
  } catch (error) {
    console.error("Error enviando a Google Chat:", error);
  }
};
