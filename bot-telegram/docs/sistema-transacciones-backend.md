# Sistema de Transacciones - Backend

## Descripción General

El sistema de transacciones del backend es una arquitectura robusta diseñada para manejar todas las operaciones financieras dentro de la plataforma de juegos. Utiliza un patrón **Model-Controller-Routes** y está optimizado para manejar tanto transacciones automáticas como transacciones que requieren intervención manual de cajeros.

## 🏗️ Arquitectura del Sistema

### **Componentes Principales:**

- **Modelo Transaccion** - Esquema de base de datos y lógica básica
- **Controller transaccionesController** - Lógica de negocio y procesamiento
- **Routes transacciones** - Endpoints REST API
- **Modelo Cajero** - Gestión de cajeros del sistema

### **Flujo de Datos:**

```
Cliente → Rutas → Controlador → Modelo → Base de Datos
                     ↓
              Validaciones y Logs
```

## 📊 Modelo de Transacción

### **Estructura de Datos:**

#### **Campos Básicos:**

- `jugadorId` - Referencia al jugador (ObjectId)
- `telegramId` - ID de Telegram del jugador (String)
- `tipo` - Tipo de transacción: `debito` | `credito`
- `categoria` - Categoría específica (ver categorías disponibles)
- `monto` - Cantidad en centavos (Number)
- `descripcion` - Descripción de la transacción (String)
- `referencia` - Código único de referencia (String)

#### **Control de Saldo:**

- `saldoAnterior` - Saldo antes de la transacción
- `saldoNuevo` - Saldo después de la transacción
- `estado` - Estado actual de la transacción

#### **Gestión de Cajeros:**

- `cajeroId` - Referencia al cajero asignado (solo depósitos/retiros)
- `fechaAsignacionCajero` - Cuándo se asignó el cajero
- `fechaConfirmacionCajero` - Cuándo confirmó el cajero
- `infoPago` - Información detallada del pago

### **Tipos de Transacción:**

#### **1. Débito (`debito`)**

Transacciones que **descuentan** saldo del jugador:

- `entrada_sala` - Pago por entrar a una sala de juego
- `retiro` - Retiro de dinero real (requiere cajero)
- `comision` - Comisiones del sistema
- `transferencia` - Transferencia a otro jugador

#### **2. Crédito (`credito`)**

Transacciones que **agregan** saldo al jugador:

- `premio_juego` - Premios por ganar juegos
- `deposito` - Depósito de dinero real (requiere cajero)
- `reembolso` - Devoluciones por cancelaciones
- `bonificacion` - Bonos promocionales
- `ajuste_admin` - Ajustes administrativos

### **Estados de Transacción:**

#### **Transacciones Automáticas:**

- `completada` - Procesada y saldo actualizado

#### **Transacciones con Cajero:**

1. `pendiente` - Creada, esperando asignación de cajero
2. `en_proceso` - Asignada a cajero, esperando confirmación
3. `confirmada` - Confirmada por cajero, listo para procesar saldo
4. `completada` - Procesada y saldo actualizado

#### **Estados de Error:**

- `rechazada` - Rechazada por cajero o sistema
- `fallida` - Error en el procesamiento
- `revertida` - Transacción revertida
- `cancelada` - Cancelada por el usuario

## 🔧 Capacidades del Sistema

### **1. Transacciones Automáticas**

El sistema puede procesar automáticamente:

- ✅ Pagos de entrada a salas
- ✅ Distribución de premios
- ✅ Reembolsos por cancelaciones
- ✅ Transferencias entre jugadores
- ✅ Bonificaciones y ajustes

**Características:**

- Procesamiento instantáneo
- Validación de saldo automática
- Transacciones atómicas con MongoDB sessions
- Logging automático de todas las operaciones

### **2. Transacciones con Cajero**

Para depósitos y retiros de dinero real:

- ✅ Creación de solicitudes
- ✅ Asignación automática o manual de cajeros
- ✅ Confirmación con comprobantes
- ✅ Procesamiento del saldo tras confirmación

**Flujo de Cajero:**

```
Solicitud → Asignación → Confirmación → Procesamiento
```

### **3. Auditoría y Trazabilidad**

- ✅ Registro completo de todas las transacciones
- ✅ Historial de cambios de estado
- ✅ Logs de sistema automáticos
- ✅ Referencias únicas para cada transacción
- ✅ Tracking de cajeros asignados

### **4. Validaciones y Seguridad**

- ✅ Validación de saldo suficiente para débitos
- ✅ Verificación de estados válidos
- ✅ Transacciones atómicas (todo o nada)
- ✅ Rollback automático en caso de error
- ✅ Validación de permisos por rol

## 🛠️ Herramientas Disponibles

### **Endpoint Principal:**

