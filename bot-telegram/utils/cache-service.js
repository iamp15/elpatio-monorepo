"use strict";

const BOT_CONFIG = require("../config/bot-config");
const userStateManager = require("../user-state");

/**
 * Servicio de cache abstracto preparado para migración futura
 * Maneja diferentes estrategias: local, backend, redis
 */
class CacheService {
  constructor() {
    this.strategy = BOT_CONFIG.cache.type;
    this.config = BOT_CONFIG.cache[this.strategy];

    console.log(
      `🔧 Cache Service inicializado con estrategia: ${this.strategy}`
    );
  }

  /**
   * Obtiene el display name del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} api - Instancia de BackendAPI (para fallback)
   * @param {Object} user - Objeto user de Telegram (para fallback)
   * @returns {Promise<string>} Display name del usuario
   */
  async getDisplayName(userId, api = null, user = null) {
    try {
      switch (this.strategy) {
        case "local":
          return await this._getDisplayNameLocal(userId, api, user);

        case "backend":
          return await this._getDisplayNameBackend(userId, api, user);

        case "redis":
          return await this._getDisplayNameRedis(userId, api, user);

        default:
          return await this._getDisplayNameLocal(userId, api, user);
      }
    } catch (error) {
      console.log(
        `❌ Error obteniendo display name para ${userId}:`,
        error.message
      );
      // Fallback a nombre de Telegram
      return user?.first_name || user?.username || "Jugador";
    }
  }

  /**
   * Establece el display name del usuario
   * @param {string} userId - ID del usuario
   * @param {string} displayName - Display name a guardar
   * @returns {Promise<boolean>} true si se guardó correctamente
   */
  async setDisplayName(userId, displayName) {
    try {
      switch (this.strategy) {
        case "local":
          return this._setDisplayNameLocal(userId, displayName);

        case "backend":
          return await this._setDisplayNameBackend(userId, displayName);

        case "redis":
          return await this._setDisplayNameRedis(userId, displayName);

        default:
          return this._setDisplayNameLocal(userId, displayName);
      }
    } catch (error) {
      console.log(
        `❌ Error guardando display name para ${userId}:`,
        error.message
      );
      return false;
    }
  }

  /**
   * Obtiene información de salas con cache
   * @param {string} juego - ID del juego
   * @param {Object} api - Instancia de BackendAPI
   * @returns {Promise<Array>} Lista de salas
   */
  async getSalasDisponibles(juego, api) {
    try {
      switch (this.strategy) {
        case "local":
          return await this._getSalasLocal(juego, api);

        case "backend":
          return await this._getSalasBackend(juego, api);

        case "redis":
          return await this._getSalasRedis(juego, api);

        default:
          return await this._getSalasLocal(juego, api);
      }
    } catch (error) {
      console.log(`❌ Error obteniendo salas para ${juego}:`, error.message);
      return [];
    }
  }

  /**
   * Establece información de salas en cache
   * @param {string} juego - ID del juego
   * @param {Array} salas - Lista de salas
   * @returns {Promise<boolean>} true si se guardó correctamente
   */
  async setSalasDisponibles(juego, salas) {
    try {
      switch (this.strategy) {
        case "local":
          return this._setSalasLocal(juego, salas);

        case "backend":
          return await this._setSalasBackend(juego, salas);

        case "redis":
          return await this._setSalasRedis(juego, salas);

        default:
          return this._setSalasLocal(juego, salas);
      }
    } catch (error) {
      console.log(`❌ Error guardando salas para ${juego}:`, error.message);
      return false;
    }
  }

  /**
   * Invalida el cache de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} true si se invalidó correctamente
   */
  async invalidateUser(userId) {
    try {
      switch (this.strategy) {
        case "local":
          return this._invalidateUserLocal(userId);

        case "backend":
          return await this._invalidateUserBackend(userId);

        case "redis":
          return await this._invalidateUserRedis(userId);

        default:
          return this._invalidateUserLocal(userId);
      }
    } catch (error) {
      console.log(`❌ Error invalidando cache para ${userId}:`, error.message);
      return false;
    }
  }

  // ===== IMPLEMENTACIONES LOCALES (ACTUAL) =====

