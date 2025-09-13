"use strict";

// Importar la nueva estructura modular de comandos
const commandsModule = require("./commands/index");

// Re-exportar todas las funciones para mantener compatibilidad
module.exports = commandsModule;
