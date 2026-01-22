# Endpoints Creados para el Dashboard - El Patio

Este documento lista los endpoints que se han creado o mejorado para el dashboard de administración.

## Endpoints Nuevos Creados

### 1. Transacciones en Curso

**Endpoint**: `GET /api/transacciones/admin/en-curso`

**Autenticación**: Requiere rol admin

**Descripción**: Obtiene todas las transacciones que están en curso (estados: pendiente, en_proceso) para mostrarlas en el dashboard.

**Query Parameters**:
- `limite` (opcional, default: 50) - Número máximo de transacciones a devolver
- `categoria` (opcional) - Filtrar por "deposito" o "retiro"

**Respuesta**:
```json
{
  "transacciones": [
    {
      "_id": "...",
      "jugadorId": { "username": "...", "nickname": "...", "telegramId": "..." },
      "cajeroId": { "nombreCompleto": "...", "email": "...", "telefonoContacto": "..." },
      "tipo": "credito",
      "categoria": "deposito",
      "monto": 50000,
      "estado": "pendiente",
      "createdAt": "2025-01-XX...",
      ...
    }
  ],
  "total": 5,
  "pendientes": 3,
  "enProceso": 2,
  "categoria": "todas"
}
```

**Ubicación**: `elpatio-backend/routes/transacciones.js` (línea ~200)

---

### 2. Estadísticas de Conexiones Mejoradas

**Endpoint**: `GET /api/admin/connection-stats`

**Autenticación**: Requiere rol admin

**Descripción**: Obtiene estadísticas detalladas de conexiones WebSocket, incluyendo información del ConnectionStateManager y TransactionTimeoutManager.

**Respuesta**:
```json
{
  "conexiones": {
    "jugadoresConectados": 10,
    "cajerosConectados": 3,
    "botsConectados": 1,
    "totalConexiones": 14
  },
  "detalles": {
    "cajerosDisponibles": 2,
    "cajerosOcupados": 1,
    "transaccionesActivas": 5,
    "ultimaActualizacion": "2025-01-XX...",
    "detallesCajeros": [...],
    "detallesJugadores": [...],
    "detallesTransacciones": [...]
  },
  "timeouts": {
    "isRunning": true,
    "timeouts": {
      "pendiente": 120000,
      "en_proceso": 240000
    },
    "checkIntervals": {...},
    "mode": "adaptive-polling"
  },
  "timestamp": "2025-01-XX..."
}
```

**Ubicación**: `elpatio-backend/routes/admin.js` (línea ~40)

---

## Endpoints Mejorados (Seguridad)

### 3. Configuración del Sistema - Autenticación Agregada

**Endpoints afectados**:
- `GET /api/config` - Ahora requiere autenticación admin
- `POST /api/config` - Ahora requiere autenticación admin
- `PUT /api/config/:clave` - Ahora requiere autenticación admin
- `POST /api/config/inicializar` - Ahora requiere autenticación admin

**Cambios**: Se agregó middleware `auth` y `verificarMinimo("admin")` a todas las rutas que modifican configuración.

**Rutas públicas (sin cambios)**:
- `GET /api/config/depositos` - Sigue siendo pública (para app de cajeros)
- `GET /api/config/:clave` - Sigue siendo pública (solo lectura)

**Ubicación**: `elpatio-backend/routes/configuracion.js`

---

### 4. Estadísticas WebSocket - Autenticación Agregada

**Endpoint**: `GET /api/websocket/stats`

**Cambio**: Se agregó middleware `auth` y `verificarMinimo("admin")` para proteger el endpoint.

**Antes**: Endpoint público (sin autenticación)
**Ahora**: Requiere autenticación de admin

**Respuesta** (sin cambios):
```json
{
  "success": true,
  "stats": {
    "jugadoresConectados": 10,
    "cajerosConectados": 3,
    "botsConectados": 1,
    "totalConexiones": 14
  }
}
```

**Ubicación**: `elpatio-backend/routes/websocket.js` (línea ~9)

---

## Resumen de Cambios

### Archivos Modificados

1. **elpatio-backend/routes/transacciones.js**
   - ✅ Agregado endpoint `GET /api/transacciones/admin/en-curso`

2. **elpatio-backend/routes/admin.js**
   - ✅ Agregado endpoint `GET /api/admin/connection-stats`

3. **elpatio-backend/routes/configuracion.js**
   - ✅ Agregada autenticación a rutas de creación/actualización
   - ✅ Mantenidas rutas públicas para lectura específica

4. **elpatio-backend/routes/websocket.js**
   - ✅ Agregada autenticación a `GET /api/websocket/stats`

### Endpoints Disponibles para el Dashboard

Ahora el dashboard puede utilizar los siguientes endpoints:

#### Autenticación
- ✅ `POST /api/admin/login`

#### Estadísticas
- ✅ `GET /api/admin/stats` - Estadísticas globales
- ✅ `GET /api/admin/stats/fecha` - Estadísticas por fecha
- ✅ `GET /api/admin/connection-stats` - **NUEVO** - Estadísticas detalladas de conexiones
- ✅ `GET /api/websocket/stats` - Estadísticas básicas de WebSocket (ahora protegido)
- ✅ `GET /api/transacciones/admin/estadisticas-sistema` - Estadísticas detalladas de transacciones

#### Transacciones
- ✅ `GET /api/transacciones/admin/todas` - Listar todas las transacciones
- ✅ `GET /api/transacciones/admin/en-curso` - **NUEVO** - Transacciones en curso
- ✅ `GET /api/transacciones/:transaccionId` - Detalles de transacción

#### Configuración
- ✅ `GET /api/payment-config` - Obtener configuración de precios
- ✅ `PUT /api/payment-config` - Actualizar configuración de precios
- ✅ `GET /api/config/:clave` - Obtener configuración específica (público para lectura)
- ✅ `PUT /api/config/:clave` - Actualizar configuración (ahora protegido)
- ✅ `GET /api/config` - Obtener todas las configuraciones (ahora protegido)

---

## Próximos Pasos

### Pendientes (Baja Prioridad)

1. **Configuración de Timeouts de Transacciones**
   - Crear endpoints para configurar timeouts dinámicamente
   - Requiere modificar `TransactionTimeoutManager` para leer desde configuración
   - Sugerencia: Usar claves `transaccion_timeout_pendiente` y `transaccion_timeout_en_proceso` en `ConfiguracionSistema`

---

_Última actualización: Enero 2025_
