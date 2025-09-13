"use strict";

const axios = require("axios");
const BOT_CONFIG = require("../../config/bot-config");
const { isAdmin, getCacheStats } = require("../../utils/helpers");
const paymentCommands = require("./admin-payment-commands");
const abandonLimitManager = require("../../utils/abandon-limits");
const { getWebAppUrl } = require("../../config/webapp-config");

// Variables de entorno
const TEST_MODE = process.env.TEST_MODE === "true" || !process.env.BACKEND_URL;

/**
 * Comando /stats - Estadísticas del sistema (solo admin)
 */
async function handleStats(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    if (!isAdmin(userId)) {
      await bot.sendMessage(
        chatId,
        "❌ No tienes permisos para usar este comando.",
        { parse_mode: "HTML" }
      );
      return;
    }

    // Obtener estadísticas del cache
    const cacheStats = getCacheStats();

    // Obtener estadísticas del backend si está disponible
    let backendStats = null;
    if (!TEST_MODE && api) {
      try {
        backendStats = await api.getSystemStats();
      } catch (error) {
        console.log(
          "Error obteniendo estadísticas del backend:",
          error.message
        );
      }
    }

    let statsMessage = `📊 <b>Estadísticas del Sistema</b>

🔧 <b>Cache:</b>
• Estrategia: ${cacheStats.strategy || "local"}
• Usuarios en cache: ${cacheStats.totalUsers || 0}
• Usuarios activos: ${cacheStats.activeUsers || 0}
• Última limpieza: ${cacheStats.lastCleanup || "N/A"}`;

    if (backendStats) {
      statsMessage += `

🌐 <b>Backend:</b>
• Total usuarios: ${backendStats.totalUsers || 0}
• Usuarios activos: ${backendStats.activeUsers || 0}
• Total salas: ${backendStats.totalRooms || 0}
• Salas activas: ${backendStats.activeRooms || 0}`;
    }

    if (TEST_MODE) {
      statsMessage += `

🧪 <b>Modo:</b> TEST (sin backend)`;
    }

    await bot.sendMessage(chatId, statsMessage, {
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("❌ Error en /stats:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error obteniendo estadísticas. Intenta de nuevo."
    );
  }
}

/**
 * Comando /token - Verificar estado del token de autenticación (solo admin)
 */
async function handleToken(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    if (!isAdmin(userId)) {
      await bot.sendMessage(
        chatId,
        "❌ No tienes permisos para usar este comando.",
        { parse_mode: "HTML" }
      );
      return;
    }

    if (TEST_MODE) {
      await bot.sendMessage(
        chatId,
        "🧪 <b>Modo TEST activo</b>\nNo hay token de autenticación en modo TEST.",
        { parse_mode: "HTML" }
      );
      return;
    }

    // Obtener información del token
    const tokenInfo = api.getTokenInfo();

    let tokenMessage = `🔐 <b>Estado del Token de Autenticación</b>

📋 <b>Información:</b>
• Válido: ${tokenInfo.valid ? "✅ Sí" : "❌ No"}
• Expira: ${
      tokenInfo.expiresAt ? tokenInfo.expiresAt.toLocaleString("es-ES") : "N/A"
    }`;

    if (tokenInfo.timeUntilExpiry) {
      const minutes = Math.round(tokenInfo.timeUntilExpiry / 60000);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      tokenMessage += `\n• Tiempo restante: ${
        hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`
      }`;
    }

    if (tokenInfo.willExpireSoon) {
      tokenMessage += `\n\n⚠️ <b>Advertencia:</b> El token expirará pronto`;
    }

    // Agregar botones de acción
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "🔄 Renovar Token",
            callback_data: "refresh_token",
          },
        ],
        [
          {
            text: "📊 Ver Estadísticas",
            callback_data: "view_stats",
          },
        ],
      ],
    };

    await bot.sendMessage(chatId, tokenMessage, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error("❌ Error en /token:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error obteniendo información del token. Intenta de nuevo."
    );
  }
}

/**
 * Comando /setwelcome - Configurar comandos del bot (solo admin)
 */
async function handleSetWelcome(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const adminId = process.env.ADMIN_ID;

  if (!isAdmin(userId)) {
    const errorMessage = `❌ <b>No tienes permisos para configurar esto.</b>

🔍 <b>Información de debug:</b>
- Tu ID: \`${userId}\`- ADMIN_ID configurado: \`${adminId}\`- Username: @${
      msg.from.username || "N/A"
    }

💡 <b>Para solucionarlo:</b>
1. Ejecuta /myid para obtener tu ID correcto
2. Actualiza ADMIN_ID en tu archivo .env
3. Reinicia el bot`;

    return bot.sendMessage(chatId, errorMessage, { parse_mode: "HTML" });
  }

  try {
    await bot.setMyCommands(BOT_CONFIG.commands);
    await bot.sendMessage(
      chatId,
      "✅ Configuración del bot actualizada correctamente."
    );
  } catch (err) {
    console.error("Error configurando bot:", err);
    await bot.sendMessage(chatId, "Error configurando el bot.");
  }
}

