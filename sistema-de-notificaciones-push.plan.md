<!-- 1657ea84-baf0-4f49-a60e-466ee9f0d338 eda79005-94d3-4ae0-8079-5ab1f3d75932 -->

# Plan: Sistema de Notificaciones WebSocket para Bot de Telegram

## Arquitectura General

El bot se conectará al backend vía WebSocket con conexión permanente y se unirá dinámicamente a rooms de transacciones. Sistema de polling inteligente de respaldo activo solo durante desconexiones.

---

## Fase 1: Backend - Modelo y Endpoints de Notificaciones Bot ✅ COMPLETADA

### 1.1 Crear Modelo `NotificacionBot` ✅

**Archivo**: `elpatio-backend/models/NotificacionBot.js`

### 1.2 Crear Controlador de Notificaciones Bot ✅

**Archivo**: `elpatio-backend/controllers/notificacionesBotController.js`

### 1.3 Crear Rutas de API ✅

**Archivo**: `elpatio-backend/routes/notificacionesBot.js`

### 1.4 Registrar Rutas en App ✅

**Archivo**: `elpatio-backend/app.js`

---

## Fase 2: Backend - Integración WebSocket para Bot ✅ COMPLETADA

### 2.1 Agregar Autenticación de Bot en SocketManager ✅

**Archivo**: `elpatio-backend/websocket/socketManager.js`

✅ Agregado evento `auth-bot`
✅ Validación de JWT con rol "bot"
✅ Almacenamiento en `this.connectedBots`
✅ Manejo de desconexión de bots

### 2.2 Modificar DepositoController para Notificar al Bot ✅ COMPLETADA

**Archivo**: `elpatio-backend/websocket/depositoController.js`

✅ `notificarBotNuevoDeposito()` - Implementado para nuevo depósito
✅ `notificarBotSolicitudAceptada()` - Implementado
✅ `notificarBotPagoConfirmado()` - Implementado
✅ `notificarBotDepositoCompletado()` - Implementado
✅ `notificarBotDepositoRechazado()` - Implementado

### 2.3 Agregar Bot a Rooms de Transacciones ⏳ PENDIENTE

**Archivo**: `elpatio-backend/websocket/roomsManager.js`

⏳ Agregar automáticamente bot a rooms cuando se crean

---

## Fase 3: Bot - Cliente WebSocket ✅ COMPLETADA

### 3.1 Crear Cliente WebSocket ✅

**Archivo**: `bot-telegram/websocket/websocket-client.js`

### 3.2 Crear Gestor de Notificaciones ✅

**Archivo**: `bot-telegram/websocket/notification-handler.js`

### 3.3 Crear Sistema de Polling de Respaldo ✅

**Archivo**: `bot-telegram/websocket/polling-fallback.js`

---

## Fase 4: Bot - Integración en Index.js ✅ COMPLETADA

### 4.1 Inicializar WebSocket en Bot ✅

**Archivo**: `bot-telegram/index.js`

### 4.2 Agregar Dependencia socket.io-client ✅

**Archivo**: `bot-telegram/package.json`

---

## Fase 5: Plan de Pruebas

### 5.1 Casos de Prueba por Evento

#### **5.1.1 Notificación de Depósito Creado**

- ✅ Crear depósito desde webapp
- ✅ Verificar notificación en BD (`enviada: false`)
- ✅ Verificar mensaje en Telegram
- ✅ Verificar marcado como enviada

#### **5.1.2 Notificación de Solicitud Aceptada**

- ✅ Cajero acepta solicitud
- ✅ Verificar mensaje: "El cajero [nombre] aceptó..."
- ✅ Verificar datos del cajero incluidos

#### **5.1.3 Notificación de Pago Confirmado**

- ✅ Jugador confirma pago
- ✅ Verificar mensaje con referencia
- ✅ Verificar marcado como enviada

#### **5.1.4 Notificación de Depósito Completado**

- ✅ Cajero verifica pago
- ✅ Verificar mensaje con saldo actualizado
- ✅ Verificar datos completos

#### **5.1.5 Notificación de Depósito Rechazado**

- ✅ Cajero rechaza pago
- ✅ Verificar mensaje con motivo
- ✅ Verificar motivo incluido

### 5.2 Pruebas de Resiliencia

#### **5.2.1 Bot Desconectado - Modo Polling**

- ✅ Detener WebSocket
- ✅ Crear evento de depósito
- ✅ Verificar activación de polling
- ✅ Verificar recepción de notificación (máx 30s)

#### **5.2.2 Reconexión WebSocket**

- ✅ Bot se reconecta automáticamente
- ✅ Polling se detiene
- ✅ Notificaciones pendientes se procesan
- ✅ No hay duplicados

#### **5.2.3 Máximo de Intentos de Reconexión**

- ✅ Intentos con backoff exponencial
- ✅ Después de 10 intentos, solo polling
- ✅ Al reiniciar backend, bot reconecta

### 5.3 Pruebas de Prevención de Duplicados

#### **5.3.1 EventoId Único**

- ✅ Crear notificación
- ✅ Intentar crear duplicado
- ✅ Verificar rechazo (error 11000)
- ✅ Solo un mensaje enviado

### 5.4 Checklist de Testing E2E Manual

- [ ] Setup inicial (backend + bot funcionando)
- [ ] Flujo completo de depósito exitoso (todas las notificaciones)
- [ ] Flujo de depósito rechazado
- [ ] Prueba de resiliencia (desconexión/reconexión)
- [ ] Prueba de duplicados
- [ ] Verificación de logs

### 5.5 Criterios de Éxito

- ✅ Todos los casos de prueba pasan (100%)
- ✅ No se pierden notificaciones durante desconexiones
- ✅ Reconexión funciona en < 60 segundos
- ✅ Polling fallback funciona correctamente
- ✅ Mensajes de Telegram se envían exitosamente
- ✅ Logs son claros y útiles para debugging

---

## Estado Actual

- ✅ Backend: Modelo y endpoints de notificaciones bot creados
- ✅ Backend: WebSocket de bot configurado y funcionando
- ✅ Backend: **Todas las notificaciones de eventos implementadas**
  - ✅ `notificarBotNuevoDeposito()`
  - ✅ `notificarBotSolicitudAceptada()`
  - ✅ `notificarBotPagoConfirmado()`
  - ✅ `notificarBotDepositoCompletado()`
  - ✅ `notificarBotDepositoRechazado()`
- ✅ Bot: Cliente WebSocket implementado
- ✅ Bot: Polling de respaldo implementado
- ✅ Bot: Integración completa en index.js

**Próximos pasos**:

1. ⏳ Ejecutar casos de prueba según el plan
2. ⏳ Testing E2E manual del flujo completo
3. ⏳ Verificar resiliencia (desconexiones, reconexiones)
4. ⏳ Desplegar a Fly.io