  /**
   * Obtiene display name usando cache local
   */
  async _getDisplayNameLocal(userId, api, user) {
    // Intentar obtener del cache local
    const cachedDisplayName = userStateManager.getDisplayName(userId);
    if (cachedDisplayName) {
      return cachedDisplayName;
    }

    // Si no está en cache, obtener del backend
    if (api && user) {
      try {
        const jugador = await api.findPlayerByTelegram(String(userId));
        if (jugador && jugador.nickname) {
          let displayName;
          if (jugador.nickname.startsWith("SIN_NICKNAME_")) {
            displayName =
              jugador.firstName ||
              jugador.username ||
              user.first_name ||
              user.username ||
              "Jugador";
          } else {
            displayName = jugador.nickname;
          }

          // Guardar en cache local
          userStateManager.setDisplayName(userId, displayName);
          return displayName;
        } else if (jugador) {
          const displayName =
            jugador.firstName || user.first_name || user.username || "Jugador";
          userStateManager.setDisplayName(userId, displayName);
          return displayName;
        }
      } catch (error) {
        console.log(`Error obteniendo jugador ${userId}:`, error.message);
      }
    }

    // Fallback
    return user?.first_name || user?.username || "Jugador";
  }

  /**
   * Establece display name en cache local
   */
  _setDisplayNameLocal(userId, displayName) {
    try {
      userStateManager.setDisplayName(userId, displayName);
      return true;
    } catch (error) {
      console.log(
        `Error guardando display name local para ${userId}:`,
        error.message
      );
      return false;
    }
  }

  /**
   * Obtiene salas usando cache local (por ahora sin cache)
   */
  async _getSalasLocal(juego, api) {
    // Por ahora, siempre obtener del backend
    // En el futuro, se puede implementar cache local
    if (api) {
      try {
        const salas = await api.getSalasDisponibles();
        return salas.filter((sala) => sala.juego === juego);
      } catch (error) {
        console.log(`Error obteniendo salas del backend:`, error.message);
        return [];
      }
    }
    return [];
  }

  /**
   * Establece salas en cache local (por ahora sin implementar)
   */
  _setSalasLocal(juego, salas) {
    // Por ahora, no implementamos cache local para salas
    // Se puede implementar en el futuro si es necesario
    return true;
  }

  /**
   * Invalida cache local de usuario
   */
  _invalidateUserLocal(userId) {
    try {
      // Limpiar display name del cache local
      userStateManager.clearState(userId);
      return true;
    } catch (error) {
      console.log(
        `Error invalidando cache local para ${userId}:`,
        error.message
      );
      return false;
    }
  }

  // ===== IMPLEMENTACIONES BACKEND (FUTURO) =====

