"use strict";

const { getPlayerDisplayName } = require("./player-names");

/**
 * Obtiene la información completa de un jugador, ya sea un objeto completo o solo un ID
 * @param {Object|string} jugadorOrId - Objeto jugador completo o ID del jugador
 * @param {Object} api - Instancia de BackendAPI
 * @returns {Promise<Object|null>} Objeto jugador completo o null si no se puede obtener
 */
async function getPlayerInfo(jugadorOrId, api) {
  try {
    // Si ya tenemos un objeto completo, devolverlo
    if (typeof jugadorOrId === "object" && jugadorOrId !== null) {
      return jugadorOrId;
    }

    // Si solo tenemos el ID, obtener la información completa
    if (typeof jugadorOrId === "string") {
      console.log(
        `🔍 [NOTIFICACION] Obteniendo información completa para jugador ID: ${jugadorOrId}`
      );
      const jugador = await api.findPlayerById(jugadorOrId);
      if (!jugador) {
        console.log(
          `⚠️ [NOTIFICACION] No se pudo obtener información del jugador ${jugadorOrId}`
        );
        return null;
      }
      return jugador;
    }

    return null;
  } catch (error) {
    console.log(`❌ Error obteniendo información del jugador:`, error.message);
    return null;
  }
}

/**
 * Sistema de notificaciones para salas de juego
 * Maneja el envío de mensajes de actualización a los jugadores
 */

/**
 * Notifica a todos los jugadores de una sala sobre un nuevo jugador que se unió
 * @param {Object} bot - Instancia del bot de Telegram
 * @param {Object} api - Instancia de BackendAPI
 * @param {Object} sala - Información de la sala
 * @param {Object} nuevoJugador - Información del jugador que se unió
 */
async function notificarNuevoJugador(bot, api, sala, nuevoJugador) {
  try {
    console.log("🔍 [NOTIFICACION] Iniciando notificación de nuevo jugador");
    console.log(
      "🔍 [NOTIFICACION] Sala recibida:",
      JSON.stringify(sala, null, 2)
    );
    console.log(
      "🔍 [NOTIFICACION] Nuevo jugador:",
      JSON.stringify(nuevoJugador, null, 2)
    );

    if (!sala.jugadores || sala.jugadores.length === 0) {
      console.log(
        "⚠️ [NOTIFICACION] No hay jugadores en la sala para notificar"
      );
      return;
    }

    console.log(`🔍 [NOTIFICACION] Jugadores en sala:`, sala.jugadores);

    const mensaje = `🎉 <b>¡Nuevo jugador se unió a la sala!</b>

🎮 <b>Sala:</b> ${sala.nombre || `Sala ${sala._id?.slice(-6)}`}
👤 <b>Jugador:</b> ${await getPlayerDisplayName(nuevoJugador)}
👥 <b>Total jugadores:</b> ${sala.jugadores.length}

${
  sala.jugadores.length >= sala.configuracion?.maxJugadores
    ? "🎯 <b>¡Sala completa!</b> La partida comenzará pronto."
    : "⏳ Esperando más jugadores..."
}`;

    console.log("📝 [NOTIFICACION] Mensaje a enviar:", mensaje);

    // Enviar notificación a todos los jugadores de la sala
    for (const jugadorOrId of sala.jugadores) {
      let playerName = "Jugador";
      try {
        // Obtener información completa del jugador
        const jugador = await getPlayerInfo(jugadorOrId, api);
        if (!jugador) {
          continue;
        }

        playerName = await getPlayerDisplayName(jugador);
        console.log(`🔍 [NOTIFICACION] Procesando jugador: ${playerName}`);

        // Verificar que el jugador tenga telegramId
        if (jugador && jugador.telegramId) {
          console.log(
            `📱 [NOTIFICACION] Enviando mensaje a telegramId: ${jugador.telegramId}`
          );
          await bot.sendMessage(jugador.telegramId, mensaje, {
            parse_mode: "HTML",
          });
          console.log(
            `✅ [NOTIFICACION] Mensaje enviado exitosamente a ${jugador.telegramId}`
          );
        } else {
          console.log(
            `⚠️ [NOTIFICACION] Jugador sin telegramId válido:`,
            jugador
          );
        }
      } catch (error) {
        console.log(
          `❌ Error notificando a jugador ${playerName}:`,
          error.message
        );
      }
    }

    console.log(
      `✅ Notificación de nuevo jugador enviada a ${sala.jugadores.length} jugadores`
    );
  } catch (error) {
    console.error(
      "❌ Error enviando notificación de nuevo jugador:",
      error.message
    );
  }
}

