"use strict";

/**
 * Comandos de notificaciones para jugadores
 */

/**
 * Comando /notificaciones - Ver últimas 10 notificaciones
 */
async function handleNotificaciones(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    console.log(
      `📬 [NOTIFICACIONES] Usuario ${userId} solicita notificaciones`
    );

    // Obtener notificaciones del jugador
    const result = await api.obtenerNotificacionesJugador(String(userId), 10);

    if (
      !result ||
      !result.notificaciones ||
      result.notificaciones.length === 0
    ) {
      await bot.sendMessage(
        chatId,
        `🔕 <b>No tienes notificaciones</b>

No hay notificaciones registradas en este momento.
Cuando ocurran eventos importantes, aparecerán aquí.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Formatear notificaciones
    const notificaciones = result.notificaciones;
    let mensaje = `🔔 <b>Tus Notificaciones</b>\n\n`;
    mensaje += `Mostrando las últimas ${notificaciones.length} notificaciones:\n\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━\n\n`;

    notificaciones.forEach((notif, index) => {
      const fecha = formatearFecha(notif.createdAt);
      const icono = obtenerIcono(notif.tipo);

      mensaje += `${icono} <b>${notif.titulo}</b>\n`;
      mensaje += `${notif.mensaje}\n`;
      mensaje += `📅 ${fecha}\n`;

      // Mostrar datos adicionales si existen
      if (notif.datos && notif.datos.monto) {
        mensaje += `💰 Monto: ${(notif.datos.monto / 100).toFixed(2)} Bs\n`;
      }

      mensaje += `\n━━━━━━━━━━━━━━━━━━\n\n`;
    });

    mensaje += `📝 <i>Usa /eliminar_notificacion [id] para eliminar una notificación</i>`;

    await bot.sendMessage(chatId, mensaje, { parse_mode: "HTML" });

    console.log(
      `✅ [NOTIFICACIONES] Enviadas ${notificaciones.length} notificaciones a ${userId}`
    );
  } catch (error) {
    console.error(`❌ [NOTIFICACIONES] Error:`, error.message);
    await bot.sendMessage(
      chatId,
      `❌ <b>Error</b>

No se pudieron cargar las notificaciones. Intenta de nuevo más tarde.`,
      { parse_mode: "HTML" }
    );
  }
}

/**
 * Comando /eliminar_notificacion <id> - Eliminar una notificación específica
 */
async function handleEliminarNotificacion(bot, api, msg, match) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Obtener ID de la notificación del comando
    const notificacionId = match[1]?.trim();

    if (!notificacionId) {
      await bot.sendMessage(
        chatId,
        `⚠️ <b>Uso incorrecto</b>

Para eliminar una notificación, usa:
<code>/eliminar_notificacion [id]</code>

Puedes ver los IDs con el comando /notificaciones`,
        { parse_mode: "HTML" }
      );
      return;
    }

    console.log(
      `🗑️ [NOTIFICACIONES] Usuario ${userId} elimina notificación ${notificacionId}`
    );

    // Eliminar notificación
    await api.eliminarNotificacion(notificacionId);

    await bot.sendMessage(
      chatId,
      `✅ <b>Notificación eliminada</b>

La notificación ha sido eliminada correctamente.`,
      { parse_mode: "HTML" }
    );

    console.log(
      `✅ [NOTIFICACIONES] Notificación ${notificacionId} eliminada para usuario ${userId}`
    );
  } catch (error) {
    console.error(`❌ [NOTIFICACIONES] Error eliminando:`, error.message);

    let mensajeError = `❌ <b>Error</b>

No se pudo eliminar la notificación.`;

    if (error.response?.status === 404) {
      mensajeError += `\n\nLa notificación no existe o ya fue eliminada.`;
    }

    await bot.sendMessage(chatId, mensajeError, { parse_mode: "HTML" });
  }
}

/**
 * Formatear fecha de manera legible
 */
function formatearFecha(dateString) {
  const date = new Date(dateString);
  const ahora = new Date();
  const diff = ahora - date;

  // Menos de 1 minuto
  if (diff < 60000) {
    return "Hace un momento";
  }

  // Menos de 1 hora
  if (diff < 3600000) {
    const minutos = Math.floor(diff / 60000);
    return `Hace ${minutos} minuto${minutos > 1 ? "s" : ""}`;
  }

  // Menos de 1 día
  if (diff < 86400000) {
    const horas = Math.floor(diff / 3600000);
    return `Hace ${horas} hora${horas > 1 ? "s" : ""}`;
  }

  // Menos de 7 días
  if (diff < 604800000) {
    const dias = Math.floor(diff / 86400000);
    return `Hace ${dias} día${dias > 1 ? "s" : ""}`;
  }

  // Fecha completa
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Obtener icono según tipo de notificación
 */
function obtenerIcono(tipo) {
  const iconos = {
    deposito_aprobado: "✅",
    deposito_rechazado: "❌",
    retiro_aprobado: "✅",
    retiro_rechazado: "❌",
    sala_completa: "🎮",
    juego_iniciado: "🎲",
  };
  return iconos[tipo] || "🔔";
}

module.exports = {
  handleNotificaciones,
  handleEliminarNotificacion,
};
