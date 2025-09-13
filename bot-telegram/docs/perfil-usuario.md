# Perfil de Usuario - El Patio 🎮

## 📋 Descripción General

El sistema de perfil de usuario permite a los jugadores ver y gestionar su información personal, saldo, estadísticas y configuraciones dentro del bot de Telegram.

## 🎯 Funcionalidades Implementadas

### ✅ **Completado**

#### 1. **Visualización del Perfil**

- **Comando:** `/miperfil` o botón "👤 Mi Perfil"
- **Información mostrada:**
  - Nickname del jugador (si está configurado)
  - Saldo disponible (formateado según configuración de moneda del backend)
  - ID del usuario
  - Estadísticas básicas:
    - Victorias
    - Derrotas
    - Total de partidas
    - Porcentaje de victoria

#### 2. **Gestión de Nickname** ✅ **COMPLETADO**

- **Botón dinámico:** Cambia según si el usuario tiene nickname o no
  - "🎮 Crear Nickname" (si no tiene)
  - "✏️ Cambiar Nickname" (si ya tiene)
- **Validación completa:**
  - Entre 3 y 32 caracteres
  - Una sola palabra (sin espacios)
  - Solo letras, números, guiones (-) y guiones bajos (\_)
  - Debe contener al menos una letra
  - No puede empezar o terminar con guión
  - Palabras apropiadas únicamente
- **Verificación de disponibilidad** en el backend usando `GET /api/jugadores/check-nickname/:nickname`
- **Consulta específica de nickname** usando `GET /api/jugadores/:telegramId/nickname`
- **Actualización en tiempo real** en el backend usando `PUT /api/jugadores/:telegramId/nickname`
- **Sugerencias automáticas** para nicknames inválidos
- **Manejo de errores** robusto

#### 3. **Botones de Acción**

- **💰 Depositar** - Función en desarrollo
- **💸 Retirar** - Función en desarrollo
- **📊 Estadísticas Detalladas** - Función en desarrollo

## 🏗️ Arquitectura Técnica

### **Archivos Creados/Modificados**

#### **Nuevos Archivos:**

- `handlers/commands/profile-commands.js` - Comando principal del perfil
- `handlers/callbacks/profile-callbacks.js` - Callbacks de las acciones del perfil
- `docs/perfil-usuario.md` - Esta documentación

#### **Archivos Modificados:**

- `handlers/commands/index.js` - Agregado comando de perfil
- `handlers/callbacks/index.js` - Agregados callbacks de perfil
- `handlers/messages/registration-handlers.js` - Agregada función de cambio de nickname
- `handlers/messages/text-handler.js` - Agregado manejo de cambio de nickname
- `handlers/messages/keyboard-handlers.js` - Actualizado para usar nuevo comando
- `api/backend.js` - Agregado método `updatePlayerNickname`
- `config/bot-config.js` - Agregado comando `/miperfil`
- `index.js` - Registrado comando `/miperfil`

### **Flujo de Datos**

```
Usuario → /miperfil → profile-commands.js → Backend API → Respuesta formateada
    ↓
Botones inline → profile-callbacks.js → Estados de usuario → registration-handlers.js
```

## 📊 Estructura de Datos

### **Campos del Jugador Utilizados**

```javascript
{
  _id: "ObjectId",
  telegramId: "String",
  username: "String",
  nickname: "String", // Puede ser "SIN_NICKNAME_123" si no tiene
  firstName: "String",
  saldo: Number, // En centavos (ej: 10000 = 100,00 Bs)
  victorias: Number, // Estadísticas básicas
  derrotas: Number   // Estadísticas básicas
}
```

### **Estados de Usuario**

```javascript
{
  waitingForNickname: Boolean,      // Para crear nickname
  waitingForNicknameChange: Boolean // Para cambiar nickname
}
```

## 🧪 Pruebas y Validación

### **Scripts de Prueba Disponibles**

- `npm run test:nickname` - Pruebas completas de cambio de nickname
- `npm run test:currency` - Pruebas de formateo dinámico de moneda
- `npm run test:profile` - Pruebas completas del perfil

### **Funcionalidades Verificadas**

✅ **Validación de formato de nickname**
✅ **Verificación de disponibilidad en backend**
✅ **Sugerencias automáticas para nicknames inválidos**
✅ **Manejo de errores y casos edge**
✅ **Integración con endpoint `GET /api/jugadores/check-nickname/:nickname`**
✅ **Actualización en tiempo real del nickname**

### **Casos de Prueba Cubiertos**

- Nicknames válidos e inválidos
- Verificación de disponibilidad
- Palabras reservadas (admin, bot, etc.)
- Manejo de errores de red
- Sugerencias automáticas
- Simulación de cambio sin afectar datos reales

## 🎨 Interfaz de Usuario

### **Mensaje del Perfil**

```
👤 **Tu Perfil**

🎮 **Nickname:** ElPatioKing
💰 **Saldo:** 1.500,00 Bs
🆔 **ID:** 123456789

📊 **Estadísticas:**
🏆 **Victorias:** 15
💔 **Derrotas:** 8
📈 **Total partidas:** 23
📊 **Porcentaje victoria:** 65%
```