/**
 * Notifica a todos los jugadores cuando una sala se completa
 * @param {Object} bot - Instancia del bot de Telegram
 * @param {Object} api - Instancia de BackendAPI
 * @param {Object} sala - Información de la sala
 */
async function notificarSalaCompleta(bot, api, sala) {
  try {
    console.log("🔍 [NOTIFICACION] Iniciando notificación de sala completa");
    console.log(
      "🔍 [NOTIFICACION] Sala recibida:",
      JSON.stringify(sala, null, 2)
    );

    if (!sala.jugadores || sala.jugadores.length === 0) {
      console.log(
        "⚠️ [NOTIFICACION] No hay jugadores en la sala para notificar"
      );
      return;
    }

    console.log(`🔍 [NOTIFICACION] Jugadores en sala:`, sala.jugadores);
    console.log(
      `🔍 [NOTIFICACION] Cantidad de jugadores:`,
      sala.jugadores.length
    );
    console.log(
      `🔍 [NOTIFICACION] maxJugadores configurado:`,
      sala.configuracion?.maxJugadores
    );
    console.log(
      `🔍 [NOTIFICACION] ¿Sala realmente completa?`,
      sala.jugadores.length >= (sala.configuracion?.maxJugadores || 999)
    );

    // Obtener maxJugadores del modo de la sala (misma lógica que en sala-callbacks.js)
    const BOT_CONFIG = require("../config/bot-config");
    const modo = sala.modo;
    let maxJugadores = sala.configuracion?.maxJugadores;

    console.log(`🔍 [NOTIFICACION] Obteniendo maxJugadores para mensaje:`);
    console.log(`🔍 [NOTIFICACION] - modo: ${modo}`);
    console.log(`🔍 [NOTIFICACION] - juego: ${sala.juego}`);
    console.log(`🔍 [NOTIFICACION] - maxJugadores en config: ${maxJugadores}`);

    // Si no está en configuración, obtener del modo
    if (!maxJugadores && modo) {
      const juego = BOT_CONFIG.juegos.find((j) => j.id === sala.juego);
      if (juego && juego.modos && juego.modos[modo]) {
        maxJugadores = juego.modos[modo].maxJugadores;
        console.log(
          `🔍 [NOTIFICACION] - maxJugadores obtenido del modo: ${maxJugadores}`
        );
      } else {
        console.log(
          `⚠️ [NOTIFICACION] - No se encontró el juego o modo en BOT_CONFIG`
        );
      }
    }

    // Fallback final
    if (!maxJugadores) {
      maxJugadores = sala.jugadores.length; // Usar el número actual como fallback
      console.log(
        `🔍 [NOTIFICACION] - maxJugadores usando fallback: ${maxJugadores}`
      );
    }

    console.log(`🔍 [NOTIFICACION] - maxJugadores final: ${maxJugadores}`);

    const mensaje = `🎯 <b>¡Sala completada!</b>

🎮 <b>Sala:</b> ${sala.nombre || `Sala ${sala._id?.slice(-6)}`}
👥 <b>Jugadores:</b> ${sala.jugadores.length}/${maxJugadores}
🚀 <b>Estado:</b> Iniciando partida

⏰ <b>La partida comenzará en breve...</b>`;

    console.log("📝 [NOTIFICACION] Mensaje a enviar:", mensaje);

    // Enviar notificación a todos los jugadores de la sala
    console.log(
      `🔍 [NOTIFICACION] Iniciando envío a ${sala.jugadores.length} jugadores`
    );
    let jugadoresNotificados = 0;
    let jugadoresConError = 0;

    for (let i = 0; i < sala.jugadores.length; i++) {
      const jugadorOrId = sala.jugadores[i];
      let playerName = "Jugador";

      console.log(
        `🔍 [NOTIFICACION] Procesando jugador ${i + 1}/${
          sala.jugadores.length
        }:`,
        jugadorOrId
      );

      try {
        // Obtener información completa del jugador
        const jugador = await getPlayerInfo(jugadorOrId, api);
        if (!jugador) {
          console.log(
            `⚠️ [NOTIFICACION] No se pudo obtener información del jugador ${
              i + 1
            }`
          );
          jugadoresConError++;
          continue;
        }

        playerName = await getPlayerDisplayName(jugador);
        console.log(`🔍 [NOTIFICACION] Procesando jugador: ${playerName}`);

        // Verificar que el jugador tenga telegramId
        if (jugador && jugador.telegramId) {
          console.log(
            `📱 [NOTIFICACION] Enviando mensaje a telegramId: ${jugador.telegramId}`
          );
          await bot.sendMessage(jugador.telegramId, mensaje, {
            parse_mode: "HTML",
          });
          console.log(
            `✅ [NOTIFICACION] Mensaje enviado exitosamente a ${jugador.telegramId}`
          );
          jugadoresNotificados++;
        } else {
          console.log(
            `⚠️ [NOTIFICACION] Jugador sin telegramId válido:`,
            jugador
          );
          jugadoresConError++;
        }
      } catch (error) {
        console.log(
          `❌ Error notificando sala completa a jugador ${playerName}:`,
          error.message
        );
        jugadoresConError++;
      }
    }

    console.log(`📊 [NOTIFICACION] Resumen de envío:`);
    console.log(
      `📊 [NOTIFICACION] - Jugadores notificados: ${jugadoresNotificados}`
    );
    console.log(
      `📊 [NOTIFICACION] - Jugadores con error: ${jugadoresConError}`
    );
    console.log(
      `📊 [NOTIFICACION] - Total procesados: ${
        jugadoresNotificados + jugadoresConError
      }`
    );

    console.log(
      `✅ Notificación de sala completa enviada a ${sala.jugadores.length} jugadores`
    );
  } catch (error) {
    console.error(
      "❌ Error enviando notificación de sala completa:",
      error.message
    );
  }
}

