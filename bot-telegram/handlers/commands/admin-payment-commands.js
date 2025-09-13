"use strict";

/**
 * Comandos de Administración para Consulta de Configuración de Precios
 *
 * Este módulo contiene los comandos de Telegram para que los administradores
 * puedan consultar precios, límites y comisiones del sistema de pagos
 *
 * NOTA: Este módulo solo permite consultas, no modificaciones.
 * Las modificaciones se realizan desde el dashboard web de administración.
 */

const userStateManager = require("../../user-state");

/**
 * Verifica si un usuario es administrador
 * @param {number} userId - ID del usuario
 * @returns {boolean} true si es administrador
 */
function isAdmin(userId) {
  const adminIds = process.env.ADMIN_ID ? process.env.ADMIN_ID.split(",") : [];
  return adminIds.includes(userId.toString());
}

/**
 * Comando para ver la configuración actual de precios
 */
async function handleVerPrecios(bot, msg) {
  console.log("🔍 handleVerPrecios iniciado");
  console.log("📋 msg recibido:", JSON.stringify(msg, null, 2));

  // Validar que msg existe
  if (!msg) {
    console.error("❌ Error: msg es undefined");
    return;
  }

  // Validar que msg.chat existe
  if (!msg.chat) {
    console.error("❌ Error: msg.chat es undefined", msg);
    return;
  }

  const chatId = msg.chat.id;
  console.log("📱 chatId:", chatId);

  // Validar que el mensaje tiene la estructura esperada
  if (!msg.from || !msg.from.id) {
    console.error("❌ Error: msg.from o msg.from.id es undefined", msg);
    try {
      await bot.sendMessage(
        chatId,
        "❌ Error interno del bot. Contacta al administrador."
      );
    } catch (sendError) {
      console.error("❌ Error enviando mensaje de error:", sendError);
    }
    return;
  }

  const userId = msg.from.id;
  console.log("👤 userId:", userId);

  try {
    // Verificar si es administrador
    if (!isAdmin(userId)) {
      await bot.sendMessage(
        chatId,
        "❌ Solo los administradores pueden usar este comando."
      );
      return;
    }

    // Obtener configuración desde el backend
    const BackendAPI = require("../../api/backend");
    const paymentConfigManager = require("../../utils/payment-config-manager");

    // Crear instancia de la API del backend
    const api = new BackendAPI({
      baseUrl: process.env.BACKEND_URL || "http://localhost:5000",
      botEmail: process.env.BOT_EMAIL || "bot@elpatio.com",
      botPassword: process.env.BOT_PASSWORD || "tu_password",
    });

    const configManager = new paymentConfigManager(api);

    const config = await configManager.getConfig();

    let message = "📊 <b>CONFIGURACIÓN ACTUAL DE PRECIOS</b>\n\n";

    // Información de moneda
    message += `💰 <b>Moneda:</b> ${config.currency || "VES"}\n\n`;

    // Precios por juego
    message += "🎮 <b>PRECIOS POR JUEGO:</b>\n";
    if (config.prices) {
      for (const [juego, modos] of Object.entries(config.prices)) {
        message += `\n<b>${juego.toUpperCase()}:</b>\n`;
        for (const [modo, precio] of Object.entries(modos)) {
          const precioFormateado = formatCurrency(precio);
          message += `  • ${modo}: ${precioFormateado}\n`;
        }
      }
    }

    // Límites
    message += "\n📏 <b>LÍMITES:</b>\n";
    if (config.limits) {
      for (const [categoria, valores] of Object.entries(config.limits)) {
        message += `\n<b>${categoria.toUpperCase()}:</b>\n`;
        if (typeof valores === "object" && valores !== null) {
          for (const [tipo, valor] of Object.entries(valores)) {
            if (
              categoria === "retiros" &&
              (tipo === "diarios" || tipo === "semanales")
            ) {
              // Para retiros, mostrar como cantidad máxima
              message += `  • Máximo ${tipo}: ${valor} retiros\n`;
            } else if (typeof valor === "number") {
              const valorFormateado = formatCurrency(valor);
              message += `  • ${tipo}: ${valorFormateado}\n`;
            } else {
              message += `  • ${tipo}: ${valor}\n`;
            }
          }
        } else {
          const valorFormateado = formatCurrency(valores);
          message += `  • ${valorFormateado}\n`;
        }
      }
    }

    // Comisiones
    message += "\n💸 <b>COMISIONES:</b>\n";
    if (config.commissions) {
      for (const [tipo, configuracion] of Object.entries(config.commissions)) {
        message += `\n<b>${tipo.toUpperCase()}:</b>\n`;

        // Manejar casos especiales donde el valor es directo
        if (tipo === "porcentaje_ganancias") {
          message += `  • Ganancia de la casa: ${configuracion}%\n`;
        } else if (
          typeof configuracion === "object" &&
          configuracion !== null
        ) {
          for (const [subtipo, valor] of Object.entries(configuracion)) {
            if (subtipo === "comision" && tipo === "deposito") {
              // Comisión de depósito como porcentaje
              message += `  • Comisión: ${valor}%\n`;
            } else if (subtipo === "comision_fija" && tipo === "retiro") {
              // Comisión fija de retiro
              const valorFormateado = formatCurrency(valor);
              message += `  • Comisión fija: ${valorFormateado}\n`;
            } else if (subtipo === "frecuecia_semanal" && tipo === "retiro") {
              // Frecuencia semanal de retiros
              message += `  • Frecuencia semanal:\n`;
              if (typeof valor === "object" && valor !== null) {
                // Ordenar las frecuencias como especificaste
                const ordenFrecuencias = [
                  "primera_vez",
                  "segunda_vez",
                  "tercera_vez",
                  "adicional",
                ];
                for (const frecuencia of ordenFrecuencias) {
                  if (valor[frecuencia] !== undefined) {
                    if (frecuencia === "periodo_dias") {
                      message += `    - Período de reinicio: ${valor[frecuencia]} días\n`;
                    } else {
                      const nombreFrecuencia = frecuencia.replace("_", " ");
                      message += `    - ${nombreFrecuencia}: ${valor[frecuencia]}%\n`;
                    }
                  }
                }
              }
            } else if (typeof valor === "number") {
              // Verificar si es un porcentaje antes de formatear como moneda
              if (subtipo === "porcentaje_ganancias") {
                message += `  • Ganancia de la casa: ${valor}%\n`;
              } else {
                const valorFormateado = formatCurrency(valor);
                message += `  • ${subtipo}: ${valorFormateado}\n`;
              }
            } else {
              message += `  • ${subtipo}: ${valor}\n`;
            }
          }
        } else {
          const valorFormateado = formatCurrency(configuracion);
          message += `  • ${valorFormateado}\n`;
        }
      }
    }

    message +=
      "\n⚠️ <b>Nota:</b> La configuración se modifica desde el dashboard web de administración.";

    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (error) {
    console.error("Error en handleVerPrecios:", error);
    await bot.sendMessage(
      chatId,
      "❌ Error obteniendo configuración de precios desde el backend."
    );
  }
}

/**
 * Comando para ver el historial de cambios de configuración
 */
async function handleVerHistorial(bot, msg) {
  const chatId = msg.chat.id;

  // Validar que el mensaje tiene la estructura esperada
  if (!msg.from || !msg.from.id) {
    console.error("Error: msg.from o msg.from.id es undefined", msg);
    await bot.sendMessage(
      chatId,
      "❌ Error interno del bot. Contacta al administrador."
    );
    return;
  }

  const userId = msg.from.id;

  try {
    // Verificar si es administrador
    if (!isAdmin(userId)) {
      await bot.sendMessage(
        chatId,
        "❌ Solo los administradores pueden usar este comando."
      );
      return;
    }

    // Obtener historial desde el backend
    const BackendAPI = require("../../api/backend");
    const paymentConfigManager = require("../../utils/payment-config-manager");

    // Crear instancia de la API del backend
    const api = new BackendAPI({
      baseUrl: process.env.BACKEND_URL || "http://localhost:5000",
      botEmail: process.env.BOT_EMAIL || "bot@elpatio.com",
      botPassword: process.env.BOT_PASSWORD || "tu_password",
    });

    const configManager = new paymentConfigManager(api);

    const auditHistory = await configManager.getAuditHistory();

    // Verificar si auditHistory es válido y tiene datos
    if (
      !auditHistory ||
      (typeof auditHistory === "object" &&
        Object.keys(auditHistory).length === 0) ||
      (Array.isArray(auditHistory) && auditHistory.length === 0)
    ) {
      await bot.sendMessage(
        chatId,
        "📋 No hay historial de cambios disponible.\n\n💡 El historial de auditoría se registra cuando se realizan cambios en la configuración desde el dashboard web."
      );
      return;
    }

    // Si auditHistory no es un array, intentar convertirlo
    let historyArray = auditHistory;
    if (!Array.isArray(auditHistory)) {
      // Si es un objeto con datos, intentar extraer el array
      if (auditHistory.data && Array.isArray(auditHistory.data)) {
        historyArray = auditHistory.data;
      } else if (auditHistory.changes && Array.isArray(auditHistory.changes)) {
        historyArray = auditHistory.changes;
      } else {
        await bot.sendMessage(
          chatId,
          "📋 No hay historial de cambios disponible.\n\n💡 El historial de auditoría se registra cuando se realizan cambios en la configuración desde el dashboard web."
        );
        return;
      }
    }

    let message = "📋 <b>HISTORIAL DE CAMBIOS DE CONFIGURACIÓN</b>\n\n";

    // Mostrar los últimos 10 cambios
    const recentChanges = historyArray.slice(0, 10);

    for (const change of recentChanges) {
      const fecha = new Date(
        change.timestamp || change.createdAt
      ).toLocaleString("es-VE");
      const admin = change.admin || change.user || "Admin";
      const tipo = change.type || change.action || "Modificación";

      message += `📅 <b>${fecha}</b>\n`;
      message += `👤 <b>Admin:</b> ${admin}\n`;
      message += `🔧 <b>Acción:</b> ${tipo}\n`;

      if (change.description) {
        message += `📝 <b>Descripción:</b> ${change.description}\n`;
      }

      message += "\n";
    }

    if (historyArray.length > 10) {
      message += `... y ${historyArray.length - 10} cambios más.\n`;
    }

    message +=
      "\n⚠️ <b>Nota:</b> Los cambios se realizan desde el dashboard web de administración.";

    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (error) {
    console.error("Error en handleVerHistorial:", error);
    await bot.sendMessage(
      chatId,
      "❌ Error obteniendo historial de configuración desde el backend."
    );
  }
}

/**
 * Comando para ver estadísticas del cache de configuración
 */
async function handleVerCacheStats(bot, msg) {
  const chatId = msg.chat.id;

  // Validar que el mensaje tiene la estructura esperada
  if (!msg.from || !msg.from.id) {
    console.error("Error: msg.from o msg.from.id es undefined", msg);
    await bot.sendMessage(
      chatId,
      "❌ Error interno del bot. Contacta al administrador."
    );
    return;
  }

  const userId = msg.from.id;

  try {
    // Verificar si es administrador
    if (!isAdmin(userId)) {
      await bot.sendMessage(
        chatId,
        "❌ Solo los administradores pueden usar este comando."
      );
      return;
    }

    // Obtener estadísticas del cache
    const BackendAPI = require("../../api/backend");
    const paymentConfigManager = require("../../utils/payment-config-manager");

    // Crear instancia de la API del backend
    const api = new BackendAPI({
      baseUrl: process.env.BACKEND_URL || "http://localhost:5000",
      botEmail: process.env.BOT_EMAIL || "bot@elpatio.com",
      botPassword: process.env.BOT_PASSWORD || "tu_password",
    });

    const configManager = new paymentConfigManager(api);

    const stats = configManager.getCacheStats();

    let message = "📊 <b>ESTADÍSTICAS DEL CACHE DE CONFIGURACIÓN</b>\n\n";
    message += `📦 <b>Total de entradas:</b> ${stats.totalEntries}\n`;
    message += `✅ <b>Entradas válidas:</b> ${stats.validEntries}\n`;
    message += `⏰ <b>Entradas expiradas:</b> ${stats.expiredEntries}\n`;
    message += `🕐 <b>Tiempo de expiración:</b> ${
      stats.cacheTimeout / 1000 / 60
    } minutos\n`;

    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (error) {
    console.error("Error en handleVerCacheStats:", error);
    await bot.sendMessage(
      chatId,
      "❌ Error obteniendo estadísticas del cache."
    );
  }
}

/**
 * Comando para limpiar el cache de configuración
 */
async function handleLimpiarCache(bot, msg) {
  const chatId = msg.chat.id;

  // Validar que el mensaje tiene la estructura esperada
  if (!msg.from || !msg.from.id) {
    console.error("Error: msg.from o msg.from.id es undefined", msg);
    await bot.sendMessage(
      chatId,
      "❌ Error interno del bot. Contacta al administrador."
    );
    return;
  }

  const userId = msg.from.id;

  try {
    // Verificar si es administrador
    if (!isAdmin(userId)) {
      await bot.sendMessage(
        chatId,
        "❌ Solo los administradores pueden usar este comando."
      );
      return;
    }

    // Limpiar cache
    const BackendAPI = require("../../api/backend");
    const paymentConfigManager = require("../../utils/payment-config-manager");

    // Crear instancia de la API del backend
    const api = new BackendAPI({
      baseUrl: process.env.BACKEND_URL || "http://localhost:5000",
      botEmail: process.env.BOT_EMAIL || "bot@elpatio.com",
      botPassword: process.env.BOT_PASSWORD || "tu_password",
    });

    const configManager = new paymentConfigManager(api);

    configManager.clearCache();

    await bot.sendMessage(
      chatId,
      "🗑️ <b>Cache de configuración limpiado exitosamente.</b>\n\nLa próxima consulta obtendrá datos frescos del backend."
    );
  } catch (error) {
    console.error("Error en handleLimpiarCache:", error);
    await bot.sendMessage(
      chatId,
      "❌ Error limpiando el cache de configuración."
    );
  }
}

/**
 * Comando para mostrar ayuda sobre los comandos de configuración
 */
async function handleAyudaPrecios(bot, msg) {
  const chatId = msg.chat.id;

  // Validar que el mensaje tiene la estructura esperada
  if (!msg.from || !msg.from.id) {
    console.error("Error: msg.from o msg.from.id es undefined", msg);
    await bot.sendMessage(
      chatId,
      "❌ Error interno del bot. Contacta al administrador."
    );
    return;
  }

  const userId = msg.from.id;

  try {
    // Verificar si es administrador
    if (!isAdmin(userId)) {
      await bot.sendMessage(
        chatId,
        "❌ Solo los administradores pueden usar este comando."
      );
      return;
    }

    let message = "📚 <b>AYUDA - COMANDOS DE CONFIGURACIÓN</b>\n\n";
    message += "🔍 <b>Comandos de Consulta:</b>\n\n";
    message += "📊 `/verprecios` - Ver configuración actual de precios\n";
    message += "📋 `/verhistorial` - Ver historial de cambios\n";
    message += "📈 `/vercachestats` - Ver estadísticas del cache\n";
    message += "🗑️ `/limpiarcache` - Limpiar cache de configuración\n";
    message += "❓ `/ayudaprecios` - Mostrar esta ayuda\n\n";

    message += "⚠️ <b>Nota Importante:</b>\n";
    message += "• Los comandos solo permiten consultas\n";
    message += "• Las modificaciones se realizan desde el dashboard web\n";
    message += "• El cache se actualiza automáticamente cada 5 minutos\n";
    message += "• Use `/limpiarcache` para forzar una actualización\n";

    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (error) {
    console.error("Error en handleAyudaPrecios:", error);
    await bot.sendMessage(chatId, "❌ Error mostrando ayuda de comandos.");
  }
}

/**
 * Función auxiliar para formatear moneda
 * @param {number} amount - Monto en centavos
 * @returns {string} Monto formateado
 */
function formatCurrency(amount) {
  try {
    const moneyUtils = require("../../utils/money-utils");
    return moneyUtils.formatCurrency(amount, "VES");
  } catch (error) {
    // Fallback simple si money-utils no está disponible
    return `${(amount / 100).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} Bs`;
  }
}

module.exports = {
  handleVerPrecios,
  handleVerHistorial,
  handleVerCacheStats,
  handleLimpiarCache,
  handleAyudaPrecios,
};
