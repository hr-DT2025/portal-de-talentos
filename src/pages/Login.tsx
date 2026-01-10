import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { dataService } from '../services/dataService';
import { JOB_TITLES, calculateSystemRole } from '../constants/jobs'; 
import { Loader2, Mail, Lock, Building, User, Eye, EyeOff, Briefcase } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  const [selectedJob, setSelectedJob] = useState('');
  const [customJob, setCustomJob] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        const finalJobTitle = selectedJob === 'Otros' ? customJob : selectedJob;
        // Calculamos el rol del sistema (HR, Director, Admin, Colaborador)
        const systemRole = calculateSystemRole(finalJobTitle, companyName);

        const newUser = await dataService.register({
          email,
          password,
          fullName,
          companyName,
          jobTitle: finalJobTitle,
          role: systemRole 
        });
        login(newUser);
      } else {
        const user = await dataService.login(email, password, 'collaborator'); // El tipo es irrelevante aqui, el servicio lo resuelve
        login(user);
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Portal de Talentos</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" required className="pl-10 block w-full border-gray-300 rounded-md focus:ring-topacio focus:border-topacio sm:text-sm py-2 border" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input type="email" required className="pl-10 block w-full border-gray-300 rounded-md focus:ring-topacio focus:border-topacio sm:text-sm py-2 border" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            {isRegistering && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Empresa</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="text" required className="pl-10 block w-full border-gray-300 rounded-md focus:ring-topacio focus:border-topacio sm:text-sm py-2 border" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Cargo</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <select required className="pl-10 block w-full border-gray-300 rounded-md focus:ring-topacio focus:border-topacio sm:text-sm py-2 border bg-white" value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)}>
                      <option value="">Selecciona...</option>
                      {JOB_TITLES.map((job) => (<option key={job} value={job}>{job}</option>))}
                      <option value="Otros">Otro</option>
                    </select>
                  </div>
                </div>

                {selectedJob === 'Otros' && (
                  <input type="text" required placeholder="Especifica tu cargo" className="mt-2 block w-full border-gray-300 rounded-md focus:ring-topacio focus:border-topacio sm:text-sm py-2 border px-3" value={customJob} onChange={(e) => setCustomJob(e.target.value)} />
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input type={showPassword ? "text" : "password"} required className="pl-10 block w-full border-gray-300 rounded-md focus:ring-topacio focus:border-topacio sm:text-sm py-2 border pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</div>}

            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-topacio hover:bg-topacio-600 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-topacio hover:text-topacio-600 font-medium">
              {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
