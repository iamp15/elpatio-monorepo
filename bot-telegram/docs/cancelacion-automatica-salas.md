# Cancelación Automática de Salas

## Descripción General

Se ha implementado la funcionalidad de cancelación automática de salas cuando todos los jugadores las abandonan. Esta funcionalidad se ejecuta en el backend y el bot maneja la respuesta correspondiente.

## 🎯 Problema Resuelto

### **Antes:**

- Las salas quedaban "huérfanas" cuando todos los jugadores las abandonaban
- No había limpieza automática del sistema
- Confusión para administradores y usuarios

### **Después:**

- ✅ Cancelación automática cuando la sala queda vacía
- ✅ Notificación clara al usuario sobre la cancelación
- ✅ Limpieza automática del sistema
- ✅ Mejor experiencia de usuario

## 🔧 Implementación Técnica

### 1. **Backend - Cancelación Automática**

El backend ahora verifica automáticamente si una sala queda vacía después de que un jugador la abandone:

```javascript
// En el endpoint /api/salas/{salaId}/eliminar-jugador
async function eliminarJugadorDeSala(salaId, jugadorId) {
  // 1. Eliminar jugador de la sala
  const sala = await Sala.findById(salaId);
  sala.jugadores = sala.jugadores.filter((j) => j.toString() !== jugadorId);
  await sala.save();

  // 2. Verificar si la sala quedó vacía
  if (sala.jugadores.length === 0) {
    // 3. Cancelar la sala automáticamente
    sala.estado = "cancelada";
    sala.fechaCancelacion = new Date();
    sala.motivoCancelacion = "Sala vacía - todos los jugadores abandonaron";
    await sala.save();

    return { sala, cancelada: true };
  }

  return { sala, cancelada: false };
}
```

### 2. **Bot - Manejo de Respuesta**

El bot ahora maneja dos escenarios diferentes según la respuesta del backend:

#### **Escenario 1: Sala Cancelada**

```javascript
if (salaCancelada) {
  await bot.sendMessage(
    chatId,
    `✅ **¡Has abandonado la sala exitosamente!**

🎮 **Sala:** ${sala.nombre}
⚠️ **La sala ha sido cancelada** porque quedó sin jugadores.

📋 **Próximos pasos:**
• Puedes crear una nueva sala
• O unirte a otra sala disponible
• ¡Gracias por participar!`,
    { parse_mode: "Markdown" }
  );

  await bot.answerCallbackQuery(callbackQuery.id, {
    text: "✅ Sala abandonada y cancelada",
  });
}
```

#### **Escenario 2: Sala No Cancelada**

```javascript
else {
  await bot.sendMessage(
    chatId,
    `✅ **¡Has abandonado la sala exitosamente!**

🎮 **Sala:** ${sala.nombre}
👥 **Jugadores restantes:** ${sala.jugadores?.length || 0}

📋 **Próximos pasos:**
• Puedes unirte a otra sala
• O crear una nueva sala
• ¡Gracias por participar!`,
    { parse_mode: "Markdown" }
  );

  await bot.answerCallbackQuery(callbackQuery.id, {
    text: "✅ Abandonado la sala exitosamente",
  });
}
```

## 📱 Experiencia del Usuario

### **Flujo de Usuario - Último Jugador:**

1. **Usuario en sala con otros jugadores**

   - Ve botón "🚪 Abandonar Sala"
   - Al hacer clic, recibe confirmación

2. **Usuario confirma abandono**

   - Se elimina de la sala
   - Recibe mensaje de abandono exitoso
   - **Si es el último jugador:**
     - Recibe mensaje especial indicando que la sala fue cancelada
     - Se le sugiere crear una nueva sala o unirse a otra

3. **Usuario ve opciones**
   - Crear nueva sala
   - Unirse a otra sala disponible
   - Continuar navegando

### **Flujo de Usuario - No Último Jugador:**

1. **Usuario abandona sala con otros jugadores**

   - Se elimina de la sala
   - Recibe mensaje de abandono exitoso
   - Se le informa cuántos jugadores quedan

2. **Usuario ve opciones**
   - Unirse a otra sala
   - Crear nueva sala
   - Continuar navegando

## 🧪 Pruebas

### **Script de Prueba**

Se ha creado un script de prueba para verificar la funcionalidad:

```bash
# Probar con salas existentes
node scripts/test-cancelacion-automatica-sala.js

# Probar con sala específica
TEST_SALA_ID=123456 node scripts/test-cancelacion-automatica-sala.js
```

### **Casos de Prueba**

1. **Sala con múltiples jugadores**

   - Un jugador abandona → Sala continúa activa
   - Último jugador abandona → Sala se cancela automáticamente

2. **Sala con un solo jugador**

   - Jugador abandona → Sala se cancela automáticamente

3. **Sala vacía**
   - No se puede abandonar (validación del backend)

## 🔄 Integración con el Sistema

### **Compatibilidad**

- ✅ Compatible con el sistema existente
- ✅ No afecta otras funcionalidades
- ✅ Mantiene la estructura de datos actual

### **Dependencias**

- Backend debe devolver `cancelada: true/false` en la respuesta
- Bot debe manejar ambos escenarios de respuesta
- Sistema de notificaciones (opcional para administradores)

## 📊 Beneficios

### **Para Usuarios:**

- ✅ Claridad sobre el estado de la sala
- ✅ Mejor experiencia de usuario
- ✅ Opciones claras después del abandono

### **Para Administradores:**

- ✅ Limpieza automática del sistema
- ✅ Menos salas "huérfanas"
- ✅ Mejor gestión de recursos

### **Para el Sistema:**

- ✅ Integridad de datos
- ✅ Rendimiento mejorado
- ✅ Escalabilidad

## 🚀 Próximos Pasos

### **Mejoras Futuras:**

1. **Notificaciones a Administradores**

   - Enviar notificación cuando se cancela una sala automáticamente
   - Registrar estadísticas de cancelaciones

2. **Configuración de Tiempo de Espera**

   - Permitir configurar si se cancela inmediatamente o después de un tiempo
   - Opción de "tiempo de gracia" antes de cancelar

3. **Reembolsos Automáticos**

   - Si hay pagos involucrados, manejar reembolsos automáticos
   - Notificar a los jugadores sobre reembolsos

4. **Estadísticas y Métricas**
   - Registrar métricas de cancelaciones automáticas
   - Dashboard para administradores

## 📝 Notas de Implementación

- La funcionalidad es transparente para el usuario
- No requiere cambios en la interfaz de usuario
- Mantiene compatibilidad con versiones anteriores
- Se puede deshabilitar fácilmente si es necesario

---

**Fecha de Implementación:** [Fecha actual]
**Versión:** 1.0
**Estado:** ✅ Implementado y probado


