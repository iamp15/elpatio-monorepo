/**
 * Sistema de manejo de estado del usuario
 * Almacena información como juego seleccionado, preferencias, etc.
 */

const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "user-state.json");

class UserStateManager {
  constructor() {
    this.state = this.loadState();
    this.saveTimeout = null;
    this.lastSave = Date.now();
  }

  // Cargar estado desde archivo
  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const data = fs.readFileSync(STATE_FILE, "utf8");
        return JSON.parse(data);
      }
    } catch (err) {
      console.error("Error cargando estado de usuarios:", err);
    }
    return {};
  }

  // Guardar estado a archivo con debounce
  saveState() {
    // Limpiar timeout anterior si existe
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Solo guardar si han pasado al menos 2 segundos desde el último guardado
    const now = Date.now();
    if (now - this.lastSave < 2000) {
      // Programar guardado para más tarde
      this.saveTimeout = setTimeout(() => {
        this._doSave();
      }, 2000 - (now - this.lastSave));
      return;
    }

    // Guardar inmediatamente
    this._doSave();
  }

  // Método interno para hacer el guardado real
  _doSave() {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
      this.lastSave = Date.now();
    } catch (err) {
      console.error("Error guardando estado de usuarios:", err);
    }
  }

  // Establecer juego seleccionado para un usuario
  setSelectedGame(userId, gameId, expiresIn = null) {
    try {
      if (!this.state[userId]) {
        this.state[userId] = {};
      }
      this.state[userId].selectedGame = gameId;
      this.state[userId].lastUpdated = new Date().toISOString();

      // Agregar expiración si se especifica (en horas)
      if (expiresIn && typeof expiresIn === "number" && expiresIn > 0) {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + expiresIn);
        this.state[userId].gameExpiresAt = expiryDate.toISOString();
      } else {
        // Si no se especifica expiración, eliminar cualquier expiración anterior
        delete this.state[userId].gameExpiresAt;
      }

      // Guardar con debounce
      this.saveState();
    } catch (err) {
      console.error("❌ Error guardando estado:", err);
      throw err;
    }
  }

  // Establecer display name para un usuario
  setDisplayName(userId, displayName) {
    try {
      if (!this.state[userId]) {
        this.state[userId] = {};
      }
      this.state[userId].displayName = displayName;
      this.state[userId].lastUpdated = new Date().toISOString();

      // Guardar con debounce
      this.saveState();
    } catch (err) {
      console.error("❌ Error guardando display name:", err);
      throw err;
    }
  }

  // Obtener display name para un usuario
  getDisplayName(userId) {
    try {
      const userState = this.state[userId];
      return userState ? userState.displayName : null;
    } catch (err) {
      console.error("❌ Error consultando display name:", err);
      return null;
    }
  }

  // Obtener juego seleccionado para un usuario
  getSelectedGame(userId) {
    try {
      const userState = this.state[userId];
      if (!userState || !userState.selectedGame) {
        return null;
      }

      // Verificar si el juego ha expirado
      if (userState.gameExpiresAt) {
        const expiryDate = new Date(userState.gameExpiresAt);
        const now = new Date();

        if (now > expiryDate) {
          // El juego ha expirado, limpiarlo
          console.log(
            `🕐 Juego expirado para usuario ${userId}, limpiando estado`
          );
          this.clearSelectedGame(userId);
          return null;
        }
      }

      return userState.selectedGame;
    } catch (err) {
      console.error("❌ Error consultando estado:", err);
      return null;
    }
  }

  // Limpiar juego seleccionado para un usuario
  clearSelectedGame(userId) {
    if (this.state[userId]) {
      delete this.state[userId].selectedGame;
      delete this.state[userId].gameExpiresAt;
      this.saveState();
    }
  }

  // Obtener información completa del juego seleccionado
  getSelectedGameInfo(userId) {
    try {
      const userState = this.state[userId];
      if (!userState || !userState.selectedGame) {
        return null;
      }

      const gameInfo = {
        gameId: userState.selectedGame,
        expiresAt: null,
        isExpired: false,
        isExpiringSoon: false,
        hoursUntilExpiry: null,
      };

      // Verificar expiración
      if (userState.gameExpiresAt) {
        const expiryDate = new Date(userState.gameExpiresAt);
        const now = new Date();

        if (now > expiryDate) {
          // El juego ha expirado
          gameInfo.isExpired = true;
          this.clearSelectedGame(userId);
          return null;
        } else {
          gameInfo.expiresAt = expiryDate;
          gameInfo.hoursUntilExpiry = Math.ceil(
            (expiryDate - now) / (1000 * 60 * 60)
          );
          gameInfo.isExpiringSoon = gameInfo.hoursUntilExpiry <= 2; // Expira en 2 horas o menos
        }
      }

      return gameInfo;
    } catch (err) {
      console.error("❌ Error consultando información del juego:", err);
      return null;
    }
  }

  // Obtener estadísticas de uso
  getStats() {
    const stats = {
      totalUsers: Object.keys(this.state).length,
      usersWithGame: 0,
      gameDistribution: {},
    };

    Object.values(this.state).forEach((userState) => {
      if (userState.selectedGame) {
        stats.usersWithGame++;
        stats.gameDistribution[userState.selectedGame] =
          (stats.gameDistribution[userState.selectedGame] || 0) + 1;
      }
    });

    return stats;
  }

  // ===== MÉTODOS DE CACHE GENÉRICOS =====

  /**
   * Obtiene datos del cache por clave
   * @param {string} key - Clave del cache
   * @returns {any} Datos almacenados o null si no existen
   */
  getCacheData(key) {
    try {
      if (!this.state.cache) {
        this.state.cache = {};
      }
      return this.state.cache[key] || null;
    } catch (err) {
      console.error("❌ Error obteniendo datos de cache:", err);
      return null;
    }
  }

  /**
   * Establece datos en el cache por clave
   * @param {string} key - Clave del cache
   * @param {any} data - Datos a almacenar
   * @returns {boolean} true si se guardó correctamente
   */
  setCacheData(key, data) {
    try {
      if (!this.state.cache) {
        this.state.cache = {};
      }
      this.state.cache[key] = data;
      this.saveState();
      return true;
    } catch (err) {
      console.error("❌ Error guardando datos de cache:", err);
      return false;
    }
  }

  /**
   * Elimina datos del cache por clave
   * @param {string} key - Clave del cache
   * @returns {boolean} true si se eliminó correctamente
   */
  deleteCacheData(key) {
    try {
      if (!this.state.cache) {
        this.state.cache = {};
      }
      if (this.state.cache[key]) {
        delete this.state.cache[key];
        this.saveState();
        return true;
      }
      return false;
    } catch (err) {
      console.error("❌ Error eliminando datos de cache:", err);
      return false;
    }
  }

  /**
   * Limpia todo el cache
   * @returns {boolean} true si se limpió correctamente
   */
  clearCache() {
    try {
      this.state.cache = {};
      this.saveState();
      return true;
    } catch (err) {
      console.error("❌ Error limpiando cache:", err);
      return false;
    }
  }

  /**
   * Obtiene estadísticas del cache
   * @returns {Object} Estadísticas del cache
   */
  getCacheStats() {
    try {
      if (!this.state.cache) {
        this.state.cache = {};
      }
      const cacheKeys = Object.keys(this.state.cache);
      return {
        totalKeys: cacheKeys.length,
        keys: cacheKeys,
        size: JSON.stringify(this.state.cache).length,
      };
    } catch (err) {
      console.error("❌ Error obteniendo estadísticas de cache:", err);
      return { totalKeys: 0, keys: [], size: 0 };
    }
  }

  // Limpiar usuarios inactivos (más de 30 días)
  cleanupInactiveUsers() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let cleanedCount = 0;
    Object.keys(this.state).forEach((userId) => {
      const userState = this.state[userId];
      if (userState.lastUpdated) {
        const lastUpdated = new Date(userState.lastUpdated);
        if (lastUpdated < thirtyDaysAgo) {
          delete this.state[userId];
          cleanedCount++;
        }
      }
    });

    if (cleanedCount > 0) {
      this.saveState();
      console.log(`Limpiados ${cleanedCount} usuarios inactivos`);
    }

    return cleanedCount;
  }
}

