import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { dataService } from '../services/dataService'; // <--- CORREGIDO
import { profileService } from '../services/supabaseService'; // <--- CORREGIDO
import { supabase } from '../lib/supabase';
import { Request, RequestStatus, Role } from '../types';
import Toast from '../components/Toast'; 
import { FileText, Plus, Calendar, CheckCircle, Clock, AlertCircle, Filter, Search, Loader2 } from 'lucide-react';

// TU WEBHOOK DE N8N
const N8N_WEBHOOK_URL = 'https://talentprocesos.app.n8n.cloud/webhook/datos-constancia-sheets'; 

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<RequestStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Estados del Formulario Dinámico
  const [requestType, setRequestType] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  // Campos para Día Libre
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysCount, setDaysCount] = useState(1);
  const [reason, setReason] = useState('');

  // Campos para Constancia
  const [addressedTo, setAddressedTo] = useState('');
  const [includeSalary, setIncludeSalary] = useState('No');

  // 1. Carga Inicial
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // A. Cargar Solicitudes
        const requestsData = user?.role === Role.HR 
          ? await dataService.getAllRequests()
          : await dataService.getRequests(user?.id);
        setRequests(requestsData);

        // B. LOGICA CORREGIDA PARA PRE-LLENAR EMPRESA
        if (user?.id && !companyName) {
           const profile = await profileService.getById(user.id);
           
           if (profile) {
             // Prioridad 1: Nombre desde la relación oficial (Tabla Empresas)
             // Prioridad 2: Nombre desde company_temp (Tabla Profiles)
             // Prioridad 3: Cadena vacía
             const empresaNombre = profile.empresas?.nombre || profile.company_temp || '';
             
             console.log("Perfil cargado:", profile); // Para depurar en consola F12
             console.log("Empresa detectada:", empresaNombre); 

             if (empresaNombre) {
               setCompanyName(empresaNombre);
             }
           }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) loadData();
  }, [user]); // Quitamos companyName de dependencias para evitar loops

  // 2. Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('solicitudes-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitudes',
          filter: user.role !== Role.HR ? `colaborador_id=eq.${user.id}` : undefined
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setRequests((prev) => 
              prev.map((req) => req.id === payload.new.id ? { ...req, ...payload.new } : req)
            );
          }
          if (payload.eventType === 'INSERT') {
             // Opcional: manejar inserción externa
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Limpiar formulario al abrir/cerrar
  useEffect(() => {
    if (!showNewRequestModal) {
      setRequestType('');
      // No reseteamos companyName para mantenerlo
      setStartDate('');
      setEndDate('');
      setDaysCount(1);
      setReason('');
      setAddressedTo('');
      setIncludeSalary('No');
    }
  }, [showNewRequestModal]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setToast(null);

    if (!user || !user.id) {
        setToast({ message: 'Error de sesión. Recarga la página.', type: 'error' });
        setCreating(false);
        return;
    }

    try {
      let displayDetails = '';
      
      if (requestType === 'Dia libre') {
        displayDetails = `Día Libre. Desde: ${startDate} Hasta: ${endDate} (${daysCount} días). Motivo: ${reason}`;
      } else if (requestType === 'Constancia laboral') {
        displayDetails = `Constancia dirigida a: ${addressedTo}. Incluir salario: ${includeSalary}. Motivo: ${reason}`;
      }

      const newRequest = await dataService.createRequest(
        requestType,
        displayDetails,
        user.id,
        companyName
      );

      if (!newRequest || !newRequest.id) {
          throw new Error('No se pudo obtener el ID de la nueva solicitud.');
      }

      =========================PAYLOAD A N8N==========================
 
      /**const n8nPayload = {
        requestId: newRequest.id,
        colaboradorId: user.id,
        colaboradorNombre: user.fullName || 'Usuario',
        colaboradorEmail: user.email || 'No disponible',
        empresa: newRequest.companyName || companyName,
        tipo: requestType,
        fecha_solicitud: new Date().toISOString(),
        
        ...(requestType === 'Dia libre' ? {
          fecha_inicio: startDate,
          fecha_fin: endDate,
          dias_totales: daysCount,
          motivo: reason
        } : {}),

        ...(requestType === 'Constancia laboral' ? {
          dirigido_a: addressedTo,
          incluir_salario: includeSalary === 'Si',
          motivo: reason
        } : {})
      };**/
==========================paylod que funciona 10-1-26================
    // 1. Primero obtenemos el ID de la empresa desde el perfil del usuario
const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('empresa_id')
  .eq('id', user.id)
  .single();

if (profileError) {
  console.error("Error obteniendo el ID de la empresa:", profileError);
}

// 2. Construimos el Payload incluyendo el ID obtenido
const n8nPayload = {
  requestId: newRequest.id,
  colaboradorId: user.id,
  // Agregamos el ID de la empresa desde la DB
  empresaId: profileData?.empresa_id || null, 
  colaboradorNombre: user.fullName || 'Usuario',
  colaboradorEmail: user.email || 'No disponible',
  empresa: newRequest.companyName || companyName,
  tipo: requestType,
  fecha_solicitud: new Date().toISOString(),
  
  ...(requestType === 'Dia libre' ? {
    fecha_inicio: startDate,
    fecha_fin: endDate,
    dias_totales: daysCount,
    motivo: reason
  } : {}),

  ...(requestType === 'Constancia laboral' ? {
    dirigido_a: addressedTo,
    incluir_salario: includeSalary === 'Si',
    motivo: reason
  } : {})
};

// 3. Enviar a n8n...
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(n8nPayload)
        });
      } catch (n8nError) {
        console.error('Error enviando a n8n (No crítico para la UI):', n8nError);
      }
      
      setRequests([newRequest, ...requests]);
      setToast({ message: 'Solicitud enviada correctamente', type: 'success' });
      setShowNewRequestModal(false);

    } catch (error: any) {
      console.error('Error CRÍTICO creando solicitud:', error);
      setToast({ message: 'Error al guardar: ' + (error.message || 'Intente de nuevo'), type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: RequestStatus) => {
    try {
      await dataService.updateRequestStatus(requestId, status);
    } catch (error) {
      console.error('Error updating request:', error);
      setToast({ message: 'Error actualizando estado', type: 'error' });
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.APPROVED: return 'text-green-600 bg-green-50 border-green-200';
      case RequestStatus.REJECTED: return 'text-red-600 bg-red-50 border-red-200';
      case RequestStatus.IN_PROGRESS: return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.APPROVED: return <CheckCircle size={16} />;
      case RequestStatus.REJECTED: return <AlertCircle size={16} />;
      case RequestStatus.IN_PROGRESS: return <Clock size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch = request.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const isHR = user?.role === Role.HR;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-12 w-12 text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      {toast && (
        <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isHR ? 'Gestión de Solicitudes' : 'Mis Solicitudes'}
          </h1>
          <p className="text-gray-500">
            {isHR ? 'Revisa y gestiona todas las solicitudes' : 'Gestiona tus solicitudes y seguimientos'}
          </p>
        </div>
        {!isHR && (
          <button
            onClick={() => setShowNewRequestModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Solicitud
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar solicitudes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as RequestStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value={RequestStatus.PENDING}>Pendientes</option>
              <option value={RequestStatus.IN_PROGRESS}>En Progreso</option>
              <option value={RequestStatus.APPROVED}>Aprobados</option>
              <option value={RequestStatus.REJECTED}>Rechazados</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="text-indigo-500" size={20} />
            Solicitudes ({filteredRequests.length})
          </h3>
          
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No se encontraron solicitudes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{request.type}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2 whitespace-pre-line">{request.details}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(request.date).toLocaleDateString('es-CL')}
                        </span>
                        {request.companyName && <span>{request.companyName}</span>}
                      </div>
                      {request.archivo_url && (
                        <a href={request.archivo_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 underline mt-2 block">
                          Ver Documento Generado
                        </a>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {isHR && request.status === RequestStatus.PENDING && (
                        <>
                          <button onClick={() => handleUpdateRequestStatus(request.id, RequestStatus.APPROVED)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => handleUpdateRequestStatus(request.id, RequestStatus.REJECTED)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <AlertCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Solicitud</h3>
            
            <form onSubmit={handleCreateRequest}>
              <div className="space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Solicitud</label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Selecciona tipo</option>
                    <option value="Dia libre">Día libre</option>
                    <option value="Constancia laboral">Constancia Laboral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    readOnly={!!companyName} 
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nombre de tu empresa"
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${companyName ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  />
                </div>

                {requestType === 'Dia libre' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desde</label>
                        <input
                          type="date"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hasta</label>
                        <input
                          type="date"
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de días requeridos</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={daysCount}
                        onChange={(e) => setDaysCount(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                      <textarea
                        rows={3}
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Explica brevemente el motivo..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 resize-none"
                      />
                    </div>
                  </div>
                )}

                {requestType === 'Constancia laboral' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirigida a</label>
                      <input
                        type="text"
                        required
                        value={addressedTo}
                        onChange={(e) => setAddressedTo(e.target.value)}
                        placeholder="Ej: Banco Santander, A quien corresponda..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">¿Incluir Salario?</label>
                      <div className="flex gap-4 mt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="salary"
                            value="Si"
                            checked={includeSalary === 'Si'}
                            onChange={(e) => setIncludeSalary(e.target.value)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Sí</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="salary"
                            value="No"
                            checked={includeSalary === 'No'}
                            onChange={(e) => setIncludeSalary(e.target.value)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la solicitud</label>
                      <textarea
                        rows={3}
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ej: Trámite bancario, Visa..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 resize-none"
                      />
                    </div>
                  </div>
                )}

              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !requestType}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {creating ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
