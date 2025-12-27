import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { dataService } from '../services/dataService';
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginHR() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return false;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const user = await dataService.login(email, password, 'hr');
      login(user);
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Auth error", error);
      if (error?.message?.includes('Invalid login credentials')) {
        setError("Credenciales inválidas. Verifica tu correo y contraseña.");
      } else if (error?.message?.includes('Email not confirmed')) {
        setError("Debes confirmar tu correo electrónico antes de iniciar sesión.");
      } else {
        setError("Error en autenticación. Por favor intente nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Función de recuperación de contraseña próximamente disponible');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-onix-50 to-zafiro-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-onix to-zafiro p-8 text-center">
          <div className="mx-auto w-20 h-20 mb-4">
            <img src="/logo.png" alt="Disruptive Talent" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Disruptive Talent
          </h2>
          <p className="text-zafiro-100">
            Portal de Recursos Humanos
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zafiro focus:border-zafiro transition-all outline-none"
                  placeholder="rrhh@empresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zafiro focus:border-zafiro transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-zafiro hover:text-zafiro-600 font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-onix to-zafiro hover:from-onix-600 hover:to-zafiro-600 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-zafiro/30"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-zafiro hover:text-zafiro-600 font-medium"
            >
              ¿Eres un colaborador? Ingresa aquí
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
