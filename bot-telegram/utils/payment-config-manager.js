"use strict";

/**
 * Gestor de Configuración de Precios - Sistema de Consulta
 *
 * Este módulo permite consultar la configuración de precios
 * y parámetros del sistema de pagos desde el backend
 *
 * NOTA: Este módulo solo permite consultas, no modificaciones.
 * Las modificaciones se realizan desde el dashboard web de administración.
 */

const moneyUtils = require("./money-utils");

class PaymentConfigManager {
  constructor(backendAPI) {
    this.api = backendAPI;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Obtiene la configuración completa de pagos desde el backend
   * @returns {Promise<Object>} Configuración completa
   */
  async getConfig() {
    try {
      const cacheKey = "full_config";
      const cached = this.getCached(cacheKey);
      if (cached) return cached;

      // Obtener cada tipo de configuración por separado
      const [prices, limits, commissions] = await Promise.all([
        this.getConfigByType("precios"),
        this.getConfigByType("limites"),
        this.getConfigByType("comisiones"),
      ]);

      // Estructurar la respuesta como espera el comando
      const config = {
        currency: "VES", // Por defecto
        prices: prices,
        limits: limits,
        commissions: commissions,
      };

      this.setCached(cacheKey, config);

      return config;
    } catch (error) {
      console.error("Error obteniendo configuración de pagos:", error.message);
      throw error;
    }
  }

  /**
   * Obtiene un tipo específico de configuración
   * @param {string} configType - Tipo de configuración (prices, limits, commissions)
   * @returns {Promise<Object>} Configuración específica
   */
  async getConfigByType(configType) {
    try {
      const cacheKey = `config_${configType}`;
      const cached = this.getCached(cacheKey);
      if (cached) return cached;

      const response = await this.api.getPaymentConfigByType(configType);

      // Validar estructura de respuesta
      if (!response || !response.success) {
        throw new Error(`Respuesta inválida para ${configType}`);
      }

      const config = response.data;
      this.setCached(cacheKey, config);

      return config;
    } catch (error) {
      console.error(
        `Error obteniendo configuración ${configType}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Obtiene los precios de los juegos
   * @returns {Promise<Object>} Precios por juego y modo
   */
  async getPrices() {
    try {
      const response = await this.api.getPaymentConfigByType("precios");

      if (response && response.success && response.data) {
        return response.data;
      }

      return {};
    } catch (error) {
      console.error("Error obteniendo precios:", error);
      return {};
    }
  }

  /**
   * Obtiene los límites del sistema
   * @returns {Promise<Object>} Límites de depósitos y retiros
   */
  async getLimits() {
    try {
      const response = await this.api.getPaymentConfigByType("limites");

      if (response && response.success && response.data) {
        return response.data;
      }

      return {};
    } catch (error) {
      console.error("Error obteniendo límites:", error);
      return {};
    }
  }

  /**
   * Obtiene las comisiones del sistema
   * @returns {Promise<Object>} Comisiones de retiro
   */
  async getCommissions() {
    try {
      const response = await this.api.getPaymentConfigByType("comisiones");

      if (response && response.success && response.data) {
        return response.data;
      }

      return {};
    } catch (error) {
      console.error("Error obteniendo comisiones:", error);
      return {};
    }
  }

  /**
   * Obtiene el historial de cambios de configuración
   * @returns {Promise<Array>} Historial de cambios
   */
  async getAuditHistory() {
    try {
      const response = await this.api.getPaymentConfigAudit();

      // Validar estructura de respuesta
      if (!response || !response.success) {
        throw new Error("Respuesta inválida del historial");
      }

      return response.data;
    } catch (error) {
      console.error(
        "Error obteniendo historial de configuración:",
        error.message
      );
      throw error;
    }
  }

  /**
   * Obtiene el precio de entrada para un juego y modo específicos
   * @param {string} gameId - ID del juego
   * @param {string} mode - Modo de juego
   * @returns {Promise<number>} Precio de entrada en centavos
   */
  async getGamePrice(gameId, mode) {
    try {
      const prices = await this.getPrices();

      if (!prices[gameId]) {
        throw new Error(`Juego no encontrado: ${gameId}`);
      }

      if (!prices[gameId][mode]) {
        throw new Error(`Modo no encontrado: ${mode} para ${gameId}`);
      }

      return prices[gameId][mode];
    } catch (error) {
      console.error(
        `Error obteniendo precio para ${gameId}/${mode}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Obtiene información de comisiones de retiro para un usuario
   * @param {number} withdrawalCount - Número de retiros en la semana
   * @returns {Promise<Object>} Información de comisión
   */
  async getWithdrawalFeeInfo(withdrawalCount) {
    try {
      const commissions = await this.getCommissions();

      if (!commissions.withdrawal) {
        throw new Error("Configuración de comisiones de retiro no encontrada");
      }

      return moneyUtils.getWeeklyFeeInfo(
        withdrawalCount,
        commissions.withdrawal
      );
    } catch (error) {
      console.error("Error obteniendo información de comisión:", error.message);
      throw error;
    }
  }

  /**
   * Valida si un monto está dentro de los límites permitidos
   * @param {number} amount - Monto en centavos
   * @param {string} type - Tipo de operación (deposit, withdrawal)
   * @returns {Promise<Object>} Resultado de validación
   */
  async validateAmount(amount, type) {
    try {
      const limits = await this.getLimits();

      const minKey = `min${type.charAt(0).toUpperCase() + type.slice(1)}`;
      const maxKey = `max${type.charAt(0).toUpperCase() + type.slice(1)}`;

      const minAmount = limits[minKey];
      const maxAmount = limits[maxKey];

      return moneyUtils.validateAmount(amount, minAmount, maxAmount);
    } catch (error) {
      console.error(`Error validando monto para ${type}:`, error.message);
      throw error;
    }
  }

  /**
   * Limpia el cache de configuración
   */
  clearCache() {
    this.cache.clear();
    console.log("🗑️ Cache de configuración limpiado");
  }

  /**
   * Obtiene un valor del cache si no ha expirado
   * @param {string} key - Clave del cache
   * @returns {Object|null} Valor cacheado o null si expiró
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Guarda un valor en el cache
   * @param {string} key - Clave del cache
   * @param {Object} data - Datos a cachear
   */
  setCached(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Obtiene estadísticas del cache
   * @returns {Object} Estadísticas del cache
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheTimeout: this.cacheTimeout,
    };
  }

  /**
   * Obtener el porcentaje de ganancia de la casa
   * @returns {number} Porcentaje de ganancia (ej: 20 para 20%)
   */
  async getHousePercentage() {
    try {
      const response = await this.api.getPaymentConfigByType("comisiones");

      if (
        response &&
        response.success &&
        response.data &&
        response.data.comisiones
      ) {
        const porcentajeGanancias =
          response.data.comisiones.porcentaje_ganancias;
        if (porcentajeGanancias !== undefined) {
          return porcentajeGanancias;
        }
      }

      // Valor por defecto si no se encuentra
      return 20;
    } catch (error) {
      console.error("Error en getHousePercentage:", error);
      return 20; // Valor por defecto
    }
  }

  /**
   * Obtiene la configuración de moneda desde el backend
   * @returns {Promise<Object>} Configuración de moneda con código, símbolo, formato y decimales
   */
  async getCurrencyConfig() {
    try {
      const cacheKey = "currency_config";
      const cached = this.getCached(cacheKey);
      if (cached) return cached;

      const response = await this.api.getPaymentConfigByType("moneda");

      if (!response || !response.success || !response.data) {
        // Configuración por defecto para bolívares venezolanos
        const defaultConfig = {
          codigo: "VES",
          simbolo: "Bs",
          formato: "es-VE",
          decimales: 2,
        };
        this.setCached(cacheKey, defaultConfig);
        return defaultConfig;
      }

      const config = response.data;
      this.setCached(cacheKey, config);

      return config;
    } catch (error) {
      console.error("Error obteniendo configuración de moneda:", error.message);
      // Configuración por defecto en caso de error
      const defaultConfig = {
        codigo: "VES",
        simbolo: "Bs",
        formato: "es-VE",
        decimales: 2,
      };
      return defaultConfig;
    }
  }

  /**
   * Calcular el premio para el ganador de una partida
   * @param {number} entryPrice - Precio de entrada en centavos
   * @param {number} playerCount - Número de jugadores
   * @returns {Object} Información del premio
   */
  async calculatePrize(entryPrice, playerCount) {
    try {
      const housePercentage = await this.getHousePercentage();
      const totalPot = entryPrice * playerCount;
      const houseCommission = Math.floor((totalPot * housePercentage) / 100);
      const winnerPrize = totalPot - houseCommission;

      return {
        totalPot,
        housePercentage,
        houseCommission,
        winnerPrize,
        entryPrice,
        playerCount,
      };
    } catch (error) {
      console.error("Error en calculatePrize:", error);
      return null;
    }
  }
}

module.exports = PaymentConfigManager;
