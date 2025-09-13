"use strict";

const BOT_CONFIG = require("../../config/bot-config");
const userStateManager = require("../../user-state");
const { getGameName } = require("../../utils/helpers");

/**
 * Comando /juegos - Selección de juego
 */
async function handleJuegos(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Verificar si ya tiene un juego seleccionado
    const currentGameInfo = userStateManager.getSelectedGameInfo(userId);
    let message = BOT_CONFIG.messages.seleccionJuego;

    if (currentGameInfo) {
      const currentGameName = getGameName(currentGameInfo.gameId);
      message += `\n\n🎮 <b>Juego actual:</b> ${currentGameName}`;

      if (currentGameInfo.expiresAt) {
        const expiryDate = new Date(currentGameInfo.expiresAt);
        const formattedDate = expiryDate.toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        message += `\n🕐 <b>Expira:</b> ${formattedDate}`;
      }

      message += `\n💡 Selecciona un nuevo juego para cambiar.`;
    }

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: BOT_CONFIG.juegos
          .filter((juego) => juego.disponible)
          .map((juego) => [
            {
              text: juego.nombre,
              callback_data: `select_game:${juego.id}`,
            },
          ]),
      },
    };

    await bot.sendMessage(chatId, message, {
      parse_mode: "HTML",
      ...inlineKeyboard,
    });
  } catch (err) {
    console.error("❌ Error en /juegos:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error mostrando juegos. Intenta de nuevo."
    );
  }
}

/**
 * Comando /mijuego - Ver juego seleccionado
 */
async function handleMiJuego(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const gameInfo = userStateManager.getSelectedGameInfo(userId);

    if (!gameInfo) {
      await bot.sendMessage(chatId, BOT_CONFIG.messages.noJuegoSeleccionado, {
        parse_mode: "HTML",
      });
      return;
    }

    const gameName = getGameName(gameInfo.gameId);
    let message = `🎮 <b>Tu juego seleccionado:</b> ${gameName}`;

    // Agregar información de expiración si existe
    if (gameInfo.expiresAt) {
      const expiryDate = new Date(gameInfo.expiresAt);
      const formattedDate = expiryDate.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      if (gameInfo.isExpiringSoon) {
        message += `\n⚠️ <b>Expira pronto:</b> ${formattedDate} (en ${
          gameInfo.hoursUntilExpiry
        } hora${gameInfo.hoursUntilExpiry !== 1 ? "s" : ""})`;
      } else {
        message += `\n🕐 <b>Expira:</b> ${formattedDate}`;
      }
    }

    message += `\n\n💡 Usa /salas para ver las salas disponibles o /cambiarjuego para cambiar.`;

    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (err) {
    console.error("❌ Error en /mijuego:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error obteniendo tu juego. Intenta de nuevo."
    );
  }
}

/**
 * Comando /cambiarjuego - Cambiar juego seleccionado
 */
async function handleCambiarJuego(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Limpiar juego anterior
    userStateManager.clearSelectedGame(userId);

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: BOT_CONFIG.juegos
          .filter((juego) => juego.disponible)
          .map((juego) => [
            {
              text: juego.nombre,
              callback_data: `select_game:${juego.id}`,
            },
          ]),
      },
    };

    await bot.sendMessage(
      chatId,
      `🔄 <b>Cambiar juego</b>

Selecciona el nuevo juego que quieres jugar:`,
      {
        parse_mode: "HTML",
        ...inlineKeyboard,
      }
    );
  } catch (err) {
    console.error("❌ Error en /cambiarjuego:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error cambiando juego. Intenta de nuevo."
    );
  }
}

module.exports = {
  handleJuegos,
  handleMiJuego,
  handleCambiarJuego,
};
