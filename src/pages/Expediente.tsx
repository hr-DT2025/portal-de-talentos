import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { expedienteService, profileService } from '../services/supabaseService';
import PasswordModal from '../components/PasswordModal';
import Toast from '../components/Toast';
import { Info, Upload, FileText, CheckCircle, AlertCircle, Save, Loader2 } from 'lucide-react';

export default function Expediente() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Determina si es "Guardar" o "Actualizar"
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<any>(null);

  // Estado adicional para la estructura de carpetas (Nombre Empresa / Nombre Usuario)
  const [folderInfo, setFolderInfo] = useState({ companyName: '', userName: '' });

  // Datos del Formulario
  const [formData, setFormData] = useState({
    fecha_nacimiento: '',
    pais_residencia: '',
    nacionalidad: '',
    direccion: '',
    estado_civil: '',
    contacto_nombre: '',
    contacto_relacion: '',
    contacto_telefono: '',
    medio_pago: '',
    departamento: '',
    cargo: '',
    linkedin_url: ''
  });

  // Archivos seleccionados (File objects)
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    documento_identidad: null,
    recibo_servicio: null,
    constancia_estudios: null,
    qr_monedero: null,
    foto_actualizada: null
  });

  // Estado de archivos ya subidos (URLs o flags)
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Cargar perfil con datos de empresa para la estructura de carpetas
      const profile = await profileService.getProfileWithEmpresa(user!.id);
      
      // 2. Cargar expediente existente
      const expediente = await expedienteService.getById(user!.id);

      // Guardamos info para las carpetas del Storage
      setFolderInfo({
        companyName: profile?.empresas?.nombre || 'General',
        userName: profile?.full_name || 'Colaborador'
      });

      if (expediente) {
        setIsEditing(true); // Ya existe data
        setFormData({
          fecha_nacimiento: expediente.fecha_nacimiento || '',
          pais_residencia: expediente.pais_residencia || '',
          nacionalidad: expediente.nacionalidad || '',
          direccion: expediente.direccion || '',
          estado_civil: expediente.estado_civil || '',
          contacto_nombre: expediente.contacto_nombre || '',
          contacto_relacion: expediente.contacto_relacion || '',
          contacto_telefono: expediente.contacto_telefono || '',
          medio_pago: expediente.medio_pago || '',
          departamento: expediente.departamento || profile?.area || '',
          cargo: expediente.cargo || profile?.job_title || '',
          linkedin_url: expediente.linkedin_url || ''
        });
        
        // Marcar qué archivos ya existen
        setUploadedFiles({
          documento_identidad: !!expediente.documento_identidad_url,
          recibo_servicio: !!expediente.recibo_servicio_url,
          constancia_estudios: !!expediente.constancia_estudios_url,
          qr_monedero: !!expediente.qr_monedero_url,
          foto_actualizada: !!expediente.foto_actualizada_url,
        });
      } else {
        // Pre-llenar con perfil si no hay expediente
        setFormData(prev => ({
          ...prev,
          departamento: profile?.area || '',
          cargo: profile?.job_title || ''
        }));
      }
    } catch (error) {
      console.error(error);
      setToast({ message: 'Error cargando datos', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [fieldName]: e.target.files[0] });
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setShowModal(true); // Pedir contraseña
    } else {
      processSave(); // Guardar directo primera vez
    }
  };

  const processSave = async (password?: string) => {
    setSaving(true);
    setToast(null);

    try {
      // 1. Si hay password (actualización), verificarlo
      if (password) {
        await expedienteService.verifyPassword(user!.email, password);
      }

      // 2. Subir Archivos (si hay nuevos seleccionados)
      const fileUrls: any = {};
      const fileKeys = Object.keys(files);

      for (const key of fileKeys) {
        const file = files[key as keyof typeof files];
        if (file) {
          // Subir y obtener path, enviando la estructura de carpetas
          const path = await expedienteService.uploadDocument(
            user!.id, 
            file, 
            key,
            { 
              company: folderInfo.companyName, 
              userName: folderInfo.userName 
            }
          );
          fileUrls[`${key}_url`] = path;
        }
      }

      // 3. Preparar metadata comment
      const comment = `Datos actualizados por el colaborador el ${new Date().toLocaleDateString()}`;

      // 4. Guardar en Base de Datos
      await expedienteService.save(
        user!.id, 
        { ...formData, ...fileUrls }, 
        comment
      );

      setToast({ message: 'Expediente guardado exitosamente', type: 'success' });
      setShowModal(false);
      setIsEditing(true);
      loadData(); // Recargar para ver estado actualizado
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || 'Error al guardar', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Componente Auxiliar para Inputs de Archivo
  const FileUploadField = ({ label, name, accept, tooltip, uploaded }: any) => (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-white transition-colors">
      <div className="flex justify-between items-start mb-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {label}
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute left-0 bottom-6 w-64 bg-gray-800 text-white text-xs p-2 rounded hidden group-hover:block z-10">
              {tooltip} <br/> Formatos: {accept} (Max 5MB)
            </div>
          </div>
        </label>
        {uploaded && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Cargado</span>}
        {files[name as keyof typeof files] && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Seleccionado</span>}
      </div>
      <div className="relative">
        <input 
          type="file" 
          name={name}
          accept={accept}
          onChange={(e) => handleFileChange(e, name)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-topacio file:text-white hover:file:bg-topacio-600"
        />
      </div>
    </div>
  );

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-topacio w-8 h-8" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <PasswordModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onConfirm={processSave} 
        loading={saving}
      />
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-onix">Mi Expediente Digital</h1>
          <p className="text-gray-500">Completa tu ficha de colaborador. Asegúrate de que los documentos sean legibles.</p>
        </div>

        <form onSubmit={handlePreSubmit} className="space-y-8">
          
          {/* SECCIÓN 1: DATOS PERSONALES */}
          <div>
            <h3 className="text-lg font-semibold text-topacio mb-4 border-b pb-2">Datos Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                <input type="date" name="fecha_nacimiento" required value={formData.fecha_nacimiento} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg focus:ring-topacio" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País de Residencia</label>
                <input type="text" name="pais_residencia" required value={formData.pais_residencia} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg focus:ring-topacio px-3 py-2 border" placeholder="Ej: Venezuela" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
                <input type="text" name="nacionalidad" required value={formData.nacionalidad} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg focus:ring-topacio px-3 py-2 border" placeholder="Ej: Venezolana" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Habitación</label>
                <input type="text" name="direccion" required value={formData.direccion} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg focus:ring-topacio px-3 py-2 border" placeholder="Calle, Número, Ciudad" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
                <select name="estado_civil" required value={formData.estado_civil} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg focus:ring-topacio px-3 py-2 border bg-white">
                  <option value="">Seleccionar...</option>
                  <option value="Soltero">Soltero/a</option>
                  <option value="Casado">Casado/a</option>
                  <option value="Divorciado">Divorciado/a</option>
                  <option value="Viudo">Viudo/a</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CONTACTO DE EMERGENCIA */}
          <div>
            <h3 className="text-lg font-semibold text-topacio mb-4 border-b pb-2">Contacto de Emergencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input type="text" name="contacto_nombre" required value={formData.contacto_nombre} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg focus:ring-topacio px-3 py-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relación / Parentesco</label>
                <input type="text" name="contacto_relacion" required value={formData.contacto_relacion} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg focus:ring-topacio px-3 py-2 border" placeholder="Ej: Madre, Esposo..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="tel" name="contacto_telefono" required value={formData.contacto_telefono} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg focus:ring-topacio px-3 py-2 border" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: DATOS LABORALES */}
          <div>
            <h3 className="text-lg font-semibold text-topacio mb-4 border-b pb-2">Información Laboral</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <input type="text" name="departamento" value={formData.departamento} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg bg-gray-100 px-3 py-2 border" readOnly />
                <p className="text-xs text-gray-400 mt-1">Si este dato es incorrecto, edítalo en tu perfil.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input type="text" name="cargo" value={formData.cargo} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg bg-gray-100 px-3 py-2 border" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Perfil LinkedIn</label>
                <input type="url" name="linkedin_url" value={formData.linkedin_url} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg focus:ring-topacio px-3 py-2 border" placeholder="https://linkedin.com/in/usuario" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medio de Pago Principal</label>
                <select name="medio_pago" required value={formData.medio_pago} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg focus:ring-topacio px-3 py-2 border bg-white">
                  <option value="">Seleccionar...</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Monedero Virtual">Monedero Virtual (Binance/Zinli)</option>
                  <option value="Efectivo">Efectivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: DOCUMENTOS */}
          <div>
            <h3 className="text-lg font-semibold text-topacio mb-4 border-b pb-2">Carga de Documentos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <FileUploadField 
                label="Documento de Identidad" 
                name="documento_identidad"
                accept=".pdf,.jpg,.jpeg,.png"
                tooltip="Cédula, DNI o Pasaporte vigente. Debe verse claro."
                uploaded={uploadedFiles.documento_identidad}
              />

              <FileUploadField 
                label="Recibo de Servicio Público" 
                name="recibo_servicio"
                accept=".pdf,.jpg,.jpeg,.png"
                tooltip="Luz, Agua, Internet o RIF donde aparezca tu dirección."
                uploaded={uploadedFiles.recibo_servicio}
              />

              <FileUploadField 
                label="Constancia de Estudios (Opcional)" 
                name="constancia_estudios"
                accept=".pdf,.jpg,.jpeg,.png"
                tooltip="Último título obtenido o constancia actual."
                uploaded={uploadedFiles.constancia_estudios}
              />

              <FileUploadField 
                label="Foto Actualizada" 
                name="foto_actualizada"
                accept=".jpg,.jpeg,.png"
                tooltip="Foto tipo carnet fondo blanco o neutro."
                uploaded={uploadedFiles.foto_actualizada}
              />

              {/* Condicional: Solo si el método de pago es Monedero Virtual */}
              {formData.medio_pago === 'Monedero Virtual' && (
                <div className="md:col-span-2 animate-fadeIn">
                  <FileUploadField 
                    label="QR de Monedero Virtual" 
                    name="qr_monedero"
                    accept=".jpg,.jpeg,.png"
                    tooltip="Captura del QR de tu Wallet para recibir pagos."
                    uploaded={uploadedFiles.qr_monedero}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
             <button
              type="submit"
              disabled={saving}
              className="flex items-center px-8 py-3 bg-topacio text-white font-bold rounded-xl hover:bg-topacio-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-5 h-5" />}
              {isEditing ? 'Actualizar Datos' : 'Guardar Datos'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
