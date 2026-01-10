import React, { useState } from 'react';
import { Lock, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  loading: boolean;
}

export default function PasswordModal({ isOpen, onClose, onConfirm, loading }: Props) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-topacio" />
            Seguridad Requerida
          </h3>
          <button onClick={onClose}><X className="text-gray-400 hover:text-red-500" /></button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Para actualizar información sensible de tu expediente, por favor confirma tu contraseña.
        </p>

        <input
          type="password"
          className="w-full border border-gray-300 rounded-lg p-2 mb-6 focus:ring-2 focus:ring-topacio outline-none"
          placeholder="Tu contraseña actual"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
          <button 
            onClick={() => onConfirm(password)}
            disabled={!password || loading}
            className="px-4 py-2 bg-topacio text-white rounded-lg hover:bg-topacio-600 disabled:opacity-50 flex items-center"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : 'Confirmar y Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
