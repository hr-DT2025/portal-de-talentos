import React, { useState } from 'react';
import { supabase } from '../lib/supabase'; // Asegúrate de tener configurado tu cliente
import { Building2, Globe, Palette, ShieldCheck, Mail, Phone, User, Save } from 'lucide-react';

const RegistroEmpresa = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    razon_social: '',
    nit_identificacion: '',
    pais_operacion: '',
    direccion_fiscal: '',
    website_url: '',
    google_webhook_url: '',
    color_primario: '#37b1e3', // Default Topacio
    contacto_nombre: '',
    contacto_email: '',
    contacto_telefono: '',
    hrbp_id: '' // Se asigna el código del HRBP logueado
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('empresas')
        .insert([formData]);

      if (error) throw error;
      alert('Empresa registrada exitosamente en el portal.');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-onix">Registro de Nueva Empresa</h1>
          <p className="text-onix-400">Configuración del portal de autogestión y datos legales de Disruptive Talent.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Sección 1: Datos Legales */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center mb-6 text-topacio font-semibold">
              <Building2 className="mr-2" size={20} />
              <h2>Información Legal y Fiscal</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-onix-500 mb-1">Razón Social</label>
                <input required name="razon_social" onChange={handleChange} className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-topacio outline-none transition-all" placeholder="Ej: Servicios Disruptivos S.A.S" />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-onix-500 mb-1">NIT / Identificación Fiscal</label>
                <input required name="nit_identificacion" onChange={handleChange} className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-topacio outline-none transition-all" placeholder="900.XXX.XXX-X" />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-onix-500 mb-1">País de Operación</label>
                <input required name="pais_operacion" onChange={handleChange} className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-topacio outline-none transition-all" placeholder="Ej: Colombia, México..." />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-onix-500 mb-1">Sitio Web</label>
                <input name="website_url" onChange={handleChange} className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-topacio outline-none transition-all" placeholder="https://empresa.com" />
              </div>
              <div className="md:col-span-2 flex flex-col">
                <label className="text-sm font-medium text-onix-500 mb-1">Dirección Fiscal</label>
                <textarea name="direccion_fiscal" onChange={handleChange} rows={2} className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-topacio outline-none transition-all" />
              </div>
            </div>
          </section>

          {/* Sección 2: Personalización y Tech */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center mb-6 text-zafiro font-semibold">
              <Palette className="mr-2" size={20} />
              <h2>Configuración del Portal (Branding)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-onix-500 mb-1">Color Primario de la Marca</label>
                <div className="flex gap-2">
                  <input type="color" name="color_primario" value={formData.color_primario} onChange={handleChange} className="h-10 w-20 rounded cursor-pointer border-none" />
                  <input type="text" value={formData.color_primario} readOnly className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm" />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-onix-500 mb-1 text-turmalina">Webhook Google Chat (Notificaciones)</label>
                <input name="google_webhook_url" onChange={handleChange} className="border border-turmalina/30 rounded-lg p-2 focus:ring-2 focus:ring-turmalina outline-none transition-all" placeholder="https://chat.googleapis.com/v1/spaces/..." />
              </div>
            </div>
          </section>

          {/* Sección 3: Contacto Principal */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center mb-6 text-jade font-semibold">
              <User className="mr-2" size={20} />
              <h2>Punto de Contacto Operativo</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-onix-500 mb-1">Nombre Completo</label>
                <input required name="contacto_nombre" onChange={handleChange} className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-topacio outline-none transition-all" />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-onix-500 mb-1">Email Corporativo</label>
                <input required type="email" name="contacto_email" onChange={handleChange} className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-topacio outline-none transition-all" />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-onix-500 mb-1">WhatsApp / Teléfono</label>
                <input required name="contacto_telefono" onChange={handleChange} className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-topacio outline-none transition-all" />
              </div>
            </div>
          </section>

          {/* Botón de Acción */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center px-8 py-3 rounded-lg font-bold text-white transition-all shadow-lg ${
                loading ? 'bg-gray-400' : 'bg-topacio hover:bg-topacio-600 active:scale-95'
              }`}
            >
              {loading ? 'Procesando...' : (
                <>
                  <Save className="mr-2" size={20} />
                  Registrar Empresa y Activar Portal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistroEmpresa;
