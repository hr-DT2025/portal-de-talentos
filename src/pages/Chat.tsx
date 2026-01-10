import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import { ChatMessage } from '../types';
import { Send, MessageCircle, User, Bot, ExternalLink, Loader2 } from 'lucide-react';

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hrbpData, setHrbpData] = useState<{
    webhook: string | null;
    chatId: string | null;
    nombre: string;
    receptor_uuid: string | null;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. CARGA INICIAL: Datos del HRBP y Mensajes previos
  useEffect(() => {
    const loadChatData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);

        // A. Buscamos el empresa_id y el hrbp_id (código) del perfil del colaborador
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            empresa_id,
            empresas (
              nombre,
              google_webhook_url,
              hrbp_id
            )
          `)
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // B. Buscamos el ID de Google Chat y obtenemos el UUID real del HRBP (desde profiles)
        // para poder usarlo como receptor_id en chat_history
        if (profile?.empresas?.hrbp_id) {
          const { data: hrbpProfile } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('hrbp_code', profile.empresas.hrbp_id)
            .single();

          const { data: googleChatInfo } = await supabase
            .from('ID_googlechat')
            .select('google_chat, hrbp')
            .eq('hrbp_code_ref', profile.empresas.hrbp_id)
            .single();

          setHrbpData({
            webhook: profile.empresas.google_webhook_url,
            chatId: googleChatInfo?.google_chat || null,
            nombre: hrbpProfile?.full_name || googleChatInfo?.hrbp || 'Consultor RRHH',
            receptor_uuid: hrbpProfile?.id || null
          });
        }

        // C. Cargar historial de mensajes entre el usuario y RRHH
        const { data: chatMessages, error: chatError } = await supabase
          .from('chat_history')
          .select('*')
          .or(`emisor_id.eq.${user.id},receptor_id.eq.${user.id}`)
          .order('created_at', { ascending: true });

        if (chatError) throw chatError;

        if (chatMessages) {
          setMessages(chatMessages.map(m => ({
            id: m.id,
            message: m.mensaje,
            isFromHR: m.emisor_id !== user.id,
            timestamp: m.created_at
          })));
        }
      } catch (error) {
        console.error('Error al cargar datos del chat:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChatData();
  }, [user]);

  // 2. REALTIME: Escuchar nuevos mensajes entrantes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('chat_realtime')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_history',
          filter: `receptor_id=eq.${user.id}` 
        },
        (payload) => {
          const newMessage = payload.new;
          setMessages((prev) => [
            ...prev,
            {
              id: newMessage.id,
              message: newMessage.mensaje,
              isFromHR: true,
              timestamp: newMessage.created_at,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Scroll automático al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. ENVIAR MENSAJE
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !hrbpData) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // A. Guardar en Base de Datos
      const { data: savedMsg, error: saveError } = await supabase
        .from('chat_history')
        .insert({
          emisor_id: user.id,
          receptor_id: hrbpData.receptor_uuid, // UUID del HRBP obtenido en el primer useEffect
          mensaje: messageText
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // B. Actualizar UI localmente
      if (savedMsg) {
        setMessages(prev => [...prev, {
          id: savedMsg.id,
          message: savedMsg.mensaje,
          isFromHR: false,
          timestamp: savedMsg.created_at
        }]);
      }

      // C. Notificar a Google Chat (Webhook de la empresa)
      if (hrbpData.webhook) {
        fetch(hrbpData.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `*💬 Nuevo mensaje de colaborador*\n*De:* ${user.full_name}\n*Mensaje:* ${messageText}\n*ID Google Chat:* \`${hrbpData.chatId || 'No configurado'}\``
          })
        }).catch(err => console.error("Error enviando a webhook:", err));
      }

    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <MessageCircle className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Asistencia RRHH</h3>
              <p className="text-sm text-gray-500">
                {loading ? 'Cargando asesor...' : `${hrbpData?.nombre} • Tu HRBP asignado`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="mx-auto text-gray-300 mb-2" size={48} />
            <p className="text-gray-500 font-medium">¿En qué podemos ayudarte?</p>
            <p className="text-xs text-gray-400">Escribe tu consulta y un HRBP te responderá aquí.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.isFromHR ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm ${
                message.isFromHR ? 'bg-white text-gray-800 border border-gray-100' : 'bg-indigo-600 text-white'
              }`}>
                <div className="flex items-center gap-2 mb-1 opacity-70">
                  {message.isFromHR ? <Bot size={14} /> : <User size={14} />}
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {message.isFromHR ? 'RRHH' : 'Tú'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{message.message}</p>
                <p className={`text-[10px] mt-1 text-right ${message.isFromHR ? 'text-gray-400' : 'text-indigo-200'}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-full focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white p-2 rounded-full transition-all shadow-md active:scale-95"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
