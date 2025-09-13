# Funcionalidad de Abandonar Sala

## Descripción General

Se ha implementado una nueva funcionalidad que permite a los jugadores abandonar salas en las que están participando. Cuando un usuario ya está en una sala, en lugar de mostrar el botón "Unirme", se muestra el botón "Abandonar Sala".

## 🎯 Problema Resuelto

### **Antes:**

- Los usuarios veían el botón "Unirme" incluso cuando ya estaban en la sala
- No había forma de abandonar una sala desde el bot
- Confusión para los usuarios sobre su estado en la sala

### **Después:**

- ✅ Botón dinámico que cambia según el estado del usuario
- ✅ "🎯 Unirme" cuando el usuario NO está en la sala
- ✅ "🚪 Abandonar Sala" cuando el usuario SÍ está en la sala
- ✅ Funcionalidad completa para abandonar salas

## 🔧 Implementación Técnica

### 1. **Backend API - Nuevo Método**

Se agregó el método `eliminarJugadorDeSala` al backend API:

```javascript
async eliminarJugadorDeSala(salaId, jugadorId) {
  await this.ensureAuth();
  const res = await this.client.post(`/api/salas/${salaId}/eliminar-jugador`, {
    jugadorId,
  });
  return res.data;
}
```

### 2. **Función `sendFilteredRooms` Mejorada**

Se modificó la función para recibir el usuario actual y verificar si está en cada sala:

```javascript
async function sendFilteredRooms(bot, chatId, salas, gameId, gameName, api, currentUser = null)
```

#### **Lógica de Detección:**

1. **Comparación por telegramId**: Si el jugador tiene `telegramId`, se compara directamente
2. **Búsqueda en backend**: Si no se encuentra por telegramId, se busca el jugador en el backend
3. **Comparación por ID**: Se compara el ID del jugador con los IDs en la sala

#### **Botones Dinámicos:**

```javascript
let buttonText, callbackData;
if (userInSala) {
  buttonText = "🚪 Abandonar Sala";
  callbackData = `leave:${s._id}`;
} else {
  buttonText = "🎯 Unirme";
  callbackData = `join:${s._id}`;
}
```

### 3. **Handler de Abandonar Sala**

Se implementó `handleLeaveSala` en `handlers/callbacks.js`:

```javascript
async function handleLeaveSala(bot, api, callbackQuery, salaId) {
  // 1) Buscar jugador en backend
  const jugador = await registerOrFindPlayer(api, from);

  // 2) Llamar endpoint para eliminar
  const leaveRes = await api.eliminarJugadorDeSala(salaId, jugador._id);

  // 3) Responder al usuario
  await bot.sendMessage(chatId, "✅ ¡Has abandonado la sala exitosamente!");
}
```

### 4. **Manejo de Errores**

Se implementó manejo específico de errores:

- **"No estás en esta sala"**: Informa que no puede abandonar una sala en la que no está
- **"No puedes abandonar"**: Maneja restricciones del backend
- **Errores genéricos**: Mensaje de error estándar

## 📱 Experiencia del Usuario

### **Flujo de Usuario:**

1. **Usuario ve salas**: Se muestran todas las salas del juego seleccionado
2. **Botones dinámicos**:
   - Si NO está en la sala → "🎯 Unirme"
   - Si SÍ está en la sala → "🚪 Abandonar Sala"
3. **Acción del usuario**:
   - Clic en "Unirme" → Se une a la sala
   - Clic en "Abandonar Sala" → Abandona la sala
4. **Confirmación**: Mensaje de confirmación con detalles

### **Mensajes de Confirmación:**

#### **Al Abandonar Sala:**

```
✅ **¡Has abandonado la sala exitosamente!**

🎮 **Sala:** sala_123
👥 **Jugadores restantes:** 2

📋 **Próximos pasos:**
• Puedes unirte a otra sala
• O crear una nueva sala
• ¡Gracias por participar!
```

#### **Errores:**

```
ℹ️ **No estás en esta sala**

No puedes abandonar una sala en la que no estás participando.
```

## 🧪 Scripts de Prueba

### 1. **`test-abandonar-sala.js`**

- Prueba la detección de usuario en sala
- Verifica que los botones cambien correctamente
- Simula diferentes escenarios

### 2. **`test-eliminar-jugador-endpoint.js`**

- Prueba el endpoint del backend
- Verifica que el jugador se elimine correctamente
- Valida la respuesta del servidor

## 🔄 Actualizaciones de Código

### **Archivos Modificados:**

1. **`api/backend.js`**

   - Agregado método `eliminarJugadorDeSala`

2. **`utils/helpers.js`**

   - Modificada función `sendFilteredRooms`
   - Agregada lógica de detección de usuario en sala
   - Botones dinámicos según estado

3. **`handlers/callbacks/sala-callbacks.js`**

   - Agregado `handleLeaveSala`
   - Manejo de cancelación automática de salas
   - Manejo de errores específicos

4. **`handlers/commands.js`**

   - Actualizada llamada a `sendFilteredRooms`

5. **`handlers/messages.js`**

   - Actualizada llamada a `sendFilteredRooms`

6. **`scripts/test-cancelacion-automatica-sala.js`**
   - Nuevo script de prueba para cancelación automática

## ⚙️ Configuración

### **Variables de Entorno:**

No se requieren nuevas variables de entorno. La funcionalidad usa la configuración existente.

### **Endpoint del Backend:**

```
POST /api/salas/:salaId/eliminar-jugador
Body: { jugadorId: "string" }
```

## 🎯 Beneficios

### **Para el Usuario:**

- ✅ Claridad sobre su estado en cada sala
- ✅ Facilidad para abandonar salas
- ✅ Mejor experiencia de navegación
- ✅ Menos confusión

### **Para el Sistema:**

- ✅ Gestión correcta de participantes
- ✅ Mejor control de salas
- ✅ Logs más informativos
- ✅ Funcionalidad completa

## 🚀 Próximas Mejoras Sugeridas

1. **✅ Confirmación de Abandono**: Implementado - Preguntar antes de abandonar
2. **Notificaciones**: Avisar a otros jugadores cuando alguien abandona
3. **Estadísticas**: Rastrear abandonos por sala
4. **Restricciones**: Limitar abandonos en ciertas condiciones
5. **✅ Cancelación Automática**: Implementado - Cancelar sala cuando queda vacía

## 📝 Notas de Implementación

- **Compatibilidad**: Totalmente compatible con el sistema existente
- **Rendimiento**: Impacto mínimo en el rendimiento
- **Seguridad**: Valida permisos y estado antes de permitir abandono
- **Logs**: Registra todas las acciones de abandono

---

_Documento generado automáticamente - Última actualización: Agosto 2025_
