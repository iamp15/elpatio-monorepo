/**
 * Sistema de límites de abandono para prevenir abusos
 * Usa cache local para tracking de abandonos por jugador
 * Proporciona mensajes claros y transparentes sobre el estado del jugador
 */

class AbandonLimitManager {
  constructor() {
    this.limits = {
      maxAbandonosPorHora: 3,
      maxAbandonosPorDia: 8,
    };

    this.cache = new Map();
  }

  /**
   * Verificar si un jugador puede abandonar una sala
   */
  canAbandon(telegramId) {
    console.log(`🔍 [CANABANDON] Verificando para usuario: ${telegramId}`);
    console.log(`📊 [CANABANDON] Cache actual:`, this.cache.size, "usuarios");

    const userData = this.cache.get(telegramId);

    if (!userData) {
      console.log(
        `✅ [CANABANDON] Usuario sin historial (primer abandono), puede abandonar`
      );
      return { canAbandon: true, reason: null };
    }

    console.log(`📊 [CANABANDON] Usuario con historial encontrado:`, {
      abandonosHora: userData.abandonos.ultimaHora.count,
      abandonosDia: userData.abandonos.ultimoDia.count,
      ultimoResetHora: new Date(
        userData.abandonos.ultimaHora.resetTime
      ).toLocaleString(),
      ultimoResetDia: new Date(
        userData.abandonos.ultimoDia.resetTime
      ).toLocaleString(),
    });

    // Resetear contadores si es necesario
    this.resetCountersIfNeeded(userData, Date.now());

    // Verificar límite por hora
    if (
      userData.abandonos.ultimaHora.count >= this.limits.maxAbandonosPorHora
    ) {
      const tiempoRestante = this.getTimeUntilReset(
        userData.abandonos.ultimaHora.resetTime
      );

      return {
        canAbandon: false,
        reason: "hourly_limit",
        tiempoRestante,
        mensaje: this.getMensajeBloqueoHora(tiempoRestante),
      };
    }

    // Verificar límite por día
    if (userData.abandonos.ultimoDia.count >= this.limits.maxAbandonosPorDia) {
      return {
        canAbandon: false,
        reason: "daily_limit",
        mensaje: this.getMensajeBloqueoDia(),
      };
    }

    return { canAbandon: true, reason: null };
  }

  /**
   * Registrar un abandono VOLUNTARIO de sala
   * Solo se cuenta cuando el jugador toma la decisión activa de abandonar
   */
  registerAbandonVoluntario(telegramId) {
    console.log(
      `🔍 [REGISTERABANDON] Registrando abandono para usuario: ${telegramId}`
    );
    console.log(
      `📊 [REGISTERABANDON] Cache antes del registro:`,
      this.cache.size,
      "usuarios"
    );

    const now = Date.now();
    let userData = this.cache.get(telegramId);

    if (!userData) {
      console.log(
        `🆕 [REGISTERABANDON] Creando nuevo registro para usuario (primer abandono)`
      );
      userData = {
        abandonos: {
          ultimaHora: { count: 0, timestamp: now, resetTime: now + 3600000 },
          ultimoDia: { count: 0, timestamp: now, resetTime: now + 86400000 },
        },
      };
    } else {
      console.log(`📊 [REGISTERABANDON] Usuario existente encontrado:`, {
        abandonosHora: userData.abandonos.ultimaHora.count,
        abandonosDia: userData.abandonos.ultimoDia.count,
      });
    }

    // Resetear contadores si es necesario
    this.resetCountersIfNeeded(userData, now);

    // Incrementar contadores SOLO para abandonos voluntarios
    userData.abandonos.ultimaHora.count++;
    userData.abandonos.ultimoDia.count++;

    this.cache.set(telegramId, userData);

    console.log(
      `📊 [REGISTERABANDON] Cache después del registro:`,
      this.cache.size,
      "usuarios"
    );
    console.log(`📊 [REGISTERABANDON] Datos finales del usuario:`, userData);

    return {
      abandonosHora: userData.abandonos.ultimaHora.count,
      abandonosDia: userData.abandonos.ultimoDia.count,
      bloqueado:
        userData.abandonos.ultimaHora.count >= this.limits.maxAbandonosPorHora,
      mensaje: this.getMensajeDespuesAbandono(
        userData.abandonos.ultimaHora.count,
        userData.abandonos.ultimoDia.count
      ),
    };
  }

  /**
   * Registrar salida AUTOMÁTICA del sistema (NO cuenta en límites)
   * Para salas canceladas por admin, bot, o eventos automáticos
   */
  registerSalidaAutomatica(telegramId, motivo) {
    console.log(
      `📊 Salida automática registrada para ${telegramId}: ${motivo}`
    );

    // NO incrementar contadores, solo registrar para auditoría si es necesario
    return {
      tipo: "salida_automatica",
      motivo: motivo,
      noCuentaEnLimites: true,
    };
  }

