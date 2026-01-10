import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import { getEmotionalFeedback } from '../services/geminiService';
import { Mood, Role } from '../types';
import { Briefcase, Calendar, Clock, Smile, Frown, Meh, Award, Sparkles, Loader2, MessageSquare, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
  const { user } = useAuth();
  
  // Estados para datos reales de la DB
  const [profile, setProfile] = useState<any>(null);
  const [legajo, setLegajo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para Check-in IA
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    async function fetchAllData() {
      if (!user?.id) return;

      try {
        setLoading(true);

        // 1. Obtener Perfil y datos de la Empresa (Relación: profiles -> empresas)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            empresas (
              nombre,
              logo_url,
              color_primario
            )
          `)
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // 2. Obtener datos de Legajo / Registro Masivo (Relación: registro_colaboradores -> profiles)
        // Aquí es donde residen los "Proyectos Clave" y "Salario" según tu esquema
        const { data: legajoData, error: legajoError } = await supabase
          .from('registro_colaboradores')
          .select('*')
          .eq('id_user', user.id)
          .single();

        if (!legajoError) setLegajo(legajoData);

      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, [user]);

  const handleMoodSelect = async (mood: Mood) => {
    setSelectedMood(mood);
    setLoadingFeedback(true);
    
    // Guardamos el feedback en el JSONB de metadatos de la tabla expedientes
    try {
      const { data: currentExp } = await supabase
        .from('expedientes')
        .select('metadata_actualizacion')
        .eq('id', user?.id)
        .single();

      const newHistory = [...(currentExp?.metadata_actualizacion || []), {
        fecha: new Date().toISOString(),
        mood: mood,
        tipo: 'check-in-emocional'
      }];

      await supabase
        .from('expedientes')
        .upsert({ id: user?.id, metadata_actualizacion: newHistory, updated_at: new Date() });

      const feedback = await getEmotionalFeedback(mood, profile?.full_name || 'Colaborador');
      setAiFeedback(feedback);
    } catch (e) {
      setAiFeedback("¡Gracias por compartir! Que tengas un excelente día.");
    } finally {
      setLoadingFeedback(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#37b1d3] mb-4" size={40} />
      <p className="text-gray-500 animate-pulse">Cargando tu portal de colaborador...</p>
    </div>
  );

  // Lógica de datos calculados
  const antiguedad = profile?.fecha_ingreso 
    ? formatDistanceToNow(parseISO(profile.fecha_ingreso), { locale: es })
    : "No registrada";

  // Simulamos PTO ya que no está en el esquema enviado (se podría añadir a profiles)
  const ptoData = [
    { name: 'Disfrutados', value: 4, color: '#262f3f' },
    { name: 'Disponibles', value: 11, color: '#37b1d3' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 animate-fade-in">
      
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gray-50 p-2 border border-gray-100">
            <img 
              src={profile?.empresas?.logo_url || "/logo.png"} 
              alt="Logo Empresa" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {profile?.full_name}
            </h1>
            <p className="text-[#37b1d3] font-medium text-sm">
              {profile?.rol_puesto || profile?.job_title} | {profile?.area}
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col items-end">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Antigüedad</span>
          <span className="text-gray-700 font-semibold flex items-center gap-2">
            <Clock size={16} className="text-[#37b1d3]" /> {antiguedad}
          </span>
        </div>
      </div>

      {/* SECCIÓN IA & BIENESTAR */}
      <div className="bg-[#262f3f] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="text-yellow-400" /> Check-in de Bienestar
            </h2>
            <p className="text-gray-300 text-sm mt-2 mb-6">
              Hola {profile?.full_name?.split(' ')[0]}, ¿cómo está tu energía para los retos de hoy?
            </p>
            
            {!selectedMood ? (
              <div className="flex gap-6">
                {[{ m: Mood.HAPPY, i: Smile }, { m: Mood.NEUTRAL, i: Meh }, { m: Mood.STRESSED, i: Frown }].map((item) => (
                  <button 
                    key={item.m}
                    onClick={() => handleMoodSelect(item.m)}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-[#37b1d3] transition-all group-hover:scale-110">
                      <item.i size={32} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md animate-slide-up">
                {loadingFeedback ? (
                  <div className="flex items-center gap-3 text-sm">
                    <Loader2 className="animate-spin text-[#37b1d3]" /> Analizando con Gemini IA...
                  </div>
                ) : (
                  <p className="italic text-gray-100 text-sm leading-relaxed">"{aiFeedback}"</p>
                )}
              </div>
            )}
          </div>
          
          {/* Badge de Cargo desde registro_colaboradores */}
          <div className="w-full md:w-64 bg-white/5 p-4 rounded-xl border border-white/10">
            <h3 className="text-[10px] font-bold text-[#37b1d3] uppercase mb-2 tracking-tighter">Estatus de Colaborador</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">ID Legajo:</span>
                <span className="font-mono">{legajo?.id_legajo || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estatus:</span>
                <span className="text-green-400 font-bold">{legajo?.status || 'Activo'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PROYECTOS CLAVE (Datos reales de registro_colaboradores) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Briefcase className="text-[#37b1d3]" size={20} />
            Proyectos Clave y Objetivos
          </h3>
          <div className="bg-gray-50 rounded-xl p-5 border border-dashed border-gray-200">
            {legajo?.proyectos_clave ? (
              <div className="flex items-start gap-4">
                <div className="bg-[#37b1d3]/10 p-3 rounded-lg text-[#37b1d3]">
                  <Award size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Foco Actual</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{legajo.proyectos_clave}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic text-center py-4">
                No hay proyectos clave asignados en tu registro actual.
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">Fortalezas Identificadas</h5>
              <p className="text-sm text-gray-700">{legajo?.fortalezas || 'Pendiente de evaluación'}</p>
            </div>
            <div className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">Plan de Desarrollo</h5>
              <p className="text-sm text-gray-700">{legajo?.plan_desarrollo || 'En definición con RRHH'}</p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: PTO Y ACCIONES */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
              <Calendar className="text-[#37b1d3]" size={18} /> GESTIÓN DE TIEMPO
            </h3>
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ptoData} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                    {ptoData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pb-2">
                <span className="text-2xl font-bold text-gray-800">11</span>
                <span className="text-[10px] text-gray-400 font-bold">DÍAS LIBRES</span>
              </div>
            </div>
          </div>

          <button className="w-full bg-white border-2 border-dashed border-gray-200 p-4 rounded-2xl flex items-center justify-between hover:border-[#37b1d3] hover:bg-[#37b1d3]/5 transition-all group">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg text-green-600">
                <MessageSquare size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-800">Consultar RRHH</p>
                <p className="text-xs text-gray-400">Canal de Google Chat</p>
              </div>
            </div>
            <ExternalLink size={16} className="text-gray-300 group-hover:text-[#37b1d3]" />
          </button>
        </div>
      </div>
    </div>
  );
}
