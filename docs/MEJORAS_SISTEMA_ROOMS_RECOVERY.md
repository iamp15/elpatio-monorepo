# Mejoras para el Sistema de Rooms y Recovery

## Análisis del Problema

Basado en los logs y el código analizado, el problema principal es una **condición de carrera** entre el sistema de limpieza de rooms y el sistema de recovery:

1. **Problema Principal**: Cuando múltiples sockets se desconectan simultáneamente, el room de transacción puede ser eliminado antes de que el recovery manager pueda procesarlo.

2. **Secuencia del Problema**:
   - Socket A (jugador) se desconecta → Recovery detecta transacciones activas
   - Socket B (app de depósitos) se desconecta → Limpia el room inmediatamente
   - Recovery intenta acceder al room → **Room ya no existe** ⚠️

3. **Código Problemático**:
   - `roomsManager.limpiarSocket()` elimina el socket de todas las transacciones
   - Si una transacción queda sin participantes, elimina el room completo
   - No verifica si hay un periodo de gracia activo

## Propuestas de Mejora

### 1. Protección de Rooms durante Periodo de Gracia

**Problema**: Los rooms se eliminan inmediatamente cuando no hay participantes, sin verificar si hay un periodo de gracia activo.

**Solución**: Agregar un sistema de "protección" de rooms durante el periodo de gracia.

### 2. Sincronización entre RoomsManager y RecoveryManager

**Problema**: No hay comunicación entre el sistema de limpieza y el sistema de recovery.

**Solución**: El RoomsManager debe consultar al RecoveryManager antes de eliminar un room.

### 3. Mejora en la Detección de Transacciones Activas

**Problema**: La detección de transacciones activas se hace después de que el socket ya se desconectó.

**Solución**: Capturar las transacciones activas ANTES de limpiar el socket.

### 4. Manejo de Desconexiones Simultáneas

**Problema**: Múltiples desconexiones simultáneas pueden causar condiciones de carrera.

**Solución**: Usar un sistema de cola o locks para procesar desconexiones de forma ordenada.

## Implementación de Mejoras

### Mejora 1: Agregar Protección de Rooms

Modificar `roomsManager.js` para proteger rooms durante el periodo de gracia:

```javascript
// En roomsManager.js

/**
 * Verificar si un room está protegido (en periodo de gracia)
 */
isRoomProtected(transaccionId) {
  if (!this.socketManager.connectionRecoveryManager) {
    return false;
  }
  return this.socketManager.connectionRecoveryManager.isTransactionPending(transaccionId);
}

/**
 * Limpiar socket de todos los rooms (MEJORADO)
 */
limpiarSocket(socketId) {
  // Remover de cajeros disponibles
  this.rooms.cajerosDisponibles.delete(socketId);
  this.rooms.cajerosOcupados.delete(socketId);

  // Remover de jugadores
  for (const [telegramId, sockets] of this.rooms.jugadores.entries()) {
    if (sockets.has(socketId)) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.rooms.jugadores.delete(telegramId);
      }
    }
  }

  // Remover de transacciones (MEJORADO: verificar protección)
  const transaccionesParaLimpiar = [];
  for (const [transaccionId, sockets] of this.rooms.transacciones.entries()) {
    if (sockets.has(socketId)) {
      sockets.delete(socketId);
      
      // Si el room queda vacío, verificar si está protegido
      if (sockets.size === 0) {
        if (this.isRoomProtected(transaccionId)) {
          console.log(
            `🛡️ [ROOMS] Room de transacción ${transaccionId} protegido durante periodo de gracia`
          );
          // NO eliminar el room, mantenerlo para recovery
        } else {
          transaccionesParaLimpiar.push(transaccionId);
        }
      }
    }
  }

  // Limpiar solo los rooms no protegidos
  transaccionesParaLimpiar.forEach((transaccionId) => {
    this.limpiarRoomTransaccion(transaccionId);
  });

  // Remover de admin dashboard
  this.rooms.adminDashboard.delete(socketId);

  console.log(`🧹 [ROOMS] Socket ${socketId} limpiado de todos los rooms`);
}
```

### Mejora 2: Capturar Transacciones Activas ANTES de Limpiar

Modificar `connectionRecoveryManager.js` para capturar transacciones antes de que se limpien:

