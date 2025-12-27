import React, { useState } from 'react';
import { useAuth } from '../App';
import { User as UserIcon, Shield, Briefcase, Mail, Key, Building, Calendar, CreditCard, Phone, User } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    area: user?.area || '',
    idType: user?.idType || '',
    idNumber: user?.idNumber || '',
    personalEmail: user?.personalEmail || '',
    mobilePhone: user?.mobilePhone || ''
  });

  if (!user) return null;

  const handleSave = () => {
    // Aquí iría la lógica para guardar los cambios
    console.log('Guardando cambios:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      area: user?.area || '',
      idType: user?.idType || '',
      idNumber: user?.idNumber || '',
      personalEmail: user?.personalEmail || '',
      mobilePhone: user?.mobilePhone || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Editar Perfil
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full p-1 border-2 border-indigo-100 mb-4">
             <img src={user.avatarUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
          <p className="text-indigo-600 font-medium text-sm">{user.role}</p>
          <div className="mt-6 w-full pt-6 border-t border-gray-100 flex flex-col gap-2 text-sm text-gray-500">
             <div className="flex items-center justify-between">
                <span>Departamento</span>
                <span className="font-medium text-gray-800">{user.department}</span>
             </div>
             <div className="flex items-center justify-between">
                <span>Líder</span>
                <span className="font-medium text-gray-800">{user.leader}</span>
             </div>
             <div className="flex items-center justify-between">
                <span>Fecha de Ingreso</span>
                <span className="font-medium text-gray-800">
                  {new Date(user.startDate).toLocaleDateString('es-CL')}
                </span>
             </div>
          </div>
        </div>

        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Briefcase className="text-indigo-500" size={20} />
              Información Laboral
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    disabled
                    value={user.role}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                  {isEditing ? (
                    <select
                      value={formData.area}
                      onChange={(e) => setFormData({...formData, area: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Selecciona tu área</option>
                      <option value="Tecnología">Tecnología</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Ventas">Ventas</option>
                      <option value="Finanzas">Finanzas</option>
                      <option value="Recursos Humanos">Recursos Humanos</option>
                      <option value="Operaciones">Operaciones</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={user.area || 'No especificado'}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    disabled
                    value={user.department}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    disabled
                    value={new Date(user.startDate).toLocaleDateString('es-CL')}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <User className="text-indigo-500" size={20} />
              Información Personal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Identificación</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                  {isEditing ? (
                    <select
                      value={formData.idType}
                      onChange={(e) => setFormData({...formData, idType: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Selecciona tipo</option>
                      <option value="Cédula de Identidad">Cédula de Identidad</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="Carnet de Extranjería">Carnet de Extranjería</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={user.idType || 'No especificado'}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Identificación</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="12345678-9"
                    />
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={user.idNumber || 'No especificado'}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Personal</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.personalEmail}
                      onChange={(e) => setFormData({...formData, personalEmail: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="correo@personal.com"
                    />
                  ) : (
                    <input
                      type="email"
                      disabled
                      value={user.personalEmail || 'No especificado'}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Móvil / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.mobilePhone}
                      onChange={(e) => setFormData({...formData, mobilePhone: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="+569 1234 5678"
                    />
                  ) : (
                    <input
                      type="tel"
                      disabled
                      value={user.mobilePhone || 'No especificado'}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    disabled
                    value={user.email}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            )}
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Shield className="text-indigo-500" size={20} />
              Seguridad
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
               </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Actualizar Contraseña
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}