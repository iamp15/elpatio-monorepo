# Diagnóstico y Limpieza de Rooms de Transacciones

## Formas de Uso

Los métodos de diagnóstico y limpieza se pueden usar de **3 formas diferentes**:

1. **Script Manual** (Recomendado para uso ocasional)
2. **Eventos WebSocket** (Para integración en apps/dashboards)
3. **Limpieza Automática** (Configurable, deshabilitada por defecto)

---

## 1. Script Manual (Recomendado)

### Instalación

El script está en `elpatio-backend/scripts/diagnosticarRooms.js`

**Requisitos:**
- Node.js instalado
- Dependencias instaladas: `npm install` (necesita `axios`)
- Variable de entorno `BACKEND_URL` configurada (o usa el valor por defecto)

### Configuración

Agregar en `.env`:
```env
BACKEND_URL=https://elpatio-backend.fly.dev
```

Si no se configura, el script usa `https://elpatio-backend.fly.dev` por defecto.

### Uso

```bash
# Desde la raíz del proyecto backend
cd elpatio-backend

# Solo diagnóstico
node scripts/diagnosticarRooms.js diagnostico

# Solo limpieza
node scripts/diagnosticarRooms.js limpiar

# Diagnóstico y limpieza (por defecto)
node scripts/diagnosticarRooms.js ambos
```

**Nota:** El script se conecta al servidor remoto en Fly.io mediante endpoints REST. No requiere que el servidor esté corriendo localmente.

### Ejemplo de Salida

```
🔍 ===== DIAGNÓSTICO DE ROOMS DE TRANSACCIONES =====
📅 Fecha: 15/01/2025, 13:30:45

✅ Usando RoomsManager del servidor activo

📊 RESUMEN:
   Total de rooms: 18
   Rooms con participantes: 5
   Rooms vacíos: 13
   Rooms protegidos: 2
   Rooms huérfanos: 11

📋 DETALLES:
   1. 695fab92... | ✅ ACTIVO | Participantes: 2
   2. 692c53ec... | 🔴 HUÉRFANO | Participantes: 0
   ...

✅ Diagnóstico completado
```

### Ventajas

- ✅ No requiere servidor activo para diagnóstico
- ✅ Fácil de ejecutar desde terminal
- ✅ Útil para debugging y mantenimiento
- ✅ Puede ejecutarse en cualquier momento

---

## 2. Eventos WebSocket (Para Apps/Dashboards)

### Requisitos

- El servidor debe estar activo
- El socket debe estar autenticado como `cajero` o `admin`

### Uso desde Cliente

```javascript
// Conectar al WebSocket
const socket = io('http://localhost:3000');

// Autenticarse como cajero/admin
socket.emit('auth-cajero', { token: 'tu-jwt-token' });

// Diagnosticar rooms
socket.emit('diagnosticar-rooms-transacciones');

socket.on('diagnostico-rooms-transacciones', (diagnostico) => {
  console.log('Total rooms:', diagnostico.totalRooms);
  console.log('Huérfanos:', diagnostico.roomsHuerfanos);
  
  // Mostrar en UI
  mostrarDiagnostico(diagnostico);
});

// Limpiar rooms huérfanos
socket.emit('limpiar-rooms-huerfanos');

socket.on('limpieza-rooms-completada', (resultado) => {
  console.log('Limpiados:', resultado.limpiados);
  mostrarNotificacion(`Se limpiaron ${resultado.limpiados} rooms`);
});
```

### Ventajas

- ✅ Integración directa en dashboards
- ✅ Tiempo real
- ✅ Puede ejecutarse desde la UI
- ✅ Respuestas inmediatas

---

## 3. Limpieza Automática (Opcional)

### Configuración

La limpieza automática está **deshabilitada por defecto**. Para habilitarla:

**Archivo `.env`:**
```env
# Habilitar limpieza automática de rooms
ROOMS_CLEANUP_ENABLED=true

# Frecuencia (expresión cron)
# Por defecto: cada 6 horas (0 */6 * * *)
ROOMS_CLEANUP_CRON=0 */6 * * *
```

