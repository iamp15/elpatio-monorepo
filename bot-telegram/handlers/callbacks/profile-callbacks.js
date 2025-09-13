"use strict";

const userStateManager = require("../../user-state");
const { getWebAppUrl } = require("../../config/webapp-config");

/**
 * Maneja la creación de nickname
 */
async function handleCreateNickname(bot, api, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    // Establecer estado para esperar el nickname
    userStateManager.setState(userId, { waitingForNickname: true });

    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Escribe tu nickname",
    });

    await bot.sendMessage(
      chatId,
      `🎮 <b>Crear Nickname</b>

📋 <b>Reglas para tu nickname:</b>
• Entre 3 y 32 caracteres
• Una sola palabra (sin espacios)
• Solo letras (incluyendo ñ), números, guiones (-) y guiones bajos (_)
• Debe contener al menos una letra
• No puede empezar o terminar con guión
• Palabras apropiadas únicamente

📝 <b>Envíame tu nickname:</b>`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("❌ Error en create nickname:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Error procesando solicitud",
    });
  }
}

/**
 * Maneja el cambio de nickname con verificación de límites
 */
async function handleChangeNickname(bot, api, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    // Verificar límites de cambio de nickname
    const NicknameLimitManager = require("../../utils/nickname-limit-manager");
    const limitManager = new NicknameLimitManager();
    const limitCheck = await limitManager.canChangeNickname(String(userId));

    if (!limitCheck.canChange) {
      // Usuario no puede cambiar nickname, mostrar información de límites
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Límite de cambios alcanzado",
      });

      await bot.sendMessage(
        chatId,
        `⏰ <b>Límite de Cambio de Nickname Alcanzado</b>

${limitCheck.message}

🔄 <b>Próximo reset:</b> ${limitCheck.nextReset.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}

💡 <b>Tip:</b> Los límites se resetean cada lunes a las 00:00

🔄 <b>Inténtalo de nuevo después del reset</b>`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Usuario puede cambiar nickname, mostrar información de límites disponibles
    const limitInfo = await limitManager.getLimitInfo(String(userId));

    await bot.answerCallbackQuery(callbackQuery.id, {
      text: `Puedes cambiar tu nickname (${limitCheck.remainingChanges} restante(s))`,
    });

    await bot.sendMessage(
      chatId,
      `✏️ <b>Cambiar Nickname</b>

📋 <b>Reglas para tu nickname:</b>
• Entre 3 y 32 caracteres
• Una sola palabra (sin espacios)
• Solo letras (incluyendo ñ), números, guiones (-) y guiones bajos (_)
• Debe contener al menos una letra
• No puede empezar o terminar con guión
• Palabras apropiadas únicamente

⏰ <b>Límites actuales:</b>
${limitInfo.message}
🔄 <b>Próximo reset:</b> ${limitInfo.nextReset.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}

📝 <b>Envíame tu nuevo nickname:</b>`,
      { parse_mode: "HTML" }
    );

    // Establecer estado para esperar el nuevo nickname
    userStateManager.setState(userId, { waitingForNicknameChange: true });
  } catch (err) {
    console.error("❌ Error en change nickname:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Error procesando solicitud",
    });
  }
}

/**
 * Maneja la solicitud de depósito - Abre la Mini App
 */
async function handleDeposit(bot, api, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Abriendo Mini App de depósitos...",
    });

    // URL de la Mini App desde configuración
    const webAppUrl = getWebAppUrl("DEPOSITO");

    await bot.sendMessage(
      chatId,
      `💰 <b>Realizar Depósito</b>

💳 <b>Haz clic en el botón de abajo para abrir la Mini App de depósitos</b>

📱 <b>En la Mini App podrás:</b>
• Ingresar el monto que deseas depositar
• Ver los datos bancarios del cajero
• Confirmar tu pago móvil
• Seguir el estado de tu transacción

🔒 <b>Seguro y confiable</b>
• Todos los datos se procesan de forma segura
• Comunicación directa con el sistema de transacciones
• Verificación automática de pagos

¡Haz clic en el botón para comenzar!`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💳 Abrir Mini App de Depósitos",
                web_app: { url: webAppUrl },
              },
            ],
            [
              {
                text: "📊 Ver Historial de Depósitos",
                callback_data: "profile_deposit_history",
              },
            ],
            [
              {
                text: "⬅️ Volver al Perfil",
                callback_data: "profile_main",
              },
            ],
          ],
        },
      }
    );
  } catch (err) {
    console.error("❌ Error en deposit:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Error abriendo Mini App",
    });

    await bot.sendMessage(
      chatId,
      `❌ <b>Error</b>

No se pudo abrir la Mini App de depósitos. Por favor intenta de nuevo o contacta al administrador.

🔧 <b>Posibles causas:</b>
• Problema de conexión
• Mini App temporalmente no disponible
• Error en la configuración

¡Intenta de nuevo en unos minutos!`,
      { parse_mode: "HTML" }
    );
  }
}

/**
 * Maneja la solicitud de historial de depósitos
 */
async function handleDepositHistory(bot, api, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Cargando historial de depósitos...",
    });

    // TODO: Implementar obtención de historial de depósitos desde el backend
    // const historial = await api.obtenerHistorialDepositos(userId.toString());

    // Por ahora mostrar mensaje de desarrollo
    await bot.sendMessage(
      chatId,
      `📊 <b>Historial de Depósitos</b>

⚠️ <b>Función en desarrollo</b>

Próximamente podrás ver:
• Historial completo de tus depósitos
• Estados de cada transacción
• Fechas y montos
• Referencias de pago

💡 <b>Mientras tanto:</b>
• Usa la Mini App para realizar nuevos depósitos
• El historial se guardará automáticamente

¡Mantente atento a las actualizaciones!`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💳 Realizar Nuevo Depósito",
                callback_data: "profile_deposit",
              },
            ],
            [
              {
                text: "⬅️ Volver al Perfil",
                callback_data: "profile_main",
              },
            ],
          ],
        },
      }
    );
  } catch (err) {
    console.error("❌ Error en deposit history:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Error cargando historial",
    });
  }
}

/**
 * Maneja la solicitud de retiro
 */
async function handleWithdraw(bot, api, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;

  try {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Función en desarrollo",
    });

    await bot.sendMessage(
      chatId,
      `💸 <b>Retiro</b>

⚠️ <b>Función en desarrollo</b>

Próximamente podrás retirar tus ganancias.

💡 <b>Mientras tanto:</b>
• Los juegos son gratuitos en modo prueba
• El sistema de pagos estará disponible pronto

¡Mantente atento a las actualizaciones!`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("❌ Error en withdraw:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Error procesando solicitud",
    });
  }
}

/**
 * Maneja la solicitud de estadísticas detalladas
 */
async function handleDetailedStats(bot, api, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;

  try {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Función en desarrollo",
    });

    await bot.sendMessage(
      chatId,
      `📊 <b>Estadísticas Detalladas</b>

⚠️ <b>Función en desarrollo</b>

Próximamente podrás ver:
• Historial completo de partidas
• Estadísticas por juego
• Gráficos de rendimiento
• Logros y badges

💡 <b>Por ahora:</b>
• Las estadísticas básicas están disponibles en tu perfil
• Esta función estará disponible pronto

¡Mantente atento a las actualizaciones!`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("❌ Error en detailed stats:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Error procesando solicitud",
    });
  }
}

module.exports = {
  handleCreateNickname,
  handleChangeNickname,
  handleDeposit,
  handleDepositHistory,
  handleWithdraw,
  handleDetailedStats,
};
