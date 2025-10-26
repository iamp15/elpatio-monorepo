const { io } = require("socket.io-client");
const EventEmitter = require("events");

/**
 * Cliente WebSocket para el bot de Telegram
 * Gestiona la conexión permanente con el backend y notificaciones en tiempo real
 */
class BotWebSocketClient extends EventEmitter {
  constructor(backendUrl, api) {
    super();
    this.backendUrl = backendUrl;
    this.api = api;
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // 1 segundo inicial
    this.maxReconnectDelay = 60000; // 60 segundos máximo
    this.reconnectTimer = null;
    this.pingInterval = null;
  }

  /**
   * Conectar al servidor WebSocket
   */
  async connect() {
    if (this.socket && this.socket.connected) {
      console.log("✅ [WS-BOT] Ya conectado");
      return;
    }

    try {
      console.log(`🔌 [WS-BOT] Conectando a ${this.backendUrl}...`);

      // Esperar a que se conecte antes de configurar otros handlers
      await new Promise((resolve, reject) => {
        this.socket = io(this.backendUrl, {
          transports: ["websocket", "polling"],
          reconnection: false, // Manejar reconexión manualmente
          timeout: 15000,
        });

        // Configurar handler inicial de conexión (una sola vez)
        this.socket.once("connect", () => {
          console.log("✅ [WS-BOT] Conectado exitosamente");
          resolve();
        });

        this.socket.once("connect_error", (error) => {
          console.error(`❌ [WS-BOT] Error de conexión:`, error.message);
          reject(error);
        });

        // Timeout de conexión
        setTimeout(() => reject(new Error("Timeout de conexión")), 15000);
      });

      // Configurar el resto de los event handlers después de la conexión exitosa
      this.setupEventHandlers();

      // Autenticar después de conectar
      await this.authenticate();
    } catch (error) {
      console.error(`❌ [WS-BOT] Error conectando:`, error.message);
      this.scheduleReconnect();
      throw error;
    }
  }

  /**
   * Autenticar como bot
   */
  async authenticate() {
    if (!this.socket || !this.socket.connected) {
      throw new Error("Socket no conectado");
    }

    try {
      // Obtener token del API
      const token = await this.api.getToken();

      if (!token) {
        throw new Error("No se pudo obtener token de autenticación");
      }

      console.log("🔐 [WS-BOT] Autenticando...");

      // Emitir evento de autenticación
      this.socket.emit("auth-bot", { token });

      // Esperar respuesta de autenticación
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout de autenticación"));
        }, 10000);

        this.socket.once("auth-result", (result) => {
          clearTimeout(timeout);

          if (result.success) {
            this.authenticated = true;
            this.connected = true;
            this.reconnectAttempts = 0; // Reset intentos de reconexión
            console.log("✅ [WS-BOT] Autenticación exitosa");
            this.emit("connected");
            resolve(result);
          } else {
            this.authenticated = false;
            console.error(
              `❌ [WS-BOT] Autenticación fallida: ${result.message}`
            );
            reject(new Error(result.message));
          }
        });
      });

      // Iniciar ping para mantener conexión viva
      this.startPing();
    } catch (error) {
      console.error(`❌ [WS-BOT] Error autenticando:`, error.message);
      this.authenticated = false;
      throw error;
    }
  }

  /**
   * Configurar manejadores de eventos del socket
   */
  setupEventHandlers() {
    // Nota: connect y connect_error ya están manejados en connect()

    // Desconexión
    this.socket.on("disconnect", (reason) => {
      console.log(`🔌 [WS-BOT] Desconectado: ${reason}`);
      this.connected = false;
      this.authenticated = false;
      this.stopPing();
      this.emit("disconnected", reason);

      // Si no fue desconexión voluntaria, intentar reconectar
      if (reason !== "io client disconnect") {
        this.scheduleReconnect();
      }
    });

    // Notificación de bot
    this.socket.on("bot-notificacion", (data) => {
      console.log(`📬 [WS-BOT] Notificación recibida:`, data);
      this.emit("notificacion", data);
    });

    // Error general
    this.socket.on("error", (error) => {
      console.error(`❌ [WS-BOT] Error:`, error);
      this.emit("error", error);
    });
  }

  /**
   * Programar reconexión con backoff exponencial
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        `❌ [WS-BOT] Máximo de intentos de reconexión alcanzado (${this.maxReconnectAttempts})`
      );
      this.emit("max-reconnect-attempts-reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(
      `⏱️ [WS-BOT] Reintentando conexión en ${delay / 1000}s (intento ${
        this.reconnectAttempts
      }/${this.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error(`❌ [WS-BOT] Error en reconexión:`, error.message);
        // Se llamará scheduleReconnect nuevamente desde el handler de disconnect
      }
    }, delay);
  }

  /**
   * Iniciar ping periódico para mantener conexión viva
   */
  startPing() {
    // Limpiar ping anterior si existe
    this.stopPing();

    // Ping cada 30 segundos
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit("ping");
      }
    }, 30000);

    console.log("💓 [WS-BOT] Ping iniciado");
  }

  /**
   * Detener ping
   */
  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      console.log("💓 [WS-BOT] Ping detenido");
    }
  }

  /**
   * Desconectar del servidor
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopPing();

    if (this.socket) {
      console.log("🔌 [WS-BOT] Desconectando...");
      this.socket.disconnect();
      this.socket = null;
    }

    this.connected = false;
    this.authenticated = false;
    console.log("✅ [WS-BOT] Desconectado");
  }

  /**
   * Verificar si está conectado
   */
  isConnected() {
    return this.connected && this.authenticated && this.socket?.connected;
  }

  /**
   * Obtener estado de la conexión
   */
  getStatus() {
    return {
      connected: this.connected,
      authenticated: this.authenticated,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id || null,
    };
  }
}

module.exports = BotWebSocketClient;