### Ejemplos de Expresiones Cron

```env
# Cada 6 horas
ROOMS_CLEANUP_CRON=0 */6 * * *

# Cada hora
ROOMS_CLEANUP_CRON=0 * * * *

# Cada día a medianoche
ROOMS_CLEANUP_CRON=0 0 * * *

# Cada 30 minutos
ROOMS_CLEANUP_CRON=*/30 * * * *
```

### Comportamiento

- Se ejecuta automáticamente según el cron configurado
- Primero diagnostica, luego limpia solo si hay huérfanos
- Respeta rooms protegidos
- Genera logs informativos

### Ventajas

- ✅ Mantenimiento automático
- ✅ No requiere intervención manual
- ✅ Configurable según necesidades
- ✅ Reduce acumulación de rooms huérfanos

---

## Problema Identificado

Cuando hay muchas transacciones activas o cuando el sistema no limpia correctamente los rooms, pueden acumularse rooms "huérfanos" en memoria. Esto puede causar:

- Consumo innecesario de memoria
- Confusión en los logs
- Dificultad para identificar transacciones realmente activas

## Funcionalidades Implementadas

### 1. Diagnóstico de Rooms

Permite obtener información detallada sobre el estado de todos los rooms de transacciones.

**Evento WebSocket:** `diagnosticar-rooms-transacciones`

**Respuesta:**
```javascript
{
  totalRooms: 18,
  roomsConParticipantes: 5,
  roomsVacios: 13,
  roomsProtegidos: 2,
  roomsHuerfanos: 11,
  detalles: [
    {
      transaccionId: "695fab92ea493d1c92a07bf3",
      participantes: 2,
      socketIds: ["socket1", "socket2"],
      protegido: false,
      huerfano: false
    },
    // ... más rooms
  ]
}
```

**Uso desde cliente WebSocket:**
```javascript
socket.emit("diagnosticar-rooms-transacciones");

socket.on("diagnostico-rooms-transacciones", (diagnostico) => {
  console.log("Total de rooms:", diagnostico.totalRooms);
  console.log("Rooms huérfanos:", diagnostico.roomsHuerfanos);
  console.log("Detalles:", diagnostico.detalles);
});
```

### 2. Limpieza de Rooms Huérfanos

Permite limpiar automáticamente los rooms que están vacíos y no están protegidos.

**Evento WebSocket:** `limpiar-rooms-huerfanos`

**Respuesta:**
```javascript
{
  limpiados: 11,
  protegidos: 2,
  conParticipantes: 5,
  detalles: [
    {
      transaccionId: "695fab92ea493d1c92a07bf3",
      razon: "vacío y no protegido"
    },
    // ... más rooms limpiados
  ]
}
```

**Uso desde cliente WebSocket:**
```javascript
socket.emit("limpiar-rooms-huerfanos");

socket.on("limpieza-rooms-completada", (resultado) => {
  console.log("Rooms limpiados:", resultado.limpiados);
  console.log("Rooms protegidos (no limpiados):", resultado.protegidos);
  console.log("Rooms con participantes:", resultado.conParticipantes);
});
```

### 3. Métodos Internos

#### `diagnosticarRoomsTransacciones()`

Retorna un diagnóstico completo del estado de todos los rooms.

```javascript
const diagnostico = roomsManager.diagnosticarRoomsTransacciones();
```

#### `limpiarRoomsHuerfanos()`

Limpia solo los rooms que están completamente vacíos y no protegidos.

```javascript
const cantidadLimpiada = roomsManager.limpiarRoomsHuerfanos();
console.log(`Se limpiaron ${cantidadLimpiada} rooms huérfanos`);
```

#### `limpiarRoomsVacios()`

Limpia todos los rooms vacíos, pero respeta los protegidos. Retorna un resumen detallado.

