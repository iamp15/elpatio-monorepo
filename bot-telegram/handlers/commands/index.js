"use strict";

// Importar todos los módulos de comandos
const basicCommands = require("./basic-commands");
const gameCommands = require("./game-commands");
const salaCommands = require("./sala-commands");
const adminCommands = require("./admin-commands");
const profileCommands = require("./profile-commands");

// Re-exportar todas las funciones para mantener compatibilidad
module.exports = {
  // Comandos básicos
  handleStart: basicCommands.handleStart,
  handleAyuda: basicCommands.handleAyuda,

  // Comandos de juegos
  handleJuegos: gameCommands.handleJuegos,
  handleMiJuego: gameCommands.handleMiJuego,
  handleCambiarJuego: gameCommands.handleCambiarJuego,

  // Comandos de salas
  handleSalas: salaCommands.handleSalas,
  handleCrearSala: salaCommands.handleCrearSala,

  // Comandos de perfil
  handleMiPerfil: profileCommands.handleMiPerfil,

  // Comandos de administración
  handleStats: adminCommands.handleStats,
  handleToken: adminCommands.handleToken,
  handleSetWelcome: adminCommands.handleSetWelcome,
  handleSetupMeta: adminCommands.handleSetupMeta,
  handleCleanup: adminCommands.handleCleanup,
  handleRestore: adminCommands.handleRestore,
  handleAbandonLimits: adminCommands.handleAbandonLimits,
  handleAbandonSystem: adminCommands.handleAbandonSystem,
  handleCheckAbandons: adminCommands.handleCheckAbandons,
  handleResetAbandons: adminCommands.handleResetAbandons,
  handleDebugWebapp: adminCommands.handleDebugWebapp,

  // Comandos de consulta de configuración de precios
  handleVerPrecios: adminCommands.handleVerPrecios,
  handleVerHistorial: adminCommands.handleVerHistorial,
  handleVerCacheStats: adminCommands.handleVerCacheStats,
  handleLimpiarCache: adminCommands.handleLimpiarCache,
  handleAyudaPrecios: adminCommands.handleAyudaPrecios,
};
