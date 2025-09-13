"use strict";

const BOT_CONFIG = require("../../config/bot-config");
const userStateManager = require("../../user-state");
const { sendFilteredRooms } = require("../../utils/helpers");

// Variables de entorno
const TEST_MODE = process.env.TEST_MODE === "true" || !process.env.BACKEND_URL;

// Datos de prueba para cuando el backend no esté disponible
const TEST_SALAS = [
  {
    _id: "sala_test_1",
    juego: "ludo",
    modo: "1v1v1v1",
    configuracion: {
      entrada: 5000,
      premio: 20000,
    },
    jugadores: [],
  },
  {
    _id: "sala_test_2",
    juego: "ludo",
    modo: "2v2",
    configuracion: {
      entrada: 3000,
      premio: 12000,
    },
    jugadores: [{ id: "jugador1" }],
  },
];

/**
 * Maneja la selección de juego
 */
async function handleSelectGame(bot, api, callbackQuery, gameId) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;

  const selectedGame = BOT_CONFIG.juegos.find((j) => j.id === gameId);

  if (!selectedGame) {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Juego no encontrado.",
    });
    return;
  }

  // Verificar si el juego está disponible
  if (!selectedGame.disponible) {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: `${selectedGame.nombre} - Próximamente`,
    });

    const mensajeNoDisponible = BOT_CONFIG.messages.juegoNoDisponible(
      selectedGame.nombre
    );
    await bot.sendMessage(chatId, mensajeNoDisponible, {
      parse_mode: "HTML",
    });
    return;
  }

  // Verificar si ya tenía un juego seleccionado
  const previousGameInfo = userStateManager.getSelectedGameInfo(from.id);
  let acknowledgeText = `Juego seleccionado: ${selectedGame.nombre}`;

  if (previousGameInfo && previousGameInfo.gameId !== gameId) {
    const previousGameName =
      BOT_CONFIG.juegos.find((j) => j.id === previousGameInfo.gameId)?.nombre ||
      "Desconocido";
    acknowledgeText = `Cambiado de ${previousGameName} a ${selectedGame.nombre}`;
  }

  // Guardar el juego seleccionado para este usuario
  userStateManager.setSelectedGame(from.id, gameId);

  // Acknowledge callback
  await bot.answerCallbackQuery(callbackQuery.id, {
    text: acknowledgeText,
  });

  // Automáticamente mostrar las salas disponibles
  try {
    let salas;

    if (TEST_MODE) {
      salas = TEST_SALAS;
    } else {
      // Agregar timeout para evitar bloqueos
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 10000)
      );

      const salasPromise = api.getSalasDisponibles();
      salas = await Promise.race([salasPromise, timeoutPromise]);
    }

    await sendFilteredRooms(
      bot,
      chatId,
      salas,
      gameId,
      selectedGame.nombre,
      api,
      from
    );
  } catch (err) {
    console.error("❌ Error obteniendo salas:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error obteniendo salas. Intenta de nuevo."
    );
  }
}

/**
 * Maneja el botón "Ver Salas" después de crear una sala
 */
async function handleVerSalasAfterCreate(bot, api, callbackQuery, juego) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    // Acknowledge callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Mostrando salas...",
    });

    // Obtener salas del juego
    let salas;
    if (TEST_MODE) {
      salas = TEST_SALAS;
    } else {
      const salasPromise = api.getSalasDisponibles();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 10000)
      );
      salas = await Promise.race([salasPromise, timeoutPromise]);
    }

    const juegoConfig = BOT_CONFIG.juegos.find((j) => j.id === juego);
    if (!juegoConfig) {
      await bot.sendMessage(chatId, "❌ Juego no encontrado.");
      return;
    }

    // Mostrar salas filtradas
    await sendFilteredRooms(
      bot,
      chatId,
      salas,
      juego,
      juegoConfig.nombre,
      api,
      from
    );
  } catch (err) {
    console.error("❌ Error mostrando salas:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error obteniendo salas. Intenta de nuevo."
    );
  }
}

module.exports = {
  handleSelectGame,
  handleVerSalasAfterCreate,
};
