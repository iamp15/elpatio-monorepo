# Validación de Estado del Jugador al Crear Sala

## Descripción

Se ha implementado una validación adicional que verifica que el jugador no esté en estado "jugando" antes de permitirle crear una nueva sala. Esto previene que los jugadores creen salas mientras están participando en una partida activa.

## Funcionalidad

### Validación Implementada

- **Verificación de estado**: Se comprueba que `jugador.estado !== "jugando"`
- **Bloqueo preventivo**: Si el jugador está jugando, se muestra un mensaje de error y se cancela la creación
- **Mensaje informativo**: Se proporciona información clara sobre el estado actual y las soluciones

### Flujo de Validación

1. **Usuario intenta crear sala** → Se obtiene/registra el jugador
2. **Se verifica el estado** → `jugador.estado === "jugando"`
3. **Si está jugando** → Se muestra error y se cancela
4. **Si no está jugando** → Se continúa con la creación normal

## Implementación Técnica

### Ubicación del Código

**Archivo**: `handlers/callbacks.js`
**Función**: `handleCreateSalaFinal`

### Código Agregado

```javascript
// Verificar que el jugador no esté jugando
if (jugador.estado === "jugando") {
  await bot.sendMessage(
    chatId,
    `❌ **No puedes crear una sala mientras estás jugando**

🎮 **Estado actual:** Jugando
👤 **Jugador:** ${
      jugador.nickname || jugador.firstName || jugador.username || "Jugador"
    }

💡 **Solución:** 
• Termina tu partida actual
• O espera a que termine automáticamente
• Luego podrás crear una nueva sala`,
    { parse_mode: "Markdown" }
  );
  return;
}
```

### Posición en el Flujo

La validación se ejecuta:

1. ✅ **Después de** obtener/registrar el jugador
2. ✅ **Antes de** crear la sala en el backend
3. ✅ **Después de** validar el nombre de la sala

## Casos de Uso

### Caso 1: Jugador Jugando

```
Usuario intenta crear sala → Estado: "jugando" → ❌ Error mostrado → Creación cancelada
```

### Caso 2: Jugador Disponible

```
Usuario intenta crear sala → Estado: "disponible" → ✅ Continuar → Sala creada
```

### Caso 3: Jugador Nuevo

```
Usuario nuevo intenta crear sala → Jugador registrado → Estado: "disponible" → ✅ Continuar → Sala creada
```

## Mensaje de Error

### Estructura del Mensaje

```
❌ No puedes crear una sala mientras estás jugando

🎮 Estado actual: Jugando
👤 Jugador: [Nombre del Jugador]

💡 Solución:
• Termina tu partida actual
• O espera a que termine automáticamente
• Luego podrás crear una nueva sala
```

### Características del Mensaje

- ✅ **Claro y específico** sobre el problema
- ✅ **Información del estado** actual del jugador
- ✅ **Soluciones concretas** para resolver el problema
- ✅ **Formato Markdown** para mejor presentación

## Beneficios

### Para el Sistema

- **Prevención de conflictos**: Evita que jugadores en partida creen salas
- **Consistencia de datos**: Mantiene la integridad del estado del jugador
- **Mejor gestión de recursos**: Evita salas huérfanas o conflictivas

### Para el Usuario

- **Feedback claro**: Entiende por qué no puede crear la sala
- **Orientación**: Sabe qué hacer para resolver el problema
- **Experiencia mejorada**: Evita frustración por intentos fallidos

## Pruebas

### Script de Prueba

Se ha creado `scripts/test-validacion-estado-jugador.js` que verifica:

1. **Jugador jugando** → Debe bloquear la creación
2. **Jugador disponible** → Debe permitir la creación
3. **Nombre inválido** → Debe bloquear por validación de nombre

### Ejecución de Pruebas

```bash
node scripts/test-validacion-estado-jugador.js
```

### Casos de Prueba Cubiertos

- ✅ Jugador con estado "jugando"
- ✅ Jugador con estado "disponible"
- ✅ Jugador nuevo (registro automático)
- ✅ Validación de nombre de sala
- ✅ Manejo de errores

## Consideraciones Futuras

### Posibles Mejoras

- **Estados adicionales**: Validar otros estados como "en partida", "ocupado", etc.
- **Timeout automático**: Considerar estados temporales que se resuelven automáticamente
- **Notificaciones**: Alertar al jugador cuando su estado cambie y pueda crear salas
- **Historial**: Registrar intentos de creación bloqueados para análisis

### Integración con Otros Sistemas

- **Sistema de partidas**: Sincronizar con el estado real de las partidas
- **Notificaciones**: Informar a otros jugadores cuando alguien termine una partida
- **Analytics**: Medir frecuencia de bloqueos por estado

## Compatibilidad

### Estados Soportados

- ✅ `"jugando"` → Bloquea creación
- ✅ `"disponible"` → Permite creación
- ✅ `"en espera"` → Permite creación
- ✅ `null` o `undefined` → Permite creación (fallback)

### Backend Requirements

- El backend debe devolver el campo `estado` en la respuesta del jugador
- Los valores de estado deben ser consistentes entre frontend y backend
- El estado debe actualizarse correctamente al iniciar/terminar partidas

## Conclusión

La validación del estado del jugador al crear una sala proporciona una capa adicional de seguridad que mejora la experiencia del usuario y mantiene la integridad del sistema. La implementación es robusta, maneja todos los casos edge y proporciona feedback claro al usuario.
