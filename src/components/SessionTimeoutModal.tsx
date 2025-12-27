import React, { useState, useEffect } from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onExtend: () => void;
  onLogout: () => void;
  remainingSeconds: number;
}

export default function SessionTimeoutModal({
  isOpen,
  onExtend,
  onLogout,
  remainingSeconds
}: SessionTimeoutModalProps) {
  const [countdown, setCountdown] = useState(remainingSeconds);

  useEffect(() => {
    setCountdown(remainingSeconds);
  }, [remainingSeconds]);

  useEffect(() => {
    if (!isOpen || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  useEffect(() => {
    if (countdown === 0 && isOpen) {
      onLogout();
    }
  }, [countdown, isOpen, onLogout]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sesión por expirar
          </h2>
          
          <p className="text-gray-600 mb-4">
            Tu sesión se cerrará automáticamente por inactividad en:
          </p>
          
          <div className="text-5xl font-bold text-topacio mb-6">
            {countdown}s
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            ¿Deseas continuar trabajando?
          </p>
          
          <div className="flex space-x-4 w-full">
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut size={18} />
              <span>Cerrar sesión</span>
            </button>
            
            <button
              onClick={onExtend}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-topacio text-white rounded-lg hover:bg-topacio/90 transition-colors"
            >
              <RefreshCw size={18} />
              <span>Continuar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