  /**
   * Resetear contadores automáticamente
   */
  resetCountersIfNeeded(userData, now) {
    // Resetear contador por hora
    if (now >= userData.abandonos.ultimaHora.resetTime) {
      userData.abandonos.ultimaHora = {
        count: 0,
        timestamp: now,
        resetTime: now + 3600000,
      };
    }

    // Resetear contador por día
    if (now >= userData.abandonos.ultimoDia.resetTime) {
      userData.abandonos.ultimoDia = {
        count: 0,
        timestamp: now,
        resetTime: now + 86400000,
      };
    }
  }

  /**
   * Obtener tiempo restante hasta reset
   */
  getTimeUntilReset(resetTime) {
    const remaining = resetTime - Date.now();
    return Math.ceil(remaining / 60000); // en minutos
  }

  /**
   * Obtener estadísticas de un jugador
   */
  getPlayerStats(telegramId) {
    console.log(`🔍 [GETPLAYERSTATS] Consultando para usuario: ${telegramId}`);
    console.log(
      `📊 [GETPLAYERSTATS] Cache actual:`,
      this.cache.size,
      "usuarios"
    );

    const userData = this.cache.get(telegramId);

    if (!userData) {
      console.log(
        `ℹ️ [GETPLAYERSTATS] Usuario sin historial de abandonos (nunca ha abandonado una sala)`
      );
      return {
        abandonosHora: 0,
        abandonosDia: 0,
        bloqueado: false,
        tiempoRestante: 0,
        infoAdicional: {
          limiteHora: this.limits.maxAbandonosPorHora,
          limiteDia: this.limits.maxAbandonosPorDia,
          abandonosRestantesHora: this.limits.maxAbandonosPorHora,
          abandonosRestantesDia: this.limits.maxAbandonosPorDia,
        },
        mensaje:
          "✅ <b>Usuario sin historial de abandonos</b>\n\n🎯 <b>Estado:</b> Puede abandonar salas normalmente\n📊 <b>Límites disponibles:</b>\n• Hora: 0/3 abandonos\n• Día: 0/8 abandonos\n\n💡 <b>Nota:</b> Los límites se aplican solo a abandonos voluntarios",
      };
    }

    console.log(`📊 [GETPLAYERSTATS] Usuario con historial encontrado:`, {
      abandonosHora: userData.abandonos.ultimaHora.count,
      abandonosDia: userData.abandonos.ultimoDia.count,
      ultimoResetHora: new Date(
        userData.abandonos.ultimaHora.resetTime
      ).toLocaleString(),
      ultimoResetDia: new Date(
        userData.abandonos.ultimoDia.resetTime
      ).toLocaleString(),
    });

    this.resetCountersIfNeeded(userData, Date.now());

    const stats = {
      abandonosHora: userData.abandonos.ultimaHora.count,
      abandonosDia: userData.abandonos.ultimoDia.count,
      bloqueado:
        userData.abandonos.ultimaHora.count >= this.limits.maxAbandonosPorHora,
      tiempoRestante:
        userData.abandonos.ultimaHora.count >= this.limits.maxAbandonosPorHora
          ? this.getTimeUntilReset(userData.abandonos.ultimaHora.resetTime)
          : 0,
      // Información adicional para admins
      infoAdicional: {
        limiteHora: this.limits.maxAbandonosPorHora,
        limiteDia: this.limits.maxAbandonosPorDia,
        abandonosRestantesHora:
          this.limits.maxAbandonosPorHora - userData.abandonos.ultimaHora.count,
        abandonosRestantesDia:
          this.limits.maxAbandonosPorDia - userData.abandonos.ultimoDia.count,
      },
    };

    console.log(`✅ [GETPLAYERSTATS] Estadísticas generadas:`, stats);
    return stats;
  }

  /**
   * Generar mensaje de bloqueo por límite horario
   */
  getMensajeBloqueoHora(tiempoRestante) {
    return `🚫 <b>ABANDONO BLOQUEADO TEMPORALMENTE</b>

❌ <b>No puedes abandonar salas en este momento</b>

📊 <b>Razón del bloqueo:</b>
• Has abandonado ${this.limits.maxAbandonosPorHora} salas en la última hora
• El sistema detectó un patrón de abandono excesivo

⏰ <b>El bloqueo se desactiva en:</b> ${tiempoRestante} minutos

💡 <b>Mientras tanto puedes:</b>
• Seguir jugando normalmente en las salas donde estés
• Unirte a nuevas salas
• Chatear y participar en el juego
• Solo NO podrás abandonar salas temporalmente

🎯 <b>Límites del sistema:</b>
• Máximo ${this.limits.maxAbandonosPorHora} abandonos por hora
• Máximo ${this.limits.maxAbandonosPorDia} abandonos por día

⚠️ <b>Recomendación:</b> Piensa bien antes de unirte a una sala para evitar abandonos innecesarios.`;
  }

