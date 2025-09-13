"use strict";

const BOT_CONFIG = require("../../config/bot-config");
const userStateManager = require("../../user-state");
const {
  getGameName,
  getUserDisplayName,
  getSalasDisponibles,
  sendFilteredRooms,
} = require("../../utils/helpers");

/**
 * Maneja el botón "🎮 Seleccionar Juego"
 */
async function handleSeleccionarJuego(bot, api, msg) {
  const chatId = msg.chat.id;

  const inlineKeyboard = {
    reply_markup: {
      inline_keyboard: BOT_CONFIG.juegos
        .filter((juego) => juego.disponible)
        .map((juego) => [
          { text: juego.nombre, callback_data: `select_game:${juego.id}` },
        ]),
    },
  };

  await bot.sendMessage(chatId, BOT_CONFIG.messages.seleccionJuego, {
    parse_mode: "HTML",
    ...inlineKeyboard,
  });
}

/**
 * Maneja el botón "🏠 Ver Salas"
 */
async function handleVerSalas(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const userGame = userStateManager.getSelectedGame(userId);

  if (!userGame) {
    return bot.sendMessage(chatId, BOT_CONFIG.messages.noJuegoSeleccionado, {
      parse_mode: "HTML",
    });
  }

  try {
    // Usar el servicio de cache para obtener salas
    const salas = await getSalasDisponibles(userGame, api);
    const gameName = getGameName(userGame);
    await sendFilteredRooms(
      bot,
      chatId,
      salas,
      userGame,
      gameName,
      api,
      msg.from
    );
  } catch (error) {
    console.error("❌ Error obteniendo salas:", error.message);
    await bot.sendMessage(
      chatId,
      "❌ Error obteniendo salas. Intenta de nuevo."
    );
  }
}

/**
 * Maneja el botón "🏗️ Crear Sala"
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
    console.error("❌ Error en crear sala:", err.message);
    await bot.sendMessage(chatId, "❌ Error creando sala. Intenta de nuevo.");
  }
}

/**
 * Maneja el botón "❓ Ayuda"
 */
async function handleAyuda(bot, api, msg) {
  const chatId = msg.chat.id;

  await bot.sendMessage(chatId, BOT_CONFIG.messages.help, {
    parse_mode: "HTML",
  });
}

/**
 * Maneja el botón "👤 Mi Perfil"
 */
async function handleMiPerfil(bot, api, msg) {
  // Importar el comando de perfil para reutilizar la lógica
  const {
    handleMiPerfil: handleMiPerfilCommand,
  } = require("../commands/profile-commands");

  try {
    // Usar la función del comando de perfil
    await handleMiPerfilCommand(bot, api, msg);
  } catch (error) {
    console.error("❌ Error obteniendo perfil:", error.message);
    await bot.sendMessage(
      msg.chat.id,
      "❌ Error obteniendo tu perfil. Intenta de nuevo."
    );
  }
}

module.exports = {
  handleSeleccionarJuego,
  handleVerSalas,
  handleCrearSala,
  handleAyuda,
  handleMiPerfil,
};
