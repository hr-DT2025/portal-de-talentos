// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Role } from '../types';
import { profileService } from '../services/supabaseService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Función auxiliar para formatear los datos crudos de la BD al tipo User de tu app
  const formatUser = async (sessionUser: any): Promise<User | null> => {
    if (!sessionUser) return null;

    try {
      // 1. Obtenemos el perfil completo desde la tabla 'profiles'
      const profile = await profileService.getById(sessionUser.id);
      
      // Si no hay perfil, devolvemos un usuario básico
      if (!profile) {
          return {
              id: sessionUser.id,
              email: sessionUser.email!,
              fullName: sessionUser.user_metadata?.full_name || 'Usuario',
              role: (sessionUser.user_metadata?.role as Role) || Role.COLLABORATOR,
              department: 'No asignado',
              leader: 'No asignado',
              startDate: new Date().toISOString(),
              ptoTotal: 0,
              ptoTaken: 0,
              skills: []
          };
      }

      // 2. Mapeamos los datos de la BD a tu interfaz User
      return {
        id: sessionUser.id,
        email: sessionUser.email!,
        fullName: profile.full_name || sessionUser.user_metadata?.full_name || 'Sin nombre',
        role: (profile.role as Role) || Role.COLLABORATOR,
        
        // Datos adicionales
        avatarUrl: profile.avatar_url,
        department: profile.area || 'General',
        leader: 'Pendiente', // Esto podrías traerlo de registro_colaboradores si lo necesitas
        startDate: profile.fecha_ingreso || new Date().toISOString(),
        ptoTotal: 15, // Valor por defecto o traer de BD
        ptoTaken: 0,
        skills: [],
        
        // Campos específicos para lógica de negocio
        empresaId: profile.empresa_id,
        managedCompanies: [] // Si es HRBP, aquí irían sus empresas
      };

    } catch (error) {
      console.error("Error formateando usuario:", error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // A. Verificar sesión inicial
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const formattedUser = await formatUser(session.user);
          if (mounted) setUser(formattedUser);
        }
      } catch (err) {
        console.error('Error inicializando sesión:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // B. Escuchar cambios en tiempo real (Login, Logout, Auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(true);
        const userData = await formatUser(session.user);
        setUser(userData);
        setLoading(false);
      } 
      else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
      else if (event === 'TOKEN_REFRESHED' && session?.user) {
         // Opcional: refrescar datos del usuario si es necesario
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};