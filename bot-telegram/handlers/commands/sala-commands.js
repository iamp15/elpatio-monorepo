"use strict";

const BOT_CONFIG = require("../../config/bot-config");
const userStateManager = require("../../user-state");
const {
  getGameName,
  getSalasDisponibles,
  sendFilteredRooms,
} = require("../../utils/helpers");

/**
 * Comando /salas - Ver salas disponibles
 */
async function handleSalas(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const selectedGame = userStateManager.getSelectedGame(userId);

    if (!selectedGame) {
      await bot.sendMessage(chatId, BOT_CONFIG.messages.noJuegoSeleccionado, {
        parse_mode: "HTML",
      });
      return;
    }

    const gameName = getGameName(selectedGame);

    // Usar el servicio de cache para obtener salas
    const salas = await getSalasDisponibles(selectedGame, api);
    await sendFilteredRooms(
      bot,
      chatId,
      salas,
      selectedGame,
      gameName,
      api,
      msg.from
    );
  } catch (err) {
    console.error("❌ Error en /salas:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error obteniendo salas. Intenta de nuevo."
    );
  }
}

/**
 * Comando /crearsala - Crear nueva sala
 */
async function handleCrearSala(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Verificar que el usuario tenga un juego seleccionado
    const selectedGame = userStateManager.getSelectedGame(userId);
    if (!selectedGame) {
      return bot.sendMessage(chatId, BOT_CONFIG.messages.noJuegoSeleccionado, {
        parse_mode: "HTML",
      });
    }

    // Verificar que el juego esté disponible
    const juego = BOT_CONFIG.juegos.find((j) => j.id === selectedGame);
    if (!juego || !juego.disponible) {
      return bot.sendMessage(
        chatId,
        BOT_CONFIG.messages.juegoNoDisponible(juego?.nombre || selectedGame),
        {
          parse_mode: "HTML",
        }
      );
    }

    // Mostrar opciones de modo para el juego seleccionado
    const modosDisponibles = Object.entries(juego.modos).map(
      ([modo, config]) => ({
        modo,
        nombre: config.nombre,
        limiteJugadores: config.limiteJugadores,
      })
    );

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: modosDisponibles.map((modo) => [
          {
            text: `${modo.nombre} (${modo.limiteJugadores} jugadores)`,
            callback_data: `create_sala_mode:${modo.modo}`,
          },
        ]),
      },
    };

    await bot.sendMessage(
      chatId,
      `🏗️ <b>Crear Sala - ${juego.nombre}</b>

Selecciona el modo de juego:`,
      {
        parse_mode: "HTML",
        ...inlineKeyboard,
      }
    );
  } catch (err) {
    console.error("❌ Error en /crearsala:", err.message);
    await bot.sendMessage(chatId, "❌ Error creando sala. Intenta de nuevo.");
  }
}

module.exports = {
  handleSalas,
  handleCrearSala,
};
