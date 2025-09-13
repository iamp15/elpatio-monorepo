# Sistema de Autenticación Automática del Bot

## Descripción General

El bot de Telegram ahora cuenta con un sistema de autenticación automática que maneja la renovación de tokens JWT de forma transparente, eliminando la necesidad de actualizar manualmente el token cuando expira.

## Características Principales

### 🔄 Renovación Automática

- **Detección automática**: El sistema detecta cuando el token está próximo a expirar (5 minutos antes)
- **Renovación transparente**: Las peticiones al backend se manejan automáticamente sin interrumpir la funcionalidad
- **Interceptores inteligentes**: Maneja errores 401 automáticamente y reintenta las peticiones con el nuevo token

### 📊 Monitoreo en Tiempo Real

- **Monitor automático**: Verifica el estado del token cada 5 minutos
- **Renovación preventiva**: Renueva el token antes de que expire
- **Logs informativos**: Muestra información detallada sobre el estado del token

### 🛠️ Herramientas de Administración

- **Comando `/token`**: Permite a los administradores verificar el estado del token
- **Renovación manual**: Botón para renovar el token manualmente desde el bot
- **Información detallada**: Muestra tiempo restante, fecha de expiración y estado de validez

## Arquitectura del Sistema

### Componentes Principales

#### 1. AuthService (`utils/auth-service.js`)

```javascript
class AuthService {
  // Maneja toda la lógica de autenticación
  // Interceptores para renovación automática
  // Parsing de tokens JWT
  // Gestión de expiración
}
```

#### 2. BackendAPI (`api/backend.js`)

```javascript
class BackendAPI {
  // Usa AuthService internamente
  // Mantiene compatibilidad con código existente
  // Métodos adicionales para gestión de tokens
}
```

#### 3. Monitor de Token (`index.js`)

```javascript
// Verificación periódica cada 5 minutos
// Renovación preventiva
// Logs de estado
```

## Configuración Requerida

### Variables de Entorno

```env
# Credenciales del bot para autenticación
BOT_EMAIL=tu_email@ejemplo.com
BOT_PASSWORD=tu_password

# URL del backend
BACKEND_URL=https://tu-backend.com

# Token opcional (se renueva automáticamente)
BOT_JWT=token_opcional_inicial
```

### Permisos de Administrador

```env
# ID del administrador para comandos de gestión
ADMIN_ID=tu_telegram_id
```

## Uso del Sistema

### Inicio Automático

El sistema se inicializa automáticamente al arrancar el bot:

```javascript
// En index.js
const api = new BackendAPI({
  baseUrl: BACKEND_URL,
  botEmail: BOT_EMAIL,
  botPassword: BOT_PASSWORD,
  preToken: PRE_TOKEN,
});

// Autenticación automática al iniciar
await api.ensureAuth();
```

### Comandos de Administración

#### `/token` - Verificar Estado del Token

```
🔐 Estado del Token de Autenticación

📋 Información:
• Válido: ✅ Sí
• Expira: 15/12/2024, 14:30:25
• Tiempo restante: 2h 15m

[🔄 Renovar Token] [📊 Ver Estadísticas]
```

#### Renovación Manual

- Botón "🔄 Renovar Token" en el comando `/token`
- Renovación inmediata con confirmación
- Información actualizada del nuevo token

### Monitoreo Automático

```javascript
// Verificación cada 5 minutos
setInterval(async () => {
  const tokenInfo = api.getTokenInfo();

  if (tokenInfo.willExpireSoon) {
    console.log("⚠️ Token expirará pronto, renovando...");
    await api.refreshToken();
  }
}, 5 * 60 * 1000);
```

## Manejo de Errores

### Errores de Autenticación

- **401 Unauthorized**: Renovación automática del token
- **Credenciales inválidas**: Error descriptivo con sugerencias
- **Timeout de red**: Reintentos automáticos

### Logs Informativos

```
🔄 Renovando token de autenticación...
✅ Token renovado exitosamente
📅 Token expira: 15/12/2024, 14:30:25
⚠️ Token expirará pronto (3 minutos)
🔄 Renovando token automáticamente...
```

## Ventajas del Sistema

### ✅ Beneficios

1. **Sin interrupciones**: El bot funciona continuamente sin paradas
2. **Transparencia**: Los usuarios no notan la renovación de tokens
3. **Automatización**: No requiere intervención manual
4. **Monitoreo**: Visibilidad completa del estado de autenticación
5. **Robustez**: Manejo de errores y reintentos automáticos

### 🔧 Mantenimiento

- **Sin actualizaciones manuales**: No más tokens expirados
- **Logs detallados**: Fácil diagnóstico de problemas
- **Herramientas de administración**: Control total desde el bot
- **Compatibilidad**: Funciona con el código existente

## Scripts de Prueba

### `scripts/test-auth-auto-refresh.js`

Prueba completa del sistema de autenticación:

- Autenticación inicial
- Verificación de token
- Renovación manual
- Peticiones al backend

### `scripts/test-token-expiry.js`

Prueba de renovación automática:

- Simulación de token expirado
- Verificación de renovación automática
- Validación de funcionalidad

## Ejecución de Pruebas

```bash
# Probar sistema completo
node scripts/test-auth-auto-refresh.js

# Probar renovación automática
node scripts/test-token-expiry.js
```

## Troubleshooting

### Problemas Comunes

#### Error de Credenciales

```
❌ Error de autenticación: Credenciales inválidas
```

**Solución**: Verificar `BOT_EMAIL` y `BOT_PASSWORD` en `.env`

#### Token No Se Renueva

```
⚠️ No se pudo parsear la expiración del token
```

**Solución**: Verificar formato del token JWT en el backend

#### Errores de Red

```
❌ Error renovando token: Timeout
```

**Solución**: Verificar conectividad con el backend y `BACKEND_URL`

### Logs de Diagnóstico

```bash
# Ver logs del bot
npm start

# Verificar estado del token
/token

# Renovar manualmente si es necesario
[🔄 Renovar Token]
```

## Migración desde Sistema Anterior

### Cambios Automáticos

- ✅ Compatibilidad total con código existente
- ✅ No requiere cambios en handlers
- ✅ Funciona con tokens existentes

### Nuevas Funcionalidades

- 🔄 Renovación automática
- 📊 Monitoreo en tiempo real
- 🛠️ Comandos de administración
- 📝 Logs mejorados

### Configuración Opcional

- `BOT_JWT`: Se puede mantener para token inicial
- Sistema funciona sin token inicial usando credenciales
- Migración gradual sin interrupciones