El sistema utiliza un **único endpoint centralizado** para procesar todas las transacciones automáticas:

#### **`POST /api/transacciones/procesar-automatica`** ⭐

**Reemplaza todas las funciones auxiliares anteriores** y maneja:

- ✅ Pagos de entrada a salas
- ✅ Reembolsos por cancelaciones
- ✅ Distribución de premios
- ✅ Bonificaciones y ajustes
- ✅ Cualquier transacción automática

**Ventajas de la arquitectura unificada:**

- 🎯 **Menos código** - Un solo punto de procesamiento
- 🔧 **Más mantenible** - Lógica centralizada
- 🚀 **Más flexible** - Fácil agregar nuevos tipos
- ✅ **Probado y estable** - Endpoint completamente funcional

**Uso básico:**

```javascript
// Para cualquier tipo de transacción automática
const response = await fetch("/api/transacciones/procesar-automatica", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jugadorId: "68ab54e05475d8a12e468add",
    tipo: "debito", // o "credito"
    categoria: "entrada_sala", // ver categorías disponibles
    monto: 1000,
    descripcion: "Descripción de la transacción",
    referenciaExterna: {
      /* datos adicionales */
    },
    metadata: {
      /* información del contexto */
    },
  }),
});
```

### **Métodos del Modelo:**

#### **Métodos Estáticos:**

- `Transaccion.generarReferencia(categoria, jugadorId)` - Genera referencia única
- `Transaccion.obtenerBalance(jugadorId)` - Obtiene saldo actual del jugador

#### **Métodos de Instancia:**

- `transaccion.cambiarEstado(nuevoEstado, motivo)` - Cambia estado con validaciones
- `transaccion.requiereCajero()` - Verifica si necesita cajero
- `transaccion.esAutomatica()` - Verifica si es automática

## 🌐 Endpoints REST API

### **📋 Rutas Públicas/Jugadores**

#### **`POST /api/transacciones/solicitud`**

Crear solicitud de depósito o retiro.

```json
{
  "jugadorId": "64f...",
  "tipo": "credito",
  "categoria": "deposito",
  "monto": 10000,
  "descripcion": "Depósito via transferencia",
  "metodoPago": "transferencia"
}
```

#### **`GET /api/transacciones/jugador/:jugadorId/historial`**

Obtener historial de transacciones del jugador.
**Query params:** `limite`, `tipo`, `categoria`, `estado`

#### **`GET /api/transacciones/jugador/:jugadorId/estadisticas`**

Estadísticas de transacciones del jugador.
**Query params:** `fechaInicio`, `fechaFin`

### **🤖 Rutas del Sistema/Bot**

#### **`POST /api/transacciones/procesar-automatica`** ⭐ **NUEVO**

Procesar transacciones automáticas desde el bot de Telegram o sistema interno.

**Descripción:** Endpoint principal para procesar transacciones que no requieren intervención de cajeros (pagos de entrada, premios, reembolsos, etc.).

**Roles permitidos:** `admin`, `sistema`, `bot`

**Payload:**

```json
{
  "jugadorId": "68ab54e05475d8a12e468add",
  "tipo": "debito",
  "categoria": "entrada_sala",
  "monto": 1000,
  "descripcion": "Pago entrada a Sala de Ludo",
  "referenciaExterna": {
    "salaId": "675a1b2c3d4e5f6789abcdef"
  },
  "metadata": {
    "ipOrigen": "bot-telegram",
    "dispositivoOrigen": "telegram-bot"
  }
}
```

**Respuesta Exitosa:**

```json
{
  "exito": true,
  "mensaje": "Transacción procesada exitosamente",
  "transaccion": {
    "_id": "68b39f775dd16c26cd064e60",
    "referencia": "ENTRADA_SALA_68ab54e05475d8a12e468add_1756602231919_kx6gt",
    "tipo": "debito",
    "categoria": "entrada_sala",
    "monto": 1000,
    "estado": "completada",
    "createdAt": "2024-12-30T21:03:51.919Z"
  },
  "saldoAnterior": 90400,
  "saldoNuevo": 89400
}
```

**Respuesta de Error:**

```json
{
  "exito": false,
  "mensaje": "Saldo insuficiente",
  "saldoActual": 500,
  "montoRequerido": 1000
}
```

**Características:**

- ✅ Procesamiento instantáneo
- ✅ Validación automática de saldo
- ✅ Transacciones atómicas con MongoDB sessions
- ✅ Generación automática de referencias únicas
- ✅ Logging completo de operaciones
- ✅ Rollback automático en caso de error

**Casos de Uso:**

- Pagos de entrada a salas de juego
- Distribución de premios
- Reembolsos por cancelaciones
- Bonificaciones del sistema
- Ajustes administrativos

