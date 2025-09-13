"use strict";

const BOT_CONFIG = require("../../config/bot-config");
const userStateManager = require("../../user-state");
const { handleCreateSalaFinal } = require("../callbacks");
const keyboardHandlers = require("./keyboard-handlers");
const registrationHandlers = require("./registration-handlers");

/**
 * Maneja mensajes de texto genéricos
 */
async function handleTextMessage(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  try {
    // Verificar si es un comando que ya tiene handler específico
    if (text && text.startsWith("/")) {
      // Lista de comandos que tienen handlers específicos
      const handledCommands = [
        "/start",
        "/juegos",
        "/salas",
        "/ayuda",
        "/mijuego",
        "/cambiarjuego",
        "/crearsala",
        "/stats",
        "/setwelcome",
        "/setupmeta",
        "/cleanup",
        "/restore",
        // Comandos de configuración de precios
        "/verprecios",
        "/verhistorial",
        "/vercachestats",
        "/limpiarcache",
        "/ayudaprecios",
      ];

      // Si es un comando con handler específico, no procesarlo aquí
      if (handledCommands.some((cmd) => text.startsWith(cmd))) {
        return; // Salir sin hacer nada, el handler específico se encargará
      }
    }

    // Verificar si el usuario está esperando un nickname
    const userState = userStateManager.getState(userId);

    if (userState && userState.waitingForNickname) {
      if (text.toLowerCase() === "-no") {
        await registrationHandlers.handleTelegramNameRegistration(
          bot,
          api,
          msg
        );
      } else {
        await registrationHandlers.handleNicknameRegistration(bot, api, msg);
      }
      return;
    }

    // Verificar si el usuario está cambiando su nickname
    if (userState && userState.waitingForNicknameChange) {
      await registrationHandlers.handleNicknameChange(bot, api, msg);
      return;
    }

    // Verificar si el usuario está creando una sala
    if (userState && userState.creatingSala) {
      await handleCreateSalaFinal(bot, api, msg);
      return;
    }

    // Manejar botones del teclado personalizado
    if (text) {
      switch (text) {
        case "🎮 Seleccionar Juego":
          await keyboardHandlers.handleSeleccionarJuego(bot, api, msg);
          return;

        case "🏠 Ver Salas":
          await keyboardHandlers.handleVerSalas(bot, api, msg);
          return;

        case "🏗️ Crear Sala":
          await keyboardHandlers.handleCrearSala(bot, api, msg);
          return;

        case "❓ Ayuda":
          await keyboardHandlers.handleAyuda(bot, api, msg);
          return;

        case "👤 Mi Perfil":
          await keyboardHandlers.handleMiPerfil(bot, api, msg);
          return;

        default:
          // Si no es un botón reconocido, mostrar mensaje de ayuda
          await bot.sendMessage(chatId, BOT_CONFIG.messages.unknown, {
            parse_mode: "HTML",
          });
          return;
      }
    }

    // Si no es un comando específico, mostrar mensaje de ayuda
    await bot.sendMessage(chatId, BOT_CONFIG.messages.unknown, {
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error("❌ Error procesando mensaje de texto:", error.message);
    await bot.sendMessage(chatId, BOT_CONFIG.messages.error);
  }
}

module.exports = {
  handleTextMessage,
};
