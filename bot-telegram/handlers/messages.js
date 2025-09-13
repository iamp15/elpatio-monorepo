"use strict";

// Importar la nueva estructura modular de mensajes
const messagesModule = require("./messages/index");

// Re-exportar todas las funciones para mantener compatibilidad
module.exports = messagesModule;
