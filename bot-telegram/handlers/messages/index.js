"use strict";

const keyboardHandlers = require("./keyboard-handlers");
const registrationHandlers = require("./registration-handlers");
const textHandler = require("./text-handler");

// Re-exportar todas las funciones de los módulos especializados
module.exports = {
  // Funciones de botones del teclado personalizado
  handleSeleccionarJuego: keyboardHandlers.handleSeleccionarJuego,
  handleVerSalas: keyboardHandlers.handleVerSalas,
  handleCrearSala: keyboardHandlers.handleCrearSala,
  handleAyuda: keyboardHandlers.handleAyuda,
  handleMiPerfil: keyboardHandlers.handleMiPerfil,

  // Funciones de registro de usuarios
  handleNicknameRegistration: registrationHandlers.handleNicknameRegistration,
  handleTelegramNameRegistration:
    registrationHandlers.handleTelegramNameRegistration,
  handleNicknameChange: registrationHandlers.handleNicknameChange,

  // Función principal de manejo de mensajes de texto
  handleTextMessage: textHandler.handleTextMessage,
};
