# Análisis de Endpoints para el Dashboard - El Patio

Este documento analiza los endpoints disponibles en el backend y cuáles debemos crear para el dashboard de administración.

## Endpoints Existentes que Podemos Usar

### Autenticación

| Endpoint | Método | Autenticación | Descripción | Estado |
|----------|--------|---------------|-------------|--------|
| `/api/admin/login` | POST | Público | Login de administrador. Devuelve token JWT | ✅ Usable |
| `/api/admin/stats` | GET | Admin | Estadísticas globales del sistema | ✅ Usable |
| `/api/admin/stats/fecha` | GET | Admin | Estadísticas por rango de fechas | ✅ Usable |

**Nota**: El endpoint `/api/admin/stats` está duplicado en `/api/admin/stats` (rutas admin.js línea 26) y `/api/admin/stats/` (rutas stats.js línea 8). Ambos requieren autenticación de admin.

### Transacciones

| Endpoint | Método | Autenticación | Descripción | Estado |
|----------|--------|---------------|-------------|--------|
| `/api/transacciones/admin/todas` | GET | Admin | Listar todas las transacciones con filtros (tipo, categoria, estado, fecha, cajeroId). Incluye paginación | ✅ Usable |
| `/api/transacciones/admin/estadisticas-sistema` | GET | Admin | Estadísticas detalladas del sistema de transacciones (agregaciones por categoría/estado, resumen por estado, transacciones por cajero) | ✅ Usable |
| `/api/transacciones/:transaccionId` | GET | Admin/Cajero/Jugador | Detalles completos de una transacción específica | ✅ Usable |

**Query Parameters para `/api/transacciones/admin/todas`**:
- `limite` (default: 100)
- `pagina` (default: 1)
- `tipo` (debito/credito)
- `categoria` (entrada_sala, deposito, retiro, etc.)
- `estado` (pendiente, en_proceso, completada, etc.)
- `cajeroId`
- `fechaInicio`
- `fechaFin`

### Configuración de Precios

| Endpoint | Método | Autenticación | Descripción | Estado |
|----------|--------|---------------|-------------|--------|
| `/api/payment-config` | GET | Auth | Obtener toda la configuración de precios (organizada por tipo: precios, comisiones, limites, moneda) | ✅ Usable |
| `/api/payment-config/:configType` | GET | Auth | Obtener configuración por tipo específico | ✅ Usable |
| `/api/payment-config` | PUT | Admin | Actualizar configuración de precios (requiere configType, configKey, configValue en body) | ✅ Usable |
| `/api/payment-config/audit` | GET | Admin | Obtener historial de auditoría de cambios en configuración | ✅ Usable |

**Nota**: La ruta está registrada como `/api/payment-config` en app.js (línea 123), pero también puede aparecer como `/api/paymentConfig` en algunos lugares.

### Configuración del Sistema

| Endpoint | Método | Autenticación | Descripción | Estado |
|----------|--------|---------------|-------------|--------|
| `/api/config` | GET | - | Obtener todas las configuraciones (TODO: falta middleware de admin) | ⚠️ Revisar |
| `/api/config/:clave` | GET | - | Obtener una configuración específica por clave | ✅ Usable |
| `/api/config/:clave` | PUT | - | Actualizar configuración (TODO: falta middleware de admin) | ⚠️ Revisar |
| `/api/config/depositos` | GET | - | Obtener configuraciones de depósitos | ✅ Usable |
| `/api/config` | POST | - | Crear nueva configuración (TODO: falta middleware de admin) | ⚠️ Revisar |

**Nota**: Las rutas de configuración no tienen middleware de autenticación implementado (según comentarios en el código). Deberíamos agregarlo.

### WebSocket

| Endpoint | Método | Autenticación | Descripción | Estado |
|----------|--------|---------------|-------------|--------|
| `/api/websocket/stats` | GET | - | Estadísticas de conexiones WebSocket (jugadoresConectados, cajerosConectados, botsConectados, totalConexiones) | ⚠️ Sin autenticación |

**Respuesta de `/api/websocket/stats`**:
```json
{
  "success": true,
  "stats": {
    "jugadoresConectados": 0,
    "cajerosConectados": 0,
    "botsConectados": 0,
    "totalConexiones": 0
  }
}
```

## Endpoints que Debemos Crear

### 1. Transacciones en Curso

**Endpoint**: `GET /api/transacciones/admin/en-curso`

**Propósito**: Obtener transacciones que están en curso (pendiente + en_proceso) para el dashboard.

**Autenticación**: Requiere rol admin

**Query Parameters**:
- `limite` (default: 50)
- `categoria` (opcional, para filtrar deposito/retiro)

**Respuesta Esperada**:
```json
{
  "transacciones": [...],
  "total": 5,
  "pendientes": 3,
  "enProceso": 2
}
```

**Implementación**: Similar a `/api/transacciones/admin/todas` pero filtrando solo estados "pendiente" y "en_proceso".

---

### 2. Estadísticas de Conexiones (Mejora)

**Endpoint**: `GET /api/admin/connection-stats`

**Propósito**: Obtener estadísticas detalladas de conexiones WebSocket. Puede ser una mejora del endpoint actual `/api/websocket/stats` con autenticación y más información.

**Autenticación**: Requiere rol admin