```javascript
// En connectionRecoveryManager.js

/**
 * Registrar desconexión con tiempo de gracia (MEJORADO)
 */
registerDisconnection(socket) {
  const userType = socket.userType;
  const userId = userType === "jugador" ? socket.telegramId : socket.cajeroId;

  if (!userType || !userId) {
    console.log(
      "⚠️ [RECOVERY] Socket sin tipo o ID, limpiando inmediatamente"
    );
    this.cleanupImmediately(socket.id);
    return;
  }

  // MEJORA: Capturar transacciones activas ANTES de que se limpien
  // Esto evita condiciones de carrera
  const activeTransactions = this.getActiveTransactions(socket.id);

  // Si no hay transacciones activas, limpiar inmediatamente
  if (activeTransactions.length === 0) {
    console.log(
      `🧹 [RECOVERY] ${userType} ${userId} sin transacciones activas, limpiando inmediatamente`
    );
    this.cleanupImmediately(socket.id);
    return;
  }

  // MEJORA: Proteger los rooms ANTES de limpiar el socket
  // Esto previene que otros sockets eliminen el room
  activeTransactions.forEach((transaccionId) => {
    this.protectTransactionRoom(transaccionId);
  });

  const gracePeriod = this.gracePeriodsMs[userType];
  const disconnectionTime = Date.now();

  console.log(
    `⏳ [RECOVERY] ${userType} ${userId} desconectado con ${activeTransactions.length} transacciones activas. Tiempo de gracia: ${gracePeriod}ms`
  );

  // Guardar información de desconexión
  const disconnectionInfo = {
    socketId: socket.id,
    tipo: userType,
    userId: userId,
    timestamp: disconnectionTime,
    transaccionesActivas: activeTransactions,
    gracePeriod: gracePeriod,
  };

  this.disconnectedUsers.set(socket.id, disconnectionInfo);

  // Registrar transacciones pendientes
  activeTransactions.forEach((transaccionId) => {
    this.pendingTransactions.set(transaccionId, {
      ...disconnectionInfo,
      transaccionId,
      estadoDesconexion: "esperando_reconexion",
    });
  });

  // Notificar a los participantes sobre la desconexión temporal
  this.notifyTemporaryDisconnection(disconnectionInfo);

  // Configurar timer para limpieza después del periodo de gracia
  const timer = setTimeout(() => {
    this.handleGracePeriodExpired(socket.id);
  }, gracePeriod);

  disconnectionInfo.timer = timer;

  // AHORA SÍ limpiar el socket (los rooms ya están protegidos)
  this.socketManager.roomsManager.limpiarSocket(socket.id);
}

/**
 * Proteger un room de transacción durante el periodo de gracia
 */
protectTransactionRoom(transaccionId) {
  // Marcar el room como protegido
  if (!this.protectedRooms) {
    this.protectedRooms = new Set();
  }
  this.protectedRooms.add(transaccionId);
  console.log(
    `🛡️ [RECOVERY] Room de transacción ${transaccionId} protegido`
  );
}

/**
 * Desproteger un room de transacción
 */
unprotectTransactionRoom(transaccionId) {
  if (this.protectedRooms) {
    this.protectedRooms.delete(transaccionId);
    console.log(
      `🔓 [RECOVERY] Room de transacción ${transaccionId} desprotegido`
    );
  }
}
```

### Mejora 3: Verificar Existencia del Room antes de Acceder

Modificar `rejoinTransactionRoom` para manejar mejor cuando el room no existe:

```javascript
// En connectionRecoveryManager.js

/**
 * Re-unir socket a room de transacción (MEJORADO)
 */
async rejoinTransactionRoom(socket, transaccionId) {
  try {
    console.log(
      `🔄 [RECOVERY] Re-uniendo socket ${socket.id} a transacción ${transaccionId}`
    );

    // MEJORA: Verificar si el room existe antes de intentar acceder
    const roomExists = this.socketManager.roomsManager.rooms.transacciones.has(
      transaccionId
    );

    if (!roomExists) {
      console.log(
        `⚠️ [RECOVERY] Room de transacción ${transaccionId} no existe, recreándolo...`
      );
      // Recrear el room si no existe
      this.socketManager.roomsManager.rooms.transacciones.set(
        transaccionId,
        new Set()
      );
    }

    // Obtener estado actual de la transacción desde la BD
    const Transaccion = require("../models/Transaccion");
    const transaccion = await Transaccion.findById(transaccionId)
      .populate("jugadorId", "telegramId nickname firstName")
      .populate("cajeroId", "nombreCompleto email datosPagoMovil");

    if (!transaccion) {
      console.error(
        `❌ [RECOVERY] Transacción ${transaccionId} no encontrada`
      );
      return false;
    }

    // Estados finales que no requieren recuperación
    const estadosFinales = [
      "completada",
      "rechazada",
      "cancelada",
      "fallida",
      "revertida",
    ];

    if (estadosFinales.includes(transaccion.estado)) {
      console.log(
        `ℹ️ [RECOVERY] Transacción ${transaccionId} en estado final: ${transaccion.estado} - No se recupera`
      );
      socket.emit("transaction-already-finished", {
        transaccionId: transaccionId,
        estado: transaccion.estado,
        mensaje: "La transacción ya ha finalizado y no requiere acción",
      });
      return false;
    }

    console.log(
      `✅ [RECOVERY] Transacción ${transaccionId} en estado activo: ${transaccion.estado} - Recuperando`
    );

    // Agregar a room usando roomsManager
    this.socketManager.roomsManager.agregarParticipanteTransaccion(
      transaccionId,
      socket.id
    );

    // Desproteger el room ahora que se re-unieron
    this.unprotectTransactionRoom(transaccionId);

    // ... resto del código igual ...
  } catch (error) {
    console.error(
      `❌ [RECOVERY] Error re-uniendo a transacción ${transaccionId}:`,
      error
    );
    return false;
  }
}
```

