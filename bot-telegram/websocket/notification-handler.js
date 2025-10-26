/**
 * Gestor de notificaciones para el bot de Telegram
 * Procesa notificaciones recibidas vía WebSocket y las envía a los jugadores
 */
class NotificationHandler {
  constructor(bot, api, wsClient) {
    this.bot = bot;
    this.api = api;
    this.wsClient = wsClient;
  }

  /**
   * Manejar notificación recibida
   */
  async handleNotificacion(notificacionData) {
    try {
      // Puede venir de WebSocket (con notificacionId) o de polling (con _id)
      const notificacionId =
        notificacionData.notificacionId || notificacionData._id;
      const { titulo, mensaje } = notificacionData;
      const telegramId =
        notificacionData.jugadorTelegramId ||
        notificacionData.datos?.telegramId;

      if (!telegramId) {
        console.error(
          `❌ [NOTIF] telegramId no encontrado en notificación ${notificacionId}`
        );
        return;
      }

      console.log(`📬 [NOTIF] Procesando notificación ${notificacionId}...`);

      // Enviar mensaje a Telegram
      await this.enviarMensajeTelegram(telegramId, titulo, mensaje);

      // Marcar como enviada en el backend
      await this.api.marcarNotificacionEnviada(notificacionId);

      console.log(
        `✅ [NOTIF] Notificación ${notificacionId} enviada exitosamente`
      );
    } catch (error) {
      console.error(`❌ [NOTIF] Error procesando notificación:`, error.message);

      // Intentar marcar como error o reintentar según la lógica
      // Por ahora solo logueamos el error
    }
  }

  /**
   * Enviar mensaje de Telegram a un jugador
   */
  async enviarMensajeTelegram(telegramId, titulo, mensaje) {
    if (!telegramId) {
      throw new Error("telegramId requerido");
    }

    try {
      const mensajeCompleto = `<b>[NOTIFICACIÓN]</b> ${titulo}\n\n${mensaje}`;

      await this.bot.sendMessage(telegramId, mensajeCompleto, {
        parse_mode: "HTML",
      });

      console.log(`✅ [TELEGRAM] Mensaje enviado a ${telegramId}`);
    } catch (error) {
      console.error(
        `❌ [TELEGRAM] Error enviando mensaje a ${telegramId}:`,
        error.message
      );
      throw error;
    }
  }
}

module.exports = NotificationHandler;
