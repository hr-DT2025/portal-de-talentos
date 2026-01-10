import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { dataService } from '../services/dataService';
import { GoogleChatService } from '../services/googleChatService';
import { ChatMessage } from '../types';
import { Send, MessageCircle, User, Bot, ExternalLink } from 'lucide-react';

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hrUser, setHrUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadChatData = async () => {
      try {
        // Get HR user (in real app, this would come from user's company)
        const hrData = await dataService.getUser('hr-456');
        setHrUser(hrData);
        
        // Load chat messages
        if (user && hrData) {
          const chatMessages = await dataService.getChatMessages(user.id, hrData.id);
          setMessages(chatMessages);
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
      }
    };
    loadChatData();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !hrUser) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    try {
      // Send message to HR (local storage)
      const message = await dataService.sendMessage(
        user.id,
        hrUser.id,
        messageText,
        false
      );
      
      setMessages(prev => [...prev, message]);
      
      // Send to Google Chat (real integration)
      const chatService = GoogleChatService.create();
      try {
        await chatService.sendUserMessage(user.fullName, messageText);
      } catch (error) {
        console.warn('Failed to send to Google Chat:', error);
      }
      
      // Simulate HR response after a delay
      setTimeout(async () => {
        try {
          const hrResponse = await dataService.sendMessage(
            hrUser.id,
            user.id,
            'Gracias por tu mensaje. Te responderé a la brevedad posible.',
            true
          );
          setMessages(prev => [...prev, hrResponse]);
          
          // Send HR response to Google Chat
          try {
            await chatService.sendHRResponse(user.fullName, 'Gracias por tu mensaje. Te responderé a la brevedad posible.');
          } catch (error) {
            console.warn('Failed to send HR response to Google Chat:', error);
          }
        } catch (error) {
          console.error('Error sending HR response:', error);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openGoogleChat = () => {
    // Simulate opening Google Chat
    alert('Esta función abriría Google Chat del colaborador correspondiente');
  };

  if (!user) return null;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <MessageCircle className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Chat con RRHH</h3>
              <p className="text-sm text-gray-500">
                {hrUser ? `${hrUser.fullName} • Recursos Humanos` : 'Cargando...'}
              </p>
            </div>
          </div>
          <button
            onClick={openGoogleChat}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Abrir en Google Chat"
          >
            <ExternalLink size={14} />
            Google Chat
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No hay mensajes aún</p>
            <p className="text-sm text-gray-400 mt-1">
              Envía tu primera consulta al equipo de RRHH
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isFromHR ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.isFromHR
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                <div className="flex items-start gap-2 mb-1">
                  {message.isFromHR ? (
                    <Bot size={16} className="text-gray-500 mt-0.5" />
                  ) : (
                    <User size={16} className="text-indigo-200 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {message.isFromHR ? 'RRHH' : user.fullName}
                    </p>
                    <p className="text-sm break-words">{message.message}</p>
                  </div>
                </div>
                <p className={`text-xs mt-1 ${
                  message.isFromHR ? 'text-gray-500' : 'text-indigo-200'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              disabled={loading}
              rows={1}
            />
            {newMessage && (
              <button
                type="button"
                onClick={() => setNewMessage('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
        
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Mensajes se guardan en el sistema y se envían a Google Chat</span>
        </div>
      </div>
    </div>
  );
}
