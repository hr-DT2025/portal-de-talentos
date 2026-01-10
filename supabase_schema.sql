-- =====================================================
-- SCHEMA PARA PORTAL HR - Supabase
-- Ejecuta este script en el SQL Editor de Supabase
-- https://supabase.com/dashboard/project/fwhxhweeqmjqgrubboep/sql
-- =====================================================

-- 1. Tabla de perfiles (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'Colaborador' CHECK (role IN ('Colaborador', 'HR', 'Admin')),
  empresa_id UUID REFERENCES public.empresas(id),
  area TEXT,
  rol_puesto TEXT,
  fecha_ingreso DATE,
  tipo_identificacion TEXT,
  numero_identificacion TEXT,
  correo_personal TEXT,
  telefono_whatsapp TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de empresas
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  nit_identificacion TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de solicitudes
CREATE TABLE IF NOT EXISTS public.solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  tipo TEXT NOT NULL,
  estatus TEXT DEFAULT 'Pendiente',
  detalles TEXT,
  archivo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de chat
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emisor_id UUID REFERENCES public.profiles(id),
  receptor_id UUID REFERENCES public.profiles(id),
  mensaje TEXT NOT NULL,
  google_thread_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para empresas (lectura pública)
CREATE POLICY "Anyone can view empresas" ON public.empresas
  FOR SELECT USING (true);

-- Políticas para solicitudes
CREATE POLICY "Users can view own solicitudes" ON public.solicitudes
  FOR SELECT USING (auth.uid() = colaborador_id);

CREATE POLICY "Users can create own solicitudes" ON public.solicitudes
  FOR INSERT WITH CHECK (auth.uid() = colaborador_id);

-- Políticas para chat
CREATE POLICY "Users can view own messages" ON public.chat_history
  FOR SELECT USING (auth.uid() = emisor_id OR auth.uid() = receptor_id);

CREATE POLICY "Users can send messages" ON public.chat_history
  FOR INSERT WITH CHECK (auth.uid() = emisor_id);

-- =====================================================
-- TRIGGER: Crear perfil automáticamente al registrarse
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Colaborador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe y crear nuevo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
