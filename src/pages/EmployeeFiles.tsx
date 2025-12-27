import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { dataService } from '../services/dataService';
import { Company, User, EmployeeFile } from '../types';
import { 
  Building, 
  Users, 
  Folder, 
  FileText, 
  Upload, 
  Download, 
  Search,
  Eye,
  ChevronRight,
  Plus
} from 'lucide-react';

export default function EmployeeFiles() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [employeeFiles, setEmployeeFiles] = useState<EmployeeFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await dataService.getCompanies();
        setCompanies(companiesData);
      } catch (error) {
        console.error('Error loading companies:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany && selectedEmployee) {
      const loadEmployeeFiles = async () => {
        try {
          const files = await dataService.getEmployeeFiles(selectedEmployee.id, selectedCompany.id);
          setEmployeeFiles(files);
        } catch (error) {
          console.error('Error loading employee files:', error);
        }
      };
      loadEmployeeFiles();
    }
  }, [selectedCompany, selectedEmployee]);

  const handleFileUpload = async (fileData: any) => {
    try {
      const newFile = await dataService.uploadEmployeeFile({
        userId: selectedEmployee?.id || '',
        companyId: selectedCompany?.id || '',
        fileName: fileData.fileName,
        fileType: fileData.fileType,
        fileUrl: fileData.fileUrl,
        uploadedBy: user?.id || ''
      });
      setEmployeeFiles([...employeeFiles, newFile]);
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📁';
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Expedientes de Colaboradores</h1>
          <p className="text-gray-500">Gestiona los documentos de los colaboradores por empresa</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Companies List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building className="text-indigo-500" size={20} />
              Empresas
            </h3>
            
            <div className="space-y-2">
              {filteredCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => {
                    setSelectedCompany(company);
                    setSelectedEmployee(null);
                    setEmployeeFiles([]);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedCompany?.id === company.id
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-gray-500">{company.collaborators.length} colaboradores</p>
                    </div>
                    <ChevronRight size={16} />
                  </div>
                </button>
              ))}
              
              {filteredCompanies.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No se encontraron empresas
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Employees and Files */}
        <div className="lg:col-span-2">
          {selectedCompany ? (
            <div className="space-y-6">
              {/* Employees List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="text-indigo-500" size={20} />
                    Colaboradores - {selectedCompany.name}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedCompany.collaborators.map((employee) => (
                    <button
                      key={employee.id}
                      onClick={() => setSelectedEmployee(employee)}
                      className={`p-4 rounded-lg border transition-colors ${
                        selectedEmployee?.id === employee.id
                          ? 'bg-indigo-50 border-indigo-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={employee.avatarUrl}
                          alt={employee.fullName}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{employee.fullName}</p>
                          <p className="text-sm text-gray-500">{employee.role}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {selectedCompany.collaborators.length === 0 && (
                    <p className="text-gray-500 text-sm col-span-2 text-center py-8">
                      No hay colaboradores en esta empresa
                    </p>
                  )}
                </div>
              </div>

              {/* Employee Files */}
              {selectedEmployee && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Folder className="text-indigo-500" size={20} />
                      Expediente - {selectedEmployee.fullName}
                    </h3>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Subir Archivo
                    </button>
                  </div>

                  <div className="space-y-3">
                    {employeeFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFileIcon(file.fileType)}</span>
                          <div>
                            <p className="font-medium text-gray-900">{file.fileName}</p>
                            <p className="text-sm text-gray-500">
                              Subido el {new Date(file.uploadedAt).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Eye size={16} />
                          </button>
                          <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {employeeFiles.length === 0 && (
                      <div className="text-center py-8">
                        <Folder className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-500">No hay archivos en el expediente</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Sube el primer documento para este colaborador
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Building className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una empresa</h3>
              <p className="text-gray-500">
                Elige una empresa de la lista para ver sus colaboradores y expedientes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subir Archivo</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleFileUpload({
                fileName: formData.get('fileName'),
                fileType: formData.get('fileType'),
                fileUrl: '#', // In real app, this would be the actual file URL
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Archivo</label>
                  <input
                    name="fileName"
                    type="text"
                    required
                    placeholder="Contrato 2024.pdf"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                  <select
                    name="fileType"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Selecciona tipo</option>
                    <option value="pdf">PDF</option>
                    <option value="doc">Word</option>
                    <option value="xls">Excel</option>
                    <option value="jpg">Imagen</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                  <p className="text-sm text-gray-600">Arrastra un archivo aquí o haz clic para seleccionar</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, XLS, JPG hasta 10MB</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Subir Archivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
