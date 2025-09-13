# Bot de Telegram - El Patio 🎮

Bot para gestionar salas de juego desde Telegram con sistema de selección de juegos, persistencia de estado y cache preparado para migración futura a Redis.

**⚠️ Estado del Proyecto: En Desarrollo Activo**

## 🚀 Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env` con las siguientes variables:

```env
BOT_TOKEN=tu_token_del_bot
BACKEND_URL=http://localhost:3000/api
BOT_EMAIL=bot@elpatio.com
BOT_PASSWORD=password_del_bot
ADMIN_ID=tu_telegram_id
TEST_MODE=true  # Opcional: para modo de prueba sin backend

# Configuración de cache (preparado para migración futura)
CACHE_TYPE=local  # local | backend | redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=tu_password_redis
REDIS_DB=0
BACKEND_USE_CACHE=false
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar el Bot

Para configurar el bot con los comandos y mensajes de bienvenida:

1. Ejecuta el bot: `npm run dev`
2. En Telegram, envía `/setwelcome` al bot (solo admin)

## 🎯 Funcionalidades Implementadas

### ✅ **Completado**

- Sistema de selección de juegos
- Persistencia de estado de usuario
- Modo de prueba sin backend
- Comandos básicos de administración
- Manejo de errores robusto
- Teclado personalizado
- Filtrado de salas por juego
- **Registro automático de jugadores** 🆕
- **Sistema de cache preparado para migración** 🆕
- **Arquitectura híbrida MongoDB + Cache** 🆕
- **Display name con jerarquía inteligente** 🆕
- **Estadísticas del sistema** 🆕

### 🔄 **En Desarrollo**

- Creación de salas personalizadas
- Sistema de pagos completo
- Unirse a salas (backend integration)
- Gestión de comprobantes
- Estadísticas avanzadas

### 📋 **Pendiente**

- Integración completa con backend
- Sistema de notificaciones
- Historial de partidas
- Configuración de perfil
- Múltiples idiomas

## 🎮 Experiencia del Usuario

### Flujo Actual

1. **Inicio**: Usuario presiona `/start`
2. **Registro**: Se registra automáticamente como jugador en la base de datos
3. **Selección**: Elige un juego con `/juegos`
4. **Salas**: Automáticamente ve las salas disponibles
5. **Unirse**: (En desarrollo) Puede unirse a salas

### Juegos Disponibles

- 🎲 **Ludo** - El clásico juego de mesa
- 🂋 **Dominó** - Juego de fichas (próximamente)

## 🏗️ Arquitectura del Sistema

### 📊 **Arquitectura Actual (Desarrollo)**

```
┌─────────────────┐    ┌─────────────────┐
│   Bot Telegram  │    │     Backend     │
│                 │    │   (Node.js)     │
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ user-state  │ │    │ │   MongoDB   │ │
│ │   (local)   │ │    │ │  (Primary)  │ │
│ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │
│ ┌─────────────┐ │    │                 │
│ │ Display     │ │    │                 │
│ │ Name Cache  │ │    │                 │
│ └─────────────┘ │    │                 │
└─────────────────┘    └─────────────────┘
```

### 🚀 **Arquitectura Futura (Producción)**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Bot Telegram  │    │     Backend     │    │     Redis       │
│                 │    │   (Node.js)     │    │   (Cache)       │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ user-state  │ │    │ │   MongoDB   │ │    │ │ Display     │ │
│ │   (local)   │ │    │ │  (Primary)  │ │    │ │ Names       │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│                 │    │ │    Redis    │ │◄───┤ │ Sala Cache  │ │
│                 │    │ │  (Cache)    │ │    │ └─────────────┘ │
│                 │    │ └─────────────┘ │    │ ┌─────────────┐ │
│                 │    │                 │    │ │ User Cache  │ │
│                 │    │                 │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔄 **Sistema de Cache Preparado para Migración**

El bot incluye un sistema de cache abstracto que soporta múltiples estrategias:

#### **Estrategias Disponibles:**

1. **`local`** (Actual): Cache en archivo JSON

   - Rápido para desarrollo
   - Sin dependencias externas
   - Persistente entre reinicios

2. **`backend`** (Futuro): Cache manejado por el backend

   - Centralizado
   - Compartido entre apps
   - Control total del backend

3. **`redis`** (Futuro): Cache directo con Redis
   - Máximo rendimiento
   - Escalabilidad
   - Funciones avanzadas

#### **Configuración de Cache:**

```javascript
// config/bot-config.js
cache: {
  type: 'local', // 'local' | 'backend' | 'redis'

  redis: {
    host: 'localhost',
    port: 6379,
    ttl: {
      displayName: 3600,    // 1 hora
      salaInfo: 1800,       // 30 minutos
      userProfile: 7200     // 2 horas
    }
  },

  backend: {
    useCache: true,
    cacheEndpoints: {
      displayName: '/api/users/display-name',
      salas: '/api/salas/disponibles'
    }
  }
}
```

## 📁 Estructura del Proyecto

```
bot-telegram/
├── api/                  # Comunicación con backend
│   └── backend.js       # API preparada para cache
├── assets/              # Recursos (logos, imágenes)
├── config/              # Archivos de configuración
│   └── bot-config.js   # Configuración central + cache
├── handlers/            # Manejadores de eventos
│   ├── callbacks.js    # Botones inline
│   ├── commands.js     # Comandos /command
│   └── messages.js     # Mensajes de texto
├── scripts/             # Scripts de utilidad
│   └── test-cache-migration.js  # Pruebas del sistema de cache
├── utils/               # Funciones auxiliares
│   ├── helpers.js      # Funciones principales
│   ├── cache-service.js # Servicio de cache abstracto
│   └── nickname-validator.js
├── user-state.js       # Manejo de estado de usuarios
└── index.js            # Punto de entrada principal
```

## 🔧 Características Técnicas

### **Sistema de Cache**

- **Abstracción completa**: Fácil cambio entre estrategias
- **Configuración centralizada**: Un solo lugar para configurar
- **Fallback automático**: Si falla el cache, usa datos directos
- **Invalidación inteligente**: Limpia cache cuando es necesario
- **Estadísticas**: Monitoreo del rendimiento del cache

### **Display Name Hierarchy**

El sistema determina el nombre a mostrar siguiendo esta jerarquía:

1. **Nickname** (si existe y no es placeholder)
2. **firstName** (nombre de Telegram)
3. **username** (usuario de Telegram)
4. **"Jugador"** (fallback)

### **Manejo de Placeholders**

Los usuarios que eligen no usar nickname reciben un placeholder único:

- `SIN_NICKNAME_123456789`
- El sistema detecta estos placeholders y usa la jerarquía alternativa

## 🧪 Pruebas del Sistema

### **Probar el Sistema de Cache**

```bash
# Probar el sistema de cache preparado para migración
node scripts/test-cache-migration.js
```

Este script verifica:

- ✅ Configuración del cache
- ✅ Servicio de cache
- ✅ Display names con cache
- ✅ Salas con cache
- ✅ Estadísticas del cache
- ✅ Múltiples usuarios
- ✅ Invalidación de cache
- ✅ Diferentes estrategias

## 🚀 Migración a Redis (Futuro)

### **Plan de Migración**

1. **Fase 1: Backend con Redis**

   - Instalar Redis en el servidor del backend
   - Crear `redisService.js` en el backend
   - Modificar controladores para usar cache
   - Agregar rutas de cache

2. **Fase 2: Bot simplificado**

   - Cambiar `CACHE_TYPE=backend` en `.env`
   - El bot usará la API del backend con cache
   - Código más simple y mantenible

3. **Fase 3: Webapps integradas**
   - Webapp de pagos usa la API del backend
   - Webapp de juegos usa la API del backend
   - Todas las apps comparten el mismo cache

### **Configuración para Producción**

```env
# Cambiar solo esta variable para migrar
CACHE_TYPE=backend