// Instancia global del manejador de estado
const userStateManager = new UserStateManager();

// Limpiar usuarios inactivos cada hora
setInterval(() => {
  userStateManager.cleanupInactiveUsers();
}, 60 * 60 * 1000); // 1 hora

const userStates = new Map();

function setState(userId, state) {
  userStates.set(userId, state);
}

function getState(userId) {
  return userStates.get(userId);
}

function clearState(userId) {
  userStates.delete(userId);
}

// Exportar la instancia del UserStateManager y las funciones adicionales
module.exports = {
  // Métodos del UserStateManager
  setSelectedGame: (userId, gameId, expiresIn) =>
    userStateManager.setSelectedGame(userId, gameId, expiresIn),
  getSelectedGame: (userId) => userStateManager.getSelectedGame(userId),
  getSelectedGameInfo: (userId) => userStateManager.getSelectedGameInfo(userId),
  clearSelectedGame: (userId) => userStateManager.clearSelectedGame(userId),
  setDisplayName: (userId, displayName) =>
    userStateManager.setDisplayName(userId, displayName),
  getDisplayName: (userId) => userStateManager.getDisplayName(userId),
  getStats: () => userStateManager.getStats(),
  cleanupInactiveUsers: () => userStateManager.cleanupInactiveUsers(),

  // Métodos de cache
  getCacheData: (key) => userStateManager.getCacheData(key),
  setCacheData: (key, data) => userStateManager.setCacheData(key, data),
  deleteCacheData: (key) => userStateManager.deleteCacheData(key),
  clearCache: () => userStateManager.clearCache(),
  getCacheStats: () => userStateManager.getCacheStats(),

  // Funciones adicionales para manejo de estado temporal
  setState,
  getState,
  clearState,
};