  /**
   * Generar mensaje de bloqueo por límite diario
   */
  getMensajeBloqueoDia() {
    return `🚫 <b>ABANDONO BLOQUEADO HASTA MAÑANA</b>

❌ <b>No puedes abandonar salas hasta mañana</b>

📊 <b>Razón del bloqueo:</b>
• Has abandonado ${this.limits.maxAbandonosPorDia} salas hoy
• Has alcanzado el límite diario de abandonos

⏰ <b>El bloqueo se desactiva:</b> Mañana a las 00:00

💡 <b>Mientras tanto puedes:</b>
• Seguir jugando normalmente en las salas donde estés
• Unirte a nuevas salas
• Chatear y participar en el juego
• Solo NO podrás abandonar salas hasta mañana

🎯 <b>Límites del sistema:</b>
• Máximo ${this.limits.maxAbandonosPorHora} abandonos por hora
• Máximo ${this.limits.maxAbandonosPorDia} abandonos por día

⚠️ <b>Recomendación:</b> Sé más selectivo al unirte a salas para evitar abandonos innecesarios.`;
  }

  /**
   * Generar mensaje después de un abandono
   */
  getMensajeDespuesAbandono(abandonosHora, abandonosDia) {
    const abandonosRestantesHora =
      this.limits.maxAbandonosPorHora - abandonosHora;
    const abandonosRestantesDia = this.limits.maxAbandonosPorDia - abandonosDia;

    let mensaje = `✅ <b>Abandono registrado exitosamente</b>\n\n`;

    // Información sobre límites por hora
    if (abandonosRestantesHora > 0) {
      mensaje += `⏰ <b>Límite por hora:</b> ${abandonosHora}/${this.limits.maxAbandonosPorHora}\n`;
      mensaje += `🔄 <b>Puedes abandonar:</b> ${abandonosRestantesHora} ve${
        abandonosRestantesHora > 1 ? "ces" : "z"
      } más en la próxima hora\n\n`;
    } else {
      mensaje += `🚫 <b>Límite por hora alcanzado</b>\n`;
      mensaje += `⏰ <b>Puedes abandonar de nuevo en:</b> 1 hora\n\n`;
    }

    // Información sobre límites por día
    if (abandonosRestantesDia > 0) {
      mensaje += `📅 <b>Límite por día:</b> ${abandonosDia}/${this.limits.maxAbandonosPorDia}\n`;
      mensaje += `🔄 <b>Puedes hacer:</b> ${abandonosRestantesDia} más hoy\n\n`;
    } else {
      mensaje += `🚫 <b>Límite diario alcanzado</b>\n`;
      mensaje += `📅 <b>Puedes abandonar de nuevo:</b> Mañana\n\n`;
    }

    mensaje += `💡 <b>Recuerda:</b> Los límites se resetean automáticamente por tiempo.`;

    return mensaje;
  }

  /**
   * Limpiar cache de usuarios inactivos (opcional)
   */
  cleanup() {
    const now = Date.now();
    const oneDayAgo = now - 86400000;

    for (const [telegramId, userData] of this.cache.entries()) {
      if (userData.abandonos.ultimoDia.timestamp < oneDayAgo) {
        this.cache.delete(telegramId);
      }
    }
  }

  /**
   * Resetear contadores de abandonos de un jugador específico (solo admin)
   * Útil para pruebas y casos especiales
   */
  resetPlayerCounters(telegramId) {
    const userData = this.cache.get(telegramId);
    if (!userData) {
      return {
        success: false,
        message: `El jugador ${telegramId} no tiene historial de abandonos registrado.`,
      };
    }

    const now = Date.now();

    // Resetear contadores
    userData.abandonos.ultimaHora = {
      count: 0,
      timestamp: now,
      resetTime: now + 3600000,
    };

    userData.abandonos.ultimoDia = {
      count: 0,
      timestamp: now,
      resetTime: now + 86400000,
    };

    this.cache.set(telegramId, userData);

    return {
      success: true,
      message: `✅ Contadores de abandonos reseteados para el jugador ${telegramId}`,
      details: {
        abandonosHora: 0,
        abandonosDia: 0,
        timestamp: now,
      },
    };
  }

  /**
   * Obtener estadísticas del sistema completo
   */
  getSystemStats() {
    const now = Date.now();
    let totalUsuarios = 0;
    let usuariosBloqueados = 0;
    let totalAbandonosHora = 0;
    let totalAbandonosDia = 0;

    for (const [telegramId, userData] of this.cache.entries()) {
      totalUsuarios++;

      // Resetear contadores si es necesario
      this.resetCountersIfNeeded(userData, now);

      totalAbandonosHora += userData.abandonos.ultimaHora.count;
      totalAbandonosDia += userData.abandonos.ultimoDia.count;

      if (
        userData.abandonos.ultimaHora.count >= this.limits.maxAbandonosPorHora
      ) {
        usuariosBloqueados++;
      }
    }

    return {
      totalUsuarios,
      usuariosBloqueados,
      totalAbandonosHora,
      totalAbandonosDia,
      limites: this.limits,
      timestamp: now,
    };
  }
}

module.exports = new AbandonLimitManager();
