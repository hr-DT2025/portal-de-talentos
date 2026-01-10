import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Calendar, Briefcase, Save, Loader2, Camera, CreditCard } from 'lucide-react';
import { useAuth } from '../App';
import { profileService } from '../services/supabaseService';
import Toast from '../components/Toast';

export default function Profile() {
  const { user } = useAuth();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulario
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',           
    role: '',            
    job_title: '',       
    area: '',            // Ahora editable
    telefono_whatsapp: '',
    correo_personal: '',
    tipo_identificacion: '',
    numero_identificacion: '',
    fecha_ingreso: '',   // Ahora editable
    avatar_url: ''
  });

  // Cargar datos
  useEffect(() => {
    if (user?.id) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const profile = await profileService.getById(user.id);

      if (profile) {
        setFormData({
          full_name: profile.full_name || '',
          email: profile.email || '',
          role: profile.role || '',
          job_title: profile.job_title || profile.rol_puesto || '',
          area: profile.area || '',
          telefono_whatsapp: profile.telefono_whatsapp || '',
          correo_personal: profile.correo_personal || '',
          tipo_identificacion: profile.tipo_identificacion || '',
          numero_identificacion: profile.numero_identificacion || '',
          fecha_ingreso: profile.fecha_ingreso || '',
          avatar_url: profile.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
      setToast({ message: 'Error al cargar datos', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios de texto
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejar subida de foto
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    setUploadingImg(true);
    const file = event.target.files[0];

    try {
      if (!user?.id) throw new Error("No sesión");
      
      // 1. Subir imagen
      const publicUrl = await profileService.uploadAvatar(user.id, file);
      
      // 2. Actualizar estado local
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      // 3. Guardar URL en base de datos inmediatamente
      await profileService.updateProfile(user.id, { avatar_url: publicUrl });
      
      setToast({ message: 'Foto actualizada correctamente', type: 'success' });
    } catch (error: any) {
      console.error('Error subiendo imagen:', error);
      setToast({ message: 'Error al subir imagen: ' + error.message, type: 'error' });
    } finally {
      setUploadingImg(false);
    }
  };

  // Guardar todo el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      if (!user?.id) throw new Error("No hay sesión activa");

      await profileService.updateProfile(user.id, {
        full_name: formData.full_name,
        telefono_whatsapp: formData.telefono_whatsapp,
        correo_personal: formData.correo_personal,
        tipo_identificacion: formData.tipo_identificacion,
        numero_identificacion: formData.numero_identificacion,
        area: formData.area,               // Guardamos departamento
        fecha_ingreso: formData.fecha_ingreso // Guardamos fecha
      });

      setToast({ message: 'Perfil actualizado correctamente', type: 'success' });
    } catch (error) {
      console.error(error);
      setToast({ message: 'Error al actualizar perfil', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-topacio" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <h1 className="text-2xl font-bold text-onix">Mi Perfil</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* === COLUMNA IZQUIERDA (Datos Laborales y Foto) === */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Tarjeta de Foto y Nombre */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="relative inline-block">
              <div className="h-32 w-32 rounded-full bg-topacio/10 flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg overflow-hidden relative">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-topacio">
                    {formData.full_name?.charAt(0) || user?.fullName?.charAt(0) || 'U'}
                  </span>
                )}
                {uploadingImg && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" />
                  </div>
                )}
              </div>
              
              {/* Botón Cámara (Input File Oculto) */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImg}
                className="absolute bottom-4 right-0 p-2 bg-onix text-white rounded-full hover:bg-gray-800 transition-colors shadow-md disabled:opacity-50"
              >
                <Camera size={16} />
              </button>
            </div>
            
            <h2 className="text-xl font-bold text-gray-800">{formData.full_name || 'Usuario'}</h2>
            <p className="text-topacio font-medium">{formData.job_title || 'Sin Cargo'}</p>
            <p className="text-sm text-gray-500 mt-1">{formData.email}</p>
          </div>

          {/* Tarjeta de Información Laboral (Ahora EDITABLE) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-topacio" />
              Información Laboral
            </h3>
            <div className="space-y-4">
              
              {/* Departamento Editable */}
              <div className="group">
                <label className="text-xs text-gray-400 uppercase font-bold">Departamento / Área</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="Ej: Marketing"
                  className="w-full mt-1 px-2 py-1 -mx-2 rounded text-gray-700 font-medium border border-transparent hover:border-gray-200 focus:border-topacio focus:bg-gray-50 focus:outline-none transition-all placeholder-gray-300"
                />
              </div>

              {/* Fecha Ingreso Editable */}
              <div className="group">
                <label className="text-xs text-gray-400 uppercase font-bold">Fecha de Ingreso</label>
                <div className="flex items-center text-gray-700 mt-1">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <input
                    type="date"
                    name="fecha_ingreso"
                    value={formData.fecha_ingreso}
                    onChange={handleChange}
                    className="bg-transparent border-none p-0 text-gray-700 font-medium focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase font-bold">Rol de Sistema</label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1 block w-max">
                  {formData.role || 'Colaborador'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* === COLUMNA DERECHA (Información Personal) === */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Información Personal</h3>
              <button 
                type="submit" 
                disabled={saving}
                className="flex items-center px-4 py-2 bg-topacio text-white rounded-lg hover:bg-topacio-600 transition-colors disabled:opacity-50 text-sm font-medium shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar Cambios
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="pl-10 w-full rounded-lg border-gray-300 focus:ring-topacio focus:border-topacio transition-shadow" placeholder="Tu nombre completo" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="tel" name="telefono_whatsapp" value={formData.telefono_whatsapp} onChange={handleChange} className="pl-10 w-full rounded-lg border-gray-300 focus:ring-topacio focus:border-topacio" placeholder="+58 412 1234567" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Personal</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="email" name="correo_personal" value={formData.correo_personal} onChange={handleChange} className="pl-10 w-full rounded-lg border-gray-300 focus:ring-topacio focus:border-topacio" placeholder="personal@gmail.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Identificación</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select name="tipo_identificacion" value={formData.tipo_identificacion} onChange={handleChange} className="pl-10 w-full rounded-lg border-gray-300 focus:ring-topacio focus:border-topacio bg-white">
                    <option value="">Seleccionar...</option>
                    <option value="DNI">DNI / Cédula</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="RUT">RUT / RIF</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Núm. Identificación</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" name="numero_identificacion" value={formData.numero_identificacion} onChange={handleChange} className="pl-10 w-full rounded-lg border-gray-300 focus:ring-topacio focus:border-topacio" placeholder="12345678" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
