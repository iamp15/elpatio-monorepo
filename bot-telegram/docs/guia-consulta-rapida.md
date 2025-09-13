# Guía de Consulta Rápida - Bot de Telegram

## 📋 Índice de Contenidos

- [Mensajes y Textos](#mensajes-y-textos)
- [Botones y Teclados](#botones-y-teclados)
- [Comandos](#comandos)
- [Callbacks (Botones Interactivos)](#callbacks-botones-interactivos)
- [Validaciones](#validaciones)
- [Configuración del Bot](#configuración-del-bot)
- [Estados de Usuario](#estados-de-usuario)
- [API y Backend](#api-y-backend)
- [Utilidades y Helpers](#utilidades-y-helpers)

---

## 🗨️ Mensajes y Textos

### **Mensaje de Bienvenida**

- **Archivo:** `config/bot-config.js`
- **Función:** `messages.start(nickname)`
- **Línea:** Buscar `start:` en el objeto `messages`

### **Mensaje de Ayuda**

- **Archivo:** `config/bot-config.js`
- **Función:** `messages.help`
- **Línea:** Buscar `help:` en el objeto `messages`

### **Mensaje de Perfil**

- **Archivo:** `config/bot-config.js`
- **Función:** `messages.profile(displayName, user)`
- **Línea:** Buscar `profile:` en el objeto `messages`

### **Mensaje de Perfil Completo (Nuevo)**

- **Archivo:** `handlers/commands/profile-commands.js`
- **Función:** `crearMensajePerfil()`
- **Línea:** ~75
- **Descripción:** Crea el mensaje completo del perfil con nickname, saldo, estadísticas y botones inline

### **Mensaje de Selección de Juego**

- **Archivo:** `config/bot-config.js`
- **Función:** `messages.seleccionJuego`
- **Línea:** Buscar `seleccionJuego:` en el objeto `messages`

### **Mensaje de Error**

- **Archivo:** `config/bot-config.js`
- **Función:** `messages.error`
- **Línea:** Buscar `error:` en el objeto `messages`

### **Mensaje de Comando Desconocido**

- **Archivo:** `config/bot-config.js`
- **Función:** `messages.unknown`
- **Línea:** Buscar `unknown:` en el objeto `messages`

---

## 🔘 Botones y Teclados

### **Teclado Personalizado Principal**

- **Archivo:** `config/bot-config.js`
- **Variable:** `customKeyboard`
- **Línea:** Buscar `customKeyboard:`

### **Botón "🎮 Seleccionar Juego"**

- **Handler:** `handlers/messages/keyboard-handlers.js`
- **Función:** `handleSeleccionarJuego()`
- **Línea:** ~18

### **Botón "🏠 Ver Salas"**

- **Handler:** `handlers/messages/keyboard-handlers.js`
- **Función:** `handleVerSalas()`
- **Línea:** ~35

### **Botón "🏗️ Crear Sala"**

- **Handler:** `handlers/messages/keyboard-handlers.js`
- **Función:** `handleCrearSala()`
- **Línea:** ~65

### **Botón "❓ Ayuda"**

- **Handler:** `handlers/messages/keyboard-handlers.js`
- **Función:** `handleAyuda()`
- **Línea:** ~120

### **Botón "👤 Mi Perfil"**

- **Handler:** `handlers/messages/keyboard-handlers.js`
- **Función:** `handleMiPerfil()`
- **Línea:** ~130

### **Botón "🎯 Unirme" / "🚪 Abandonar Sala"**

- **Archivo:** `utils/helpers.js`
- **Función:** `sendFilteredRooms()`
- **Línea:** Buscar `buttonText` y `callbackData`

---

## ⌨️ Comandos

### **Comando `/start`**

- **Handler:** `handlers/commands/basic-commands.js`
- **Función:** `handleStart()`
- **Línea:** ~18

### **Comando `/ayuda`**

- **Handler:** `handlers/commands/basic-commands.js`
- **Función:** `handleAyuda()`
- **Línea:** ~35

### **Comando `/juegos`**

- **Handler:** `handlers/commands/game-commands.js`
- **Función:** `handleJuegos()`
- **Línea:** ~18

### **Comando `/mijuego`**

- **Handler:** `handlers/commands/game-commands.js`
- **Función:** `handleMiJuego()`
- **Línea:** ~45

### **Comando `/cambiarjuego`**

- **Handler:** `handlers/commands/game-commands.js`
- **Función:** `handleCambiarJuego()`
- **Línea:** ~75

### **Comando `/salas`**

- **Handler:** `handlers/commands/sala-commands.js`
- **Función:** `handleSalas()`
- **Línea:** ~18

### **Comando `/crearsala`**

- **Handler:** `handlers/commands/sala-commands.js`
- **Función:** `handleCrearSala()`
- **Línea:** ~45

### **Comando `/stats`**

- **Handler:** `handlers/commands/admin-commands.js`
- **Función:** `handleStats()`
- **Línea:** ~18

### **Comando `/token`**

- **Handler:** `handlers/commands/admin-commands.js`
- **Función:** `handleToken()`
- **Línea:** ~45

### **Comando `/setwelcome`**

- **Handler:** `handlers/commands/admin-commands.js`
- **Función:** `handleSetWelcome()`
- **Línea:** ~75

### **Comando `/setupmeta`**

- **Handler:** `handlers/commands/admin-commands.js`
- **Función:** `handleSetupMeta()`
- **Línea:** ~110

### **Comando `/cleanup`**

- **Handler:** `handlers/commands/admin-commands.js`
- **Función:** `handleCleanup()`
- **Línea:** ~150

### **Comando `/restore`**

- **Handler:** `handlers/commands/admin-commands.js`
- **Función:** `handleRestore()`
- **Línea:** ~200

### **Comando `/miperfil` (Nuevo)**

- **Handler:** `handlers/commands/profile-commands.js`
- **Función:** `handleMiPerfil()`
- **Línea:** ~18
- **Descripción:** Muestra el perfil completo del usuario con nickname, saldo, estadísticas y botones de acción

### **Comandos de Configuración de Precios (Solo Administradores)**

#### **Comando `/verprecios`**

- **Handler:** `handlers/commands/admin-commands.js`
- **Función:** `handleVerPrecios()`
- **Línea:** Importado desde `admin-payment-commands.js`

#### **Comando `/configurarprecio`**

- **Handler:** `handlers/commands/admin-commands.js`
- **Función:** `handleConfigurarPrecio()`
- **Línea:** Importado desde `admin-payment-commands.js`

#### **Comando `/configurarlimite`**

- **Handler:** `handlers/commands/admin-commands.js`
- **Función:** `handleConfigurarLimite()`
- **Línea:** Importado desde `admin-payment-commands.js`

#### **Comando `/configurarcomision`**

- **Handler:** `handlers/commands/admin-commands.js`
- **Función:** `handleConfigurarComision()`
- **Línea:** Importado desde `admin-payment-commands.js`

#### **Comando `/restaurarprecios`**

- **Handler:** `handlers/commands/admin-commands.js`
- **Función:** `handleRestaurarPrecios()`
- **Línea:** Importado desde `admin-payment-commands.js`

#### **Comando `/ayudaprecios`**

- **Handler:** `handlers/commands/admin-commands.js`
- **Función:** `handleAyudaPrecios()`
- **Línea:** Importado desde `admin-payment-commands.js`

---

## 🔄 Callbacks (Botones Interactivos)

### **Selección de Juego**

- **Handler:** `handlers/callbacks/game-callbacks.js`
- **Función:** `handleSelectGame()`
- **Línea:** ~18

### **Unirse a Sala**

- **Handler:** `handlers/callbacks/sala-callbacks.js`
- **Función:** `handleJoinSala()`
- **Línea:** ~18

### **Abandonar Sala**

- **Handler:** `handlers/callbacks/sala-callbacks.js`
- **Función:** `handleLeaveSala()`
- **Línea:** ~120

### **Confirmar Abandono de Sala**

- **Handler:** `handlers/callbacks/sala-callbacks.js`
- **Función:** `handleConfirmLeaveSala()`
- **Línea:** ~150

### **Cancelar Abandono de Sala**

- **Handler:** `handlers/callbacks/sala-callbacks.js`
- **Función:** `handleCancelLeaveSala()`
- **Línea:** ~180

### **Crear Sala (Modo)**

- **Handler:** `handlers/callbacks/sala-callbacks.js`
- **Función:** `handleCreateSalaMode()`
- **Línea:** ~200

### **Crear Sala (Final)**

- **Handler:** `handlers/callbacks/sala-creation.js`
- **Función:** `handleCreateSalaFinal()`
- **Línea:** ~18
- **Precios:** Consulta automáticamente precios del backend según el modo de juego
- **Premios:** Calcula automáticamente usando `PaymentConfigManager.calculatePrize()`
- **Formato:** Muestra precios en formato venezolano (1.000,00 Bs)

### **Refrescar Token**

- **Handler:** `handlers/callbacks/admin-callbacks.js`
- **Función:** `handleRefreshToken()`
- **Línea:** ~18

### **Ver Estadísticas**

- **Handler:** `handlers/callbacks/admin-callbacks.js`
- **Función:** `handleViewStats()`
- **Línea:** ~45

### **Callbacks del Perfil (Nuevos)**

#### **Crear Nickname**

- **Handler:** `handlers/callbacks/profile-callbacks.js`
- **Función:** `handleCreateNickname()`
- **Línea:** ~8
- **Descripción:** Inicia el proceso de creación de nickname

#### **Cambiar Nickname**

- **Handler:** `handlers/callbacks/profile-callbacks.js`
- **Función:** `handleChangeNickname()`
- **Línea:** ~35
- **Descripción:** Inicia el proceso de cambio de nickname

#### **Depositar**

- **Handler:** `handlers/callbacks/profile-callbacks.js`
- **Función:** `handleDeposit()`
- **Línea:** ~62
- **Descripción:** Muestra mensaje de "función en desarrollo"

#### **Retirar**

- **Handler:** `handlers/callbacks/profile-callbacks.js`
- **Función:** `handleWithdraw()`
- **Línea:** ~85
- **Descripción:** Muestra mensaje de "función en desarrollo"

#### **Estadísticas Detalladas**

- **Handler:** `handlers/callbacks/profile-callbacks.js`
- **Función:** `handleDetailedStats()`
- **Línea:** ~108
- **Descripción:** Muestra mensaje de "función en desarrollo"

---

## ✅ Validaciones

### **Validación de Nickname**

- **Archivo:** `utils/nickname-validator.js`
- **Función:** `validateNickname()`
- **Línea:** ~18

### **Sugerencias de Nickname**

- **Archivo:** `utils/nickname-validator.js`
- **Función:** `generateNicknameSuggestions()`
- **Línea:** ~50

### **Configuración de Precios y Pagos**

- **Backend:** Configuración almacenada en MongoDB (Express.js)
- **Archivo:** `utils/payment-config-manager.js`
- **Clase:** `PaymentConfigManager`
- **Funciones:** `getGamePrice()`, `calculatePrize()`, `getHousePercentage()`
- **Formato:** Moneda venezolana (Bolívares) con formato 1.000,00 Bs

### **Utilidades de Dinero**

- **Archivo:** `utils/money-utils.js`
- **Funciones:** Formateo de moneda, conversiones, validaciones

### **Gestor de Configuración de Precios**

- **Archivo:** `utils/payment-config-manager.js`
- **Clase:** `PaymentConfigManager`
- **Funciones:** Actualizar precios, límites, comisiones, backup

### **Verificación de Disponibilidad de Nickname**

- **Archivo:** `api/backend.js`
- **Función:** `checkNicknameAvailability()`
- **Línea:** Buscar en la clase `BackendAPI`

---

## ⚙️ Configuración del Bot

### **Configuración General**

- **Archivo:** `config/bot-config.js`
- **Contenido:** Juegos, mensajes, teclados

### **Variables de Entorno**

- **Archivo:** `.env`
- **Contenido:** Tokens, URLs, credenciales

### **Configuración de Playwright**

- **Archivo:** `playwright.config.ts`
- **Contenido:** Configuración de testing

---

## 👤 Estados de Usuario

### **Gestión de Estado**

- **Archivo:** `user-state.js`
- **Funciones:** `setState()`, `getState()`, `clearState()`

### **Juego Seleccionado**

- **Archivo:** `user-state.js`
- **Función:** `setSelectedGame()`, `getSelectedGame()`

### **Estados del Perfil (Nuevos)**

#### **Esperando Nickname**

- **Archivo:** `user-state.js`
- **Estado:** `waitingForNickname: true`
- **Manejo:** `handlers/messages/registration-handlers.js`

#### **Esperando Cambio de Nickname**

- **Archivo:** `user-state.js`
- **Estado:** `waitingForNicknameChange: true`
- **Manejo:** `handlers/messages/registration-handlers.js`
- **Línea:** Buscar funciones relacionadas con `selectedGame`

### **Estado de Registro**

- **Archivo:** `user-state.js`
- **Función:** `setWaitingForNickname()`
- **Línea:** Buscar `waitingForNickname`

### **Estado de Creación de Sala**

- **Archivo:** `user-state.js`
- **Función:** `setCreatingSala()`
- **Línea:** Buscar `creatingSala`

---

## 🌐 API y Backend

### **Cliente API**

- **Archivo:** `api/backend.js`
- **Clase:** `BackendAPI`

### **Autenticación**

- **Archivo:** `utils/auth-service.js`
- **Clase:** `AuthService`

### **Crear Jugador**

- **Archivo:** `api/backend.js`
- **Función:** `createPlayer()`

### **Obtener Salas**

- **Archivo:** `api/backend.js`
- **Función:** `getSalasDisponibles()`

### **Unirse a Sala**

- **Archivo:** `api/backend.js`
- **Función:** `joinSala()`

### **Abandonar Sala**

- **Archivo:** `api/backend.js`
- **Función:** `eliminarJugadorDeSala()`

---

## 🛠️ Utilidades y Helpers

### **Helpers Generales**

- **Archivo:** `utils/helpers.js`
- **Funciones:** `getGameName()`, `sendFilteredRooms()`, etc.

### **Servicio de Cache**

- **Archivo:** `utils/cache-service.js`
- **Clase:** `CacheService`

### **Obtener Display Name**

- **Archivo:** `utils/helpers.js`
- **Función:** `getUserDisplayName()`

### **Obtener Salas Disponibles**

- **Archivo:** `utils/helpers.js`
- **Función:** `getSalasDisponibles()`

### **Funciones del Perfil (Nuevas)**

#### **Formatear Saldo**

- **Archivo:** `handlers/commands/profile-commands.js`
- **Función:** `formatearSaldo()`
- **Línea:** ~140
- **Descripción:** Convierte saldo en centavos a formato dinámico según configuración del backend
- **Dependencias:** `PaymentConfigManager.getCurrencyConfig()`

#### **Crear Teclado del Perfil**

- **Archivo:** `handlers/commands/profile-commands.js`
- **Función:** `crearTecladoPerfil()`
- **Línea:** ~95
- **Descripción:** Genera botones inline dinámicos según el estado del usuario

#### **Actualizar Nickname**

- **Archivo:** `api/backend.js`
- **Función:** `updatePlayerNickname()`
- **Línea:** ~120
- **Descripción:** Actualiza el nickname del jugador usando el endpoint específico `PUT /api/jugadores/:telegramId/nickname`

#### **Configuración de Moneda**

- **Archivo:** `utils/payment-config-manager.js`
- **Función:** `getCurrencyConfig()`
- **Línea:** ~320
- **Descripción:** Obtiene configuración de moneda desde `/api/paymentConfig`
- **Retorna:** `{codigo, simbolo, formato, decimales}`

---

## 📁 Estructura de Archivos

```
bot-telegram/
├── config/
│   └── bot-config.js          # Configuración principal
├── handlers/
│   ├── callbacks.js           # Punto de entrada callbacks
│   ├── commands.js            # Punto de entrada commands
│   ├── messages.js            # Punto de entrada messages
│   ├── callbacks/             # Módulos de callbacks
│   ├── commands/              # Módulos de commands
│   └── messages/              # Módulos de messages
├── utils/
│   ├── helpers.js             # Funciones auxiliares
│   ├── auth-service.js        # Autenticación
│   ├── cache-service.js       # Cache
│   ├── nickname-validator.js  # Validación de nicknames
│   ├── money-utils.js         # Utilidades de dinero
│   └── payment-config-manager.js # Gestor de configuración de precios
├── api/
│   └── backend.js             # Cliente API
├── user-state.js              # Gestión de estado
└── index.js                   # Punto de entrada principal
```

---

## 🔍 Búsqueda Rápida por Funcionalidad

### **¿Quieres modificar...?**

| Funcionalidad             | Archivo Principal                             | Función/Sección              |
| ------------------------- | --------------------------------------------- | ---------------------------- |
| Mensaje de bienvenida     | `config/bot-config.js`                        | `messages.start`             |
| Botones del teclado       | `config/bot-config.js`                        | `customKeyboard`             |
| Validación de nickname    | `utils/nickname-validator.js`                 | `validateNickname`           |
| Lógica de unirse a sala   | `handlers/callbacks/sala-callbacks.js`        | `handleJoinSala`             |
| Lógica de crear sala      | `handlers/callbacks/sala-creation.js`         | `handleCreateSalaFinal`      |
| Comando /start            | `handlers/commands/basic-commands.js`         | `handleStart`                |
| Comando /ayuda            | `handlers/commands/basic-commands.js`         | `handleAyuda`                |
| Comando /juegos           | `handlers/commands/game-commands.js`          | `handleJuegos`               |
| Comando /salas            | `handlers/commands/sala-commands.js`          | `handleSalas`                |
| Comando /stats            | `handlers/commands/admin-commands.js`         | `handleStats`                |
| Comandos de precios       | `handlers/commands/admin-payment-commands.js` | `handleVerPrecios`, etc.     |
| **Perfil de usuario**     | `handlers/commands/profile-commands.js`       | `handleMiPerfil`             |
| **Callbacks del perfil**  | `handlers/callbacks/profile-callbacks.js`     | `handleCreateNickname`, etc. |
| **Registro de nicknames** | `handlers/messages/registration-handlers.js`  | `handleNicknameChange`       |
| Autenticación             | `utils/auth-service.js`                       | `AuthService`                |
| API del backend           | `api/backend.js`                              | `BackendAPI`                 |
| Estado del usuario        | `user-state.js`                               | Funciones de estado          |
| Cache                     | `utils/cache-service.js`                      | `CacheService`               |
| Configuración de precios  | `utils/payment-config-manager.js`             | `PaymentConfigManager`       |
| Utilidades de dinero      | `utils/money-utils.js`                        | Formateo, conversiones       |

---

## 💡 Consejos de Uso

1. **Para mensajes:** Siempre busca primero en `config/bot-config.js`
2. **Para lógica de botones:** Busca en `handlers/messages/keyboard-handlers.js`
3. **Para comandos:** Busca en `handlers/commands/[tipo]-commands.js`
4. **Para callbacks:** Busca en `handlers/callbacks/[tipo]-callbacks.js`
5. **Para validaciones:** Busca en `utils/` según el tipo
6. **Para API:** Busca en `api/backend.js`

---

## 🚀 Flujo de Desarrollo

1. **Identifica el tipo de funcionalidad** (mensaje, comando, callback, etc.)
2. **Usa esta guía** para encontrar el archivo correcto
3. **Modifica la función específica**
4. **Prueba con los scripts de testing** en `scripts/`
5. **Verifica que no rompas la modularización**

---

_Esta guía se actualiza automáticamente con cada cambio en la estructura del proyecto._