/**
 * Notifica a todos los jugadores cuando un jugador abandona la sala
 * @param {Object} bot - Instancia del bot de Telegram
 * @param {Object} api - Instancia de BackendAPI
 * @param {Object} sala - Información de la sala
 * @param {Object} jugadorAbandono - Información del jugador que abandonó
 */
async function notificarJugadorAbandono(bot, api, sala, jugadorAbandono) {
  try {
    console.log("🔍 [NOTIFICACION] Iniciando notificación de abandono");
    console.log(
      "🔍 [NOTIFICACION] Sala recibida:",
      JSON.stringify(sala, null, 2)
    );
    console.log(
      "🔍 [NOTIFICACION] Jugador que abandonó:",
      JSON.stringify(jugadorAbandono, null, 2)
    );

    if (!sala.jugadores || sala.jugadores.length === 0) {
      console.log(
        "⚠️ [NOTIFICACION] No hay jugadores en la sala para notificar"
      );
      return;
    }

    console.log(
      `🔍 [NOTIFICACION] Jugadores restantes en sala:`,
      sala.jugadores
    );

    const mensaje = `👋 <b>Un jugador abandonó la sala</b>

🎮 <b>Sala:</b> ${sala.nombre || `Sala ${sala._id?.slice(-6)}`}
👤 <b>Jugador que abandonó:</b> ${await getPlayerDisplayName(jugadorAbandono)}
👥 <b>Jugadores restantes:</b> ${sala.jugadores.length}

${
  sala.jugadores.length < (sala.configuracion?.minJugadores || 2)
    ? "⚠️ <b>¡Atención!</b> La sala necesita más jugadores para continuar."
    : "✅ La sala puede continuar con los jugadores restantes."
}`;

    console.log("📝 [NOTIFICACION] Mensaje a enviar:", mensaje);

    // Enviar notificación a todos los jugadores restantes de la sala
    for (const jugadorOrId of sala.jugadores) {
      let playerName = "Jugador";
      try {
        // Obtener información completa del jugador
        const jugador = await getPlayerInfo(jugadorOrId, api);
        if (!jugador) {
          continue;
        }

        playerName = await getPlayerDisplayName(jugador);
        console.log(`🔍 [NOTIFICACION] Procesando jugador: ${playerName}`);

        // Verificar que el jugador tenga telegramId
        if (jugador && jugador.telegramId) {
          console.log(
            `📱 [NOTIFICACION] Enviando mensaje a telegramId: ${jugador.telegramId}`
          );
          await bot.sendMessage(jugador.telegramId, mensaje, {
            parse_mode: "HTML",
          });
          console.log(
            `✅ [NOTIFICACION] Mensaje enviado exitosamente a ${jugador.telegramId}`
          );
        } else {
          console.log(
            `⚠️ [NOTIFICACION] Jugador sin telegramId válido:`,
            jugador
          );
        }
      } catch (error) {
        console.log(
          `❌ Error notificando abandono a jugador ${playerName}:`,
          error.message
        );
      }
    }

    console.log(
      `✅ Notificación de abandono enviada a ${sala.jugadores.length} jugadores`
    );
  } catch (error) {
    console.error("❌ Error enviando notificación de abandono:", error.message);
  }
}

