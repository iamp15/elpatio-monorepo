"use strict";

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const BackendAPI = require("./api/backend");

// Importar módulos
const commands = require("./handlers/commands");
const { handleCallbackQuery } = require("./handlers/callbacks");
const { handleTextMessage } = require("./handlers/messages");

// Variables de entorno
const BOT_TOKEN = process.env.BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL;
const BOT_EMAIL = process.env.BOT_EMAIL;
const BOT_PASSWORD = process.env.BOT_PASSWORD;
const PRE_TOKEN = process.env.BOT_JWT || null;

if (!BOT_TOKEN || !BACKEND_URL) {
  console.error("Faltan variables de entorno. Revisa .env");
  process.exit(1);
}

// Inicializar bot y API
const bot = new TelegramBot(BOT_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10,
    },
  },
  request: {
    timeout: 30000,
    proxy: false,
    // Configuración de DNS personalizada
    httpsAgent: new (require("https").Agent)({
      keepAlive: true,
      timeout: 30000,
    }),
  },
});

const api = new BackendAPI({
  baseUrl: BACKEND_URL,
  botEmail: BOT_EMAIL,
  botPassword: BOT_PASSWORD,
  preToken: PRE_TOKEN,
});

// Login al backend (obtiene el JWT) al iniciar
(async () => {
  try {
    await api.ensureAuth();
    console.log("✅ Bot autenticado en el backend");

    // Mostrar información del token
    const tokenInfo = api.getTokenInfo();
    if (tokenInfo.expiresAt) {
      console.log(
        `📅 Token válido hasta: ${tokenInfo.expiresAt.toLocaleString("es-ES")}`
      );
    }
  } catch (err) {
    console.error("❌ Error autenticando el bot en backend:", err.message);
    console.error(
      "⚠️  El bot continuará funcionando pero algunas funciones pueden fallar"
    );
  }
})();

// Monitor de estado del token (verifica cada 5 minutos)
setInterval(async () => {
  try {
    const tokenInfo = api.getTokenInfo();

    if (tokenInfo.willExpireSoon) {
      console.log(
        `⚠️ Token expirará pronto (${Math.round(
          tokenInfo.timeUntilExpiry / 60000
        )} minutos)`
      );
      console.log("🔄 Renovando token automáticamente...");
      await api.refreshToken();
    }
  } catch (error) {
    console.error("❌ Error en monitor de token:", error.message);
  }
}, 5 * 60 * 1000); // 5 minutos

// Manejo de errores global para evitar crashes
process.on("uncaughtException", (err) => {
  console.error("❌ Error no capturado:", err.message);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Promesa rechazada no manejada:", reason);
});

// Manejo específico de errores de polling del bot
bot.on("polling_error", (error) => {
  console.error("❌ Error de polling:", error.message);

  // Si es un error de DNS, intentar reconectar después de un delay
  if (
    error.message.includes("ENOTFOUND") ||
    error.message.includes("getaddrinfo")
  ) {
    console.log(
      "🔄 Error de DNS detectado, intentando reconectar en 30 segundos..."
    );
    setTimeout(() => {
      console.log("🔄 Reiniciando polling...");
      bot.stopPolling().then(() => {
        setTimeout(() => {
          bot.startPolling();
        }, 5000);
      });
    }, 30000);
  }
});

bot.on("error", (error) => {
  console.error("❌ Error del bot:", error.message);
});

// === COMANDOS ===
bot.onText(/\/start/, (msg) => commands.handleStart(bot, api, msg));
bot.onText(/\/juegos/, (msg) => commands.handleJuegos(bot, api, msg));
bot.onText(/\/salas/, (msg) => commands.handleSalas(bot, api, msg));
bot.onText(/\/ayuda/, (msg) => commands.handleAyuda(bot, api, msg));
bot.onText(/\/mijuego/, (msg) => commands.handleMiJuego(bot, api, msg));
bot.onText(/\/cambiarjuego/, (msg) =>
  commands.handleCambiarJuego(bot, api, msg)
);
bot.onText(/\/crearsala/, (msg) => commands.handleCrearSala(bot, api, msg));
bot.onText(/\/miperfil/, (msg) => commands.handleMiPerfil(bot, api, msg));

// === COMANDOS DE NOTIFICACIONES ===
bot.onText(/\/notificaciones/, (msg) =>
  commands.handleNotificaciones(bot, api, msg)
);
bot.onText(/\/eliminar_notificacion (.+)/, (msg, match) =>
  commands.handleEliminarNotificacion(bot, api, msg, match)
);

bot.onText(/\/stats/, (msg) => commands.handleStats(bot, api, msg));
bot.onText(/\/token/, (msg) => commands.handleToken(bot, api, msg));
bot.onText(/\/setwelcome/, (msg) => commands.handleSetWelcome(bot, api, msg));
bot.onText(/\/setupmeta/, (msg) => commands.handleSetupMeta(bot, api, msg));
bot.onText(/\/cleanup/, (msg) => commands.handleCleanup(bot, api, msg));
bot.onText(/\/restore/, (msg) => commands.handleRestore(bot, api, msg));

// === COMANDOS DE ADMINISTRACIÓN DE LÍMITES DE ABANDONO ===
bot.onText(/\/abandonlimits/, (msg) =>
  commands.handleAbandonLimits(bot, api, msg)
);
bot.onText(/\/abandonsystem/, (msg) =>
  commands.handleAbandonSystem(bot, api, msg)
);
bot.onText(/\/checkabandons/, (msg) =>
  commands.handleCheckAbandons(bot, api, msg)
);
bot.onText(/\/resetabandons/, (msg) =>
  commands.handleResetAbandons(bot, api, msg)
);
bot.onText(/\/debug-webapp/, (msg) =>
  commands.handleDebugWebapp(bot, api, msg)
);

// === COMANDOS DE CONSULTA DE CONFIGURACIÓN DE PRECIOS ===
bot.onText(/\/verprecios/, (msg) => commands.handleVerPrecios(bot, msg));
bot.onText(/\/verhistorial/, (msg) => commands.handleVerHistorial(bot, msg));
bot.onText(/\/vercachestats/, (msg) => commands.handleVerCacheStats(bot, msg));
bot.onText(/\/limpiarcache/, (msg) => commands.handleLimpiarCache(bot, msg));
bot.onText(/\/ayudaprecios/, (msg) => commands.handleAyudaPrecios(bot, msg));

// === CALLBACK QUERIES ===
bot.on("callback_query", (callbackQuery) =>
  handleCallbackQuery(bot, api, callbackQuery)
);

// === MENSAJES DE TEXTO ===
bot.on("message", (msg) => handleTextMessage(bot, api, msg));

console.log("🤖 Bot iniciado correctamente");
