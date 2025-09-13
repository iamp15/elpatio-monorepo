"use strict";

// Importar la nueva estructura modular de callbacks
const callbacksModule = require("./callbacks/index");

// Re-exportar las funciones para mantener compatibilidad
module.exports = {
  handleCallbackQuery: callbacksModule.handleCallbackQuery,
  handleCreateSalaFinal: callbacksModule.handleCreateSalaFinal,
};
