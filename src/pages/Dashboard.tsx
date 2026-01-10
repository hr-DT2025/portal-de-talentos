import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { getEmotionalFeedback } from '../services/geminiService';
import { Project, Mood, Role } from '../types';
import { Briefcase, Calendar, Clock, Smile, Frown, Meh, Award, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const projs = await dataService.getProjects();
      setProjects(projs);
    };
    loadData();
  }, []);

  const handleMoodSelect = async (mood: Mood) => {
    setSelectedMood(mood);
    setLoadingFeedback(true);
    setAiFeedback('');
    
    // Call Gemini API
    const feedback = await getEmotionalFeedback(mood, user?.fullName || 'Colaborador');
    setAiFeedback(feedback);
    setLoadingFeedback(false);
  };

  if (!user) return null;

  // Redirect HR users to HR dashboard
  if (user.role === Role.HR) {
    window.location.href = '/hr-dashboard';
    return null;
  }

  const tenure = formatDistanceToNow(parseISO(user.startDate), { locale: es });
  
  // Chart Data
  const ptoData = [
    { name: 'Disfrutados', value: user.ptoTaken, color: '#6366f1' }, // indigo-500
    { name: 'Disponibles', value: user.ptoTotal - user.ptoTaken, color: '#e0e7ff' }, // indigo-100
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {user.fullName.split(' ')[0]} 👋</h1>
          <p className="text-gray-500">Aquí tienes el resumen de tu actividad y beneficios.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 flex items-center space-x-2 text-sm text-gray-600">
          <Clock size={16} className="text-indigo-500" />
          <span>Tiempo en la empresa: <strong>{tenure}</strong></span>
        </div>
      </div>

      {/* Emotional Salary Check-in */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-lg">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="text-yellow-300" /> 
              Check-in Emocional
            </h2>
            <p className="text-indigo-100 text-sm mt-1 mb-4">
              ¿Cómo inicias tu jornada hoy? Tu bienestar es nuestra prioridad.
            </p>
            
            {!selectedMood ? (
              <div className="flex gap-4">
                {[
                  { mood: Mood.HAPPY, icon: Smile, color: 'hover:text-yellow-300' },
                  { mood: Mood.NEUTRAL, icon: Meh, color: 'hover:text-gray-200' },
                  { mood: Mood.STRESSED, icon: Frown, color: 'hover:text-red-300' },
                ].map(({ mood, icon: Icon, color }) => (
                  <button
                    key={mood}
                    onClick={() => handleMoodSelect(mood)}
                    className={`p-2 bg-white/10 rounded-full backdrop-blur-sm transition-all hover:scale-110 ${color}`}
                  >
                    <Icon size={32} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                 {loadingFeedback ? (
                   <div className="flex items-center gap-2">
                     <Loader2 className="animate-spin" size={18} />
                     <span className="text-sm">Generando consejo de bienestar con IA...</span>
                   </div>
                 ) : (
                   <p className="text-sm font-medium italic">"{aiFeedback}"</p>
                 )}
              </div>
            )}
          </div>
          
          {/* Skills Badges */}
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10 w-full md:w-auto">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-2">Habilidades Destacadas</h3>
            <div className="flex flex-wrap gap-2">
              {user.skills.map(skill => (
                <span key={skill} className="text-xs bg-indigo-800/50 px-2 py-1 rounded border border-indigo-400/30">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors text-left">
          <div className="bg-indigo-100 p-3 rounded-lg">
            <MessageSquare className="text-indigo-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Chat con RRHH</p>
            <p className="text-sm text-gray-500">Consulta con el equipo</p>
          </div>
        </button>
        
        <button className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors text-left">
          <div className="bg-green-100 p-3 rounded-lg">
            <Calendar className="text-green-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Solicitar Día Libre</p>
            <p className="text-sm text-gray-500">Gestiona tus vacaciones</p>
          </div>
        </button>
        
        <button className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors text-left">
          <div className="bg-purple-100 p-3 rounded-lg">
            <Award className="text-purple-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Beneficios</p>
            <p className="text-sm text-gray-500">Ver todos tus beneficios</p>
          </div>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PTO Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="text-indigo-500" size={20} />
            Días Libres
          </h3>
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ptoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ptoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pb-8">
              <span className="text-3xl font-bold text-gray-800">{user.ptoTotal - user.ptoTaken}</span>
              <p className="text-xs text-gray-500">Restantes</p>
            </div>
          </div>
        </div>

        {/* Projects Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Briefcase className="text-indigo-500" size={20} />
            Proyectos Activos
          </h3>
          <div className="space-y-4">
            {projects.map(project => (
              <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors">
                <div>
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  <p className="text-sm text-gray-500">{project.role}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  project.status === 'Active' ? 'bg-green-100 text-green-700' :
                  project.status === 'Completed' ? 'bg-gray-100 text-gray-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {project.status === 'Active' ? 'Activo' : project.status}
                </span>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-gray-500 text-sm">No tienes proyectos asignados actualmente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
