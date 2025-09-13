"use strict";

const BOT_CONFIG = require("../config/bot-config");
const cacheService = require("./cache-service");

/**
 * Obtiene el nombre del juego por su ID
 * @param {string} gameId - ID del juego
 * @returns {string} Nombre del juego
 */
function getGameName(gameId) {
  const game = BOT_CONFIG.juegos.find((j) => j.id === gameId);
  return game ? game.nombre : gameId;
}

/**
 * Verifica si un usuario es administrador
 * @param {number} userId - ID del usuario
 * @returns {boolean} true si es admin
 */
function isAdmin(userId) {
  const adminId = process.env.ADMIN_ID;
  return userId.toString() === adminId;
}

/**
 * Maneja errores de API y devuelve mensaje apropiado
 * @param {Error} err - Error capturado
 * @returns {string} Mensaje de error para el usuario
 */
function handleApiError(err) {
  let errorMessage = "Error consultando el servidor. Intenta luego.";

  if (err.message === "Timeout") {
    errorMessage =
      "El servidor está tardando en responder. Intenta de nuevo en unos momentos.";
  } else if (err.code === "ECONNREFUSED") {
    errorMessage =
      "No se puede conectar con el servidor. Verifica que el backend esté funcionando.";
  } else if (err.response && err.response.status === 401) {
    errorMessage =
      "Error de autenticación con el servidor. El administrador debe verificar la configuración.";
  } else if (err.response && err.response.status === 500) {
    errorMessage = "Error interno del servidor. Intenta de nuevo más tarde.";
  }

  return errorMessage;
}

/**
 * Registra o encuentra un jugador en el backend
 * @param {Object} api - Instancia de BackendAPI
 * @param {Object} user - Objeto user de Telegram
 * @returns {Object} Jugador encontrado o creado
 */
async function registerOrFindPlayer(api, user) {
  try {
    let jugador = await api.findPlayerByTelegram(String(user.id));

    if (!jugador) {
      // Para registro automático sin nickname, usar el nombre de Telegram como fallback
      // Asegurar que nickname nunca sea null para evitar errores de índice único
      const nickname =
        user.first_name ||
        user.username ||
        `Jugador_${user.id}` ||
        `User_${user.id}`;
      const username = user.username || `user_${user.id}`;
      const firstName = user.first_name || null; // Guardar firstName por separado

      const jugadorResponse = await api.createPlayer({
        telegramId: String(user.id),
        username: username,
        nickname: nickname,
        firstName: firstName, // Añadir firstName al registro
      });

      // Manejar la respuesta del backend correctamente
      jugador = jugadorResponse.jugador || jugadorResponse;

      console.log(`✅ Nuevo jugador registrado: ${nickname} (${user.id})`);
    } else {
      console.log(
        `✅ Jugador existente: ${jugador.nickname || jugador.username} (${
          user.id
        })`
      );
    }

    return jugador;
  } catch (err) {
    console.error("❌ Error registrando/buscando jugador:", err.message);
    throw err;
  }
}

/**
 * Envía las salas filtradas por juego seleccionado
 * @param {Object} bot - Instancia del bot de Telegram
 * @param {number} chatId - ID del chat
 * @param {Array} salas - Lista de salas
 * @param {string} gameId - ID del juego seleccionado
 * @param {string} gameName - Nombre del juego
 * @param {Object} api - Instancia de BackendAPI para buscar jugadores
 * @param {Object} currentUser - Usuario actual (opcional)
 */
