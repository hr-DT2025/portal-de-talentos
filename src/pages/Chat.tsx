import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import { ChatMessage } from '../types';
import { Send, MessageCircle, User, Bot, Loader2, WifiOff } from 'lucide-react';

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [hrbpData, setHrbpData] = useState<{
    webhook: string | null;
    chatId: string | null;
    nombre: string;
    receptor_uuid: string | null;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadChatData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        setIsDisconnected(false);

        // 1. Obtener perfil y datos de empresa
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('empresa_id, empresas(nombre, google_webhook_url, hrbp_id)')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) throw new Error('Error al cargar perfil');

        const hrbpCode = profile.empresas?.hrbp_id;

        // 2. Buscar datos del HRBP (UUID y Nombre)
        if (hrbpCode) {
          const [hrbpProfileRes, googleChatRes] = await Promise.all([
            supabase.from('profiles').select('id, full_name').eq('hrbp_code', hrbpCode).single(),
            supabase.from('ID_googlechat').select('google_chat, hrbp').eq('hrbp_code_ref', hrbpCode).single()
          ]);

          setHrbpData({
            webhook: profile.empresas.google_webhook_url,
            chatId: googleChatRes.data?.google_chat || null,
            nombre: hrbpProfileRes.data?.full_name || googleChatRes.data?.hrbp || 'Asesor de RRHH',
            receptor_uuid: hrbpProfileRes.data?.id || null
          });
        }

        // 3. Cargar mensajes
        const { data: chatMessages } = await supabase
          .from('chat_history')
          .select('*')
          .or(`emisor_id.eq.${user.id},receptor_id.eq.${user.id}`)
          .order('created_at', { ascending: true });

        if (chatMessages) {
          setMessages(chatMessages.map(m => ({
            id: m.id,
            message: m.mensaje,
            isFromHR: m.emisor_id !== user.id,
            timestamp: m.created_at
          })));
        }
      } catch (error) {
        console.error('Error:', error);
        setIsDisconnected(true);
      } finally {
        setLoading(false);
      }
    };

    loadChatData();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('chat_realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_history',
        filter: `receptor_id=eq.${user.id}` 
      }, (payload) => {
        setMessages(prev => [...prev, {
          id: payload.new.id,
          message: payload.new.mensaje,
          isFromHR: true,
          timestamp: payload.new.created_at
        }]);
      })
      .subscribe((status) => {
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setIsDisconnected(true);
      });

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !hrbpData?.receptor_uuid) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const { data: savedMsg, error: saveError } = await supabase
        .from('chat_history')
        .insert({
          emisor_id: user.id,
          receptor_id: hrbpData.receptor_uuid,
          mensaje: messageText
        })
        .select().single();

      if (saveError) throw saveError;

      setMessages(prev => [...prev, {
        id: savedMsg.id,
        message: savedMsg.mensaje,
        isFromHR: false,
        timestamp: savedMsg.created_at
      }]);

      if (hrbpData.webhook) {
        fetch(hrbpData.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `*💬 Mensaje de ${user.full_name}*\n${messageText}\n_ID: ${hrbpData.chatId || 'N/A'}_`
          })
        }).catch(() => null);
      }
    } catch (error) {
      setIsDisconnected(true);
    }
  };

  // Función para capturar el Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) return null;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <MessageCircle className="text-indigo-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 leading-none">Asistencia RRHH</h3>
            <p className="text-xs text-gray-500 mt-1">
              {loading ? 'Identificando...' : hrbpData ? `${hrbpData.nombre} • HRBP` : 'Buscando asesor...'}
            </p>
          </div>
        </div>
      </div>

      {/* Connection Error Banner */}
      {isDisconnected && (
        <div className="bg-red-50 text-red-600 px-4 py-2 text-xs flex items-center gap-2 border-b border-red-100">
          <WifiOff size={14} />
          <span>No se pudo establecer conexión. Verifica tu internet o intenta más tarde.</span>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.isFromHR ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm ${
              m.isFromHR ? 'bg-white text-gray-800 border' : 'bg-indigo-600 text-white'
            }`}>
              <p className="text-sm">{m.message}</p>
              <p className="text-[10px] mt-1 opacity-60 text-right">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2 bg-gray-100 rounded-full px-4 py-2 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu consulta y presiona Enter..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
            disabled={loading}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || loading}
            className="text-indigo-600 disabled:text-gray-400"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
