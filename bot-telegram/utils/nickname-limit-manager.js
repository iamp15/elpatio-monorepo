"use strict";

/**
 * Gestor de Límites de Cambio de Nickname
 *
 * Controla cuántas veces puede cambiar nickname un usuario
 * y almacena el estado en cache para evitar consultas al backend
 */

const cacheService = require("./cache-service");

class NicknameLimitManager {
  constructor() {
    this.cache = cacheService; // Usar la instancia singleton
    this.CACHE_PREFIX = "nickname_limit:";
    this.CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos
    this.MAX_CHANGES_PER_WEEK = 1;
  }

  /**
   * Verifica si un usuario puede cambiar su nickname
   * @param {string} telegramId - ID de Telegram del usuario
   * @returns {Promise<Object>} Estado del límite
   */
  async canChangeNickname(telegramId) {
    try {
      const cacheKey = this.CACHE_PREFIX + telegramId;
      const limitData = await this.cache.get(cacheKey);

      if (!limitData) {
        // Usuario no tiene límites registrados, puede cambiar
        return {
          canChange: true,
          remainingChanges: this.MAX_CHANGES_PER_WEEK,
          nextReset: this.getNextWeekReset(),
          message: "Puedes cambiar tu nickname",
        };
      }

      const now = Date.now();
      const lastChange = limitData.lastChange;
      const changesThisWeek = limitData.changesThisWeek || 0;

      // Verificar si ya pasó una semana desde el último cambio
      if (now - lastChange >= this.CACHE_TTL) {
        // Reset semanal, puede cambiar
        await this.resetWeeklyLimit(telegramId);
        return {
          canChange: true,
          remainingChanges: this.MAX_CHANGES_PER_WEEK,
          nextReset: this.getNextWeekReset(),
          message: "Límite semanal reseteado, puedes cambiar tu nickname",
        };
      }

      // Verificar si aún tiene cambios disponibles
      if (changesThisWeek < this.MAX_CHANGES_PER_WEEK) {
        return {
          canChange: true,
          remainingChanges: this.MAX_CHANGES_PER_WEEK - changesThisWeek,
          nextReset: new Date(lastChange + this.CACHE_TTL),
          message: `Puedes cambiar tu nickname (${
            this.MAX_CHANGES_PER_WEEK - changesThisWeek
          } cambio(s) restante(s))`,
        };
      }

      // No puede cambiar, límite alcanzado
      const timeUntilReset = lastChange + this.CACHE_TTL - now;
      const daysUntilReset = Math.ceil(timeUntilReset / (24 * 60 * 60 * 1000));

      return {
        canChange: false,
        remainingChanges: 0,
        nextReset: new Date(lastChange + this.CACHE_TTL),
        message: `Has alcanzado el límite semanal. Podrás cambiar tu nickname en ${daysUntilReset} día(s)`,
        daysUntilReset,
      };
    } catch (error) {
      console.error("Error verificando límite de nickname:", error);
      // En caso de error, permitir el cambio (fallback de seguridad)
      return {
        canChange: true,
        remainingChanges: this.MAX_CHANGES_PER_WEEK,
        nextReset: this.getNextWeekReset(),
        message:
          "Puedes cambiar tu nickname (verificación de límite no disponible)",
      };
    }
  }

  /**
   * Registra un cambio de nickname exitoso
   * @param {string} telegramId - ID de Telegram del usuario
   * @returns {Promise<void>}
   */
  async recordNicknameChange(telegramId) {
    try {
      const cacheKey = this.CACHE_PREFIX + telegramId;
      const now = Date.now();
      const limitData = await this.cache.get(cacheKey);

      if (!limitData) {
        // Primer cambio, crear registro
        await this.cache.set(
          cacheKey,
          {
            lastChange: now,
            changesThisWeek: 1,
            firstChangeOfWeek: now,
          },
          this.CACHE_TTL
        );
      } else {
        // Verificar si es la misma semana
        const weekStart = this.getWeekStart(limitData.firstChangeOfWeek);
        const currentWeekStart = this.getWeekStart(now);

        if (weekStart.getTime() === currentWeekStart.getTime()) {
          // Misma semana, incrementar contador
          await this.cache.set(
            cacheKey,
            {
              ...limitData,
              lastChange: now,
              changesThisWeek: (limitData.changesThisWeek || 0) + 1,
            },
            this.CACHE_TTL
          );
        } else {
          // Nueva semana, resetear contador
          await this.cache.set(
            cacheKey,
            {
              lastChange: now,
              changesThisWeek: 1,
              firstChangeOfWeek: now,
            },
            this.CACHE_TTL
          );
        }
      }

      console.log(
        `✅ Cambio de nickname registrado para usuario ${telegramId}`
      );
    } catch (error) {
      console.error("Error registrando cambio de nickname:", error);
    }
  }

