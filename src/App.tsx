import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User, Role } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardHR from './pages/DashboardHR';
import Requests from './pages/Requests';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import EmployeeFiles from './pages/EmployeeFiles';
import Expediente from './pages/Expediente';
import Sidebar from './components/Sidebar';
import SessionTimeoutModal from './components/SessionTimeoutModal';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { Menu, X } from 'lucide-react';

// --- NUEVAS IMPORTACIONES ---
import UpdatePassword from './pages/UpdatePassword'; // Asumí esta importación basada en tu ruta
import LoginCliente from './pages/LoginCliente';       // <--- IMPORTADO
import RegisterCliente from './pages/RegisterCliente'; // <--- IMPORTADO

const SESSION_TIMEOUT = 20 * 60 * 1000;
const WARNING_TIME = 60 * 1000;

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const handleTimeout = useCallback(() => {
    setShowTimeoutModal(false);
    logout();
  }, [logout]);

  const handleWarning = useCallback(() => {
    setShowTimeoutModal(true);
  }, []);

  const { resetTimer } = useSessionTimeout({
    timeout: SESSION_TIMEOUT,
    onTimeout: handleTimeout,
    warningTime: WARNING_TIME,
    onWarning: handleWarning
  });

  const handleExtendSession = useCallback(() => {
    setShowTimeoutModal(false);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <SessionTimeoutModal
        isOpen={showTimeoutModal}
        onExtend={handleExtendSession}
        onLogout={handleTimeout}
        remainingSeconds={60}
      />
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-onix text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-onix-600 lg:hidden">
          <span className="font-bold text-xl">CollabConnect</span>
          <button onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex items-center lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
          <span className="ml-4 font-bold text-lg text-onix">CollabConnect</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

// --- MODIFICADO: Ahora acepta 'allowedRoles' (Array) en lugar de singular ---
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: Role[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/" replace />;
  
  // Si se requieren roles y el usuario no tiene uno de los permitidos, redirigir
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('collabconnect_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('collabconnect_user', JSON.stringify(userData));
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('collabconnect_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <HashRouter>
        <Routes>
          {/* --- Rutas Públicas --- */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/update-password" element={<UpdatePassword />} /> {/* NUEVO */}
          
          {/* --- NUEVAS RUTAS PARA CLIENTES --- */}
          <Route path="/login-cliente" element={<LoginCliente />} />
          <Route path="/registro-cliente" element={<RegisterCliente />} />
          
          {/* --- Rutas Comunes (Dashboard) --- */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={[Role.COLLABORATOR, Role.HR, Role.SUPERADMIN, Role.DIRECTOR]}>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />

          {/* --- RUTA EXPEDIENTE --- */}
          <Route path="/my-file" element={
            <ProtectedRoute allowedRoles={[Role.COLLABORATOR, Role.HR, Role.SUPERADMIN, Role.DIRECTOR]}>
              <Layout><Expediente /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/requests" element={<ProtectedRoute><Layout><Requests /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
          
          {/* Rutas HR y Admin */}
          <Route path="/hr-dashboard" element={
            <ProtectedRoute allowedRoles={[Role.HR, Role.SUPERADMIN, Role.DIRECTOR]}>
              <Layout><DashboardHR /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/companies" element={
            <ProtectedRoute allowedRoles={[Role.HR, Role.SUPERADMIN, Role.DIRECTOR]}>
              <Layout><DashboardHR /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/employees" element={
            <ProtectedRoute allowedRoles={[Role.HR, Role.SUPERADMIN, Role.DIRECTOR]}>
              <Layout><DashboardHR /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/files" element={
            <ProtectedRoute allowedRoles={[Role.HR, Role.SUPERADMIN, Role.DIRECTOR]}>
              <Layout><EmployeeFiles /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
}
