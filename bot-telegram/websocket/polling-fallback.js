/**
 * Sistema de Polling de Respaldo para Notificaciones
 * Se activa automáticamente cuando el WebSocket se desconecta
 */
class PollingFallback {
  constructor(api, notificationHandler) {
    this.api = api;
    this.notificationHandler = notificationHandler;
    this.interval = null;
    this.isActive = false;
    this.pollingInterval = 30000; // 30 segundos
    this.lastPollTime = null;
  }

  /**
   * Iniciar polling de respaldo
   */
  start() {
    if (this.isActive) {
      console.log("⚠️ [FALLBACK] Polling ya está activo");
      return;
    }

    console.log("⚠️ [FALLBACK] Iniciando polling de respaldo");
    this.isActive = true;
    this.lastPollTime = new Date();

    // Polling inmediato al iniciar
    this.poll();

    // Configurar polling periódico
    this.interval = setInterval(() => {
      this.poll();
    }, this.pollingInterval);
  }

  /**
   * Detener polling de respaldo
   */
  stop() {
    if (!this.isActive) {
      console.log("✅ [FALLBACK] Polling ya está detenido");
      return;
    }

    console.log("✅ [FALLBACK] Deteniendo polling de respaldo");
    this.isActive = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Consultar notificaciones pendientes del backend
   */
  async poll() {
    if (!this.isActive) {
      return;
    }

    try {
      console.log("🔍 [FALLBACK] Consultando notificaciones pendientes...");

      const notificaciones = await this.api.getNotificacionesPendientes();

      if (!notificaciones || notificaciones.length === 0) {
        console.log("ℹ️ [FALLBACK] No hay notificaciones pendientes");
        return;
      }

      console.log(
        `📬 [FALLBACK] ${notificaciones.length} notificación(es) encontrada(s)`
      );

      // Procesar cada notificación
      for (const notificacion of notificaciones) {
        try {
          await this.notificationHandler.handleNotificacion(notificacion);
        } catch (error) {
          console.error(
            `❌ [FALLBACK] Error procesando notificación ${notificacion._id}:`,
            error.message
          );
        }
      }

      this.lastPollTime = new Date();
    } catch (error) {
      console.error(`❌ [FALLBACK] Error en polling:`, error.message);
    }
  }

  /**
   * Obtener estadísticas del polling
   */
  getStats() {
    return {
      isActive: this.isActive,
      lastPollTime: this.lastPollTime,
      pollingInterval: this.pollingInterval,
    };
  }
}

module.exports = PollingFallback;
