# Mensajes de Error cuando el Jugador está Jugando

## Descripción

Se han implementado mensajes de error específicos y claros cuando el backend rechaza las acciones de crear sala o unirse a sala debido a que el jugador tiene la propiedad `jugando = true`.

## Cambios Implementados

### 1. **Eliminación de Validación Duplicada**

**Problema anterior:**

- El bot verificaba `jugador.estado === "jugando"` antes de enviar la solicitud al backend
- Esto creaba validación duplicada e inconsistente

**Solución:**

- Se eliminó la validación del lado del bot
- El backend es el único responsable de verificar `jugador.jugando === true`

### 2. **Manejo Específico de Errores del Backend**

Se agregaron validaciones específicas para detectar errores relacionados con el estado "jugando":

#### **Para Crear Sala:**

```javascript
if (
  mensaje.includes("No puedes crear una sala mientras estás jugando") ||
  (mensaje.includes("estás jugando") && mensaje.includes("crear"))
) {
  // Mostrar mensaje específico
}
```

#### **Para Unirse a Sala:**

```javascript
if (
  mensaje.includes("No puedes unirte a una sala mientras estás jugando") ||
  (mensaje.includes("estás jugando") && mensaje.includes("unirte"))
) {
  // Mostrar mensaje específico
}
```

## Mensajes de Error Implementados

### 1. **Error al Crear Sala**

**Mensaje mostrado al usuario:**

```
❌ No puedes crear una sala mientras estás jugando

🎮 Estado actual: Jugando
👤 Jugador: [Nombre del Jugador]

💡 Solución:
• Termina tu partida actual
• O espera a que termine automáticamente
• Luego podrás crear una nueva sala
```

### 2. **Error al Unirse a Sala**

**Mensaje mostrado al usuario:**

```
❌ No puedes unirte a una sala mientras estás jugando

🎮 Estado actual: Jugando
👤 Jugador: [Nombre del Jugador]

💡 Solución:
• Termina tu partida actual
• O espera a que termine automáticamente
• Luego podrás unirte a una sala
```

**Callback response:**

```
"Estás jugando, no puedes unirte"
```

## Características de los Mensajes

### ✅ **Claridad**

- Explicación clara del problema
- Estado actual del jugador
- Soluciones específicas

### ✅ **Formato Consistente**

- Uso de emojis para mejor visualización
- Formato Markdown para mejor presentación
- Estructura uniforme entre ambos mensajes

### ✅ **Información Útil**

- Nombre del jugador afectado
- Estado actual ("Jugando")
- Pasos concretos para resolver el problema

### ✅ **Experiencia de Usuario**

- Mensajes no técnicos
- Orientación clara sobre qué hacer
- Tono amigable pero informativo

## Flujo de Validación

### **Crear Sala:**

1. Usuario intenta crear sala
2. Bot envía solicitud al backend
3. Backend verifica `jugador.jugando === true`
4. Si está jugando → Backend devuelve error
5. Bot detecta error específico y muestra mensaje personalizado

### **Unirse a Sala:**

1. Usuario hace clic en "Unirme"
2. Bot envía solicitud al backend
3. Backend verifica `jugador.jugando === true`
4. Si está jugando → Backend devuelve error
5. Bot detecta error específico y muestra mensaje personalizado
6. Bot responde al callback con mensaje apropiado

## Detección de Errores

### **Patrones de Detección:**

- `"No puedes crear una sala mientras estás jugando"`
- `"No puedes unirte a una sala mientras estás jugando"`
- `"estás jugando"` + `"crear"` (para crear sala)
- `"estás jugando"` + `"unirte"` (para unirse a sala)

### **Fallback:**

Si el error no coincide con los patrones específicos, se muestra el mensaje genérico del backend.

## Pruebas

### **Script de Prueba:**

Se creó `scripts/test-mensajes-error-jugando.js` que verifica:

1. **Error al crear sala** → Mensaje específico mostrado
2. **Error al unirse a sala** → Mensaje específico mostrado
3. **Formato de mensajes** → Markdown y estructura correcta
4. **Callback responses** → Respuestas apropiadas

### **Ejecución:**

```bash
node scripts/test-mensajes-error-jugando.js
```

## Beneficios

### **Para el Usuario:**

- **Comprensión clara** del problema
- **Orientación específica** sobre cómo resolverlo
- **Experiencia consistente** en ambos casos

### **Para el Sistema:**

- **Validación centralizada** en el backend
- **Mensajes consistentes** y mantenibles
- **Detección robusta** de errores específicos

### **Para el Desarrollo:**

- **Código más limpio** sin validaciones duplicadas
- **Mantenimiento simplificado** de mensajes
- **Pruebas automatizadas** de la funcionalidad

## Consideraciones Técnicas

### **Compatibilidad:**

- Los mensajes funcionan con diferentes formatos de error del backend
- Detección flexible que maneja variaciones en el texto
- Fallback a mensajes genéricos si es necesario

### **Rendimiento:**

- Validación solo en el backend (más eficiente)
- Detección de errores mediante includes() (rápido)
- No hay llamadas adicionales al backend

### **Mantenibilidad:**

- Mensajes centralizados y fáciles de modificar
- Lógica de detección clara y documentada
- Pruebas automatizadas para validar cambios

## Conclusión

La implementación de mensajes de error específicos para el estado "jugando" mejora significativamente la experiencia del usuario al proporcionar información clara y orientación útil cuando no puede realizar acciones debido a estar participando en una partida activa.
