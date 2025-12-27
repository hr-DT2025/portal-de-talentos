import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, User, LogOut, MessageSquare, FolderOpen, Building, Users } from 'lucide-react';
import { useAuth } from '../App';
import { Role } from '../types';

export default function Sidebar() {
  const { logout, user } = useAuth();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-6 py-3 transition-colors ${
      isActive 
        ? 'bg-onix-600 border-r-4 border-topacio text-white' 
        : 'text-onix-200 hover:bg-onix-600 hover:text-white'
    }`;

  const isHR = user?.role === Role.HR;
  const isAdmin = user?.role === Role.ADMIN;

  return (
    <div className="flex flex-col h-full bg-onix">
      <div className="p-6 hidden lg:block">
        <div className="flex items-center space-x-3 text-white mb-6">
          <img src="/logo.png" alt="Disruptive Talent" className="w-10 h-10" />
          <span className="text-xl font-bold tracking-tight">Disruptive Talent</span>
        </div>
        <div className="text-xs text-topacio-300 uppercase tracking-wider font-semibold">
          {isHR ? 'Portal de RRHH' : 'Portal del Colaborador'}
        </div>
      </div>

      <nav className="flex-1 mt-4">
        {/* Common navigation */}
        <NavLink to="/dashboard" className={navClass}>
          <LayoutDashboard size={20} />
          <span>{isHR ? 'Panel RRHH' : 'Inicio'}</span>
        </NavLink>
        
        {/* HR-specific navigation */}
        {isHR && (
          <>
            <NavLink to="/companies" className={navClass}>
              <Building size={20} />
              <span>Empresas</span>
            </NavLink>
            <NavLink to="/employees" className={navClass}>
              <Users size={20} />
              <span>Colaboradores</span>
            </NavLink>
            <NavLink to="/files" className={navClass}>
              <FolderOpen size={20} />
              <span>Expedientes</span>
            </NavLink>
          </>
        )}
        
        {/* Common navigation */}
        <NavLink to="/requests" className={navClass}>
          <FileText size={20} />
          <span>Solicitudes</span>
        </NavLink>
        
        {/* Chat for both roles */}
        <NavLink to="/chat" className={navClass}>
          <MessageSquare size={20} />
          <span>Chat</span>
        </NavLink>
        
        <NavLink to="/profile" className={navClass}>
          <User size={20} />
          <span>Mi Perfil</span>
        </NavLink>
      </nav>

      <div className="p-6 border-t border-onix-600">
        <div className="flex items-center space-x-3 mb-4">
          <img 
            src={user?.avatarUrl} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full border-2 border-topacio"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
            <p className="text-xs text-topacio-300 truncate">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-turmalina hover:bg-turmalina-500 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
