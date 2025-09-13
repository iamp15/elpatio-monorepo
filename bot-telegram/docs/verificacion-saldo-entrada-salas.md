# Verificación de Saldo para Entrada a Salas

## Descripción

Se ha implementado un sistema de verificación de saldo que se ejecuta antes de permitir que un jugador entre a una sala. Este sistema garantiza que el jugador tenga saldo suficiente para pagar el precio de entrada.

## Funcionalidades Implementadas

### 1. Verificación de Saldo

- **Endpoint utilizado:** `GET /api/jugadores/:telegramId/saldo`
- **Proceso:** Antes de unirse a una sala, se verifica que el jugador tenga saldo suficiente
- **Comparación:** Se compara el saldo del jugador con el precio de entrada de la sala

### 2. Confirmación de Pago

- **Mensaje de confirmación:** Se muestra al jugador el precio de entrada y su saldo actual
- **Cálculo:** Se muestra el saldo que tendrá después del pago
- **Botones:** Confirmar entrada o Cancelar

### 3. Débito Automático

- **Endpoint utilizado:** `POST /api/jugadores/:telegramId/saldo/debitar`
- **Proceso:** Una vez confirmado, se debita automáticamente el precio de entrada
- **Razón:** Se registra la razón del débito (ej: "Entrada a sala: Sala de Ludo")

### 4. Manejo de Saldo Insuficiente

- **Mensaje informativo:** Se muestra el saldo actual y el precio requerido
- **Botón de depósito:** Se incluye un botón para hacer depósito (funcionalidad futura)
- **Opción de cancelación:** El jugador puede cancelar la operación

## Flujo de Proceso

### Caso 1: Saldo Suficiente

1. Jugador intenta unirse a una sala
2. Sistema verifica saldo vs precio de entrada
3. Si tiene saldo suficiente:
   - Se muestra mensaje de confirmación con detalles
   - Jugador confirma o cancela
   - Si confirma: se debita saldo y se une a la sala
   - Si cancela: se cancela la operación

### Caso 2: Saldo Insuficiente

1. Jugador intenta unirse a una sala
2. Sistema verifica saldo vs precio de entrada
3. Si no tiene saldo suficiente:
   - Se muestra mensaje de saldo insuficiente
   - Se incluye botón para hacer depósito
   - Se incluye botón para cancelar

## Nuevos Métodos en BackendAPI

### `getPlayerBalance(telegramId)`

- Obtiene el saldo de un jugador por su telegramId
- Retorna el saldo en centavos

### `debitPlayerBalance(telegramId, amount, reason)`

- Debita saldo de un jugador
- Parámetros:
  - `telegramId`: ID de Telegram del jugador
  - `amount`: Cantidad a debitar en centavos
  - `reason`: Razón del débito (opcional)

## Nuevas Funciones de Callback

### `handleConfirmEntrada(bot, api, callbackQuery, salaId)`

- Maneja la confirmación de entrada a una sala
- Verifica saldo nuevamente por seguridad
- Debita el saldo y une al jugador a la sala

### `handleCancelarEntrada(bot, api, callbackQuery)`

- Maneja la cancelación de entrada a una sala
- Confirma la cancelación al jugador

### `handleDepositoInicio(bot, api, callbackQuery)`

- Maneja el inicio del proceso de depósito
- Actualmente es un placeholder para funcionalidad futura

## Nuevos Tipos de Callback

- `confirmar_entrada:salaId` - Confirmar entrada a sala
- `cancelar:entrada` - Cancelar entrada a sala
- `deposito:inicio` - Iniciar proceso de depósito

## Mensajes de Usuario

### Confirmación de Entrada

```
⚠️ Confirmación de entrada

🎮 Sala: [Nombre de la sala]
💰 Precio de entrada: [Precio] Bs
💳 Tu saldo actual: [Saldo] Bs
💸 Saldo después del pago: [Saldo restante] Bs

⚠️ Se te descontará el precio de entrada de tu saldo.

¿Confirmas que deseas unirte a la sala?
```

### Saldo Insuficiente

```
❌ Saldo insuficiente

💰 Tu saldo: [Saldo] Bs
🎮 Precio de entrada: [Precio] Bs
🎯 Sala: [Nombre de la sala]

💡 Para unirte a esta sala necesitas más saldo.

¿Deseas hacer un depósito?
```

### Entrada Exitosa

```
✅ ¡Te has unido a la sala exitosamente!

🎮 Sala: [Nombre de la sala]
💰 Entrada pagada: [Precio] Bs
💳 Saldo restante: [Saldo restante] Bs
👥 Jugadores: [Número de jugadores]

📋 Próximos pasos:
• Espera a que se complete la sala
• ¡Disfruta tu partida!
```

## Consideraciones de Seguridad

1. **Doble verificación:** Se verifica el saldo tanto al inicio como antes de confirmar
2. **Transacciones atómicas:** El débito y la unión a la sala se realizan en secuencia
3. **Manejo de errores:** Se manejan errores específicos del backend
4. **Logging:** Se registran todas las operaciones para auditoría

## Solución de Problemas

### Error: "El monto debe ser un número"

**Problema:** El backend esperaba el campo `monto` en lugar de `cantidad`.

**Solución implementada:**

- Se cambió el campo `cantidad` por `monto` en el payload del endpoint de débito
- Se agregó validación de tipos en `debitPlayerBalance()`
- Se convierte automáticamente el valor a número usando `Number()`
- Se valida que sea un número válido y positivo

**Código corregido:**

```javascript
// Asegurar que amount sea un número
const cantidadNumerica = Number(amount);

// Validar que sea un número válido y positivo
if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
  throw new Error(`Cantidad inválida: ${amount}. Debe ser un número positivo.`);
}

const payload = {
  monto: cantidadNumerica, // ✅ Campo correcto
  razon: reason,
};
```

### Script de Prueba

Se creó un script de prueba para verificar los endpoints:

```bash
node scripts/test-saldo-endpoints.js
```

Este script prueba:

- Obtener saldo de un jugador
- Debitar saldo con diferentes tipos de datos
- Validación de tipos de datos

## Próximos Pasos

1. **Implementar sistema de depósitos:** Completar la funcionalidad de depósitos
2. **Notificaciones:** Agregar notificaciones push para confirmaciones
3. **Historial:** Mostrar historial de transacciones al usuario
4. **Límites:** Implementar límites de saldo mínimo/máximo