```javascript
const resultado = roomsManager.limpiarRoomsVacios();
console.log(`Limpiados: ${resultado.limpiados}`);
console.log(`Protegidos: ${resultado.protegidos}`);
console.log(`Con participantes: ${resultado.conParticipantes}`);
```

## Permisos

Ambas funcionalidades requieren que el socket esté autenticado como:
- `cajero`
- `admin`

Si el usuario no tiene permisos, recibirá un error:
```javascript
{
  message: "Solo cajeros y administradores pueden diagnosticar/limpiar rooms"
}
```

## Casos de Uso

### 1. Diagnóstico Periódico

Ejecutar diagnóstico periódicamente para monitorear la salud del sistema:

```javascript
// Cada 5 minutos
setInterval(() => {
  socket.emit("diagnosticar-rooms-transacciones");
}, 5 * 60 * 1000);

socket.on("diagnostico-rooms-transacciones", (diagnostico) => {
  if (diagnostico.roomsHuerfanos > 10) {
    console.warn("⚠️ Muchos rooms huérfanos detectados:", diagnostico.roomsHuerfanos);
    // Opcionalmente, limpiar automáticamente
    socket.emit("limpiar-rooms-huerfanos");
  }
});
```

### 2. Limpieza Manual

Permitir a administradores limpiar rooms manualmente desde el dashboard:

```javascript
// Botón en dashboard de admin
function limpiarRoomsHuerfanos() {
  socket.emit("limpiar-rooms-huerfanos");
  
  socket.on("limpieza-rooms-completada", (resultado) => {
    mostrarNotificacion(
      `Se limpiaron ${resultado.limpiados} rooms huérfanos`
    );
  });
}
```

### 3. Debugging

Usar el diagnóstico para entender por qué hay muchos rooms:

```javascript
socket.emit("diagnosticar-rooms-transacciones");

socket.on("diagnostico-rooms-transacciones", (diagnostico) => {
  console.log("=== Diagnóstico de Rooms ===");
  console.log("Total:", diagnostico.totalRooms);
  console.log("Con participantes:", diagnostico.roomsConParticipantes);
  console.log("Vacíos:", diagnostico.roomsVacios);
  console.log("Protegidos:", diagnostico.roomsProtegidos);
  console.log("Huérfanos:", diagnostico.roomsHuerfanos);
  
  // Mostrar detalles de rooms huérfanos
  const huerfanos = diagnostico.detalles.filter(r => r.huerfano);
  console.log("Rooms huérfanos:", huerfanos);
});
```

## Logs Generados

### Diagnóstico
```
🔍 [DIAGNOSTICO] Diagnóstico de rooms enviado a socket123: {
  total: 18,
  conParticipantes: 5,
  vacios: 13,
  protegidos: 2,
  huerfanos: 11
}
```

### Limpieza
```
🧹 [ROOMS] Limpiando 11 rooms huérfanos...
🧹 [ROOMS] Room huérfano 695fab92ea493d1c92a07bf3 limpiado
🧹 [ROOMS] Limpieza completada: 11 limpiados, 2 protegidos, 5 con participantes
🧹 [LIMPIEZA] Limpieza de rooms completada por socket123: {
  limpiados: 11,
  protegidos: 2,
  conParticipantes: 5
}
```

## Mejores Prácticas

1. **Ejecutar diagnóstico antes de limpiar**: Verifica qué se va a limpiar
2. **Respetar rooms protegidos**: Nunca limpiar manualmente rooms en periodo de gracia
3. **Monitorear regularmente**: Ejecutar diagnóstico periódicamente
4. **Limpiar solo cuando sea necesario**: No limpiar en cada desconexión, solo cuando se acumulen

## Integración con Sistema de Recovery

Los métodos de limpieza respetan el sistema de protección de rooms:

- **Rooms protegidos**: No se limpian (están en periodo de gracia)
- **Rooms con participantes**: No se limpian (están activos)
- **Rooms huérfanos**: Se limpian (vacíos y no protegidos)

Esto asegura que el sistema de recovery funcione correctamente y no se eliminen rooms que están esperando reconexión.