### **👨‍💼 Rutas de Administración**

#### **`GET /api/transacciones/cajeros-disponibles`**

Obtener lista de cajeros activos.

#### **`GET /api/transacciones/pendientes-cajero`**

Obtener transacciones pendientes para cajeros.
**Query params:** `tipo`, `cajeroId`, `limite`

#### **`PUT /api/transacciones/:transaccionId/asignar-cajero`**

Asignar cajero a una transacción.

```json
{
  "cajeroId": "64f..."
}
```

#### **`GET /api/transacciones/admin/todas`**

Obtener todas las transacciones con filtros (admin).
**Query params:** `limite`, `pagina`, `tipo`, `categoria`, `estado`, `cajeroId`, `fechaInicio`, `fechaFin`

#### **`GET /api/transacciones/admin/estadisticas-sistema`**

Estadísticas generales del sistema.

### **💰 Rutas de Cajeros**

#### **`PUT /api/transacciones/:transaccionId/confirmar`**

Confirmar transacción por cajero.

```json
{
  "metodoPago": "transferencia",
  "numeroReferencia": "123456789",
  "bancoOrigen": "Banco Venezuela",
  "bancoDestino": "Banco Mercantil",
  "comprobanteUrl": "https://...",
  "notas": "Transferencia confirmada",
  "telefonoOrigen": "04141234567",
  "cedulaOrigen": "V12345678"
}
```

#### **`PUT /api/transacciones/:transaccionId/rechazar`**

Rechazar transacción.

```json
{
  "motivo": "Comprobante no válido"
}
```

### **🔍 Rutas de Consulta**

#### **`GET /api/transacciones/:transaccionId`**

Obtener detalles de una transacción específica.

## 🔐 Sistema de Permisos

### **Roles y Accesos:**

#### **Jugadores:**

- ✅ Crear solicitudes de depósito/retiro
- ✅ Ver su propio historial
- ✅ Ver sus propias estadísticas
- ✅ Ver detalles de sus transacciones

#### **Cajeros:**

- ✅ Ver transacciones pendientes asignadas
- ✅ Confirmar transacciones asignadas
- ✅ Rechazar transacciones asignadas
- ✅ Ver detalles de transacciones asignadas

#### **Administradores:**

- ✅ Acceso completo a todas las funciones
- ✅ Asignar cajeros a transacciones
- ✅ Ver todas las transacciones del sistema
- ✅ Estadísticas globales
- ✅ Gestión de cajeros

## 🚀 Casos de Uso Comunes

### **1. Entrada a Sala de Juego**

#### **Desde el Bot de Telegram (Método Actual)**

```javascript
// En el bot de Telegram usando BackendAPI
const resultadoPago = await api.procesarPagoEntrada(
  jugadorId,
  precioEntrada,
  salaId
);

if (resultadoPago.exito) {
  // Unir jugador a la sala
  await api.joinSala(salaId, jugadorId);

  // Notificar al usuario
  await bot.sendMessage(
    chatId,
    `✅ Pago procesado exitosamente!\n` +
      `💰 Entrada: ${(precioEntrada / 100).toLocaleString("es-VE")} Bs\n` +
      `💳 Saldo restante: ${(resultadoPago.saldoNuevo / 100).toLocaleString(
        "es-VE"
      )} Bs\n` +
      `📋 Referencia: ${resultadoPago.transaccion.referencia}`
  );
}
```

**Nota:** `api.procesarPagoEntrada()` internamente llama al endpoint `/procesar-automatica` con los parámetros correctos.

### **2. Cancelación de Sala con Reembolsos**

```javascript
// En el controlador de salas - usando endpoint unificado
for (const jugador of jugadoresEnSala) {
  const response = await fetch("/api/transacciones/procesar-automatica", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${systemToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jugadorId: jugador._id,
      tipo: "credito",
      categoria: "reembolso",
      monto: precioEntrada,
      descripcion: `Reembolso por cancelación de sala: ${sala.nombre}`,
      referenciaExterna: { salaId: sala._id },
      metadata: {
        procesadoPor: "sistema",
        tipoOperacion: "cancelacion_sala",
      },
    }),
  });
}
```

### **3. Distribución de Premios**

```javascript
// En el controlador de juegos - usando endpoint unificado
const premios = [5000, 3000, 1000]; // Premios por posición

for (const [index, jugadorId] of ganadoresOrdenados.entries()) {
  const response = await fetch("/api/transacciones/procesar-automatica", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${systemToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jugadorId,
      tipo: "credito",
      categoria: "premio_juego",
      monto: premios[index],
      descripcion: `Premio por posición ${index + 1} en ${juegoNombre}`,
      referenciaExterna: { juegoId, posicion: index + 1 },
      metadata: {
        procesadoPor: "sistema",
        tipoOperacion: "distribucion_premio",
      },
    }),
  });
}
```

