import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Configuración de Supabase - Proyecto: fwhxhweeqmjqgrubboep
// Usamos import.meta.env para Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fwhxhweeqmjqgrubboep.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('⚠️ VITE_SUPABASE_ANON_KEY no está configurada. Agrega la Anon Key en el archivo .env');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey || '');

/**
 * Helper para verificar si Supabase tiene las credenciales necesarias.
 * Esto evita que la app intente llamadas a la API si faltan las keys.
 */
export const isSupabaseConfigured = () => {
  return !!supabaseAnonKey && 
         supabaseAnonKey !== 'your-supabase-anon-key-here' &&
         supabaseAnonKey.length > 0;
};
