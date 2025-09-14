# 🏗️ Arquitectura de Mini Apps - El Patio

## 📋 Resumen

Este documento describe la arquitectura limpia y profesional de las Mini Apps (Web Apps) de Telegram para El Patio.

## 🎯 Objetivos

- **Configuración centralizada** y fácil de mantener
- **Separación clara** entre desarrollo y producción
- **Escalabilidad** para futuras mini apps
- **Mantenibilidad** sin soluciones temporales

## 🏛️ Arquitectura General

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Bot Telegram  │    │   Mini Apps     │    │    Backend      │
│                 │    │   (Vercel)      │    │   (Docker)      │
│  - Comandos     │◄──►│  - Depósitos    │◄──►│  - API REST     │
│  - Callbacks    │    │  - Retiros      │    │  - Base Datos   │
│  - Web Apps     │    │  - Salas        │    │  - Autenticación│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Configuración

### **Archivo Principal: `bot-telegram/config/webapp-config.js`**

```javascript
// Configuración centralizada por ambiente
const WEBAPP_CONFIG = {
  ENVIRONMENT: process.env.NODE_ENV || "development",

  BASE_URLS: {
    development: {
      miniapps: "http://localhost:3002",
      backend: "http://localhost:3001/api",
    },
    production: {
      miniapps: "https://elpatio-miniapps.vercel.app",
      backend: "https://api.elpatio.com",
    },
  },
};
```

### **Variables de Entorno: `bot-telegram/env.example`**

```bash
# Ambiente
NODE_ENV=development

# Backend
BACKEND_URL=http://localhost:3001/api

# Mini Apps (opcional, se calculan automáticamente)
WEBAPP_DEPOSITO_URL=
WEBAPP_RETIRO_URL=

# Autenticación
WEBAPP_TOKEN=webapp-secret-token
```

## 📱 Mini Apps

### **Estructura de Archivos**

```
elpatio-miniapps/
├── depositos/
│   ├── index.html
│   ├── app.js          # Lógica principal
│   ├── styles.css      # Estilos
│   └── config.js       # Configuración específica
├── retiros/            # Futuro
├── salas/              # Futuro
└── configuracion/      # Futuro
```

### **Configuración Automática de Backend**

```javascript
// En cada mini app
getBackendUrl() {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3001/api';  // Desarrollo
  }
  return 'https://api.elpatio.com/api';  // Producción
}
```

## 🔄 Flujo de Datos

### **1. Usuario inicia Mini App**

```
Bot Telegram → Mini App (Vercel) → Backend (Docker)
```

### **2. Consulta de Saldo**

```
Mini App → GET /api/jugadores/:telegramId/saldo → Backend
```

### **3. Procesamiento de Depósito**

```
Mini App → POST /api/transacciones → Backend → Base de Datos
```

## 🚀 Despliegue

### **Desarrollo Local**

```bash
# Iniciar servicios
docker-compose -f docker/compose/docker-compose.dev.yml up -d

# Mini Apps en: http://localhost:3002
# Backend en: http://localhost:3001
```

### **Producción**

```bash
# Desplegar Mini Apps
cd elpatio-miniapps
vercel --prod

# Backend se despliega automáticamente con Docker
```

## 🔧 Mantenimiento

### **Agregar Nueva Mini App**

1. **Crear carpeta** en `elpatio-miniapps/nueva-app/`
2. **Agregar URL** en `webapp-config.js`:
   ```javascript
   URLS: {
     NUEVA_APP: null; // Se calcula automáticamente
   }
   ```
3. **Configurar ruta** en el bot:
   ```javascript
   const url = getWebAppUrl("NUEVA_APP");
   ```

### **Cambiar Ambiente**

```bash
# Desarrollo
NODE_ENV=development

# Producción
NODE_ENV=production
```

## 📊 Monitoreo

### **Logs Centralizados**

```javascript
// En cada mini app
console.log("[WEBAPP] Acción realizada");
```

### **Métricas**

- Tiempo de respuesta de API
- Errores de conexión
- Usuarios activos

## 🔒 Seguridad

### **Autenticación**

- Token de webapp para requests
- Validación de datos de Telegram
- Rate limiting en endpoints

### **CORS**

```javascript
// Headers permitidos
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
```

## 🧪 Testing

### **Scripts de Prueba**

```bash
# Probar endpoint de saldo
node scripts/test-saldo-endpoint.js

# Probar mini app local
node scripts/test-miniapp-local.js
```

### **Scripts Temporales**

Los scripts de prueba están en `scripts/temp/` para no interferir con el código de producción.

## 📈 Escalabilidad

### **Futuras Mini Apps**

- Retiros
- Salas de juego
- Configuración de perfil
- Historial de transacciones

### **Optimizaciones**

- Caching de datos
- Lazy loading
- Compresión de assets

## 🎯 Beneficios de esta Arquitectura

✅ **Configuración centralizada** - Un solo lugar para cambiar URLs
✅ **Separación de ambientes** - Desarrollo y producción claramente separados
✅ **Escalabilidad** - Fácil agregar nuevas mini apps
✅ **Mantenibilidad** - Sin soluciones temporales
✅ **Profesional** - Estructura limpia y documentada
