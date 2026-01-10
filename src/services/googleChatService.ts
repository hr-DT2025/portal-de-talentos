// Servicio para integración real con Google Chat
export interface GoogleChatMessage {
  text: string;
  cards?: any[];
}

export class GoogleChatService {
  private webhookUrl: string;

  constructor(webhookUrl?: string) {
    // Permitir inyectar la URL directamente o usar una por defecto
    this.webhookUrl = webhookUrl || '';
  }

  // Método estático para crear instancia con variables de entorno
  static create(): GoogleChatService {
    // En Vercel, las variables se inyectan en tiempo de construcción
    // Por ahora, usamos una URL vacía (se configurará en producción)
    return new GoogleChatService('');
  }

  async sendMessage(message: GoogleChatMessage): Promise<void> {
    if (!this.webhookUrl) {
      console.warn('Google Chat webhook URL not configured');
      return;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Google Chat API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending message to Google Chat:', error);
      throw error;
    }
  }

  async sendUserMessage(userName: string, message: string): Promise<void> {
    const formattedMessage = {
      text: `📩 Nuevo mensaje de ${userName}:\n\n${message}`,
      cards: [
        {
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: `<b>Usuario:</b> ${userName}`
                  }
                },
                {
                  textParagraph: {
                    text: `<b>Mensaje:</b> ${message}`
                  }
                },
                {
                  textParagraph: {
                    text: `<i>Enviado desde Portal de Colaboradores</i>`
                  }
                }
              ]
            }
          ]
        }
      ]
    };

    await this.sendMessage(formattedMessage);
  }

  async sendHRResponse(userName: string, response: string): Promise<void> {
    const formattedMessage = {
      text: `💬 Respuesta de RRHH para ${userName}:\n\n${response}`,
      cards: [
        {
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: `<b>Respuesta de RRHH para:</b> ${userName}`
                  }
                },
                {
                  textParagraph: {
                    text: `<b>Respuesta:</b> ${response}`
                  }
                }
              ]
            }
          ]
        }
      ]
    };

    await this.sendMessage(formattedMessage);
  }
}

export const googleChatService = new GoogleChatService();
