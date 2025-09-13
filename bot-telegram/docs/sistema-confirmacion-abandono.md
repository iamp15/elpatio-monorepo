# Sistema de Confirmación al Abandonar Sala

## Descripción

Se ha implementado un sistema de confirmación que requiere que el usuario confirme su intención antes de abandonar una sala. Esto previene abandonos accidentales y mejora la experiencia del usuario.

## Flujo de Funcionamiento

### 1. Visualización de Salas

Cuando un usuario ve las salas disponibles:

- **Si está en la sala**: Ve el botón "🚪 Abandonar Sala"
- **Si no está en la sala**: Ve el botón "🎯 Unirme"

### 2. Proceso de Confirmación

1. **Usuario hace clic en "Abandonar Sala"**

   - Se ejecuta el callback `confirm_leave:{salaId}`
   - Se muestra un mensaje de confirmación

2. **Mensaje de Confirmación**

   ```
   ⚠️ ¿Estás seguro de que quieres abandonar la sala?

   🎮 Sala: [Nombre de la Sala]
   👤 Usuario: [Nombre del Usuario]

   ⚠️ Esta acción no se puede deshacer.

   ¿Deseas continuar?
   ```

3. **Botones de Confirmación**
   - **✅ Sí, abandonar**: Ejecuta `leave:{salaId}`
   - **❌ Cancelar**: Ejecuta `cancel_leave:{salaId}`

### 3. Resultados Posibles

#### Confirmación Exitosa

- Se ejecuta el abandono real de la sala
- Se muestra mensaje de confirmación con nombre de la sala
- Se actualiza la lista de jugadores restantes

#### Cancelación

- Se muestra mensaje de cancelación
- El usuario permanece en la sala
- No se ejecuta ninguna acción en el backend

## Implementación Técnica

### Archivos Modificados

#### `utils/helpers.js`

- **Función**: `sendFilteredRooms`
- **Cambio**: El callback del botón "Abandonar Sala" cambió de `leave:` a `confirm_leave:`

#### `handlers/callbacks.js`

- **Nuevas funciones**:

  - `handleConfirmLeaveSala`: Maneja la confirmación inicial
  - `handleCancelLeaveSala`: Maneja la cancelación
  - `handleLeaveSala`: Mantiene la funcionalidad original (ahora solo se ejecuta tras confirmación)

- **Función modificada**:
  - `handleCallbackQuery`: Agregados nuevos casos para `confirm_leave:` y `cancel_leave:`

### Callbacks Implementados

| Callback                 | Función                  | Descripción                      |
| ------------------------ | ------------------------ | -------------------------------- |
| `confirm_leave:{salaId}` | `handleConfirmLeaveSala` | Muestra confirmación de abandono |
| `leave:{salaId}`         | `handleLeaveSala`        | Ejecuta el abandono real         |
| `cancel_leave:{salaId}`  | `handleCancelLeaveSala`  | Cancela el proceso de abandono   |

## Beneficios

### Para el Usuario

- ✅ **Previene abandonos accidentales**
- ✅ **Información clara** sobre la acción a realizar
- ✅ **Posibilidad de cancelar** antes de confirmar
- ✅ **Feedback visual** con emojis y mensajes descriptivos

### Para el Sistema

- ✅ **Reducción de errores** por clics accidentales
- ✅ **Mejor experiencia de usuario**
- ✅ **Logs más claros** de las acciones realizadas
- ✅ **Consistencia** en el flujo de interacción

## Casos de Uso

### Caso 1: Abandono Confirmado

1. Usuario ve salas → Botón "Abandonar Sala"
2. Usuario hace clic → Mensaje de confirmación
3. Usuario confirma → Abandono ejecutado
4. Usuario recibe confirmación de abandono

### Caso 2: Abandono Cancelado

1. Usuario ve salas → Botón "Abandonar Sala"
2. Usuario hace clic → Mensaje de confirmación
3. Usuario cancela → Mensaje de cancelación
4. Usuario permanece en la sala

### Caso 3: Error en Confirmación

1. Usuario ve salas → Botón "Abandonar Sala"
2. Error al obtener información de sala → Mensaje de error
3. Usuario puede intentar nuevamente

## Pruebas

### Script de Prueba

Se ha creado `scripts/test-confirmacion-abandono.js` que simula:

- Visualización de salas con botones dinámicos
- Confirmación de abandono
- Cancelación del abandono
- Ejecución del abandono confirmado

### Ejecución de Pruebas

```bash
node scripts/test-confirmacion-abandono.js
```

## Consideraciones Futuras

### Posibles Mejoras

- **Timeout automático**: Cancelar automáticamente después de X minutos
- **Confirmación por texto**: Permitir confirmar escribiendo "SÍ" o "CONFIRMAR"
- **Historial de confirmaciones**: Guardar estadísticas de confirmaciones vs cancelaciones
- **Personalización**: Permitir a los usuarios desactivar la confirmación

### Integración con Otros Sistemas

- **Notificaciones**: Enviar notificación a otros jugadores cuando alguien abandona
- **Estadísticas**: Registrar tiempo entre confirmación y cancelación
- **Analytics**: Medir efectividad del sistema de confirmación

## Conclusión

El sistema de confirmación al abandonar una sala proporciona una capa adicional de seguridad que mejora significativamente la experiencia del usuario al prevenir acciones accidentales. La implementación es robusta, maneja errores apropiadamente y mantiene la consistencia con el resto del sistema.