### **4. Uso Directo del Endpoint `/procesar-automatica`**

```javascript
// Desde cualquier cliente autenticado (bot, frontend, etc.)
const response = await fetch("/api/transacciones/procesar-automatica", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jugadorId: "68ab54e05475d8a12e468add",
    tipo: "debito",
    categoria: "entrada_sala",
    monto: 1000,
    descripcion: "Pago entrada a Sala de Ludo",
    referenciaExterna: {
      salaId: "675a1b2c3d4e5f6789abcdef",
    },
    metadata: {
      ipOrigen: "bot-telegram",
      dispositivoOrigen: "telegram-bot",
    },
  }),
});

const resultado = await response.json();

if (resultado.exito) {
  console.log(`Transacción exitosa: ${resultado.transaccion.referencia}`);
  console.log(`Nuevo saldo: ${resultado.saldoNuevo} centavos`);
} else {
  console.error(`Error: ${resultado.mensaje}`);
}
```

### **5. Solicitud de Depósito**

```javascript
// Desde el frontend/bot
const response = await fetch("/api/transacciones/solicitud", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jugadorId: "64f...",
    tipo: "credito",
    categoria: "deposito",
    monto: 10000,
    descripcion: "Depósito via Pago Móvil",
    metodoPago: "pago_movil",
  }),
});
```

## 🔧 Configuración y Dependencias

### **Modelos Requeridos:**

- `Transaccion` - Modelo principal
- `Jugador` - Para validar jugadores y actualizar saldos
- `Cajero` - Para validar cajeros disponibles

### **Middleware Requerido:**

- `authenticateToken` - Autenticación JWT
- `requireRole` - Autorización por roles

### **Utilidades Requeridas:**

- `registrarLog` - Para logging de sistema
- `mongoose.startSession()` - Para transacciones de BD

## 📈 Métricas y Monitoreo

### **Métricas Disponibles:**

- Total de transacciones por tipo/categoría
- Montos procesados por período
- Efectividad de cajeros
- Tiempos de procesamiento
- Transacciones fallidas/rechazadas

### **Alertas Recomendadas:**

- Transacciones pendientes por más de 24h
- Múltiples transacciones fallidas
- Saldo negativo en jugadores
- Cajeros con alta tasa de rechazo

## 🔮 Extensibilidad

### **Funcionalidades Futuras Preparadas:**

- ✅ Nuevas categorías de transacciones
- ✅ Múltiples monedas (campo `tasaCambio`)
- ✅ Comisiones variables
- ✅ Promociones y descuentos
- ✅ Transferencias entre jugadores
- ✅ Wallets externos
- ✅ Criptomonedas

### **Campos Extensibles:**

- `metadata.extra` - Para datos adicionales
- `infoPago` - Para nuevos métodos de pago
- `referenciaExterna` - Para nuevas entidades

---

## 📝 Notas Importantes

1. **Todas las cantidades se manejan en centavos** para evitar problemas de precisión decimal
2. **Las transacciones son atómicas** utilizando MongoDB sessions
3. **El sistema valida automáticamente** la consistencia de saldos
4. **Los reembolsos se procesan automáticamente** en cancelaciones de sala
5. **Los cajeros solo manejan depósitos y retiros** de dinero real
6. **El sistema mantiene auditoría completa** de todas las operaciones

---

## 📋 Historial de Cambios

### **v1.2 - Diciembre 30, 2024**

- 🧹 **SIMPLIFICADO:** Eliminadas funciones auxiliares del backend
- ⭐ **UNIFICADO:** Solo se usa endpoint `/procesar-automatica` para todas las transacciones automáticas
- 🎯 **OPTIMIZADO:** Arquitectura más limpia y mantenible
- 📚 **ACTUALIZADO:** Documentación reflejando la nueva arquitectura simplificada

### **v1.1 - Diciembre 30, 2024**

- ⭐ **NUEVO:** Agregado endpoint `POST /api/transacciones/procesar-automatica`
- ✅ **IMPLEMENTADO:** Sistema completo de transacciones automáticas
- ✅ **PROBADO:** Validación exitosa con pagos de entrada y reembolsos
- 📚 **DOCUMENTADO:** Casos de uso actualizados con ejemplos reales

### **v1.0 - Diciembre 2024**

- 🎯 Versión inicial del sistema de transacciones
- 📊 Modelo de datos completo
- 🔧 Funciones auxiliares implementadas
- 🌐 Endpoints básicos para cajeros y consultas

---

_Documento actualizado: Diciembre 30, 2024_
_Versión del sistema: 1.2_
