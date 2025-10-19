/**
 * Servicio de notificaciones para jugadores vía Telegram
 * Envía notificaciones y las persiste en MongoDB
 */

"use strict";

/**
 * Enviar notificación a un jugador por Telegram
 * @param {Object} bot - Instancia del bot de Telegram
 * @param {Object} api - Instancia de BackendAPI
 * @param {String} jugadorId - ID del jugador en MongoDB
 * @param {String} telegramId - ID de Telegram del jugador
 * @param {String} tipo - Tipo de notificación
 * @param {String} titulo - Título de la notificación
 * @param {String} mensaje - Mensaje de la notificación
 * @param {Object} datos - Datos adicionales (opcional)
 * @param {String} eventoId - ID del evento para prevenir duplicados (opcional)
 */
async function enviarNotificacionTelegram(
  bot,
  api,
  jugadorId,
  telegramId,
  tipo,
  titulo,
  mensaje,
  datos = {},
  eventoId = null
) {
  try {
    console.log(`🔔 [NOTIFICACION] Enviando a jugador ${telegramId}: ${tipo}`);

    // Formatear mensaje HTML para Telegram
    const mensajeFormateado = `🔔 <b>[NOTIFICACIÓN]</b>

<b>${titulo}</b>
${mensaje}`;

    // 1. Enviar mensaje por Telegram
    let mensajeEnviado = false;
    try {
      await bot.sendMessage(telegramId, mensajeFormateado, {
        parse_mode: "HTML",
      });
      mensajeEnviado = true;
      console.log(
        `✅ [NOTIFICACION] Mensaje enviado a Telegram: ${telegramId}`
      );
    } catch (error) {
      console.error(
        `❌ [NOTIFICACION] Error enviando mensaje por Telegram:`,
        error.message
      );
      // Continuar para guardar en DB aunque falle el envío
    }

    // 2. Guardar en MongoDB (siempre, incluso si falla el envío por Telegram)
    try {
      const notificacionGuardada = await api.crearNotificacionJugador(
        jugadorId,
        telegramId,
        tipo,
        titulo,
        mensaje,
        datos,
        eventoId
      );

      if (notificacionGuardada) {
        console.log(
          `📝 [NOTIFICACION] Guardada en MongoDB para jugador ${telegramId}`
        );
        return {
          success: true,
          mensajeEnviado,
          notificacionGuardada: true,
        };
      } else {
        console.warn(
          `⚠️ [NOTIFICACION] No se pudo guardar en MongoDB (posiblemente duplicada)`
        );
        return {
          success: mensajeEnviado,
          mensajeEnviado,
          notificacionGuardada: false,
          duplicada: true,
        };
      }
    } catch (error) {
      console.error(
        `❌ [NOTIFICACION] Error guardando en MongoDB:`,
        error.message
      );
      // Si se envió por Telegram pero no se guardó, aún es éxito parcial
      return {
        success: mensajeEnviado,
        mensajeEnviado,
        notificacionGuardada: false,
        error: error.message,
      };
    }
  } catch (error) {
    console.error(
      `❌ [NOTIFICACION] Error general en enviarNotificacionTelegram:`,
      error.message
    );
    return {
      success: false,
      mensajeEnviado: false,
      notificacionGuardada: false,
      error: error.message,
    };
  }
}

/**
 * Enviar notificación de depósito aprobado
 */
async function notificarDepositoAprobado(
  bot,
  api,
  transaccion,
  jugador,
  saldoNuevo
) {
  try {
    const monto = (transaccion.monto / 100).toFixed(2);
    const saldo = (saldoNuevo / 100).toFixed(2);

    await enviarNotificacionTelegram(
      bot,
      api,
      jugador._id || jugador.id,
      jugador.telegramId,
      "deposito_aprobado",
      "Depósito Aprobado ✅",
      `Tu depósito de ${monto} Bs ha sido aprobado.\n\n💰 <b>Nuevo saldo:</b> ${saldo} Bs`,
      {
        transaccionId: transaccion._id.toString(),
        monto: transaccion.monto,
        saldoNuevo,
      },
      `deposito-aprobado-${transaccion._id}`
    );
  } catch (error) {
    console.error(`❌ Error notificando depósito aprobado:`, error.message);
  }
}

/**
 * Enviar notificación de depósito rechazado
 */
