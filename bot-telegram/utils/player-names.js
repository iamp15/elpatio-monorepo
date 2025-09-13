"use strict";

const cacheService = require("./cache-service");

/**
 * Obtiene el nombre de referencia de un jugador siguiendo la jerarquía establecida:
 * 1. Nickname (desde el backend)
 * 2. firstName de Telegram
 * 3. username
 * 4. telegramId como fallback
 *
 * @param {Object} jugador - Objeto jugador del backend
 * @param {Object} userState - Estado del usuario (opcional, para cache local)
 * @returns {Promise<string>} Nombre de referencia del jugador
 */
async function getPlayerDisplayName(jugador, userState = null) {
  try {
    if (!jugador) {
      return "Jugador";
    }

    console.log(`🔍 [PLAYER-NAMES] Procesando jugador: ${jugador.telegramId}`);

    // 1. Intentar obtener nickname del backend
    if (jugador.nickname && !jugador.nickname.startsWith("SIN_NICKNAME_")) {
      console.log(`✅ [PLAYER-NAMES] Usando nickname: ${jugador.nickname}`);
      return jugador.nickname;
    } else if (jugador.nickname) {
      console.log(
        `⚠️ [PLAYER-NAMES] Nickname inválido (${jugador.nickname}), avanzando a siguiente opción`
      );
    }

    // 2. Intentar obtener displayName del cache local
    if (jugador.telegramId) {
      try {
        const cachedDisplayName = await cacheService.getDisplayName(
          jugador.telegramId
        );
        if (cachedDisplayName) {
          console.log(
            `✅ [PLAYER-NAMES] Usando displayName del cache: ${cachedDisplayName}`
          );
          return cachedDisplayName;
        } else {
          console.log(
            `⚠️ [PLAYER-NAMES] No hay displayName en cache para ${jugador.telegramId}`
          );
        }
      } catch (error) {
        console.log(
          `⚠️ Error obteniendo displayName del cache para ${jugador.telegramId}:`,
          error.message
        );
      }
    }

    // 3. Usar firstName de Telegram
    if (jugador.firstName) {
      console.log(`✅ [PLAYER-NAMES] Usando firstName: ${jugador.firstName}`);
      return jugador.firstName;
    } else {
      console.log(`⚠️ [PLAYER-NAMES] No hay firstName disponible`);
    }

    // 4. Usar username
    if (jugador.username && !jugador.username.startsWith("user_")) {
      console.log(`✅ [PLAYER-NAMES] Usando username: ${jugador.username}`);
      return jugador.username;
    } else if (jugador.username) {
      console.log(
        `⚠️ [PLAYER-NAMES] Username inválido (${jugador.username}), avanzando a siguiente opción`
      );
    }

    // 5. Fallback a telegramId
    if (jugador.telegramId) {
      console.log(
        `✅ [PLAYER-NAMES] Usando fallback: Jugador_${jugador.telegramId}`
      );
      return `Jugador_${jugador.telegramId}`;
    }

    console.log(`⚠️ [PLAYER-NAMES] Sin opciones válidas, usando: Jugador`);
    return "Jugador";
  } catch (error) {
    console.error("❌ Error obteniendo nombre de jugador:", error.message);
    return "Jugador";
  }
}

/**
 * Obtiene el nombre de referencia de un jugador usando solo el telegramId
 * Útil cuando solo tenemos el ID y necesitamos buscar en el cache
 *
 * @param {string} telegramId - ID de Telegram del jugador
 * @param {Object} api - Instancia de BackendAPI para fallback
 * @returns {Promise<string>} Nombre de referencia del jugador
 */
async function getPlayerDisplayNameById(telegramId, api = null) {
  try {
    if (!telegramId) {
      return "Jugador";
    }

    // 1. Intentar obtener del cache local
    try {
      const cachedDisplayName = await cacheService.getDisplayName(telegramId);
      if (cachedDisplayName) {
        return cachedDisplayName;
      }
    } catch (error) {
      console.log(
        `⚠️ Error obteniendo displayName del cache para ${telegramId}:`,
        error.message
      );
    }

    // 2. Si tenemos API, buscar en el backend
    if (api) {
      try {
        const jugador = await api.findPlayerByTelegram(telegramId);
        if (jugador) {
          return await getPlayerDisplayName(jugador);
        }
      } catch (error) {
        console.log(
          `⚠️ Error buscando jugador en backend para ${telegramId}:`,
          error.message
        );
      }
    }

    // 3. Fallback a telegramId
    return `Jugador_${telegramId}`;
  } catch (error) {
    console.error(
      "❌ Error obteniendo nombre de jugador por ID:",
      error.message
    );
    return `Jugador_${telegramId}`;
  }
}

module.exports = {
  getPlayerDisplayName,
  getPlayerDisplayNameById,
};