### Mejora 4: Limpiar Protección al Expirar el Periodo de Gracia

Modificar `handleGracePeriodExpired` para desproteger los rooms:

```javascript
// En connectionRecoveryManager.js

/**
 * Manejar expiración del periodo de gracia (MEJORADO)
 */
handleGracePeriodExpired(socketId) {
  const disconnectionInfo = this.disconnectedUsers.get(socketId);

  if (!disconnectionInfo) {
    console.log(
      `ℹ️ [RECOVERY] Timer de gracia expirado para socket ${socketId} pero ya fue procesado`
    );
    return;
  }

  // Verificar si el usuario ya se reconectó
  const userReconnected = this.checkUserReconnected(
    disconnectionInfo.userId,
    disconnectionInfo.tipo
  );

  if (userReconnected) {
    console.log(
      `ℹ️ [RECOVERY] Usuario ${disconnectionInfo.tipo} ${disconnectionInfo.userId} ya reconectó antes del timeout. Cancelando notificación de timeout.`
    );
    // Desproteger rooms antes de limpiar
    disconnectionInfo.transaccionesActivas.forEach((transaccionId) => {
      this.unprotectTransactionRoom(transaccionId);
      this.pendingTransactions.delete(transaccionId);
    });
    this.disconnectedUsers.delete(socketId);
    return;
  }

  console.log(
    `⏰ [RECOVERY] Periodo de gracia expirado para ${disconnectionInfo.tipo} ${disconnectionInfo.userId}`
  );

  // Marcar transacciones como desconectadas
  for (const transaccionId of disconnectionInfo.transaccionesActivas) {
    this.handleTransactionDisconnectionTimeout(transaccionId);
    this.pendingTransactions.delete(transaccionId);
    // Desproteger el room
    this.unprotectTransactionRoom(transaccionId);
  }

  // Limpiar socket completamente
  this.cleanupImmediately(socketId);

  // Remover de usuarios desconectados
  this.disconnectedUsers.delete(socketId);

  // Notificar timeout
  this.notifyDisconnectionTimeout(disconnectionInfo);
}
```

### Mejora 5: Agregar Método para Verificar Protección en RoomsManager

Agregar método en `roomsManager.js` para verificar protección:

```javascript
// En roomsManager.js

/**
 * Verificar si un room está protegido (en periodo de gracia)
 */
isRoomProtected(transaccionId) {
  if (!this.socketManager.connectionRecoveryManager) {
    return false;
  }
  return this.socketManager.connectionRecoveryManager.isTransactionPending(transaccionId);
}

/**
 * Limpiar room de transacción (MEJORADO: verificar protección)
 */
limpiarRoomTransaccion(transaccionId) {
  // Verificar si el room está protegido
  if (this.isRoomProtected(transaccionId)) {
    console.log(
      `🛡️ [ROOMS] Room de transacción ${transaccionId} está protegido, no se puede limpiar`
    );
    return;
  }

  if (this.rooms.transacciones.has(transaccionId)) {
    const participantes = this.rooms.transacciones.get(transaccionId);

    // Hacer que todos salgan del room
    participantes.forEach((socketId) => {
      const socket = this.socketManager.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(`transaccion-${transaccionId}`);
      }
    });

    this.rooms.transacciones.delete(transaccionId);
    console.log(`💰 [ROOMS] Room de transacción ${transaccionId} limpiado`);
  }
}
```

## Resumen de Cambios

### Archivos a Modificar:

1. **`elpatio-backend/websocket/roomsManager.js`**:
   - Agregar método `isRoomProtected()`
   - Modificar `limpiarSocket()` para verificar protección
   - Modificar `limpiarRoomTransaccion()` para verificar protección

2. **`elpatio-backend/websocket/connectionRecoveryManager.js`**:
   - Agregar propiedad `protectedRooms`
   - Agregar métodos `protectTransactionRoom()` y `unprotectTransactionRoom()`
   - Modificar `registerDisconnection()` para proteger rooms antes de limpiar
   - Modificar `rejoinTransactionRoom()` para recrear room si no existe
   - Modificar `handleGracePeriodExpired()` para desproteger rooms

### Beneficios:

1. ✅ **Elimina condiciones de carrera**: Los rooms están protegidos durante el periodo de gracia
2. ✅ **Mejora la recuperación**: Los rooms se recrean si fueron eliminados prematuramente
3. ✅ **Mejor sincronización**: El RoomsManager consulta al RecoveryManager antes de eliminar
4. ✅ **Más robustez**: El sistema maneja mejor las desconexiones simultáneas

### Pruebas Recomendadas:

1. Desconectar múltiples participantes simultáneamente
2. Verificar que los rooms se protegen durante el periodo de gracia
3. Verificar que los rooms se recrean si fueron eliminados
4. Verificar que la recuperación funciona correctamente después de las mejoras
