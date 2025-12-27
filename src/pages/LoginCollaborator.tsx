import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { dataService } from '../services/dataService';
import { HeartHandshake, Loader2, Mail, Lock, ArrowRight, Building, User, Eye, EyeOff } from 'lucide-react';

export default function LoginCollaborator() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [companyName, setCompanyName] = useState('');

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
    if (isRegistering && (!fullName || !role || !companyName)) {
      setError('Por favor completa todos los campos de registro');
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
      if (isRegistering) {
        const user = await dataService.register({
          fullName,
          email,
          password,
          role,
          companyName
        });
        login(user);
      } else {
        const user = await dataService.login(email, password, 'collaborator');
        login(user);
      }
      navigate('/dashboard');
    } catch (error) {
      console.error("Auth error", error);
      setError("Error en autenticación. Por favor intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Función de recuperación de contraseña próximamente disponible');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-topacio-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-topacio p-8 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <HeartHandshake className="text-white h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {isRegistering ? 'Únete al Equipo' : 'Portal de Colaboradores'}
          </h2>
          <p className="text-topacio-100">
            {isRegistering 
              ? 'Regístrate para acceder a tus beneficios.' 
              : 'Ingresa a tu portal de colaborador.'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegistering && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-topacio focus:border-topacio transition-all outline-none"
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-topacio focus:border-topacio transition-all outline-none"
                  >
                    <option value="">Selecciona tu rol</option>
                    <option value="Desarrollador">Desarrollador</option>
                    <option value="Diseñador">Diseñador</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Analista">Analista</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa donde labora</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-topacio focus:border-topacio transition-all outline-none"
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-topacio focus:border-topacio transition-all outline-none"
                  placeholder="nombre@empresa.com"
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
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-topacio focus:border-topacio transition-all outline-none"
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

            {!isRegistering && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-topacio hover:text-topacio-600 font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-topacio hover:bg-topacio-500 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-topacio/30"
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
              className="text-sm text-topacio hover:text-topacio-600 font-medium"
            >
              {isRegistering 
                ? '¿Ya tienes cuenta? Inicia sesión' 
                : '¿Eres nuevo? Regístrate aquí'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <a
              href="/hr-login"
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ¿Eres de Recursos Humanos? Ingresa aquí
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
