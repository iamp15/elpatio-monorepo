"use strict";

const BOT_CONFIG = require("../../config/bot-config");
const userStateManager = require("../../user-state");
const {
  validateNickname,
  generateNicknameSuggestions,
} = require("../../utils/nickname-validator");
const NicknameLimitManager = require("../../utils/nickname-limit-manager");

/**
 * Maneja el registro de nickname
 */
async function handleNicknameRegistration(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const nickname = msg.text.trim();

  try {
    // Validar formato del nickname
    const validationResult = validateNickname(nickname);
    if (!validationResult.valid) {
      const suggestions = generateNicknameSuggestions(nickname);
      await bot.sendMessage(
        chatId,
        `❌ <b>${validationResult.error}</b>

💡 <b>Sugerencias:</b> ${suggestions.join(", ")}

📝 Intenta de nuevo:`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Verificar disponibilidad en el backend
    const isAvailable = await api.checkNicknameAvailability(nickname);
    if (!isAvailable) {
      const suggestions = generateNicknameSuggestions(nickname);
      await bot.sendMessage(
        chatId,
        `❌ <b>El nickname "${nickname}" ya está en uso.</b>

💡 <b>Sugerencias:</b> ${suggestions.join(", ")}

📝 Intenta con otro nickname:`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Registrar jugador con el nickname validado
    const username = msg.from.username || `user_${userId}`;
    const firstName = msg.from.first_name || "Jugador";
    const validatedNickname = validationResult.nickname;

    const jugador = await api.createPlayer({
      telegramId: String(userId),
      username,
      nickname: validatedNickname,
      firstName,
    });

    // Limpiar estado y guardar display name en cache
    userStateManager.clearState(userId);

    // Guardar el display name en el cache usando el servicio
    const cacheService = require("../../utils/cache-service");
    await cacheService.setDisplayName(userId, validatedNickname);

    const welcomeMessage = BOT_CONFIG.messages.start(validatedNickname);
    await bot.sendMessage(
      chatId,
      `✅ <b>¡Registro exitoso!</b> Tu nickname es: <i>${validatedNickname}</i>`,
      { parse_mode: "HTML" }
    );
    await bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: BOT_CONFIG.customKeyboard,
      parse_mode: "HTML",
    });

    console.log(`✅ Nuevo jugador registrado: ${validatedNickname} (${userId})`);
  } catch (err) {
    console.error("❌ Error registrando nickname:", err.message);

    let errorMessage = "❌ Error registrando tu nickname.";

    if (err.response?.data?.error) {
      errorMessage += `\n\nDetalles: ${err.response.data.error}`;
    } else if (err.message) {
      errorMessage += `\n\nError: ${err.message}`;
    }

    await bot.sendMessage(chatId, errorMessage);
  }
}

/**
 * Maneja el registro con nombre de Telegram (-no)
 */
async function handleTelegramNameRegistration(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const telegramName = msg.from.first_name || "Jugador";

  try {
    const username = msg.from.username || `user_${userId}`;
    const jugador = await api.createPlayer({
      telegramId: String(userId),
      username,
      nickname: `SIN_NICKNAME_${userId}`, // Unique value for "no nickname"
      firstName: telegramName, // Store Telegram's first name
    });

    // Limpiar estado y guardar display name en cache
    userStateManager.clearState(userId);

    // Guardar el display name en el cache usando el servicio
    const cacheService = require("../../utils/cache-service");
    await cacheService.setDisplayName(userId, telegramName);

    const welcomeMessage = BOT_CONFIG.messages.start(telegramName);
    await bot.sendMessage(
      chatId,
      `✅ <b>¡Registro exitoso!</b> Te llamaremos por tu nombre: <i>${telegramName}</i>`,
      { parse_mode: "HTML" }
    );
    await bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: BOT_CONFIG.customKeyboard,
      parse_mode: "HTML",
    });

    console.log(`✅ Nuevo jugador registrado con nombre de Telegram: ${telegramName} (${userId})`);
  } catch (err) {
    console.error("❌ Error registrando con nombre de Telegram:", err.message);

    let errorMessage = "❌ Error registrando tu usuario.";

    if (err.response?.data?.error) {
      errorMessage += `\n\nDetalles: ${err.response.data.error}`;
    } else if (err.message) {
      errorMessage += `\n\nError: ${err.message}`;
    }

    await bot.sendMessage(chatId, errorMessage);
  }
}

/**
 * Maneja el cambio de nickname con verificación de límites
 */
async function handleNicknameChange(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const nickname = msg.text.trim();

  try {
    // Inicializar gestor de límites
    const limitManager = new NicknameLimitManager();

    // Verificar si puede cambiar nickname
    const limitCheck = await limitManager.canChangeNickname(String(userId));

    if (!limitCheck.canChange) {
      await bot.sendMessage(
        chatId,
        `⏰ <b>Límite de cambio alcanzado</b>

${limitCheck.message}

🔄 <b>Próximo reset:</b> ${limitCheck.nextReset.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}

💡 <b>Tip:</b> Los límites se resetean cada lunes a las 00:00`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Validar formato del nickname
    const validationResult = validateNickname(nickname);
    if (!validationResult.valid) {
      const suggestions = generateNicknameSuggestions(nickname);
      await bot.sendMessage(
        chatId,
        `❌ <b>${validationResult.error}</b>

💡 <b>Sugerencias:</b> ${suggestions.join(", ")}

📝 Intenta de nuevo:`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Verificar disponibilidad en el backend
    const isAvailable = await api.checkNicknameAvailability(nickname);
    if (!isAvailable) {
      const suggestions = generateNicknameSuggestions(nickname);
      await bot.sendMessage(
        chatId,
        `❌ <b>El nickname "${nickname}" ya está en uso.</b>

💡 <b>Sugerencias:</b> ${suggestions.join(", ")}

📝 Intenta con otro nickname:`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Actualizar nickname en el backend
    const validatedNickname = validationResult.nickname;
    await api.updatePlayerNickname(String(userId), validatedNickname);

    // Registrar el cambio en el sistema de límites
    await limitManager.recordNicknameChange(String(userId));

    // Limpiar estado y actualizar display name en cache
    userStateManager.clearState(userId);

    // Actualizar el display name en el cache usando el servicio
    const cacheService = require("../../utils/cache-service");
    await cacheService.setDisplayName(userId, validatedNickname);

    await bot.sendMessage(
      chatId,
      `✅ <b>¡Nickname actualizado!</b> Tu nuevo nickname es: <i>${validatedNickname}</i>

💡 <b>Recuerda:</b> Puedes cambiar tu nickname 1 vez por semana. El próximo reset será el lunes.`,
      { parse_mode: "HTML" }
    );

    console.log(`✅ Nickname actualizado: ${validatedNickname} (${userId}) - Límites aplicados`);
  } catch (err) {
    console.error("❌ Error actualizando nickname:", err.message);

    let errorMessage = "❌ Error actualizando tu nickname.";

    if (err.response?.data?.error) {
      errorMessage += `\n\nDetalles: ${err.response.data.error}`;
    } else if (err.message) {
      errorMessage += `\n\nError: ${err.message}`;
    }

    await bot.sendMessage(chatId, errorMessage);
  }
}

module.exports = {
  handleNicknameRegistration,
  handleTelegramNameRegistration,
  handleNicknameChange,
};