  /**
   * Resetea el límite semanal para un usuario
   * @param {string} telegramId - ID de Telegram del usuario
   * @returns {Promise<void>}
   */
  async resetWeeklyLimit(telegramId) {
    try {
      const cacheKey = this.CACHE_PREFIX + telegramId;
      const now = Date.now();

      await this.cache.set(
        cacheKey,
        {
          lastChange: now,
          changesThisWeek: 0,
          firstChangeOfWeek: now,
        },
        this.CACHE_TTL
      );

      console.log(`🔄 Límite semanal reseteado para usuario ${telegramId}`);
    } catch (error) {
      console.error("Error reseteando límite semanal:", error);
    }
  }

  /**
   * Obtiene información del límite actual de un usuario
   * @param {string} telegramId - ID de Telegram del usuario
   * @returns {Promise<Object>} Información del límite
   */
  async getLimitInfo(telegramId) {
    try {
      const cacheKey = this.CACHE_PREFIX + telegramId;
      const limitData = await this.cache.get(cacheKey);

      if (!limitData) {
        return {
          hasLimits: false,
          changesThisWeek: 0,
          remainingChanges: this.MAX_CHANGES_PER_WEEK,
          lastChange: null,
          nextReset: this.getNextWeekReset(),
          message: "Sin límites activos",
        };
      }

      const now = Date.now();
      const timeUntilReset = limitData.firstChangeOfWeek + this.CACHE_TTL - now;
      const daysUntilReset = Math.ceil(timeUntilReset / (24 * 60 * 60 * 1000));

      return {
        hasLimits: true,
        changesThisWeek: limitData.changesThisWeek || 0,
        remainingChanges: Math.max(
          0,
          this.MAX_CHANGES_PER_WEEK - (limitData.changesThisWeek || 0)
        ),
        lastChange: new Date(limitData.lastChange),
        nextReset: new Date(limitData.firstChangeOfWeek + this.CACHE_TTL),
        daysUntilReset: Math.max(0, daysUntilReset),
        message: this.getLimitMessage(
          limitData.changesThisWeek || 0,
          daysUntilReset
        ),
      };
    } catch (error) {
      console.error("Error obteniendo información de límite:", error);
      return {
        hasLimits: false,
        changesThisWeek: 0,
        remainingChanges: this.MAX_CHANGES_PER_WEEK,
        lastChange: null,
        nextReset: this.getNextWeekReset(),
        message: "Error obteniendo información de límite",
      };
    }
  }

  /**
   * Limpia el límite de un usuario (útil para admin)
   * @param {string} telegramId - ID de Telegram del usuario
   * @returns {Promise<boolean>} true si se limpió correctamente
   */
  async clearUserLimit(telegramId) {
    try {
      const cacheKey = this.CACHE_PREFIX + telegramId;
      await this.cache.delete(cacheKey);
      console.log(`🗑️ Límite de nickname limpiado para usuario ${telegramId}`);
      return true;
    } catch (error) {
      console.error("Error limpiando límite de usuario:", error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de límites (útil para admin)
   * @returns {Promise<Object>} Estadísticas generales
   */
  async getLimitStats() {
    try {
      // Esta función requeriría acceso a todas las claves del cache
      // Por ahora retornamos información básica
      return {
        maxChangesPerWeek: this.MAX_CHANGES_PER_WEEK,
        cacheTTL: this.CACHE_TTL,
        cachePrefix: this.CACHE_PREFIX,
        message: "Estadísticas de límites disponibles",
      };
    } catch (error) {
      console.error("Error obteniendo estadísticas de límites:", error);
      return { error: "Error obteniendo estadísticas" };
    }
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Obtiene el inicio de la semana para una fecha dada
   * @param {number} timestamp - Timestamp en milisegundos
   * @returns {Date} Inicio de la semana (lunes)
   */
  getWeekStart(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuste para que lunes sea día 1
    return new Date(date.setDate(diff));
  }

  /**
   * Obtiene la fecha del próximo reset semanal
   * @returns {Date} Fecha del próximo reset
   */
  getNextWeekReset() {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + this.CACHE_TTL);
    return nextWeek;
  }

  /**
   * Genera mensaje descriptivo del límite
   * @param {number} changesThisWeek - Cambios realizados esta semana
   * @param {number} daysUntilReset - Días hasta el reset
   * @returns {string} Mensaje descriptivo
   */
  getLimitMessage(changesThisWeek, daysUntilReset) {
    if (changesThisWeek === 0) {
      return "Puedes cambiar tu nickname";
    } else if (changesThisWeek < this.MAX_CHANGES_PER_WEEK) {
      return `Has cambiado tu nickname ${changesThisWeek} vez(es) esta semana`;
    } else {
      return `Has alcanzado el límite semanal. Reset en ${daysUntilReset} día(s)`;
    }
  }
}

module.exports = NicknameLimitManager;
