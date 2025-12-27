# Integración Real con Google Chat

## 📋 Requisitos

### 1. Variables de Entorno en Vercel
```bash
GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/..."
API_KEY="tu-google-gemini-api-key"  # Opcional para feedback emocional
```

**Nota**: La integración está diseñada para funcionar sin errores incluso si las variables no están configuradas. La aplicación seguirá funcionando localmente y los mensajes se guardarán en el almacenamiento local.

### 2. Configuración en Google Cloud

#### Paso 1: Habilitar Google Chat API
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Chat API**

#### Paso 2: Crear Espacio de Google Chat
1. Abre [Google Chat](https://chat.google.com/)
2. Crea un nuevo espacio: "Soporte RRHH Portal"
3. Añade miembros del equipo de RRHH

#### Paso 3: Configurar Webhook
1. En el espacio de Google Chat, haz clic en el nombre del espacio
2. Ve a "Apps e integraciones"
3. Haz clic en "Añadir webhooks"
4. Crea un nuevo webhook con nombre: "Portal Colaboradores"
5. Copia la URL del webhook

## 🔧 Configuración en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las siguientes variables:

| Variable | Valor | Entornos |
|----------|-------|----------|
| `GOOGLE_CHAT_WEBHOOK_URL` | URL del webhook | Production, Preview, Development |
| `API_KEY` | Google Gemini API Key (opcional) | Production, Preview, Development |

## 📱 Flujo de Mensajes

### Cuando un colaborador envía un mensaje:
1. ✅ Se guarda localmente en la aplicación
2. 📤 Se envía al espacio de Google Chat
3. 🤖 RRHH recibe notificación en tiempo real
4. 💬 RRHH puede responder directamente en Google Chat
5. 🔄 La respuesta se refleja en el portal

### Formato de mensajes en Google Chat:
```
📩 Nuevo mensaje de Juan Pérez:

Necesito ayuda con mis vacaciones

---
Usuario: Juan Pérez
Mensaje: Necesito ayuda con mis vacaciones
Enviado desde Portal de Colaboradores
```

## 🚀 Despliegue

Una vez configuradas las variables, despliega con:
```bash
vercel --prod
```

## 🧪 Pruebas

1. Inicia sesión como colaborador
2. Ve a la sección de Chat
3. Envía un mensaje de prueba
4. Verifica que llegue al espacio de Google Chat
5. Responde en Google Chat y verifica que se refleje en el portal

## 🔍 Solución de Problemas

### Si los mensajes no llegan a Google Chat:
1. Verifica que `GOOGLE_CHAT_WEBHOOK_URL` esté configurada correctamente
2. Revisa la consola del navegador por errores
3. Verifica que el webhook esté activo en Google Chat

### Si la aplicación falla:
1. La aplicación seguirá funcionando sin Google Chat
2. Los mensajes se guardarán localmente
3. Revisa los logs de Vercel para más detalles

## 📚 Documentación Adicional

- [Google Chat API Documentation](https://developers.google.com/chat)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
