import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User, Role } from './types';
import LoginCollaborator from './pages/LoginCollaborator';
import LoginHR from './pages/LoginHR';
import Dashboard from './pages/Dashboard';
import DashboardHR from './pages/DashboardHR';
import Requests from './pages/Requests';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import EmployeeFiles from './pages/EmployeeFiles';
import Sidebar from './components/Sidebar';
import SessionTimeoutModal from './components/SessionTimeoutModal';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { Menu, X } from 'lucide-react';

// Tiempo de inactividad: 20 minutos (en milisegundos)
const SESSION_TIMEOUT = 20 * 60 * 1000;
// Tiempo de advertencia: 1 minuto antes del timeout
const WARNING_TIME = 60 * 1000;

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

// --- Layout Component with Session Timeout ---
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  // Manejar timeout de sesión
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

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Session Timeout Modal */}
      <SessionTimeoutModal
        isOpen={showTimeoutModal}
        onExtend={handleExtendSession}
        onLogout={handleTimeout}
        remainingSeconds={60}
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
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

      {/* Main Content */}
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

// --- Protected Route Component ---
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: Role }> = ({ 
  children, 
  allowedRole 
}) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// --- Main App ---
export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    // Recuperar sesión de localStorage
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
          {/* Login Routes */}
          <Route path="/" element={<LoginCollaborator />} />
          <Route path="/hr-login" element={<LoginHR />} />
          
          {/* Collaborator Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/requests" element={
            <ProtectedRoute>
              <Layout><Requests /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/chat" element={
            <ProtectedRoute>
              <Layout><Chat /></Layout>
            </ProtectedRoute>
          } />
          
          {/* HR Routes */}
          <Route path="/hr-dashboard" element={
            <ProtectedRoute allowedRole={Role.HR}>
              <Layout><DashboardHR /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/companies" element={
            <ProtectedRoute allowedRole={Role.HR}>
              <Layout><DashboardHR /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/employees" element={
            <ProtectedRoute allowedRole={Role.HR}>
              <Layout><DashboardHR /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/files" element={
            <ProtectedRoute allowedRole={Role.HR}>
              <Layout><EmployeeFiles /></Layout>
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
}