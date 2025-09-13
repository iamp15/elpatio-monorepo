"use strict";

const fs = require("fs");
const path = require("path");
const BOT_CONFIG = require("../../config/bot-config");
const userStateManager = require("../../user-state");
const { getUserDisplayName, getGameName } = require("../../utils/helpers");

// Variables de entorno
const TEST_MODE = process.env.TEST_MODE === "true" || !process.env.BACKEND_URL;
const BOT_LOGO_URL = process.env.BOT_LOGO_URL || "";

/**
 * Comando /start - Registro automático y bienvenida
 */
async function handleStart(bot, api, msg) {
  const chatId = msg.chat.id;
  const nombre = msg.from.first_name || "Jugador";
  const userId = msg.from.id;

  try {
    let jugador = null;

    // Verificar si el usuario ya está registrado
    if (!TEST_MODE) {
      try {
        jugador = await api.findPlayerByTelegram(String(userId));
      } catch (err) {
        console.error("❌ Error buscando jugador:", err.message);
      }
    }

    // Si no está registrado, pedir nickname
    if (!TEST_MODE && !jugador) {
      userStateManager.setState(userId, { waitingForNickname: true });
      await bot.sendMessage(
        chatId,
        `👋 ¡Hola ${nombre}! Bienvenido a El Patio 🎮

Para comenzar, necesito que elijas un nickname para jugar.

📋 <b>Reglas para tu nickname:</b>
• Entre 3 y 32 caracteres
• Una sola palabra (sin espacios)
• Solo letras (incluyendo ñ), números, guiones (-) y guiones bajos (_)
• Debe contener al menos una letra
• No puede empezar o terminar con guión
• Palabras apropiadas únicamente

💡 <b>Alternativa:</b> Si prefieres usar tu nombre de Telegram, escribe "-no"

📝 Envíame tu nickname:`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Usuario ya registrado o en modo TEST - mostrar bienvenida
    // Usar display name del estado o obtenerlo del backend
    const displayName = await getUserDisplayName(api, msg.from);

    // Verificar si el usuario ya tiene un juego seleccionado
    const selectedGame = userStateManager.getSelectedGame(userId);
    let welcomeMessage = BOT_CONFIG.messages.start(displayName);

    // Si tiene un juego seleccionado, informar al usuario
    if (selectedGame) {
      const gameName = getGameName(selectedGame);
      welcomeMessage += `\n\n🎮 <b>Juego seleccionado:</b> ${gameName}\n💡 Usa el botón "Seleccionar Juego" si deseas cambiar de juego.`;
    }

    const keyboardOptions = {
      reply_markup: BOT_CONFIG.customKeyboard,
      parse_mode: "HTML",
    };

    // Intentar enviar logo como foto con caption
    const localLogoPath = path.join(
      __dirname,
      "..",
      "..",
      "assets",
      "logo.png"
    );
    if (BOT_LOGO_URL) {
      await bot.sendPhoto(chatId, BOT_LOGO_URL, {
        caption: welcomeMessage,
        ...keyboardOptions,
      });
    } else if (fs.existsSync(localLogoPath)) {
      try {
        await bot.sendPhoto(chatId, localLogoPath, {
          caption: welcomeMessage,
          ...keyboardOptions,
        });
      } catch (photoErr) {
        console.error("❌ Error enviando foto:", photoErr.message);
        // Si falla la foto, enviar solo texto
        await bot.sendMessage(chatId, welcomeMessage, keyboardOptions);
      }
    } else {
      await bot.sendMessage(chatId, welcomeMessage, keyboardOptions);
    }

    if (jugador) {
      console.log(
        `✅ Usuario existente: ${
          jugador.nombreCompleto || jugador.username
        } (${userId})`
      );
    } else {
      console.log(`✅ Usuario en modo TEST: ${nombre} (${userId})`);
    }
  } catch (err) {
    console.error("❌ Error en /start:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error iniciando el bot. Intenta de nuevo o contacta al admin."
    );
  }
}

/**
 * Comando /ayuda - Mostrar ayuda
 */
async function handleAyuda(bot, api, msg) {
  const chatId = msg.chat.id;

  try {
    await bot.sendMessage(chatId, BOT_CONFIG.messages.help, {
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("❌ Error en /ayuda:", err.message);
    await bot.sendMessage(
      chatId,
      "❌ Error mostrando ayuda. Intenta de nuevo."
    );
  }
}

module.exports = {
  handleStart,
  handleAyuda,
};
