import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { dataService } from '../services/dataService';
import { Request, RequestType, RequestStatus, Role } from '../types';
import { 
  FileText, 
  Plus, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Filter,
  Search,
  Eye
} from 'lucide-react';

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<RequestStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const requestsData = user?.role === Role.HR 
          ? await dataService.getAllRequests()
          : await dataService.getRequests(user?.id);
        setRequests(requestsData);
      } catch (error) {
        console.error('Error loading requests:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRequests();
  }, [user]);

  const handleCreateRequest = async (requestData: any) => {
    try {
      const newRequest = await dataService.createRequest(
        requestData.type,
        requestData.details,
        user?.id || '',
        requestData.companyName
      );
      setRequests([newRequest, ...requests]);
      setShowNewRequestModal(false);
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: RequestStatus) => {
    try {
      await dataService.updateRequestStatus(requestId, status);
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status } : req
      ));
    } catch (error) {
      console.error('Error updating request:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isHR ? 'Gestión de Solicitudes' : 'Mis Solicitudes'}
          </h1>
          <p className="text-gray-500">
            {isHR ? 'Revisa y gestiona todas las solicitudes de los colaboradores' : 'Gestiona tus solicitudes y seguimientos'}
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar solicitudes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as RequestStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="text-indigo-500" size={20} />
            Solicitudes ({filteredRequests.length})
          </h3>
          
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No se encontraron solicitudes con los filtros aplicados'
                  : isHR 
                    ? 'No hay solicitudes pendientes'
                    : 'No tienes solicitudes registradas'
                }
              </p>
              {!isHR && !searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setShowNewRequestModal(true)}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Crear tu primera solicitud
                </button>
              )}
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
                      <p className="text-gray-600 mb-2">{request.details}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(request.date).toLocaleDateString('es-CL')}
                        </span>
                        {request.companyName && (
                          <span>{request.companyName}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {isHR && request.status === RequestStatus.PENDING && (
                        <>
                          <button
                            onClick={() => handleUpdateRequestStatus(request.id, RequestStatus.APPROVED)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Aprobar"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleUpdateRequestStatus(request.id, RequestStatus.REJECTED)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Rechazar"
                          >
                            <AlertCircle size={16} />
                          </button>
                        </>
                      )}
                      <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Solicitud</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreateRequest({
                type: formData.get('type'),
                details: formData.get('details'),
                companyName: formData.get('companyName')
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Solicitud</label>
                  <select
                    name="type"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Selecciona tipo</option>
                    <option value={RequestType.TIME_OFF}>Día Libre (TPP)</option>
                    <option value={RequestType.CERTIFICATE}>Constancia Laboral</option>
                    <option value={RequestType.RECOMMENDATION}>Recomendación Laboral</option>
                    <option value={RequestType.REFERENCE}>Referencia Laboral</option>
                    <option value={RequestType.CONSULTATION}>Consulta</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detalles</label>
                  <textarea
                    name="details"
                    required
                    rows={4}
                    placeholder="Describe los detalles de tu solicitud..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <input
                    name="companyName"
                    type="text"
                    required
                    placeholder="Nombre de tu empresa"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}