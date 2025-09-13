"use strict";

/**
 * Maneja la renovación manual del token
 */
async function handleRefreshToken(bot, api, callbackQuery) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    // Verificar permisos de admin
    const { isAdmin } = require("../../utils/helpers");
    if (!isAdmin(from.id)) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ No tienes permisos",
      });
      return;
    }

    if (process.env.TEST_MODE === "true" || !process.env.BACKEND_URL) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "🧪 Modo TEST - No hay token",
      });
      return;
    }

    // Acknowledge callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "🔄 Renovando token...",
    });

    // Renovar token
    await api.refreshToken();

    // Obtener nueva información del token
    const tokenInfo = api.getTokenInfo();

    let responseMessage = `✅ <b>Token renovado exitosamente</b>

📋 <b>Nueva información:</b>
• Válido: ${tokenInfo.valid ? "✅ Sí" : "❌ No"}
• Expira: ${
      tokenInfo.expiresAt ? tokenInfo.expiresAt.toLocaleString("es-ES") : "N/A"
    }`;

    if (tokenInfo.timeUntilExpiry) {
      const minutes = Math.round(tokenInfo.timeUntilExpiry / 60000);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      responseMessage += `\n• Tiempo restante: ${
        hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`
      }`;
    }

    await bot.sendMessage(chatId, responseMessage, {
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error("❌ Error renovando token:", error.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Error renovando token",
    });
    await bot.sendMessage(
      chatId,
      `❌ <b>Error renovando token</b>\n\n${error.message}`,
      { parse_mode: "HTML" }
    );
  }
}

/**
 * Maneja la visualización de estadísticas desde el comando de token
 */
async function handleViewStats(bot, api, callbackQuery) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    // Verificar permisos de admin
    const { isAdmin } = require("../../utils/helpers");
    if (!isAdmin(from.id)) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ No tienes permisos",
      });
      return;
    }

    // Acknowledge callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "📊 Obteniendo estadísticas...",
    });

    // Importar y ejecutar el comando de estadísticas
    const commands = require("../commands");
    await commands.handleStats(bot, api, message);
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Error obteniendo estadísticas",
    });
    await bot.sendMessage(
      chatId,
      "❌ Error obteniendo estadísticas. Intenta de nuevo."
    );
  }
}

/**
 * Maneja la confirmación de reset de contadores de abandonos
 */
async function handleResetAbandonsConfirm(bot, api, callbackQuery, telegramId) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    // Verificar permisos de admin
    const { isAdmin } = require("../../utils/helpers");
    if (!isAdmin(from.id)) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ No tienes permisos para esta acción.",
        show_alert: true,
      });
      return;
    }

    // Importar el manager de límites
    const abandonLimitManager = require("../../utils/abandon-limits");

    // Convertir telegramId a número para que coincida con el tipo usado en la cache
    const telegramIdNumber = parseInt(telegramId);

    // Resetear contadores
    console.log(
      `🔍 [RESETABANDONS] Reseteando contadores para usuario: ${telegramId} (convertido a número: ${telegramIdNumber})`
    );
    console.log(
      `📊 [RESETABANDONS] Cache antes del reset:`,
      abandonLimitManager.cache.size,
      "usuarios"
    );

    const resultado = abandonLimitManager.resetPlayerCounters(telegramIdNumber);
    console.log(`📊 [RESETABANDONS] Resultado del reset:`, resultado);
    console.log(
      `📊 [RESETABANDONS] Cache después del reset:`,
      abandonLimitManager.cache.size,
      "usuarios"
    );

    if (resultado.success) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "✅ Contadores reseteados exitosamente.",
        show_alert: true,
      });

      // Actualizar mensaje con confirmación
      await bot.editMessageText(
        `🔄 <b>Reset de Contadores Completado</b>\n\n✅ <b>Contadores reseteados exitosamente</b>\n\n👤 <b>Jugador:</b> <code>${telegramId}</code>\n\n📊 <b>Nuevo estado:</b>\n• Abandonos por hora: 0/3\n• Abandonos por día: 0/8\n• Estado: ✅ LIBRE\n\n💡 <b>El jugador ahora puede abandonar salas normalmente.</b>`,
        {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: "HTML",
        }
      );
    } else {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: `❌ ${resultado.message}`,
        show_alert: true,
      });
    }
  } catch (err) {
    console.error("❌ Error reseteando contadores:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Error reseteando contadores.",
      show_alert: true,
    });
  }
}

/**
 * Maneja la cancelación del reset de contadores de abandonos
 */
async function handleCancelResetAbandons(bot, api, callbackQuery) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    // Verificar permisos de admin
    const { isAdmin } = require("../../utils/helpers");
    if (!isAdmin(from.id)) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ No tienes permisos para esta acción.",
        show_alert: true,
      });
      return;
    }

    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Reset cancelado.",
      show_alert: true,
    });

    // Actualizar mensaje con cancelación
    await bot.editMessageText(
      `🔄 <b>Reset de Contadores Cancelado</b>\n\n❌ <b>Operación cancelada</b>\n\nLos contadores de abandonos NO han sido modificados.\n\nEl jugador mantiene su estado actual.`,
      {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: "HTML",
      }
    );
  } catch (err) {
    console.error("❌ Error cancelando reset:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Error cancelando reset.",
      show_alert: true,
    });
  }
}

module.exports = {
  handleRefreshToken,
  handleViewStats,
  handleResetAbandonsConfirm,
  handleCancelResetAbandons,
};