# Configuración de Redis (en el backend)
REDIS_HOST=tu-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=tu-password
BACKEND_USE_CACHE=true
```

## 📊 Comandos Disponibles

### **Comandos de Usuario**

- `/start` - Iniciar el bot
- `/juegos` - Seleccionar juego
- `/mijuego` - Ver mi juego seleccionado
- `/cambiarjuego` - Cambiar juego
- `/salas` - Ver salas disponibles
- `/crearsala` - Crear nueva sala (en desarrollo)
- `/ayuda` - Ver ayuda

### **Comandos de Administración**

- `/stats` - Ver estadísticas del sistema (solo admin)
- `/setwelcome` - Configurar comandos del bot (solo admin)
- `/setupmeta` - Configurar metadatos del bot (solo admin)
- `/cleanup` - Limpiar configuración (solo admin)
- `/restore` - Restaurar configuración (solo admin)

## 🎯 Ventajas de la Arquitectura

### **Durante Desarrollo:**

- ✅ **Desarrollo rápido** - Sin dependencias externas
- ✅ **Testing fácil** - Todo local
- ✅ **Debugging simple** - Sin configuraciones complejas
- ✅ **Código limpio** - Preparado para el futuro

### **Para la Migración:**

- ✅ **Migración rápida** - Solo cambiar configuración
- ✅ **Sin breaking changes** - API interna igual
- ✅ **A/B testing posible** - Probar ambas implementaciones
- ✅ **Rollback fácil** - Volver a configuración anterior

## 🔍 Monitoreo y Estadísticas

### **Comando `/stats`**

Muestra estadísticas del sistema:

- **Cache**: Estrategia, usuarios en cache, última limpieza
- **Backend**: Total usuarios, usuarios activos, salas
- **Sistema**: Estado general del bot

### **Logs del Sistema**

El sistema registra:

- Inicialización del cache
- Operaciones de cache (hit/miss)
- Errores y fallbacks
- Estadísticas de rendimiento

## 📝 Notas de Desarrollo

### **Arquitectura Híbrida**

- **MongoDB**: Datos persistentes y complejos
- **Cache**: Datos temporales y de acceso frecuente
- **Flexibilidad**: Fácil cambio entre estrategias

### **Preparación para Escalabilidad**

- **30MB Redis**: Suficiente para 1,000 usuarios activos
- **Optimizaciones**: TTL agresivo, compresión de datos
- **Monitoreo**: Estadísticas y alertas

**El sistema está preparado para crecer desde desarrollo hasta producción sin cambios mayores en el código.** 🎯