/**
 * Comando /setupmeta - Configurar metadatos del bot (solo admin)
 */
async function handleSetupMeta(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ Solo el administrador puede ejecutar este comando."
    );
  }

  const token = process.env.BOT_TOKEN;
  const apiUrl = `https://api.telegram.org/bot${token}`;

  // Textos sugeridos
  const shortDescription =
    "Organiza y únete a salas de juegos (Ludo, Dominó, Damas). Pulsa Iniciar para comenzar.";
  const description = [
    "Bienvenido a El Patio. Con este bot puedes:",
    "• Seleccionar un juego",
    "• Ver salas disponibles",
    "• Unirte a partidas y gestionar pagos",
    "\nPulsa Iniciar para registrarte y empezar.",
  ].join("\n");

  try {
    // 1) Short description
    await axios.post(`${apiUrl}/setMyShortDescription`, {
      short_description: shortDescription,
      language_code: "es",
    });

    // 2) Description
    await axios.post(`${apiUrl}/setMyDescription`, {
      description,
      language_code: "es",
    });

    // 3) Commands
    await bot.setMyCommands(BOT_CONFIG.commands);

    await bot.sendMessage(
      chatId,
      "✅ Metadatos configurados: descripción, short description y comandos."
    );
  } catch (err) {
    console.error(
      "Error configurando metadatos:",
      err.response?.data || err.message
    );
    await bot.sendMessage(
      chatId,
      "❌ Error configurando metadatos. Revisa el token y vuelve a intentar."
    );
  }
}

/**
 * Comando /cleanup - Limpiar configuración del bot (solo admin)
 */
async function handleCleanup(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ Solo el administrador puede ejecutar este comando."
    );
  }

  try {
    await bot.setMyCommands([]);
    await bot.sendMessage(
      chatId,
      "✅ Configuración del bot limpiada. Los comandos han sido removidos del menú."
    );
  } catch (err) {
    console.error("Error limpiando configuración:", err);
    await bot.sendMessage(chatId, "❌ Error limpiando la configuración.");
  }
}

/**
 * Comando /restore - Restaurar configuración básica (solo admin)
 */
async function handleRestore(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ Solo el administrador puede ejecutar este comando."
    );
  }

  try {
    const basicCommands = [
      { command: "start", description: "🚀 Iniciar el bot" },
      { command: "salas", description: "🎮 Ver salas disponibles" },
      { command: "ayuda", description: "❓ Ver ayuda" },
    ];

    await bot.setMyCommands(basicCommands);
    await bot.sendMessage(
      chatId,
      "✅ Configuración básica restaurada. Solo comandos esenciales disponibles."
    );
  } catch (err) {
    console.error("Error restaurando configuración:", err);
    await bot.sendMessage(chatId, "❌ Error restaurando la configuración.");
  }
}

/**
 * Comando /abandonlimits - Ver límites de abandono de un jugador (solo admin)
 * Uso: /abandonlimits <telegramId>
 */