/**
 * Notifica a todos los jugadores cuando una sala se cancela
 * @param {Object} bot - Instancia del bot de Telegram
 * @param {Object} api - Instancia de BackendAPI
 * @param {Object} sala - Información de la sala
 * @param {string} motivo - Motivo de la cancelación
 */
async function notificarSalaCancelada(
  bot,
  api,
  sala,
  motivo = "Cancelación de la sala"
) {
  try {
    console.log("🔍 [NOTIFICACION] Iniciando notificación de sala cancelada");
    console.log(
      "🔍 [NOTIFICACION] Sala recibida:",
      JSON.stringify(sala, null, 2)
    );
    console.log("🔍 [NOTIFICACION] Motivo:", motivo);

    if (!sala.jugadores || sala.jugadores.length === 0) {
      console.log(
        "⚠️ [NOTIFICACION] No hay jugadores en la sala para notificar"
      );
      return;
    }

    console.log(`🔍 [NOTIFICACION] Jugadores en sala:`, sala.jugadores);

    const mensaje = `❌ <b>Sala cancelada</b>

🎮 <b>Sala:</b> ${sala.nombre || `Sala ${sala._id?.slice(-6)}`}
📝 <b>Motivo:</b> ${motivo}
👥 <b>Jugadores afectados:</b> ${sala.jugadores.length}

💡 <b>Puedes buscar otras salas disponibles o crear una nueva.</b>`;

    console.log("📝 [NOTIFICACION] Mensaje a enviar:", mensaje);

    // Enviar notificación a todos los jugadores de la sala
    for (const jugadorOrId of sala.jugadores) {
      let playerName = "Jugador";
      try {
        // Obtener información completa del jugador
        const jugador = await getPlayerInfo(jugadorOrId, api);
        if (!jugador) {
          continue;
        }

        playerName = await getPlayerDisplayName(jugador);
        console.log(`🔍 [NOTIFICACION] Procesando jugador: ${playerName}`);

        // Verificar que el jugador tenga telegramId
        if (jugador && jugador.telegramId) {
          console.log(
            `📱 [NOTIFICACION] Enviando mensaje a telegramId: ${jugador.telegramId}`
          );
          await bot.sendMessage(jugador.telegramId, mensaje, {
            parse_mode: "HTML",
          });
          console.log(
            `✅ [NOTIFICACION] Mensaje enviado exitosamente a ${jugador.telegramId}`
          );
        } else {
          console.log(
            `⚠️ [NOTIFICACION] Jugador sin telegramId válido:`,
            jugador
          );
        }
      } catch (error) {
        console.log(
          `❌ Error notificando sala cancelada a jugador ${playerName}:`,
          error.message
        );
      }
    }

    console.log(
      `✅ Notificación de sala cancelada enviada a ${sala.jugadores.length} jugadores`
    );
  } catch (error) {
    console.error(
      "❌ Error enviando notificación de sala cancelada:",
      error.message
    );
  }
}

module.exports = {
  notificarNuevoJugador,
  notificarSalaCompleta,
  notificarSalaCancelada,
  notificarJugadorAbandono,
};
