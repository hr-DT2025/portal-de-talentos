import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { JOB_TITLES, calculateSystemRole } from '../constants/jobs'; // ¡Importante!

export default function LoginCollaborator() {
  const { login, user } = useAuth(); // Asumo que tienes register en useAuth o dataService
  // ... imports y hooks existentes ...
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Estados del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  // Lógica de Cargo
  const [selectedJob, setSelectedJob] = useState('');
  const [customJob, setCustomJob] = useState('');

  // Efecto para calcular el rol en tiempo real (solo para debug o feedback visual)
  useEffect(() => {
    if (isRegistering) {
      const actualJob = selectedJob === 'Otros' ? customJob : selectedJob;
      const role = calculateSystemRole(actualJob, companyName);
      console.log(`Rol calculado: ${role}`);
    }
  }, [selectedJob, customJob, companyName, isRegistering]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validaciones básicas...

    try {
      if (isRegistering) {
        // 1. Determinar el cargo final
        const finalJobTitle = selectedJob === 'Otros' ? customJob : selectedJob;
        
        // 2. Calcular el rol del sistema basado en tus reglas
        const systemRole = calculateSystemRole(finalJobTitle, companyName);

        // 3. Llamar al servicio de registro (ver Paso 4)
        await dataService.register({
          email,
          password,
          fullName,
          companyName,
          jobTitle: finalJobTitle, // Enviamos el cargo real
          role: systemRole         // Enviamos el rol calculado (SuperAdmin, Director, etc)
        });
      } else {
        await login(email, password); // Tu login normal
      }
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      // Manejo de error UI
    }
  };

  return (
    <div className="...tus clases contenedoras...">
      {/* ... Inputs de Email, Password, Nombre, Empresa ... */}

      {isRegistering && (
        <div className="space-y-4">
           {/* Input Empresa */}
           <input
            type="text"
            placeholder="Nombre de la Empresa"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full pl-4 pr-4 py-3 border..."
          />

          {/* Selector de Cargo */}
          <div className="relative">
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-topacio focus:border-transparent appearance-none bg-white"
            >
              <option value="" disabled>Selecciona tu Cargo</option>
              {JOB_TITLES.map((job) => (
                <option key={job} value={job}>{job}</option>
              ))}
              <option value="Otros">Otro (Especificar)</option>
            </select>
            {/* Icono flecha abajo css... */}
          </div>

          {/* Input condicional para 'Otros' */}
          {selectedJob === 'Otros' && (
            <div className="animate-fadeIn">
              <input
                type="text"
                placeholder="Escribe tu cargo específico"
                value={customJob}
                onChange={(e) => setCustomJob(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-topacio/50 rounded-lg bg-topacio/5 focus:ring-2 focus:ring-topacio"
                autoFocus
              />
            </div>
          )}
        </div>
      )}

      {/* ... Botones de submit ... */}
    </div>
  );
}