async function handleAbandonLimits(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    if (!isAdmin(userId)) {
      await bot.sendMessage(
        chatId,
        "❌ No tienes permisos para usar este comando.",
        { parse_mode: "HTML" }
      );
      return;
    }

    // Obtener el telegramId del mensaje
    const args = msg.text.split(" ");
    if (args.length < 2) {
      await bot.sendMessage(
        chatId,
        `📋 <b>Uso del comando:</b>\n\n<code>/abandonlimits &lt;telegramId&gt;</code>\n\n💡 <b>Ejemplo:</b>\n<code>/abandonlimits 123456789</code>`,
        { parse_mode: "HTML" }
      );
      return;
    }

    const telegramId = args[1];

    // Convertir telegramId a número para que coincida con el tipo usado en la cache
    const telegramIdNumber = parseInt(telegramId);

    // Obtener estadísticas del jugador
    console.log(
      `🔍 [ABANDONLIMITS] Consultando estadísticas para usuario: ${telegramId} (convertido a número: ${telegramIdNumber})`
    );
    console.log(
      `📊 [ABANDONLIMITS] Cache del abandonLimitManager:`,
      abandonLimitManager.cache.size,
      "usuarios"
    );

    const stats = abandonLimitManager.getPlayerStats(telegramIdNumber);
    console.log(`📊 [ABANDONLIMITS] Resultado de getPlayerStats:`, stats);

    if (!stats) {
      console.log(`❌ [ABANDONLIMITS] Usuario ${telegramId} sin historial`);
      await bot.sendMessage(
        chatId,
        `ℹ️ <b>Jugador sin historial</b>\n\nEl jugador <code>${telegramId}</code> no tiene historial de abandonos registrado.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Construir mensaje de estadísticas
    let mensaje = `📊 <b>Límites de Abandono - Jugador ${telegramId}</b>\n\n`;

    mensaje += `⏰ <b>Última hora:</b> ${stats.abandonosHora}/${stats.infoAdicional.limiteHora}\n`;
    mensaje += `📅 <b>Hoy:</b> ${stats.abandonosDia}/${stats.infoAdicional.limiteDia}\n\n`;

    if (stats.bloqueado) {
      mensaje += `🚫 <b>Estado:</b> BLOQUEADO para abandonar\n`;
      mensaje += `⏰ <b>Tiempo restante:</b> ${stats.tiempoRestante} minutos\n\n`;
    } else {
      mensaje += `✅ <b>Estado:</b> Puede abandonar normalmente\n`;
      mensaje += `🔄 <b>Abandonos restantes:</b> ${stats.infoAdicional.abandonosRestantesHora} por hora, ${stats.infoAdicional.abandonosRestantesDia} por día\n\n`;
    }

    mensaje += `💡 <b>Información del Sistema:</b>\n`;
    mensaje += `• Solo cuentan los abandonos VOLUNTARIOS del jugador\n`;
    mensaje += `• NO cuentan las cancelaciones automáticas de salas\n`;
    mensaje += `• Los contadores se resetean automáticamente por tiempo`;

    await bot.sendMessage(chatId, mensaje, {
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("❌ Error en /abandonlimits:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error obteniendo límites de abandono. Intenta de nuevo."
    );
  }
}

/**
 * Comando /abandonsystem - Ver estadísticas del sistema de límites (solo admin)
 */
async function handleAbandonSystem(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    if (!isAdmin(userId)) {
      await bot.sendMessage(
        chatId,
        "❌ No tienes permisos para usar este comando.",
        { parse_mode: "HTML" }
      );
      return;
    }

    // Obtener estadísticas del sistema
    console.log(`🔍 [ABANDONSYSTEM] Consultando estadísticas del sistema`);
    console.log(
      `📊 [ABANDONSYSTEM] Cache del abandonLimitManager:`,
      abandonLimitManager.cache.size,
      "usuarios"
    );

    const systemStats = abandonLimitManager.getSystemStats();
    console.log(`📊 [ABANDONSYSTEM] Resultado de getSystemStats:`, systemStats);

    // Construir mensaje de estadísticas del sistema
    let mensaje = `📊 <b>Estadísticas del Sistema de Límites de Abandono</b>\n\n`;

    mensaje += `👥 <b>Usuarios:</b>\n`;
    mensaje += `• Total en sistema: ${systemStats.totalUsuarios}\n`;
    mensaje += `• Bloqueados actualmente: ${systemStats.usuariosBloqueados}\n\n`;

    mensaje += `📈 <b>Actividad:</b>\n`;
    mensaje += `• Total abandonos por hora: ${systemStats.totalAbandonosHora}\n`;
    mensaje += `• Total abandonos por día: ${systemStats.totalAbandonosDia}\n\n`;

    mensaje += `⚙️ <b>Configuración:</b>\n`;
    mensaje += `• Límite por hora: ${systemStats.limites.maxAbandonosPorHora} abandonos\n`;
    mensaje += `• Límite por día: ${systemStats.limites.maxAbandonosPorDia} abandonos\n\n`;

    mensaje += `💡 <b>Nota:</b> Solo se cuentan los abandonos VOLUNTARIOS de los jugadores.\n`;
    mensaje += `Las cancelaciones automáticas de salas NO afectan estos límites.`;

    await bot.sendMessage(chatId, mensaje, {
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("❌ Error en /abandonsystem:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error obteniendo estadísticas del sistema. Intenta de nuevo."
    );
  }
}

/**
 * Comando /checkabandons - Verificar estado del conteo de abandonos de un jugador (solo admin)
 * Uso: /checkabandons <telegramId>
 */
async function handleCheckAbandons(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    if (!isAdmin(userId)) {
      await bot.sendMessage(
        chatId,
        "❌ No tienes permisos para usar este comando.",
        { parse_mode: "HTML" }
      );
      return;
    }

    // Obtener el telegramId del mensaje
    const args = msg.text.split(" ");
    if (args.length < 2) {
      await bot.sendMessage(
        chatId,
        `📋 <b>Uso del comando:</b>\n\n<code>/checkabandons &lt;telegramId&gt;</code>\n\n💡 <b>Ejemplo:</b>\n<code>/checkabandons 123456789</code>\n\n🔍 <b>Función:</b> Este comando muestra el estado actual de los contadores de abandonos del jugador.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    const telegramId = args[1];

    // Convertir telegramId a número para que coincida con el tipo usado en la cache
    const telegramIdNumber = parseInt(telegramId);

    // Verificar que el jugador existe en el sistema
    console.log(
      `🔍 [CHECKABANDONS] Consultando estadísticas para usuario: ${telegramId} (convertido a número: ${telegramIdNumber})`
    );
    console.log(
      `📊 [CHECKABANDONS] Cache del abandonLimitManager:`,
      abandonLimitManager.cache.size,
      "usuarios"
    );

    const stats = abandonLimitManager.getPlayerStats(telegramIdNumber);
    console.log(`📊 [CHECKABANDONS] Resultado de getPlayerStats:`, stats);

    if (!stats) {
      console.log(`❌ [CHECKABANDONS] Usuario ${telegramId} sin historial`);
      await bot.sendMessage(
        chatId,
        `ℹ️ <b>Jugador sin historial</b>\n\nEl jugador <code>${telegramId}</code> no tiene historial de abandonos registrado.\n\n✅ <b>Estado:</b> Libre para abandonar salas`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Mostrar estado actual del jugador
    let mensajeEstado = `📊 <b>Estado de Abandonos del Jugador</b>\n\n`;
    mensajeEstado += `👤 <b>ID de Telegram:</b> <code>${telegramId}</code>\n\n`;

    // Información del jugador desde el backend si está disponible
    if (!TEST_MODE && api) {
      try {
        const jugador = await api.findPlayerByTelegram(telegramIdNumber);
        if (jugador) {
          mensajeEstado += `👤 <b>Nombre:</b> ${
            jugador.nickname || jugador.displayName || "Sin nombre"
          }\n`;
          mensajeEstado += `📧 <b>Email:</b> ${
            jugador.email || "No registrado"
          }\n\n`;
        }
      } catch (error) {
        console.log("Error obteniendo información del jugador:", error.message);
      }
    }

    mensajeEstado += `📊 <b>Contadores de Abandonos:</b>\n`;
    mensajeEstado += `• 🕐 <b>Por hora:</b> ${stats.abandonosHora}/3\n`;
    mensajeEstado += `• 📅 <b>Por día:</b> ${stats.abandonosDia}/8\n\n`;

    mensajeEstado += `🔒 <b>Estado del Sistema:</b>\n`;
    if (stats.bloqueado) {
      mensajeEstado += `• Estado: 🚫 <b>BLOQUEADO</b>\n`;
      mensajeEstado += `• ⏰ <b>Tiempo restante:</b> ${stats.tiempoRestante} minutos\n`;
      mensajeEstado += `• 🚨 <b>Razón:</b> Límite de abandonos excedido\n\n`;

      // Calcular tiempo de desbloqueo
      const minutosRestantes = stats.tiempoRestante;
      const horas = Math.floor(minutosRestantes / 60);
      const minutos = minutosRestantes % 60;

      if (horas > 0) {
        mensajeEstado += `⏳ <b>Desbloqueo en:</b> ${horas}h ${minutos}m\n\n`;
      } else {
        mensajeEstado += `⏳ <b>Desbloqueo en:</b> ${minutos}m\n\n`;
      }
    } else {
      mensajeEstado += `• Estado: ✅ <b>LIBRE</b>\n`;
      mensajeEstado += `• 🎯 <b>Puede abandonar:</b> ${
        3 - stats.abandonosHora
      } veces más en la próxima hora\n`;
      mensajeEstado += `• 🎯 <b>Puede abandonar:</b> ${
        8 - stats.abandonosDia
      } veces más hoy\n\n`;
    }

    // Información adicional del sistema
    mensajeEstado += `ℹ️ <b>Información del Sistema:</b>\n`;
    mensajeEstado += `• Límite por hora: 3 abandonos\n`;
    mensajeEstado += `• Límite por día: 8 abandonos\n`;
    mensajeEstado += `• Duración del bloqueo: 1 hora\n`;
    mensajeEstado += `• Sistema: ${
      TEST_MODE ? "🧪 Modo de prueba" : "🌐 Conectado al backend"
    }`;

    await bot.sendMessage(chatId, mensajeEstado, {
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("❌ Error en /checkabandons:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error obteniendo el estado de abandonos. Intenta de nuevo."
    );
  }
}

/**
 * Comando /debug-webapp - Verificar configuración de Mini Apps (solo admin)
 */
async function handleDebugWebapp(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    if (!isAdmin(userId)) {
      await bot.sendMessage(
        chatId,
        "❌ No tienes permisos para usar este comando.",
        { parse_mode: "HTML" }
      );
      return;
    }

    // Obtener URLs de las Mini Apps
    const depositoUrl = getWebAppUrl("DEPOSITO");
    const retiroUrl = getWebAppUrl("RETIRO");
    const salasUrl = getWebAppUrl("SALAS");
    const configUrl = getWebAppUrl("CONFIG");

    await bot.sendMessage(
      chatId,
      `🔧 <b>Debug - Configuración Mini Apps</b>

📱 <b>URLs de las Mini Apps:</b>
• 💳 <b>Depósito:</b> <code>${depositoUrl}</code>
• 💸 <b>Retiro:</b> <code>${retiroUrl}</code>
• 🎮 <b>Salas:</b> <code>${salasUrl}</code>
• ⚙️ <b>Configuración:</b> <code>${configUrl}</code>

🌐 <b>Entorno:</b> <code>${process.env.NODE_ENV || "development"}</code>
⏰ <b>Timestamp:</b> <code>${new Date().toISOString()}</code>

💡 <b>Para probar:</b> Ve a Perfil → Hacer depósito`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ <b>Error en configuración:</b> <code>${error.message}</code>`,
      { parse_mode: "HTML" }
    );
  }
}

/**
 * Comando /resetabandons - Resetear contadores de abandonos de un jugador (solo admin)
 * Uso: /resetabandons <telegramId>
 */
async function handleResetAbandons(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    if (!isAdmin(userId)) {
      await bot.sendMessage(
        chatId,
        "❌ No tienes permisos para usar este comando.",
        { parse_mode: "HTML" }
      );
      return;
    }

    // Obtener el telegramId del mensaje
    const args = msg.text.split(" ");
    if (args.length < 2) {
      await bot.sendMessage(
        chatId,
        `📋 <b>Uso del comando:</b>\n\n<code>/resetabandons &lt;telegramId&gt;</code>\n\n💡 <b>Ejemplo:</b>\n<code>/resetabandons 123456789</code>\n\n⚠️ <b>Advertencia:</b> Este comando reseteará TODOS los contadores de abandonos del jugador.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    const telegramId = args[1];

    // Convertir telegramId a número para que coincida con el tipo usado en la cache
    const telegramIdNumber = parseInt(telegramId);

    // Verificar que el jugador existe en el sistema
    console.log(
      `🔍 [RESETABANDONS] Consultando estadísticas para usuario: ${telegramId} (convertido a número: ${telegramIdNumber})`
    );
    console.log(
      `📊 [RESETABANDONS] Cache del abandonLimitManager:`,
      abandonLimitManager.cache.size,
      "usuarios"
    );

    const statsAntes = abandonLimitManager.getPlayerStats(telegramIdNumber);
    console.log(`📊 [RESETABANDONS] Resultado de getPlayerStats:`, statsAntes);

    if (!statsAntes) {
      console.log(`❌ [RESETABANDONS] Usuario ${telegramId} sin historial`);
      await bot.sendMessage(
        chatId,
        `ℹ️ <b>Jugador sin historial</b>\n\nEl jugador <code>${telegramId}</code> no tiene historial de abandonos registrado.\n\nNo es necesario resetear contadores.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Mostrar estado actual antes del reset
    let mensajeConfirmacion = `🔄 <b>Confirmación de Reset de Contadores</b>\n\n`;
    mensajeConfirmacion += `👤 <b>Jugador:</b> <code>${telegramId}</code>\n\n`;
    mensajeConfirmacion += `📊 <b>Estado actual:</b>\n`;
    mensajeConfirmacion += `• Abandonos por hora: ${statsAntes.abandonosHora}/3\n`;
    mensajeConfirmacion += `• Abandonos por día: ${statsAntes.abandonosDia}/8\n`;
    mensajeConfirmacion += `• Estado: ${
      statsAntes.bloqueado ? "🚫 BLOQUEADO" : "✅ LIBRE"
    }\n\n`;

    if (statsAntes.bloqueado) {
      mensajeConfirmacion += `⏰ <b>Tiempo restante hasta desbloqueo:</b> ${statsAntes.tiempoRestante} minutos\n\n`;
    }

    mensajeConfirmacion += `⚠️ <b>¿Estás seguro de que quieres resetear TODOS los contadores?</b>\n\n`;
    mensajeConfirmacion += `💡 <b>Después del reset:</b>\n`;
    mensajeConfirmacion += `• El jugador podrá abandonar salas normalmente\n`;
    mensajeConfirmacion += `• Todos los contadores se reiniciarán a 0\n`;
    mensajeConfirmacion += `• El bloqueo se eliminará inmediatamente`;

    // Crear teclado de confirmación
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "✅ Sí, Resetear Contadores",
            callback_data: `reset_abandons:${telegramIdNumber}`,
          },
        ],
        [
          {
            text: "❌ Cancelar",
            callback_data: "cancel_reset_abandons",
          },
        ],
      ],
    };

    await bot.sendMessage(chatId, mensajeConfirmacion, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error("❌ Error en /resetabandons:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error procesando el comando. Intenta de nuevo."
    );
  }
}

module.exports = {
  handleStats,
  handleToken,
  handleSetWelcome,
  handleSetupMeta,
  handleCleanup,
  handleRestore,
  handleAbandonLimits,
  handleAbandonSystem,
  handleCheckAbandons,
  handleResetAbandons,
  handleDebugWebapp,
  // Comandos de consulta de configuración de precios
  handleVerPrecios: paymentCommands.handleVerPrecios,
  handleVerHistorial: paymentCommands.handleVerHistorial,
  handleVerCacheStats: paymentCommands.handleVerCacheStats,
  handleLimpiarCache: paymentCommands.handleLimpiarCache,
  handleAyudaPrecios: paymentCommands.handleAyudaPrecios,
};
