import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Configuración de Supabase - Proyecto: fwhxhweeqmjqgrubboep
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fwhxhweeqmjqgrubboep.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('⚠️ VITE_SUPABASE_ANON_KEY no está configurada. Agrega la Anon Key en el archivo .env');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey || '');
