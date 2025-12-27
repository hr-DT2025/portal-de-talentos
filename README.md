# Portal HR - Disruptive Talent

Portal de Recursos Humanos para gestión de colaboradores, solicitudes y comunicación interna.

## 🚀 Tecnologías

- **Frontend:** React 18 + TypeScript + Vite
- **Estilos:** TailwindCSS
- **Backend:** Supabase (Auth + Database)
- **Despliegue:** Vercel

## 📋 Requisitos

- Node.js 18+
- Cuenta en Supabase
- Cuenta en Vercel (para despliegue)

## 🔧 Instalación Local

1. Clona el repositorio:
   ```bash
   git clone <tu-repo-url>
   cd nuevo-portal-hr
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   ```bash
   cp .env.example .env
   ```
   
   Edita `.env` con tus credenciales de Supabase:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

4. Ejecuta en desarrollo:
   ```bash
   npm run dev
   ```

## 🌐 Despliegue en Vercel

### Opción 1: Desde GitHub

1. Sube el proyecto a GitHub
2. Ve a [vercel.com](https://vercel.com) e importa el repositorio
3. Configura las variables de entorno en Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Despliega

### Opción 2: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

## 🔐 Variables de Entorno en Vercel

En el dashboard de Vercel, ve a **Settings → Environment Variables** y agrega:

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://fwhxhweeqmjqgrubboep.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Tu Anon Key de Supabase |

## 📁 Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables
├── hooks/          # Custom hooks (useSessionTimeout)
├── lib/            # Configuración de Supabase
├── pages/          # Páginas de la aplicación
├── services/       # Servicios de datos
└── types/          # Tipos TypeScript
```

## ✨ Características

- ✅ Autenticación con Supabase Auth
- ✅ Gestión de colaboradores
- ✅ Sistema de solicitudes
- ✅ Chat interno
- ✅ Timeout de sesión (20 min inactividad)
- ✅ Colores personalizados (Brandbook)

## 🎨 Colores del Brandbook

| Color | HEX | Uso |
|-------|-----|-----|
| Topacio | `#37b1e3` | Primario colaboradores |
| Onix | `#262f3f` | Sidebar, fondos oscuros |
| Turmalina | `#d3376d` | Alertas, logout |
| Jade | `#6de337` | Estados positivos |
| Zafiro | `#3755d3` | Portal RRHH |
