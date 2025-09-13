"use strict";

const BOT_CONFIG = require("../../config/bot-config");
const { getUserDisplayName } = require("../../utils/helpers");
const NicknameLimitManager = require("../../utils/nickname-limit-manager");

// Variables de entorno
const TEST_MODE = process.env.TEST_MODE === "true" || !process.env.BACKEND_URL;

/**
 * Comando para mostrar el perfil del usuario
 */
async function handleMiPerfil(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const nombre = msg.from.first_name || "Jugador";

  try {
    let jugador = null;
    let displayName = nombre;
    let saldo = 0;
    let victorias = 0;
    let derrotas = 0;
    let tieneNickname = false;

    // Obtener información del jugador desde el backend
    if (!TEST_MODE) {
      try {
        jugador = await api.findPlayerByTelegram(String(userId));
        if (jugador) {
          // Usar directamente el nickname del jugador para el display
          displayName =
            jugador.nickname || jugador.firstName || jugador.username || nombre;

          // Verificar si tiene nickname configurado
          tieneNickname =
            jugador.nickname && !jugador.nickname.startsWith("SIN_NICKNAME_");

          // Obtener saldo (si existe en el esquema)
          saldo = jugador.saldo || 0;

          // Obtener estadísticas (si existen en el esquema)
          victorias = jugador.victorias || 0;
          derrotas = jugador.derrotas || 0;
        }
      } catch (err) {
        console.error(
          "❌ Error obteniendo información del jugador:",
          err.message
        );
      }
    }

    // Crear mensaje del perfil
    const profileMessage = await crearMensajePerfil({
      displayName,
      tieneNickname,
      saldo,
      victorias,
      derrotas,
      userId,
      api,
    });

    // Crear teclado inline para las acciones del perfil
    const inlineKeyboard = crearTecladoPerfil(tieneNickname);

    await bot.sendMessage(chatId, profileMessage, {
      parse_mode: "HTML",
      reply_markup: inlineKeyboard.reply_markup,
    });
  } catch (err) {
    console.error("❌ Error en /mip perfil:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error mostrando tu perfil. Intenta de nuevo o contacta al admin."
    );
  }
}

/**
 * Crea el mensaje del perfil del usuario
 */
async function crearMensajePerfil({
  displayName,
  tieneNickname,
  saldo,
  victorias,
  derrotas,
  userId,
  api,
}) {
  const saldoFormateado = await formatearSaldo(saldo, api);
  const totalPartidas = victorias + derrotas;
  const porcentajeVictoria =
    totalPartidas > 0 ? Math.round((victorias / totalPartidas) * 100) : 0;

  return `👤 <b>Tu Perfil</b>

🎮 <b>Nickname:</b> ${tieneNickname ? displayName : "No configurado"}
💰 <b>Saldo:</b> ${saldoFormateado}
🆔 <b>ID:</b> ${userId}

📊 <b>Estadísticas:</b>
🏆 <b>Victorias:</b> ${victorias}
💔 <b>Derrotas:</b> ${derrotas}
📈 <b>Total partidas:</b> ${totalPartidas}
📊 <b>Porcentaje victoria:</b> ${porcentajeVictoria}%

${
  !tieneNickname
    ? "💡 <i>Configura tu nickname para personalizar tu experiencia</i>"
    : ""
}`;
}

/**
 * Crea el teclado inline para las acciones del perfil
 */
function crearTecladoPerfil(tieneNickname) {
  const botones = [];

  // Botón para nickname (dinámico según si lo tiene o no)
  const nicknameButton = {
    text: tieneNickname ? "✏️ Cambiar Nickname" : "🎮 Crear Nickname",
    callback_data: tieneNickname
      ? "profile_change_nickname"
      : "profile_create_nickname",
  };
  botones.push([nicknameButton]);

  // Botones de saldo
  botones.push([
    { text: "💰 Depositar", callback_data: "profile_deposit" },
    { text: "💸 Retirar", callback_data: "profile_withdraw" },
  ]);

  // Botón para ver estadísticas detalladas (futuro)
  botones.push([
    {
      text: "📊 Estadísticas Detalladas",
      callback_data: "profile_detailed_stats",
    },
  ]);

  return {
    reply_markup: {
      inline_keyboard: botones,
    },
  };
}

/**
 * Formatea el saldo usando la configuración de moneda del backend
 */
async function formatearSaldo(saldo, api) {
  try {
    // Importar PaymentConfigManager
    const PaymentConfigManager = require("../../utils/payment-config-manager");
    const paymentConfigManager = new PaymentConfigManager(api);

    // Obtener configuración de moneda desde el backend
    const monedaConfig = await paymentConfigManager.getCurrencyConfig();

    // Convertir saldo de centavos a unidades de moneda
    const saldoEnUnidades = saldo / Math.pow(10, monedaConfig.decimales);

    // Formatear el número según la configuración
    const numeroFormateado = saldoEnUnidades.toLocaleString(
      monedaConfig.formato,
      {
        minimumFractionDigits: monedaConfig.decimales,
        maximumFractionDigits: monedaConfig.decimales,
      }
    );

    // Retornar con el símbolo de la moneda
    return `${monedaConfig.simbolo}. ${numeroFormateado}`;
  } catch (error) {
    console.error("Error formateando saldo:", error.message);
    // Fallback a formato básico en caso de error
    const saldoEnBolivares = saldo / 100;
    const numeroFormateado = saldoEnBolivares.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `Bs. ${numeroFormateado}`;
  }
}

module.exports = {
  handleMiPerfil,
  formatearSaldo,
  crearMensajePerfil,
  crearTecladoPerfil,
};