### **Teclado Inline**

```
[✏️ Cambiar Nickname]
[💰 Depositar] [💸 Retirar]
[📊 Estadísticas Detalladas]
```

## 🔧 Configuración

### **Variables de Entorno**

```env
# Ya existentes, no se requieren nuevas variables
BOT_TOKEN=tu_token_del_bot
BACKEND_URL=http://localhost:3000/api
BOT_EMAIL=bot@elpatio.com
BOT_PASSWORD=password_del_bot
```

### **Endpoints del Backend Implementados**

```javascript
// Obtener información del jugador
GET /api/jugadores/:telegramId

// Verificar disponibilidad de nickname
GET /api/jugadores/check-nickname/:nickname

// Consultar nickname específico
GET /api/jugadores/:telegramId/nickname

// Actualizar nickname
PUT /api/jugadores/:telegramId/nickname
Body: { nickname: "nuevo_nickname" }

// Crear jugador
POST /api/jugadores

// Obtener configuración de moneda
GET /api/payment-config/moneda
```

## 🚀 Próximas Funcionalidades

### **Fase 1 - Sistema de Saldo**

- [ ] Implementar depósitos reales
- [ ] Implementar retiros reales
- [ ] Integración con pasarelas de pago
- [ ] Historial de transacciones

### **Fase 2 - Estadísticas Avanzadas**

- [ ] Estadísticas por juego
- [ ] Gráficos de rendimiento
- [ ] Logros y badges
- [ ] Historial completo de partidas

### **Fase 3 - Personalización**

- [ ] Avatar del usuario
- [ ] Temas de perfil
- [ ] Configuraciones de privacidad
- [ ] Notificaciones personalizadas

## 🧪 Pruebas

### **Comandos para Probar**

```bash
# En Telegram
/miperfil                    # Ver perfil completo
👤 Mi Perfil                # Botón del teclado principal

# Acciones del perfil
✏️ Cambiar Nickname         # Cambiar nickname existente
🎮 Crear Nickname           # Crear nickname nuevo
💰 Depositar               # Ver mensaje de "en desarrollo"
💸 Retirar                 # Ver mensaje de "en desarrollo"
📊 Estadísticas Detalladas # Ver mensaje de "en desarrollo"
```

### **Casos de Prueba**

1. **Usuario sin nickname:** Debe mostrar "No configurado" y botón "Crear"
2. **Usuario con nickname:** Debe mostrar el nickname y botón "Cambiar"
3. **Saldo cero:** Debe mostrar "0,00 Bs"
4. **Sin estadísticas:** Debe mostrar 0 victorias/derrotas
5. **Validación de nickname:** Probar formatos inválidos
6. **Nickname duplicado:** Probar con nickname ya existente

## 🔍 Debugging

### **Logs Importantes**

```javascript
// Creación de nickname
✅ Nuevo jugador registrado: ElPatioKing (123456789)

// Cambio de nickname
✅ Nickname actualizado: ElPatioKing (123456789)

// Errores
❌ Error obteniendo información del jugador: [error]
❌ Error actualizando nickname: [error]
```

### **Estados de Usuario para Debug**

```javascript
// Verificar estado actual
userStateManager.getState(userId);

// Limpiar estado si hay problemas
userStateManager.clearState(userId);
```

## 📝 Notas de Desarrollo

### **Consideraciones Técnicas**

- El saldo se maneja en centavos para evitar problemas de precisión
- Los nicknames se validan tanto en frontend como backend
- Se usa cache para display names para mejorar rendimiento
- Los estados de usuario se limpian automáticamente después de completar acciones

### **Formateo Dinámico de Saldo**

El sistema de perfil utiliza configuración dinámica de moneda desde el backend:

#### **Configuración de Moneda**

- **Endpoint:** `/api/paymentConfig` con `configType: "moneda"`
- **Campos utilizados:**
  - `codigo`: Código ISO de la moneda (ej: "VES", "USD")
  - `simbolo`: Símbolo de la moneda (ej: "Bs", "$")
  - `formato`: Formato regional (ej: "es-VE", "en-US")
  - `decimales`: Número de decimales a mostrar

#### **Ejemplos de Formato**

```javascript
// Configuración venezolana
{
  codigo: "VES",
  simbolo: "Bs",
  formato: "es-VE",
  decimales: 2
}
// Resultado: "Bs. 1.500,00"

// Configuración estadounidense
{
  codigo: "USD",
  simbolo: "$",
  formato: "en-US",
  decimales: 2
}
// Resultado: "$1,500.00"
```

#### **Fallback y Cache**

- Si no se puede obtener la configuración, usa formato venezolano por defecto
- La configuración se cachea por 5 minutos para mejorar rendimiento
- Cambios en la configuración se reflejan automáticamente sin reiniciar el bot

### **Compatibilidad**

- Funciona en modo TEST (sin backend)
- Compatible con la arquitectura de cache existente
- Mantiene compatibilidad con usuarios existentes
- No requiere migración de datos

### **Seguridad**

- Validación de nickname en frontend y backend
- Verificación de disponibilidad antes de asignar
- Manejo seguro de errores sin exponer información sensible
- Estados de usuario con timeout automático
