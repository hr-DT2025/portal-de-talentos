import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Company, Request, RequestStatus, RequestType } from '../types';
import { 
  Building, 
  Users, 
  FileText, 
  Plus, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  MessageSquare,
  FolderOpen
} from 'lucide-react';

export default function DashboardHR() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesData, requestsData] = await Promise.all([
          dataService.getCompanies(),
          dataService.getAllRequests()
        ]);
        setCompanies(companiesData);
        setRequests(requestsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCreateCompany = async (companyData: any) => {
    try {
      const newCompany = await dataService.createCompany(companyData);
      setCompanies([...companies, newCompany]);
      setShowNewCompanyModal(false);
    } catch (error) {
      console.error('Error creating company:', error);
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
      case RequestStatus.APPROVED: return 'text-green-600 bg-green-50';
      case RequestStatus.REJECTED: return 'text-red-600 bg-red-50';
      case RequestStatus.IN_PROGRESS: return 'text-blue-600 bg-blue-50';
      default: return 'text-yellow-600 bg-yellow-50';
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

  const getRequestStats = () => {
    const pending = requests.filter(r => r.status === RequestStatus.PENDING).length;
    const approved = requests.filter(r => r.status === RequestStatus.APPROVED).length;
    const inProgress = requests.filter(r => r.status === RequestStatus.IN_PROGRESS).length;
    const rejected = requests.filter(r => r.status === RequestStatus.REJECTED).length;
    
    return { pending, approved, inProgress, rejected, total: requests.length };
  };

  const stats = getRequestStats();

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
          <h1 className="text-2xl font-bold text-gray-900">Panel de RRHH</h1>
          <p className="text-gray-500">Gestiona empresas, colaboradores y solicitudes</p>
        </div>
        <button
          onClick={() => setShowNewCompanyModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Empresa
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Empresas</p>
              <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Building className="text-indigo-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Colaboradores</p>
              <p className="text-2xl font-bold text-gray-900">
                {companies.reduce((acc, company) => acc + company.collaborators.length, 0)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Solicitudes Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Solicitudes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <FileText className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Companies List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Building className="text-indigo-500" size={20} />
              Empresas Gestionadas
            </h3>
            <button
              onClick={() => setShowNewCompanyModal(true)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Ver todas
            </button>
          </div>

          <div className="space-y-4">
            {companies.slice(0, 3).map((company) => (
              <div 
                key={company.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors cursor-pointer"
                onClick={() => setSelectedCompany(company)}
              >
                <div>
                  <h4 className="font-medium text-gray-900">{company.name}</h4>
                  <p className="text-sm text-gray-500">{company.industry} • {company.collaborators.length} colaboradores</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Eye size={16} />
                  </button>
                  <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <FolderOpen size={16} />
                  </button>
                </div>
              </div>
            ))}
            {companies.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">
                No hay empresas registradas aún
              </p>
            )}
          </div>
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="text-indigo-500" size={20} />
              Solicitudes Recientes
            </h3>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              Ver todas
            </button>
          </div>

          <div className="space-y-4">
            {requests.slice(0, 4).map((request) => (
              <div key={request.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{request.type}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{request.details}</p>
                    <p className="text-xs text-gray-500">
                      {request.companyName} • {new Date(request.date).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  {request.status === RequestStatus.PENDING && (
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleUpdateRequestStatus(request.id, RequestStatus.APPROVED)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Aprobar"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => handleUpdateRequestStatus(request.id, RequestStatus.REJECTED)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Rechazar"
                      >
                        <AlertCircle size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">
                No hay solicitudes pendientes
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="text-indigo-500" size={20} />
          Acciones Rápidas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-left">
            <Building className="text-indigo-600" size={20} />
            <div>
              <p className="font-medium text-gray-900">Nueva Empresa</p>
              <p className="text-sm text-gray-600">Registrar nueva compañía</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
            <Users className="text-green-600" size={20} />
            <div>
              <p className="font-medium text-gray-900">Gestionar Colaboradores</p>
              <p className="text-sm text-gray-600">Ver y editar colaboradores</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
            <MessageSquare className="text-purple-600" size={20} />
            <div>
              <p className="font-medium text-gray-900">Mensajes</p>
              <p className="text-sm text-gray-600">Chat con colaboradores</p>
            </div>
          </button>
        </div>
      </div>

      {/* New Company Modal */}
      {showNewCompanyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Empresa</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreateCompany({
                name: formData.get('name'),
                businessId: formData.get('businessId'),
                industry: formData.get('industry'),
                address: formData.get('address'),
                phone: formData.get('phone'),
                contactEmail: formData.get('contactEmail'),
                hrManagerId: user?.id
              });
            }}>
              <div className="space-y-4">
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Nombre de la empresa"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  name="businessId"
                  type="text"
                  required
                  placeholder="RUT"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  name="industry"
                  type="text"
                  required
                  placeholder="Industria"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  name="address"
                  type="text"
                  required
                  placeholder="Dirección"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder="Teléfono"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  name="contactEmail"
                  type="email"
                  required
                  placeholder="Email de contacto"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewCompanyModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Crear Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