  /**
   * Obtiene display name desde backend con cache
   */
  async _getDisplayNameBackend(userId, api, user) {
    if (!api) {
      throw new Error("API no disponible para estrategia backend");
    }

    try {
      // En el futuro, esto llamará a un endpoint del backend con cache
      // Por ahora, usar la implementación local
      return await this._getDisplayNameLocal(userId, api, user);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Establece display name en backend con cache
   */
  async _setDisplayNameBackend(userId, displayName) {
    // En el futuro, esto llamará a un endpoint del backend
    // Por ahora, usar la implementación local
    return this._setDisplayNameLocal(userId, displayName);
  }

  /**
   * Obtiene salas desde backend con cache
   */
  async _getSalasBackend(juego, api) {
    if (!api) {
      throw new Error("API no disponible para estrategia backend");
    }

    try {
      // En el futuro, esto usará endpoints con cache del backend
      return await this._getSalasLocal(juego, api);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Establece salas en backend con cache
   */
  async _setSalasBackend(juego, salas) {
    // En el futuro, esto llamará a un endpoint del backend
    return this._setSalasLocal(juego, salas);
  }

  /**
   * Invalida cache de usuario en backend
   */
  async _invalidateUserBackend(userId) {
    // En el futuro, esto llamará a un endpoint del backend
    return this._invalidateUserLocal(userId);
  }

  // ===== IMPLEMENTACIONES REDIS (FUTURO) =====

  /**
   * Obtiene display name desde Redis
   */
  async _getDisplayNameRedis(userId, api, user) {
    // En el futuro, esto se conectará directamente a Redis
    // Por ahora, usar la implementación local
    return await this._getDisplayNameLocal(userId, api, user);
  }

  /**
   * Establece display name en Redis
   */
  async _setDisplayNameRedis(userId, displayName) {
    // En el futuro, esto se conectará directamente a Redis
    // Por ahora, usar la implementación local
    return this._setDisplayNameLocal(userId, displayName);
  }

  /**
   * Obtiene salas desde Redis
   */
  async _getSalasRedis(juego, api) {
    // En el futuro, esto se conectará directamente a Redis
    // Por ahora, usar la implementación local
    return await this._getSalasLocal(juego, api);
  }

  /**
   * Establece salas en Redis
   */
  async _setSalasRedis(juego, salas) {
    // En el futuro, esto se conectará directamente a Redis
    // Por ahora, usar la implementación local
    return this._setSalasLocal(juego, salas);
  }

  /**
   * Invalida cache de usuario en Redis
   */
  async _invalidateUserRedis(userId) {
    // En el futuro, esto se conectará directamente a Redis
    // Por ahora, usar la implementación local
    return this._invalidateUserLocal(userId);
  }

  /**
   * Obtiene estadísticas del cache
   * @returns {Object} Estadísticas del cache
   */
  getStats() {
    switch (this.strategy) {
      case "local":
        return userStateManager.getStats();

      case "backend":
        return { strategy: "backend", message: "Estadísticas no disponibles" };

      case "redis":
        return { strategy: "redis", message: "Estadísticas no disponibles" };

      default:
        return { strategy: "unknown", message: "Estrategia no reconocida" };
    }
  }

  // ===== MÉTODOS GENÉRICOS PARA NICKNAME LIMITS =====

  /**
   * Obtiene un valor del cache por clave
   * @param {string} key - Clave del cache
   * @returns {Promise<any>} Valor almacenado o null si no existe
   */
  async get(key) {
    try {
      switch (this.strategy) {
        case "local":
          return this._getLocal(key);

        case "backend":
          return await this._getBackend(key);

        case "redis":
          return await this._getRedis(key);

        default:
          return this._getLocal(key);
      }
    } catch (error) {
      console.log(
        `❌ Error obteniendo cache para clave ${key}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Establece un valor en el cache por clave
   * @param {string} key - Clave del cache
   * @param {any} value - Valor a almacenar
   * @param {number} ttl - Tiempo de vida en milisegundos (opcional)
   * @returns {Promise<boolean>} true si se guardó correctamente
   */
  async set(key, value, ttl = null) {
    try {
      switch (this.strategy) {
        case "local":
          return this._setLocal(key, value, ttl);

        case "backend":
          return await this._setBackend(key, value, ttl);

        case "redis":
          return await this._setRedis(key, value, ttl);

        default:
          return this._setLocal(key, value, ttl);
      }
    } catch (error) {
      console.log(`❌ Error guardando cache para clave ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Elimina un valor del cache por clave
   * @param {string} key - Clave del cache
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  async delete(key) {
    try {
      switch (this.strategy) {
        case "local":
          return this._deleteLocal(key);

        case "backend":
          return await this._deleteBackend(key);

        case "redis":
          return await this._deleteRedis(key);

        default:
          return this._deleteLocal(key);
      }
    } catch (error) {
      console.log(
        `❌ Error eliminando cache para clave ${key}:`,
        error.message
      );
      return false;
    }
  }

  // ===== IMPLEMENTACIONES LOCALES GENÉRICAS =====

  /**
   * Obtiene valor desde cache local
   */
  _getLocal(key) {
    try {
      const data = userStateManager.getCacheData(key);
      if (!data) return null;

      // Verificar si expiró
      if (data.expiresAt && Date.now() > data.expiresAt) {
        userStateManager.deleteCacheData(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.log(`Error obteniendo cache local para ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Establece valor en cache local
   */
  _setLocal(key, value, ttl = null) {
    try {
      const expiresAt = ttl ? Date.now() + ttl : null;
      userStateManager.setCacheData(key, { value, expiresAt });
      return true;
    } catch (error) {
      console.log(`Error guardando cache local para ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Elimina valor del cache local
   */
  _deleteLocal(key) {
    try {
      userStateManager.deleteCacheData(key);
      return true;
    } catch (error) {
      console.log(`Error eliminando cache local para ${key}:`, error.message);
      return false;
    }
  }

  // ===== IMPLEMENTACIONES BACKEND GENÉRICAS =====

  /**
   * Obtiene valor desde backend
   */
  async _getBackend(key) {
    // En el futuro, esto llamará a un endpoint del backend
    return this._getLocal(key);
  }

  /**
   * Establece valor en backend
   */
  async _setBackend(key, value, ttl = null) {
    // En el futuro, esto llamará a un endpoint del backend
    return this._setLocal(key, value, ttl);
  }

  /**
   * Elimina valor del backend
   */
  async _deleteBackend(key) {
    // En el futuro, esto llamará a un endpoint del backend
    return this._deleteLocal(key);
  }

  // ===== IMPLEMENTACIONES REDIS GENÉRICAS =====

  /**
   * Obtiene valor desde Redis
   */
  async _getRedis(key) {
    // En el futuro, esto se conectará directamente a Redis
    return this._getLocal(key);
  }

  /**
   * Establece valor en Redis
   */
  async _setRedis(key, value, ttl = null) {
    // En el futuro, esto se conectará directamente a Redis
    return this._setLocal(key, value, ttl);
  }

  /**
   * Elimina valor de Redis
   */
  async _deleteRedis(key) {
    // En el futuro, esto se conectará directamente a Redis
    return this._deleteLocal(key);
  }
}

// Exportar instancia singleton
module.exports = new CacheService();
