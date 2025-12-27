# Configuración de Supabase para el Portal de Colaboradores

## 📋 Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
VITE_SUPABASE_URL=https://fwhxhweeqmjqgrubboep.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
```

### Obtener la Anon Key de Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia la **anon public** key

## 🔧 Configuración en Vercel

En tu proyecto de Vercel, agrega las siguientes variables de entorno:

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://fwhxhweeqmjqgrubboep.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Tu anon key de Supabase |

## 📊 Esquema de Base de Datos

El portal utiliza las siguientes tablas:

### `profiles`
Almacena información de usuarios/colaboradores.
- `id` - UUID (referencia a auth.users)
- `email` - Correo electrónico
- `full_name` - Nombre completo
- `role` - Rol (Colaborador, HR, Admin)
- `empresa_id` - Referencia a empresa
- `area`, `rol_puesto`, `fecha_ingreso`, etc.

### `empresas`
Almacena información de empresas.
- `id` - UUID
- `nombre` - Nombre de la empresa
- `nit_identificacion` - NIT/RUT
- `logo_url` - URL del logo

### `solicitudes`
Almacena solicitudes de colaboradores.
- `id` - UUID
- `colaborador_id` - Referencia a profiles
- `empresa_id` - Referencia a empresas
- `tipo` - Tipo de solicitud
- `estatus` - Estado (Pendiente, Aprobado, Rechazado, En Proceso)
- `detalles` - Detalles de la solicitud

### `chat_history`
Almacena mensajes de chat.
- `id` - UUID
- `emisor_id` - Referencia a profiles
- `receptor_id` - Referencia a profiles
- `mensaje` - Contenido del mensaje
- `google_thread_id` - ID de thread de Google Chat (opcional)

### `registro_colaboradores`
Datos adicionales de colaboradores (importados de Excel).

### `sesion_usuario`
Sesiones de usuario (para autenticación personalizada).

## 🔐 Políticas de Seguridad (RLS)

Asegúrate de configurar las políticas de Row Level Security en Supabase:

```sql
-- Permitir a usuarios ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Permitir a usuarios actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- HR puede ver todos los perfiles de su empresa
CREATE POLICY "HR can view company profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'HR'
      AND p.empresa_id = profiles.empresa_id
    )
  );

-- Colaboradores pueden ver sus propias solicitudes
CREATE POLICY "Users can view own requests" ON solicitudes
  FOR SELECT USING (colaborador_id = auth.uid());

-- Colaboradores pueden crear solicitudes
CREATE POLICY "Users can create requests" ON solicitudes
  FOR INSERT WITH CHECK (colaborador_id = auth.uid());

-- HR puede ver todas las solicitudes de su empresa
CREATE POLICY "HR can view company requests" ON solicitudes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'HR'
      AND p.empresa_id = solicitudes.empresa_id
    )
  );

-- HR puede actualizar solicitudes de su empresa
CREATE POLICY "HR can update company requests" ON solicitudes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'HR'
      AND p.empresa_id = solicitudes.empresa_id
    )
  );
```

## 🚀 Flujo de Autenticación

1. Usuario ingresa email y contraseña
2. Se autentica con Supabase Auth
3. Se obtiene el perfil del usuario desde la tabla `profiles`
4. Se redirige según el rol (Colaborador → Dashboard, HR → Dashboard HR)

## 📱 Funcionalidades Conectadas

- ✅ **Login/Registro**: Autenticación con Supabase Auth
- ✅ **Perfiles**: CRUD de perfiles de usuario
- ✅ **Empresas**: Listado y gestión de empresas
- ✅ **Solicitudes**: Crear, listar y actualizar solicitudes
- ✅ **Chat**: Mensajería entre colaboradores y HR

## 🔄 Fallback a Mock Data

Si Supabase no está configurado (sin `VITE_SUPABASE_ANON_KEY`), la aplicación utilizará datos mock para desarrollo local.

## 📝 Notas Importantes

1. La URL de Supabase ya está configurada en el código
2. Solo necesitas agregar la `VITE_SUPABASE_ANON_KEY`
3. Asegúrate de habilitar RLS en todas las tablas
4. Configura las políticas de seguridad antes de ir a producción