async function sendFilteredRooms(
  bot,
  chatId,
  salas,
  gameId,
  gameName,
  api,
  currentUser = null
) {
  // Importar PaymentConfigManager para obtener precios y calcular premios
  const PaymentConfigManager = require("./payment-config-manager");
  const moneyUtils = require("./money-utils");

  // Crear instancia del PaymentConfigManager
  const paymentConfigManager = new PaymentConfigManager(api);
  if (!salas || salas.length === 0) {
    return bot.sendMessage(
      chatId,
      BOT_CONFIG.messages.noSalasDisponibles(gameName),
      {
        parse_mode: "Markdown",
      }
    );
  }

  // Filtrar salas por el juego seleccionado
  const salasFiltradas = salas.filter(
    (sala) => sala.juego === gameId || sala.configuracion?.juego === gameId
  );

  if (salasFiltradas.length === 0) {
    return bot.sendMessage(
      chatId,
      BOT_CONFIG.messages.noSalasDisponibles(gameName),
      {
        parse_mode: "Markdown",
      }
    );
  }

  // Calcular jugadores faltantes y ordenar salas
  const salasConPrioridad = salasFiltradas.map((sala) => {
    // Obtener el juego correspondiente
    const juego = BOT_CONFIG.juegos.find((j) => j.id === gameId);
    const modoConfig = juego?.modos?.[sala.modo];
    const limiteJugadores = modoConfig?.limiteJugadores || 4;
    const jugadoresActuales = sala.jugadores?.length || 0;
    const jugadoresFaltantes = limiteJugadores - jugadoresActuales;

    return {
      ...sala,
      jugadoresFaltantes,
      limiteJugadores,
      modoNombre: modoConfig?.nombre || sala.modo,
    };
  });

  // Ordenar por jugadores faltantes (menos faltantes primero)
  salasConPrioridad.sort((a, b) => a.jugadoresFaltantes - b.jugadoresFaltantes);

  // Enviar título
  await bot.sendMessage(chatId, BOT_CONFIG.messages.tituloSalas(gameName), {
    parse_mode: "Markdown",
  });

  // Para cada sala mostramos un bloque con botón "Unirme"
  for (const s of salasConPrioridad) {
    const jugadoresActuales = s.jugadores?.length || 0;
    const estadoSala =
      s.jugadoresFaltantes === 0
        ? "🟢 Completa"
        : s.jugadoresFaltantes === 1
        ? "🟡 Casi llena"
        : "🔵 Disponible";

    // Preparar lista de jugadores
    let jugadoresList = "";
    if (s.jugadores && s.jugadores.length > 0) {
      const jugadoresNombres = await Promise.all(
        s.jugadores.map(async (jugador) => {
          // Si el jugador es un objeto completo, usar nickname, firstName o username
          if (typeof jugador === "object" && jugador !== null) {
            // Si el nickname indica "sin nickname", usar firstName o username
            if (
              jugador.nickname &&
              jugador.nickname.startsWith("SIN_NICKNAME_")
            ) {
              // Si no hay firstName (problema del backend), usar username
              return jugador.firstName || jugador.username || "Jugador";
            }
            return (
              jugador.nickname ||
              jugador.firstName ||
              jugador.username ||
              "Jugador"
            );
          }
          // Si es solo un ID, buscar la información del jugador en el backend
          if (typeof jugador === "string" && api) {
            try {
              const jugadorCompleto = await api.findPlayerById(jugador);
              if (jugadorCompleto) {
                // Si el nickname indica "sin nickname", usar firstName o username
                if (
                  jugadorCompleto.nickname &&
                  jugadorCompleto.nickname.startsWith("SIN_NICKNAME_")
                ) {
                  // Si no hay firstName (problema del backend), usar username
                  return (
                    jugadorCompleto.firstName ||
                    jugadorCompleto.username ||
                    "Jugador"
                  );
                }
                return (
                  jugadorCompleto.nickname ||
                  jugadorCompleto.firstName ||
                  jugadorCompleto.username ||
                  "Jugador"
                );
              }
            } catch (err) {
              console.log(`Error buscando jugador ${jugador}:`, err.message);
            }
          }
          // Fallback si no se puede obtener la información
          return "Jugador";
        })
      );
      jugadoresList = `\n👤 **Jugadores:** ${jugadoresNombres.join(", ")}`;
    }

    // Obtener información del creador
    let creadorInfo = "";
    if (s.creador) {
      try {
        const creadorCompleto = await api.findPlayerById(s.creador);
        if (creadorCompleto) {
          const nombreCreador =
            creadorCompleto.nickname &&
            !creadorCompleto.nickname.startsWith("SIN_NICKNAME_")
              ? creadorCompleto.nickname
              : creadorCompleto.firstName ||
                creadorCompleto.username ||
                "Jugador";
          creadorInfo = `\n👑 **Creador:** ${nombreCreador}`;
        }
      } catch (err) {
        console.log(`Error buscando creador ${s.creador}:`, err.message);
        creadorInfo = "\n👑 **Creador:** Desconocido";
      }
    }

    // Obtener precio de entrada desde el backend
    let precioEntrada = 0;
    let premioCalculado = 0;
    let precioFormateado = "0,00 Bs";
    let premioFormateado = "0,00 Bs";

    try {
      // Obtener precio de entrada según el modo de la sala
      precioEntrada = await paymentConfigManager.getGamePrice(gameId, s.modo);

      // Calcular premio usando la función calculatePrize
      const prizeInfo = await paymentConfigManager.calculatePrize(
        precioEntrada,
        s.limiteJugadores
      );
      if (prizeInfo) {
        premioCalculado = prizeInfo.winnerPrize;
      }

      // Formatear precios
      precioFormateado = moneyUtils.formatCurrency(precioEntrada, "VES");
      premioFormateado = moneyUtils.formatCurrency(premioCalculado, "VES");
    } catch (error) {
      console.log(
        `Error obteniendo precios para sala ${s._id}:`,
        error.message
      );
      // Usar valores por defecto si hay error
      precioFormateado = "0,00 Bs";
      premioFormateado = "0,00 Bs";
    }

    const text = `🎮 **${s.nombre || `Sala ${s._id}`}**
🏆 **Modo:** ${s.modoNombre}
💰 **Entrada:** ${precioFormateado}
🏅 **Premio:** ${premioFormateado}
👥 **Capacidad:** ${jugadoresActuales}/${
      s.limiteJugadores
    } ${estadoSala}${creadorInfo}${jugadoresList}`;

    // Verificar si el usuario actual está en esta sala
    let userInSala = false;
    if (currentUser && s.jugadores && s.jugadores.length > 0) {
      // Buscar el jugador actual en la lista de jugadores de la sala
      userInSala = s.jugadores.some((jugador) => {
        if (typeof jugador === "object" && jugador !== null) {
          // Si el jugador es un objeto completo, comparar por telegramId
          return jugador.telegramId === String(currentUser.id);
        }
        // Si es solo un ID, necesitamos buscar el jugador en el backend
        // Por ahora, asumimos que no está en la sala si solo tenemos el ID
        return false;
      });

      // Si no se encontró por telegramId, intentar buscar por ID del jugador
      if (!userInSala && api) {
        try {
          // Buscar el jugador actual en el backend
          const jugadorActual = await api.findPlayerByTelegram(
            String(currentUser.id)
          );
          if (jugadorActual) {
            // Verificar si el ID del jugador actual está en la lista de jugadores
            userInSala = s.jugadores.some((jugador) => {
              if (typeof jugador === "string") {
                return jugador === jugadorActual._id;
              } else if (typeof jugador === "object" && jugador !== null) {
                return jugador._id === jugadorActual._id;
              }
              return false;
            });
          }
        } catch (err) {
          console.log(
            `Error verificando si usuario está en sala: ${err.message}`
          );
        }
      }
    }

    // Determinar qué botón mostrar
    let buttonText, callbackData;
    if (userInSala) {
      buttonText = "🚪 Abandonar Sala";
      callbackData = `confirm_leave:${s._id}`;
    } else {
      buttonText = "🎯 Unirme";
      callbackData = `join:${s._id}`;
    }

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [[{ text: buttonText, callback_data: callbackData }]],
      },
    };

    await bot.sendMessage(chatId, text, {
      parse_mode: "Markdown",
      ...inlineKeyboard,
    });
  }
}

