import React, { useState } from 'react';
import { useAuth } from '../App';
import { dataService } from '../services/dataService';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
// Asumiendo que el logo está en la carpeta pública o assets
// import logo from '../assets/logo.png'; 

export default function Login() {
  const { login } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Simulate API call
      const user = isRegistering 
        ? await dataService.register(email) 
        : await dataService.login(email);
      login(user);
    } catch (error) {
      console.error("Auth error", error);
      alert("Error en autenticación. Por favor intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert("Redirigir a recuperación de contraseña...");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Cabecera con Color Onix (Gris Oscuro)  */}
        <div className="bg-[#262f3f] p-8 text-center relative">
          <div className="flex flex-col items-center justify-center mb-4">
            {/* Logo del repositorio */}
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm p-3">
               <img 
                 src="/logo.png" 
                 alt="Disruptive Talent Logo" 
                 className="w-full h-full object-contain" 
                 onError={(e) => {
                   // Fallback visual si la imagen no carga
                   e.target.style.display = 'none';
                   e.target.parentElement.innerHTML = '<span class="text-white text-xs">Logo</span>';
                 }}
               />
            </div>
            {/* Nombre de la empresa discreto */}
            <h3 className="text-[#37b1d3] text-sm font-semibold tracking-widest uppercase opacity-90">
              Disruptive Talent
            </h3>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">
            {isRegistering ? 'Únete al Equipo' : 'Bienvenido'}
          </h2>
          <p className="text-gray-300 text-sm">
            {isRegistering 
              ? 'Regístrate para acceder a tus beneficios.' 
              : 'Ingresa a tu portal de colaborador.'}
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#262f3f] mb-1">Correo Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  // Focus ring con color Topacio (Azul vibrante) 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#37b1d3] focus:border-[#37b1d3] transition-all outline-none"
                  placeholder="nombre@disruptivetalent.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#262f3f] mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#37b1d3] focus:border-[#37b1d3] transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Opción Recuperar Contraseña */}
            {!isRegistering && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#37b1d3] hover:text-[#2a8ba6] font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              [cite_start]// Botón con color Topacio (Azul vibrante) [cite: 352]
              className="w-full bg-[#37b1d3] hover:bg-[#2a8ba6] text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-[#37b1d3]/30"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  <span>{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-[#262f3f] hover:text-[#37b1d3] font-medium transition-colors"
            >
              {isRegistering 
                ? '¿Ya tienes cuenta? Inicia sesión' 
                : '¿Eres nuevo? Regístrate aquí'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
