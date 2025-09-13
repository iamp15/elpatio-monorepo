"use strict";

const AuthService = require("../utils/auth-service");

class BackendAPI {
  constructor({ baseUrl, botEmail, botPassword, preToken }) {
    // Inicializar el servicio de autenticación
    this.authService = new AuthService({
      baseUrl,
      botEmail,
      botPassword,
      preToken,
    });

    this.baseUrl = baseUrl;
    this.botEmail = botEmail;
    this.botPassword = botPassword;

    // Usar el cliente del servicio de autenticación
    this.client = this.authService.getClient();
  }

  async login() {
    return this.authService.getToken();
  }

  async ensureAuth() {
    await this.authService.ensureValidToken();
  }

  /**
   * Obtiene información del token actual
   */
  getTokenInfo() {
    return this.authService.getTokenInfo();
  }

  /**
   * Verifica si el token actual es válido
   */
  isTokenValid() {
    return this.authService.isTokenValid();
  }

  /**
   * Renueva manualmente el token
   */
  async refreshToken() {
    return this.authService.refreshToken();
  }

  // --- Jugadores ---
  async findPlayerByTelegram(telegramId) {
    await this.ensureAuth();
    try {
      const res = await this.client.get(`/api/jugadores/${telegramId}`);
      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 404) return null;
      throw err;
    }
  }

  async findPlayerById(playerId) {
    await this.ensureAuth();
    try {
      // Buscar por ObjectId usando el nuevo endpoint
      const res = await this.client.get(`/api/jugadores/by-id/${playerId}`);
      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log(`Jugador ${playerId} no encontrado`);
        return null;
      }
      console.log(`Error buscando jugador ${playerId}:`, err.message);
      return null;
    }
  }

  async getAllPlayers() {
    await this.ensureAuth();
    try {
      const res = await this.client.get("/api/jugadores");
      return res.data;
    } catch (err) {
      console.log("Error obteniendo todos los jugadores:", err.message);
      return [];
    }
  }

  async checkNicknameAvailability(nickname) {
    await this.ensureAuth();
    try {
      const res = await this.client.get(
        `/api/jugadores/check-nickname/${encodeURIComponent(nickname)}`
      );
      return res.data.available;
    } catch (err) {
      if (err.response?.status === 400) {
        // Error de validación de formato
        throw new Error(
          err.response.data.error || "Formato de nickname inválido"
        );
      }
      throw err;
    }
  }

  async createPlayer({ telegramId, username, nickname, firstName }) {
    await this.ensureAuth();
    const res = await this.client.post("/api/jugadores", {
      telegramId,
      username,
      nickname,
      firstName,
    });
    return res.data;
  }

  async getPlayerNickname(telegramId) {
    await this.ensureAuth();
    try {
      const res = await this.client.get(
        `/api/jugadores/${telegramId}/nickname`
      );
      // El endpoint devuelve el jugador completo, extraemos solo el nickname
      return res.data.nickname;
    } catch (err) {
      if (err.response?.status === 404) {
        return null; // Jugador no encontrado
      }
      throw err;
    }
  }

  /**
   * Obtiene solo el nickname del jugador (método optimizado)
   * @param {string} telegramId - ID de Telegram del jugador
   * @returns {Promise<string|null>} Nickname o null si no existe
   */
  async getPlayerNicknameOnly(telegramId) {
    await this.ensureAuth();
    try {
      const res = await this.client.get(
        `/api/jugadores/${telegramId}/nickname`
      );
      // Si el endpoint devuelve solo el nickname, usarlo directamente
      // Si devuelve el jugador completo, extraer solo el nickname
      return res.data.nickname || res.data;
    } catch (err) {
      if (err.response?.status === 404) {
        return null; // Jugador no encontrado
      }
      throw err;
    }
  }

  async updatePlayerNickname(telegramId, newNickname) {
    await this.ensureAuth();
    try {
      // Usar el endpoint específico para nickname
      const res = await this.client.put(
        `/api/jugadores/${telegramId}/nickname`,
        { nickname: newNickname }
      );
      return res.data;
    } catch (err) {
      if (err.response?.status === 400) {
        throw new Error(
          err.response.data.error || "Error actualizando nickname"
        );
      }
      throw err;
    }
  }

  // --- Salas ---
  async getSalasDisponibles() {
    await this.ensureAuth();
    const res = await this.client.get("/api/salas/disponibles");
    return res.data;
  }

  async getSalaById(salaId) {
    await this.ensureAuth();
    const res = await this.client.get(`/api/salas/${salaId}`);
    return res.data;
  }

  async joinSala(salaId, jugadorId) {
    await this.ensureAuth();
    const res = await this.client.post(`/api/salas/${salaId}/unirse`, {
      jugadorId,
    });
    return res.data;
  }

  async eliminarJugadorDeSala(salaId, jugadorId) {
    await this.ensureAuth();
    const res = await this.client.post(
      `/api/salas/${salaId}/eliminar-jugador`,
      {
        jugadorId,
      }
    );
    return res.data;
  }

  async createSala(salaData) {
    await this.ensureAuth();
    const res = await this.client.post("/api/salas", salaData);
    return res.data;
  }

  async cancelarSala(salaId) {
    await this.ensureAuth();
    try {
      console.log(`🔄 [CANCELARSALA] Cancelando sala: ${salaId}`);
      const res = await this.client.post(`/api/salas/${salaId}/cancelar`);
      console.log(`✅ [CANCELARSALA] Sala cancelada exitosamente`);
      return res.data;
    } catch (error) {
      console.error(`❌ [CANCELARSALA] Error cancelando sala:`, error.message);
      if (error.response) {
        console.error(`📊 [CANCELARSALA] Status: ${error.response.status}`);
        console.error(`📊 [CANCELARSALA] Response:`, error.response.data);
      }
      throw error;
    }
  }

  async getJugadorEstado(telegramId) {
    await this.ensureAuth();
    try {
      // Primero obtener el jugador por telegramId
      const jugador = await this.findPlayerByTelegram(telegramId);
      if (!jugador) {
        console.log(`Jugador con telegramId ${telegramId} no encontrado`);
        return null;
      }

      // Luego consultar el estado usando el ObjectId del jugador
      const res = await this.client.get(`/api/jugadores/${jugador._id}/estado`);
      return res.data;
    } catch (err) {
      console.log("Error obteniendo estado del jugador:", err.message);
      return null;
    }
  }

  // --- Pagos ---
  async createPagoEntrada({ jugador, sala, cajero, monto }) {
    await this.ensureAuth();
    const res = await this.client.post("/api/pagos", {
      tipo: "entrada",
      jugador,
      sala,
      cajero,
      monto,
    });
    return res.data;
  }

  // ===== MÉTODOS PREPARADOS PARA MIGRACIÓN FUTURA =====

  /**
   * Obtiene display name del usuario (preparado para cache futuro)
   * @param {string} userId - ID del usuario
   * @returns {Promise<string>} Display name del usuario
   */
  async getDisplayName(userId) {
    try {
      // En el futuro, esto llamará a un endpoint del backend con cache
      // Por ahora, usar la lógica actual
      const jugador = await this.findPlayerByTelegram(String(userId));
      return this._determineDisplayName(jugador, userId);
    } catch (error) {
      console.log("Error obteniendo display name:", error.message);
      return null;
    }
  }

  /**
   * Método interno para determinar display name según jerarquía
   * @param {Object} jugador - Objeto jugador del backend
   * @param {string} userId - ID del usuario
   * @returns {string} Display name determinado
   */
  _determineDisplayName(jugador, userId) {
    if (jugador && jugador.nickname) {
      if (jugador.nickname.startsWith("SIN_NICKNAME_")) {
        return jugador.firstName || jugador.username || "Jugador";
      }
      return jugador.nickname;
    } else if (jugador) {
      return jugador.firstName || jugador.username || "Jugador";
    }
    return "Jugador";
  }

  /**
   * Obtiene salas disponibles con cache (preparado para migración)
   * @param {string} juego - ID del juego
   * @returns {Promise<Array>} Lista de salas filtradas
   */
  async getSalasDisponiblesConCache(juego) {
    try {
      // En el futuro, esto usará cache del backend
      const salas = await this.getSalasDisponibles();
      return salas.filter((sala) => sala.juego === juego);
    } catch (error) {
      console.log("Error obteniendo salas con cache:", error.message);
      return [];
    }
  }

  /**
   * Obtiene perfil de usuario con cache (preparado para migración)
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Perfil del usuario
   */
  async getUserProfile(userId) {
    try {
      // En el futuro, esto usará cache del backend
      const jugador = await this.findPlayerByTelegram(String(userId));
      if (jugador) {
        return {
          id: jugador._id,
          telegramId: jugador.telegramId,
          nickname: jugador.nickname,
          firstName: jugador.firstName,
          username: jugador.username,
          displayName: this._determineDisplayName(jugador, userId),
          createdAt: jugador.createdAt,
          lastActive: jugador.lastActive || new Date(),
        };
      }
      return null;
    } catch (error) {
      console.log("Error obteniendo perfil de usuario:", error.message);
      return null;
    }
  }

  /**
   * Actualiza perfil de usuario e invalida cache (preparado para migración)
   * @param {string} userId - ID del usuario
   * @param {Object} updates - Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  async updateUserProfile(userId, updates) {
    try {
      // En el futuro, esto invalidará cache del backend
      const res = await this.client.put(`/api/jugadores/${userId}`, updates);
      return res.data;
    } catch (error) {
      console.log("Error actualizando perfil de usuario:", error.message);
      throw error;
    }
  }

  /**
   * Obtiene usuarios online (preparado para migración)
   * @returns {Promise<Array>} Lista de usuarios online
   */
  async getOnlineUsers() {
    try {
      // En el futuro, esto usará cache del backend
      const res = await this.client.get("/api/users/online");
      return res.data;
    } catch (error) {
      console.log("Error obteniendo usuarios online:", error.message);
      return [];
    }
  }

  /**
   * Marca usuario como online (preparado para migración)
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} true si se marcó correctamente
   */
  async setUserOnline(userId) {
    try {
      // En el futuro, esto usará cache del backend
      const res = await this.client.post(`/api/users/${userId}/online`);
      return res.status === 200;
    } catch (error) {
      console.log("Error marcando usuario como online:", error.message);
      return false;
    }
  }

  /**
   * Invalida cache de usuario (preparado para migración)
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} true si se invalidó correctamente
   */
  async invalidateUserCache(userId) {
    try {
      // En el futuro, esto llamará a un endpoint del backend
      const res = await this.client.delete(`/api/users/${userId}/cache`);
      return res.status === 200;
    } catch (error) {
      console.log("Error invalidando cache de usuario:", error.message);
      return false;
    }
  }

  /**
   * Obtiene estadísticas del sistema (preparado para migración)
   * @returns {Promise<Object>} Estadísticas del sistema
   */
  async getSystemStats() {
    try {
      // En el futuro, esto usará cache del backend
      const res = await this.client.get("/api/stats/system");
      return res.data;
    } catch (error) {
      console.log("Error obteniendo estadísticas del sistema:", error.message);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalRooms: 0,
        activeRooms: 0,
      };
    }
  }

  /**
   * Crea una nueva sala
   * @param {Object} salaData - Datos de la sala
   * @param {string} salaData.nombre - Nombre de la sala
   * @param {string} salaData.juego - ID del juego
   * @param {string} salaData.modo - Modo de juego
   * @param {Object} salaData.configuracion - Configuración de la sala
   * @returns {Promise<Object>} Sala creada
   */
  async createSala(salaData) {
    try {
      const res = await this.client.post("/api/salas", salaData);
      return res.data;
    } catch (error) {
      console.log("Error creando sala:", error.message);
      throw error;
    }
  }

  // ===== MÉTODOS DE CONFIGURACIÓN DE PAGOS =====

  /**
   * Obtiene la configuración completa de pagos
   * @returns {Promise<Object>} Configuración de pagos
   */
  async getPaymentConfig() {
    try {
      const res = await this.client.get("/api/payment-config");
      return res.data;
    } catch (error) {
      console.log("Error obteniendo configuración de pagos:", error.message);
      throw error;
    }
  }

  /**
   * Obtiene un tipo específico de configuración de pagos
   * @param {string} configType - Tipo de configuración (precios, comisiones, limites, moneda)
   * @returns {Promise<Object>} Configuración específica
   */
  async getPaymentConfigByType(configType) {
    try {
      const res = await this.client.get(`/api/payment-config/${configType}`);
      return res.data;
    } catch (error) {
      console.log(
        `Error obteniendo configuración ${configType}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Obtiene el historial de cambios de configuración de pagos
   * @returns {Promise<Array>} Historial de cambios
   */
  async getPaymentConfigAudit() {
    try {
      const res = await this.client.get("/api/payment-config/audit");
      return res.data;
    } catch (error) {
      console.log(
        "Error obteniendo historial de configuración:",
        error.message
      );
      throw error;
    }
  }

  // ===== MÉTODOS DE SALDO =====

  /**
   * Obtiene el saldo de un jugador por su telegramId
   * @param {string} telegramId - ID de Telegram del jugador
   * @returns {Promise<number>} Saldo del jugador en centavos
   */
  async getPlayerBalance(telegramId) {
    await this.ensureAuth();
    try {
      const res = await this.client.get(`/api/jugadores/${telegramId}/saldo`);
      // Asegurar que el saldo sea un número
      const saldo = Number(res.data.saldo) || 0;
      return saldo;
    } catch (error) {
      console.log(
        `Error obteniendo saldo del jugador ${telegramId}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Debita saldo de un jugador usando el nuevo sistema de transacciones
   * @param {string} telegramId - ID de Telegram del jugador
   * @param {number} amount - Cantidad a debitar en centavos
   * @param {string} reason - Razón del débito
   * @param {string} salaId - ID de la sala (opcional)
   * @returns {Promise<Object>} Resultado de la operación
   */
  async debitPlayerBalance(
    telegramId,
    amount,
    reason = "Entrada a sala",
    salaId = null
  ) {
    await this.ensureAuth();
    try {
      // Asegurar que amount sea un número
      const cantidadNumerica = Number(amount);

      // Validar que sea un número válido y positivo
      if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
        throw new Error(
          `Cantidad inválida: ${amount}. Debe ser un número positivo.`
        );
      }

      // Obtener el jugador por telegramId
      const jugador = await this.findPlayerByTelegram(telegramId);
      if (!jugador) {
        throw new Error("Jugador no encontrado");
      }

      // Usar el nuevo endpoint de transacciones
      const payload = {
        jugadorId: jugador._id,
        tipo: "debito",
        categoria: "entrada_sala",
        monto: cantidadNumerica,
        descripcion: reason,
        referenciaExterna: salaId ? { salaId } : {},
        metadata: {
          ipOrigen: "bot-telegram",
          dispositivoOrigen: "telegram-bot",
        },
      };

      const res = await this.client.post(
        "/api/transacciones/procesar-automatica",
        payload
      );
      return res.data;
    } catch (error) {
      console.log(
        `Error procesando pago de entrada del jugador ${telegramId}:`,
        error.message
      );

      // Log adicional del error
      if (error.response?.data) {
        console.log("📤 Detalles del error del servidor:", error.response.data);
      }
      if (error.response?.status) {
        console.log("📤 Status code:", error.response.status);
      }

      throw error;
    }
  }

  // ===== MÉTODOS DEL NUEVO SISTEMA DE TRANSACCIONES =====

  /**
   * Procesa un pago de entrada a sala usando el sistema de transacciones
   * @param {string} jugadorId - ID del jugador
   * @param {number} monto - Cantidad en centavos
   * @param {string} salaId - ID de la sala
   * @returns {Promise<Object>} Resultado de la transacción
   */
  async procesarPagoEntrada(jugadorId, monto, salaId) {
    await this.ensureAuth();
    try {
      const payload = {
        jugadorId,
        tipo: "debito",
        categoria: "entrada_sala",
        monto: Number(monto),
        descripcion: `Pago entrada a sala`,
        referenciaExterna: { salaId },
        metadata: {
          ipOrigen: "bot-telegram",
          dispositivoOrigen: "telegram-bot",
        },
      };

      const res = await this.client.post(
        "/api/transacciones/procesar-automatica",
        payload
      );
      return res.data;
    } catch (error) {
      console.log(`Error procesando pago de entrada:`, error.message);
      throw error;
    }
  }

  /**
   * Obtiene el historial de transacciones de un jugador
   * @param {string} jugadorId - ID del jugador
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Object>} Historial de transacciones
   */
  async obtenerHistorialTransacciones(jugadorId, filtros = {}) {
    await this.ensureAuth();
    try {
      const params = new URLSearchParams(filtros);
      const res = await this.client.get(
        `/api/transacciones/jugador/${jugadorId}/historial?${params}`
      );
      return res.data;
    } catch (error) {
      console.log(
        `Error obteniendo historial de transacciones:`,
        error.message
      );
      throw error;
    }
  }

  // ===== MÉTODOS DEL SISTEMA DE DEPÓSITOS =====

  /**
   * Crea una solicitud de depósito
   * @param {string} telegramId - ID de Telegram del jugador
   * @param {number} monto - Cantidad en centavos
   * @returns {Promise<Object>} Solicitud de depósito creada
   */
  async crearSolicitudDeposito(telegramId, monto) {
    await this.ensureAuth();
    try {
      // Obtener jugador
      const jugador = await this.findPlayerByTelegram(telegramId);
      if (!jugador) {
        throw new Error("Jugador no encontrado");
      }

      // Validar monto
      const montoNumerico = Number(monto);
      if (isNaN(montoNumerico) || montoNumerico <= 0) {
        throw new Error("El monto debe ser un número positivo");
      }

      // Crear solicitud de depósito usando el endpoint correcto
      const payload = {
        jugadorId: jugador._id,
        tipo: "credito",
        categoria: "deposito",
        monto: montoNumerico,
        descripcion: `Solicitud de depósito de ${montoNumerico} centavos`,
        metodoPago: "pago_movil",
      };

      const res = await this.client.post(
        "/api/transacciones/solicitud",
        payload
      );
      return res.data;
    } catch (error) {
      console.log(`Error creando solicitud de depósito:`, error.message);
      throw error;
    }
  }

  /**
   * Confirma el pago realizado por el usuario
   * @param {string} transaccionId - ID de la transacción
   * @param {Object} datosPago - Datos del pago realizado
   * @returns {Promise<Object>} Transacción actualizada
   */
  async confirmarPagoUsuario(transaccionId, datosPago) {
    await this.ensureAuth();
    try {
      // Validar datos del pago
      const { banco, telefono, referencia, fecha } = datosPago;

      if (!banco || !telefono || !referencia || !fecha) {
        throw new Error(
          "Faltan datos del pago: banco, teléfono, referencia y fecha son requeridos"
        );
      }

      const payload = {
        bancoOrigen: banco,
        telefonoOrigen: telefono,
        numeroReferencia: referencia,
        fechaPago: fecha,
        metodoPago: "pago_movil",
      };

      const res = await this.client.put(
        `/api/transacciones/${transaccionId}/confirmar-pago-usuario`,
        payload
      );
      return res.data;
    } catch (error) {
      console.log("Error confirmando pago del usuario:", error.message);
      throw error;
    }
  }

  /**
   * Obtiene los detalles de una transacción
   * @param {string} transaccionId - ID de la transacción
   * @returns {Promise<Object>} Detalles de la transacción
   */
  async obtenerDetallesTransaccion(transaccionId) {
    await this.ensureAuth();
    try {
      const res = await this.client.get(`/api/transacciones/${transaccionId}`);
      return res.data;
    } catch (error) {
      console.log("Error obteniendo detalles de transacción:", error.message);
      throw error;
    }
  }

  /**
   * Obtiene cajeros disponibles
   * @returns {Promise<Array>} Lista de cajeros disponibles
   */
  async obtenerCajerosDisponibles() {
    await this.ensureAuth();
    try {
      const res = await this.client.get(
        "/api/transacciones/cajeros-disponibles"
      );
      return res.data;
    } catch (error) {
      console.log("Error obteniendo cajeros disponibles:", error.message);
      throw error;
    }
  }

  /**
   * Asigna un cajero a una transacción de depósito
   * @param {string} transaccionId - ID de la transacción
   * @param {string} cajeroId - ID del cajero
   * @param {Object} datosBancarios - Datos bancarios del cajero
   * @returns {Promise<Object>} Transacción actualizada
   */
  async asignarCajeroATransaccion(transaccionId, cajeroId, datosBancarios) {
    await this.ensureAuth();
    try {
      const payload = {
        cajeroId,
        infoPago: {
          metodoPago: "pago_movil",
          bancoDestino: datosBancarios.banco,
          telefonoOrigen: datosBancarios.telefono,
          cedulaOrigen: datosBancarios.cedula,
        },
      };

      const res = await this.client.put(
        `/api/transacciones/${transaccionId}/asignar-cajero`,
        payload
      );
      return res.data;
    } catch (error) {
      console.log("Error asignando cajero a transacción:", error.message);
      throw error;
    }
  }

  /**
   * Confirma la transacción por parte del cajero
   * @param {string} transaccionId - ID de la transacción
   * @param {string} cajeroId - ID del cajero
   * @param {boolean} confirmado - Si el pago fue recibido
   * @param {string} observaciones - Observaciones del cajero
   * @returns {Promise<Object>} Transacción actualizada
   */
  async confirmarTransaccionPorCajero(
    transaccionId,
    cajeroId,
    confirmado,
    observaciones = ""
  ) {
    await this.ensureAuth();
    try {
      const payload = {
        cajeroId,
        confirmado,
        notasCajero: observaciones,
      };

      const res = await this.client.put(
        `/api/transacciones/${transaccionId}/confirmar`,
        payload
      );
      return res.data;
    } catch (error) {
      console.log("Error confirmando transacción por cajero:", error.message);
      throw error;
    }
  }

  /**
   * Rechaza la transacción por parte del cajero
   * @param {string} transaccionId - ID de la transacción
   * @param {string} cajeroId - ID del cajero
   * @param {string} motivo - Motivo del rechazo
   * @returns {Promise<Object>} Transacción actualizada
   */
  async rechazarTransaccionPorCajero(transaccionId, cajeroId, motivo) {
    await this.ensureAuth();
    try {
      const payload = {
        cajeroId,
        motivo,
      };

      const res = await this.client.put(
        `/api/transacciones/${transaccionId}/rechazar`,
        payload
      );
      return res.data;
    } catch (error) {
      console.log("Error rechazando transacción por cajero:", error.message);
      throw error;
    }
  }
}

module.exports = BackendAPI;