async function notificarDepositoRechazado(
  bot,
  api,
  transaccion,
  jugador,
  motivo
) {
  try {
    const monto = (transaccion.monto / 100).toFixed(2);

    await enviarNotificacionTelegram(
      bot,
      api,
      jugador._id || jugador.id,
      jugador.telegramId,
      "deposito_rechazado",
      "Depósito Rechazado ❌",
      `Tu depósito de ${monto} Bs ha sido rechazado.\n\n📝 <b>Motivo:</b> ${
        motivo || "No especificado"
      }`,
      {
        transaccionId: transaccion._id.toString(),
        monto: transaccion.monto,
        motivo,
      },
      `deposito-rechazado-${transaccion._id}`
    );
  } catch (error) {
    console.error(`❌ Error notificando depósito rechazado:`, error.message);
  }
}

/**
 * Enviar notificación de retiro aprobado
 */
async function notificarRetiroAprobado(
  bot,
  api,
  transaccion,
  jugador,
  saldoNuevo
) {
  try {
    const monto = (transaccion.monto / 100).toFixed(2);
    const saldo = (saldoNuevo / 100).toFixed(2);

    await enviarNotificacionTelegram(
      bot,
      api,
      jugador._id || jugador.id,
      jugador.telegramId,
      "retiro_aprobado",
      "Retiro Aprobado ✅",
      `Tu retiro de ${monto} Bs ha sido procesado.\n\n💰 <b>Nuevo saldo:</b> ${saldo} Bs`,
      {
        transaccionId: transaccion._id.toString(),
        monto: transaccion.monto,
        saldoNuevo,
      },
      `retiro-aprobado-${transaccion._id}`
    );
  } catch (error) {
    console.error(`❌ Error notificando retiro aprobado:`, error.message);
  }
}

/**
 * Enviar notificación de retiro rechazado
 */
async function notificarRetiroRechazado(
  bot,
  api,
  transaccion,
  jugador,
  motivo
) {
  try {
    const monto = (transaccion.monto / 100).toFixed(2);

    await enviarNotificacionTelegram(
      bot,
      api,
      jugador._id || jugador.id,
      jugador.telegramId,
      "retiro_rechazado",
      "Retiro Rechazado ❌",
      `Tu retiro de ${monto} Bs ha sido rechazado.\n\n📝 <b>Motivo:</b> ${
        motivo || "No especificado"
      }`,
      {
        transaccionId: transaccion._id.toString(),
        monto: transaccion.monto,
        motivo,
      },
      `retiro-rechazado-${transaccion._id}`
    );
  } catch (error) {
    console.error(`❌ Error notificando retiro rechazado:`, error.message);
  }
}

/**
 * Enviar notificación de sala completa
 */
async function notificarSalaCompleta(bot, api, sala, jugador) {
  try {
    await enviarNotificacionTelegram(
      bot,
      api,
      jugador._id || jugador.id,
      jugador.telegramId,
      "sala_completa",
      "Sala Completa 🎮",
      `La sala "${sala.nombre}" está completa y lista para comenzar.`,
      {
        salaId: sala._id.toString(),
        salaNombre: sala.nombre,
        cantidadJugadores: sala.jugadores.length,
      },
      `sala-completa-${sala._id}`
    );
  } catch (error) {
    console.error(`❌ Error notificando sala completa:`, error.message);
  }
}

/**
 * Enviar notificación de juego iniciado
 */
async function notificarJuegoIniciado(bot, api, sala, jugador) {
  try {
    const timestamp = Date.now();

    await enviarNotificacionTelegram(
      bot,
      api,
      jugador._id || jugador.id,
      jugador.telegramId,
      "juego_iniciado",
      "Juego Iniciado 🎲",
      `El juego en la sala "${sala.nombre}" ha comenzado. ¡Buena suerte!`,
      {
        salaId: sala._id.toString(),
        salaNombre: sala.nombre,
      },
      `juego-iniciado-${sala._id}-${timestamp}`
    );
  } catch (error) {
    console.error(`❌ Error notificando juego iniciado:`, error.message);
  }
}

module.exports = {
  enviarNotificacionTelegram,
  notificarDepositoAprobado,
  notificarDepositoRechazado,
  notificarRetiroAprobado,
  notificarRetiroRechazado,
  notificarSalaCompleta,
  notificarJuegoIniciado,
};