**Respuesta Esperada**:
```json
{
  "jugadoresConectados": 10,
  "cajerosConectados": 3,
  "botsConectados": 1,
  "totalConexiones": 14,
  "cajerosDisponibles": 2,
  "cajerosOcupados": 1,
  "transaccionesActivas": 5,
  "ultimaActualizacion": "2025-01-XX..."
}
```

**Implementación**: Podemos reutilizar `socketManager.getStats()` y `connectionStateManager.getEstadoCompleto()` si están disponibles.

---

### 3. Configuración de Timeout de Transacciones

**Endpoints**: 
- `GET /api/config/transaccion-timeout-pendiente`
- `PUT /api/config/transaccion-timeout-pendiente`
- `GET /api/config/transaccion-timeout-en-proceso`
- `PUT /api/config/transaccion-timeout-en-proceso`

**Propósito**: Permitir configurar los timeouts de transacciones desde el dashboard. Actualmente están hardcodeados en `TransactionTimeoutManager` (2 minutos para pendiente, 4 minutos para en_proceso).

**Autenticación**: Requiere rol admin

**Body para PUT**:
```json
{
  "valor": 3  // en minutos
}
```

**Consideraciones**:
- Los timeouts actualmente están en `TransactionTimeoutManager` como propiedades de la clase
- Podríamos almacenarlos en `ConfiguracionSistema` y leerlos dinámicamente
- Requeriría modificar `TransactionTimeoutManager` para leer la configuración desde la base de datos

**Alternativa más simple**: Usar las claves existentes de `ConfiguracionSistema`:
- `transaccion_timeout_pendiente` (valor en minutos)
- `transaccion_timeout_en_proceso` (valor en minutos)

Y crear los endpoints usando las rutas existentes de `/api/config/:clave`.

---

### 4. Mejorar Autenticación en Endpoints de Configuración

**Endpoints afectados**:
- `GET /api/config` - Agregar `auth, verificarMinimo("admin")`
- `PUT /api/config/:clave` - Agregar `auth, verificarMinimo("admin")`
- `POST /api/config` - Agregar `auth, verificarMinimo("admin")`

**Propósito**: Seguir las mejores prácticas de seguridad.

---

### 5. Mejorar Autenticación en WebSocket Stats

**Endpoint**: `GET /api/websocket/stats`

**Cambio**: Agregar `auth, verificarMinimo("admin")` para proteger el endpoint.

---

## Resumen de Prioridades

### Alta Prioridad (Necesarios para funcionalidad básica)

1. ✅ **Endpoints existentes suficientes** para:
   - Login
   - Estadísticas globales
   - Listar transacciones (historial)
   - Detalles de transacciones
   - Configuración de precios

2. 🔨 **Crear**: `GET /api/transacciones/admin/en-curso` - Para mostrar transacciones en curso en el dashboard

3. 🔨 **Mejorar**: Agregar autenticación a endpoints de configuración (`/api/config`)

### Media Prioridad (Mejoras importantes)

4. 🔨 **Crear/Mejorar**: `GET /api/admin/connection-stats` - Estadísticas detalladas de conexiones con autenticación

5. 🔨 **Mejorar**: Agregar autenticación a `GET /api/websocket/stats`

### Baja Prioridad (Funcionalidad avanzada)

6. 🔨 **Crear**: Endpoints para configurar timeouts de transacciones (requiere cambios en `TransactionTimeoutManager`)

---

## Notas sobre Implementación

### Rutas Duplicadas

Existe una duplicación en las rutas de estadísticas:
- `/api/admin/stats` (en routes/admin.js)
- `/api/admin/stats/` (en routes/stats.js, montado en `/api/admin/stats` en app.js línea 121)

Ambos apuntan a `obtenerStatsGlobales`. Esto podría causar confusión. Recomendación: Mantener solo una ruta.

### Autenticación

- El middleware `auth` verifica el token JWT
- El middleware `verificarMinimo("admin")` verifica que el usuario tenga rol admin o superior
- Los tokens JWT incluyen: `{ id, email, rol }`

### WebSockets

- El backend usa Socket.IO
- Para conectar desde el dashboard, necesitaremos el URL del servidor WebSocket (probablemente el mismo dominio del backend)
- Los eventos disponibles se pueden ver en `socketManager.js`

### Timeouts de Transacciones

Actualmente hardcodeados en `TransactionTimeoutManager`:
- Pendiente: 2 minutos
- En proceso: 4 minutos

Para hacerlos configurables, se requiere:
1. Crear configuración en `ConfiguracionSistema`
2. Modificar `TransactionTimeoutManager` para leer desde configuración
3. Actualizar valores en tiempo de ejecución (o requerir reinicio)

---

## Plan de Implementación Sugerido

1. **Fase 1**: Usar endpoints existentes para desarrollar el dashboard básico
2. **Fase 2**: Crear endpoint de transacciones en curso (`/api/transacciones/admin/en-curso`)
3. **Fase 3**: Mejorar seguridad (agregar autenticación a endpoints de configuración y WebSocket stats)
4. **Fase 4**: Agregar endpoint de estadísticas de conexiones mejorado
5. **Fase 5**: (Opcional) Implementar configuración dinámica de timeouts

---

_Última actualización: Enero 2025_