/**
 * Obtiene el nombre a usar para dirigirse al usuario usando el servicio de cache
 * @param {Object} api - Instancia de BackendAPI
 * @param {Object} user - Objeto user de Telegram
 * @param {boolean} useCache - Si debe usar el cache (default: true)
 * @returns {string} Display name del usuario
 */
async function getUserDisplayName(api, user, useCache = true) {
  try {
    // Usar el servicio de cache abstracto
    const displayName = await cacheService.getDisplayName(user.id, api, user);
    return displayName || user.first_name || user.username || "Jugador";
  } catch (error) {
    console.log(
      `Error obteniendo display name para ${user.id}:`,
      error.message
    );
    // Fallback a nombre de Telegram
    return user.first_name || user.username || "Jugador";
  }
}

/**
 * Obtiene salas disponibles usando el servicio de cache
 * @param {string} juego - ID del juego
 * @param {Object} api - Instancia de BackendAPI
 * @returns {Promise<Array>} Lista de salas
 */
async function getSalasDisponibles(juego, api) {
  try {
    return await cacheService.getSalasDisponibles(juego, api);
  } catch (error) {
    console.log(`Error obteniendo salas para ${juego}:`, error.message);
    return [];
  }
}

/**
 * Invalida el cache de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} true si se invalidó correctamente
 */
async function invalidateUserCache(userId) {
  try {
    return await cacheService.invalidateUser(userId);
  } catch (error) {
    console.log(`Error invalidando cache para ${userId}:`, error.message);
    return false;
  }
}

/**
 * Obtiene estadísticas del cache
 * @returns {Object} Estadísticas del cache
 */
function getCacheStats() {
  return cacheService.getStats();
}

module.exports = {
  getGameName,
  isAdmin,
  handleApiError,
  registerOrFindPlayer,
  sendFilteredRooms,
  getUserDisplayName,
  getSalasDisponibles,
  invalidateUserCache,
  getCacheStats,
};
