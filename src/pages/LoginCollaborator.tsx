import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { dataService } from '../services/dataService';
import { JOB_TITLES, calculateSystemRole } from '../constants/jobs'; // Importamos la lógica de roles
import { Loader2, Mail, Lock, ArrowRight, Building, User, Eye, EyeOff, Briefcase } from 'lucide-react';

export default function LoginCollaborator() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Estados de control
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Datos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  // Lógica de Cargos
  const [selectedJob, setSelectedJob] = useState('');
  const [customJob, setCustomJob] = useState('');

  const validateForm = () => {
    if (!email || !password) {
      setError('Por favor completa email y contraseña');
      return false;
    }
    if (isRegistering) {
      if (!fullName || !companyName) {
        setError('Nombre y Empresa son obligatorios');
        return false;
      }
      if (!selectedJob) {
        setError('Debes seleccionar un cargo');
        return false;
      }
      if (selectedJob === 'Otros' && !customJob) {
        setError('Por favor especifica tu cargo');
        return false;
      }
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
        // 1. Determinar el nombre real del cargo
        const finalJobTitle = selectedJob === 'Otros' ? customJob : selectedJob;

        // 2. Calcular el rol del sistema (SuperAdmin, HR, Director, Colaborador)
        const systemRole = calculateSystemRole(finalJobTitle, companyName);

        console.log("Registrando:", { finalJobTitle, systemRole, companyName });

        // 3. Enviar al servicio actualizado
        await dataService.register({
          email,
          password,
          fullName,
          companyName,
          jobTitle: finalJobTitle,
          role: systemRole
        });

      } else {
        // Login normal
        await login(email, password);
      }
      
      // Si todo sale bien, ir al dashboard
      navigate('/dashboard');

    } catch (err: any) {
      console.error(err);
      // Mensajes amigables según el error
      if (err.message.includes('Invalid login')) setError('Credenciales incorrectas');
      else if (err.message.includes('already registered')) setError('Este correo ya está registrado');
      else setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Portal de Talentos
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isRegistering ? 'Crea tu cuenta profesional' : 'Bienvenido de nuevo'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Nombre Completo (Solo Registro) */}
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required={isRegistering}
                    className="pl-10 block w-full border-gray-300 rounded-md focus:ring-topacio focus:border-topacio sm:text-sm py-2 border"
                    placeholder="Ej: Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  className="pl-10 block w-full border-gray-300 rounded-md focus:ring-topacio focus:border-topacio sm:text-sm py-2 border"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Empresa y Cargo (Solo Registro) */}
            {isRegistering && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Empresa</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required={isRegistering}
                      className="pl-10 block w-full border-gray-300 rounded-md focus:ring-topacio focus:border-topacio sm:text-sm py-2 border"
                      placeholder="Nombre de tu organización"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Cargo / Puesto</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      required={isRegistering}
                      className="pl-10 block w-full border-gray-300 rounded-md focus:ring-topacio focus:border-topacio sm:text-sm py-2 border bg-white"
                      value={selectedJob}
                      onChange={(e) => setSelectedJob(e.target.value)}
                    >
                      <option value="">Selecciona tu cargo...</option>
                      {JOB_TITLES.map((job) => (
                        <option key={job} value={job}>{job}</option>
                      ))}
                      <option value="Otros">Otro (Especificar)</option>
                    </select>
                  </div>
                </div>

                {/* Input condicional para 'Otros' */}
                {selectedJob === 'Otros' && (
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-medium text-gray-700 mt-2">Especifica tu cargo</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md focus:ring-topacio focus:border-topacio sm:text-sm py-2 border px-3"
                      placeholder="Escribe tu cargo exacto"
                      value={customJob}
                      onChange={(e) => setCustomJob(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="pl-10 block w-full border-gray-300 rounded-md focus:ring-topacio focus:border-topacio sm:text-sm py-2 border pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-topacio hover:bg-topacio-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-topacio disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray
