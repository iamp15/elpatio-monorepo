"use strict";

const BOT_CONFIG = require("../../config/bot-config");
const userStateManager = require("../../user-state");
const { registerOrFindPlayer } = require("../../utils/helpers");

// Variables de entorno
const TEST_MODE = process.env.TEST_MODE === "true" || !process.env.BACKEND_URL;

/**
 * Maneja la validación del nombre de sala y muestra confirmación de precio
 */
async function handleCreateSalaFinal(bot, api, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const nombreSala = msg.text.trim();

  try {
    // Validar nombre de sala
    if (!nombreSala || nombreSala.length < 3) {
      await bot.sendMessage(
        chatId,
        "❌ <b>Nombre de sala inválido</b>\n\nEl nombre debe tener al menos 3 caracteres.\n\n📝 Intenta de nuevo:",
        { parse_mode: "HTML" }
      );
      return;
    }

    if (nombreSala.length > 100) {
      await bot.sendMessage(
        chatId,
        "❌ <b>Nombre de sala muy largo</b>\n\nEl nombre debe tener máximo 100 caracteres.\n\n📝 Intenta de nuevo:",
        { parse_mode: "HTML" }
      );
      return;
    }

    // Obtener datos de la sala en creación
    const userState = userStateManager.getState(userId);
    const salaEnCreacion = userState.creatingSala;

    if (!salaEnCreacion) {
      await bot.sendMessage(
        chatId,
        "❌ <b>Error en el proceso</b>\n\nNo se encontraron datos de la sala en creación. Intenta crear la sala nuevamente.",
        { parse_mode: "HTML" }
      );
      return;
    }

    const { modo, juego } = salaEnCreacion;
    const juegoConfig = BOT_CONFIG.juegos.find((j) => j.id === juego);

    if (!juegoConfig) {
      await bot.sendMessage(
        chatId,
        "❌ <b>Juego no encontrado</b>\n\nEl juego seleccionado ya no está disponible.",
        { parse_mode: "HTML" }
      );
      return;
    }

    // Importar PaymentConfigManager para obtener precios del backend
    const PaymentConfigManager = require("../../utils/payment-config-manager");
    const moneyUtils = require("../../utils/money-utils");

    // Crear instancia del PaymentConfigManager
    const paymentConfigManager = new PaymentConfigManager(api);

    // Obtener precio de entrada desde el backend
    let precioEntrada = 0;
    let premioCalculado = 0;

    try {
      // Obtener precio de entrada según el modo de la sala
      precioEntrada = await paymentConfigManager.getGamePrice(juego, modo);

      // Obtener el límite de jugadores para calcular el premio
      const limiteJugadores = juegoConfig.modos[modo]?.limiteJugadores || 4;

      // Calcular premio usando la función calculatePrize
      const prizeInfo = await paymentConfigManager.calculatePrize(
        precioEntrada,
        limiteJugadores
      );
      if (prizeInfo) {
        premioCalculado = prizeInfo.winnerPrize;
      }
    } catch (error) {
      console.log(
        `Error obteniendo precios para sala ${juego}/${modo}:`,
        error.message
      );
      // Usar valores por defecto si hay error
      precioEntrada = 5000; // 50 Bs por defecto
      premioCalculado = 20000; // 200 Bs por defecto
    }

    // Formatear precios para mostrar en el mensaje
    const entradaFormateada = moneyUtils.formatCurrency(precioEntrada, "VES");
    const premioFormateado = moneyUtils.formatCurrency(premioCalculado, "VES");

    // Actualizar el estado con el nombre de la sala y precios
    userStateManager.setState(userId, {
      ...userState,
      creatingSala: {
        ...salaEnCreacion,
        nombre: nombreSala,
        precioEntrada: precioEntrada,
        premioCalculado: premioCalculado,
        waitingForConfirmation: true,
      },
    });

    // Mostrar mensaje de confirmación con precio
    await mostrarConfirmacionPrecio(bot, chatId, {
      nombreSala,
      juegoConfig,
      modo,
      entradaFormateada,
      premioFormateado,
      precioEntrada,
    });
  } catch (err) {
    console.error("❌ Error validando nombre de sala:", err.message);

    // Limpiar estado en caso de error
    userStateManager.setState(userId, {
      ...userStateManager.getState(userId),
      creatingSala: null,
    });

    await bot.sendMessage(
      chatId,
      "❌ <b>Error procesando nombre de sala</b>\n\nHubo un problema al validar el nombre. Intenta de nuevo o contacta al admin.",
      { parse_mode: "HTML" }
    );
  }
}

/**
 * Muestra el mensaje de confirmación con el precio de entrada
 */
async function mostrarConfirmacionPrecio(
  bot,
  chatId,
  {
    nombreSala,
    juegoConfig,
    modo,
    entradaFormateada,
    premioFormateado,
    precioEntrada,
  }
) {
  const mensajeConfirmacion = `💰 <b>Confirmación de Precio de Entrada</b>

🏗️ <b>Sala:</b> ${nombreSala}
🎮 <b>Juego:</b> ${juegoConfig.nombre}
⚔️ <b>Modo:</b> ${juegoConfig.modos[modo]?.nombre || modo}
🏆 <b>Premio:</b> ${premioFormateado}

💳 <b>Precio de entrada:</b> ${entradaFormateada}

⚠️ <b>IMPORTANTE:</b>
• Se te cobrará ${entradaFormateada} al crear la sala
• El cobro se aplicará inmediatamente
• Asegúrate de tener saldo suficiente
• No podrás cancelar después de confirmar

¿Deseas continuar con la creación de la sala?`;

  const inlineKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Sí, crear sala", callback_data: "confirm_create_sala" },
          { text: "❌ Cancelar", callback_data: "cancel_create_sala" },
        ],
        [
          {
            text: "💰 Ver mi saldo",
            callback_data: "check_balance_before_create",
          },
        ],
      ],
    },
  };

  await bot.sendMessage(chatId, mensajeConfirmacion, {
    parse_mode: "HTML",
    ...inlineKeyboard,
  });
}

/**
 * Maneja la confirmación final de creación de sala
 */
async function handleConfirmCreateSala(bot, api, callbackQuery) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;
  const userId = from.id;

  try {
    // Obtener datos de la sala en creación
    const userState = userStateManager.getState(userId);
    const salaEnCreacion = userState.creatingSala;

    if (!salaEnCreacion || !salaEnCreacion.waitingForConfirmation) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ No hay sala pendiente de confirmación",
      });
      return;
    }

    const { nombre, juego, modo, precioEntrada, premioCalculado } =
      salaEnCreacion;
    const juegoConfig = BOT_CONFIG.juegos.find((j) => j.id === juego);

    if (!juegoConfig) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Juego no encontrado",
      });
      return;
    }

    // Configuración para la sala con precios del backend
    const configuracion = {
      entrada: precioEntrada,
      premio: premioCalculado,
    };

    // Crear la sala en el backend
    const salaData = {
      nombre,
      juego,
      modo,
      configuracion,
    };

    let salaCreada;
    let cobroInfo = null;

    if (TEST_MODE) {
      // Simular creación en modo TEST
      salaCreada = {
        _id: `sala_test_${Date.now()}`,
        ...salaData,
        jugadores: [{ id: userId }],
        estado: "esperando",
        creadaEn: new Date(),
      };
      // Simular información de cobro en modo TEST
      cobroInfo = {
        cobroAplicado: precioEntrada > 0,
        montoCobrado: precioEntrada,
        saldoAnterior: 100000, // Simular saldo
        saldoNuevo: 100000 - precioEntrada,
      };
    } else {
      // Crear en el backend real
      // Primero obtener o crear el jugador
      const jugador = await registerOrFindPlayer(api, from);

      // Agregar el ID del jugador creador a los datos de la sala
      salaData.jugadorCreador = jugador._id || jugador.id;

      const response = await api.createSala(salaData);
      salaCreada = response.sala || response;

      // Extraer información del cobro de la respuesta
      cobroInfo = {
        cobroAplicado: response.cobroAplicado || false,
        montoCobrado: response.montoCobrado || 0,
        saldoAnterior: response.saldoAnterior || null,
        saldoNuevo: response.saldoNuevo || null,
      };
    }

    // Limpiar estado de creación
    userStateManager.setState(userId, {
      ...userState,
      creatingSala: null,
    });

    // Mensaje de confirmación con botón para ver salas
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🏠 Ver Salas",
              callback_data: `ver_salas_after_create:${juego}`,
            },
          ],
        ],
      },
    };

    // Formatear precios para mostrar en el mensaje
    const moneyUtils = require("../../utils/money-utils");
    const entradaFormateada = moneyUtils.formatCurrency(
      configuracion.entrada,
      "VES"
    );
    const premioFormateado = moneyUtils.formatCurrency(
      configuracion.premio,
      "VES"
    );

    // Construir mensaje base
    let mensajeConfirmacion = `✅ <b>¡Sala creada exitosamente!</b>

🏗️ <b>Sala:</b> ${salaCreada.nombre}
🎮 <b>Juego:</b> ${juegoConfig.nombre}
⚔️ <b>Modo:</b> ${juegoConfig.modos[modo]?.nombre || modo}
💰 <b>Entrada:</b> ${entradaFormateada}
🏆 <b>Premio:</b> ${premioFormateado}`;

    // Agregar información del cobro si se aplicó
    if (cobroInfo && cobroInfo.cobroAplicado) {
      const montoCobradoFormateado = moneyUtils.formatCurrency(
        cobroInfo.montoCobrado,
        "VES"
      );
      const saldoAnteriorFormateado = moneyUtils.formatCurrency(
        cobroInfo.saldoAnterior,
        "VES"
      );
      const saldoNuevoFormateado = moneyUtils.formatCurrency(
        cobroInfo.saldoNuevo,
        "VES"
      );

      mensajeConfirmacion += `

💳 <b>Cobro de entrada aplicado:</b>
• <b>Monto cobrado:</b> ${montoCobradoFormateado}
• <b>Saldo anterior:</b> ${saldoAnteriorFormateado}
• <b>Saldo actual:</b> ${saldoNuevoFormateado}`;
    }

    mensajeConfirmacion += `

📋 <b>Próximos pasos:</b>
• Ya estás en la sala como creador
• Otros jugadores pueden unirse
• ¡Disfruta tu partida!`;

    await bot.sendMessage(chatId, mensajeConfirmacion, {
      parse_mode: "HTML",
      ...inlineKeyboard,
    });

    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "✅ Sala creada exitosamente",
    });
  } catch (err) {
    console.error("❌ Error creando sala:", err.response?.data || err.message);

    // Limpiar estado en caso de error
    userStateManager.setState(userId, {
      ...userStateManager.getState(userId),
      creatingSala: null,
    });

    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Error creando sala",
    });

    // Manejar errores específicos del backend
    const errorData = err.response?.data || err.message;
    if (errorData && typeof errorData === "object" && errorData.mensaje) {
      const mensaje = errorData.mensaje;

      // Errores específicos de validación para crear sala
      if (
        mensaje.includes("No puedes crear una sala mientras estás jugando") ||
        (mensaje.includes("estás jugando") && mensaje.includes("crear"))
      ) {
        await bot.sendMessage(
          chatId,
          `❌ <b>No puedes crear una sala mientras estás jugando</b>

🎮 <b>Estado actual:</b> Jugando
👤 <b>Jugador:</b> ${from.first_name || from.username || "Jugador"}

💡 <b>Solución:</b> 
• Termina tu partida actual
• O espera a que termine automáticamente
• Luego podrás crear una nueva sala`,
          { parse_mode: "HTML" }
        );
      } else if (mensaje.includes("Saldo insuficiente para crear la sala")) {
        // Manejar error de saldo insuficiente
        const saldoActual = errorData.saldoActual || 0;
        const montoRequerido = errorData.montoRequerido || 0;

        const moneyUtils = require("../../utils/money-utils");
        const saldoFormateado = moneyUtils.formatCurrency(saldoActual, "VES");
        const montoFormateado = moneyUtils.formatCurrency(
          montoRequerido,
          "VES"
        );
        const diferencia = montoRequerido - saldoActual;
        const diferenciaFormateada = moneyUtils.formatCurrency(
          diferencia,
          "VES"
        );

        await bot.sendMessage(
          chatId,
          `❌ <b>Saldo insuficiente para crear la sala</b>

💰 <b>Información de saldo:</b>
• <b>Saldo actual:</b> ${saldoFormateado}
• <b>Entrada requerida:</b> ${montoFormateado}
• <b>Falta:</b> ${diferenciaFormateada}

💡 <b>Soluciones:</b>
• Recarga tu saldo en el bot
• Usa el comando /recargar para agregar fondos
• Contacta a un administrador para recarga manual

🔄 <b>Una vez que tengas saldo suficiente:</b>
• Intenta crear la sala nuevamente
• El cobro se aplicará automáticamente`,
          { parse_mode: "HTML" }
        );
      } else if (mensaje.includes("Ya tienes una sala creada de modo")) {
        await bot.sendMessage(
          chatId,
          `❌ <b>Límite de creación alcanzado</b>\n\n${mensaje}\n\n💡 <b>Solución:</b> Debes cancelar la sala existente antes de crear otra del mismo modo.`
        );
      } else if (mensaje.includes("Ya tienes 2 salas creadas")) {
        await bot.sendMessage(
          chatId,
          `❌ <b>Límite de creación alcanzado</b>\n\n${mensaje}\n\n💡 <b>Solución:</b> Debes cancelar una sala antes de crear otra.`
        );
      } else if (
        mensaje.includes("Ya hay 5 salas de") &&
        mensaje.includes("esperando jugadores")
      ) {
        await bot.sendMessage(
          chatId,
          `❌ <b>Límite de salas alcanzado</b>\n\n${mensaje}\n\n💡 <b>Solución:</b> Intenta crear una sala de otro modo o espera a que se complete una sala existente.`
        );
      } else {
        // Otros errores específicos del backend
        await bot.sendMessage(
          chatId,
          `❌ <b>Error creando la sala</b>\n\n${mensaje}`
        );
      }
    } else {
      // Error genérico
      await bot.sendMessage(
        chatId,
        "❌ <b>Error creando la sala</b>\n\nHubo un problema al crear la sala. Intenta de nuevo o contacta al admin.",
        { parse_mode: "HTML" }
      );
    }
  }
}

/**
 * Maneja la cancelación de creación de sala
 */
async function handleCancelCreateSala(bot, api, callbackQuery) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;
  const userId = from.id;

  try {
    // Limpiar estado de creación
    userStateManager.setState(userId, {
      ...userStateManager.getState(userId),
      creatingSala: null,
    });

    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Creación de sala cancelada",
    });

    await bot.sendMessage(
      chatId,
      `❌ <b>Creación de sala cancelada</b>

🛡️ <b>No se ha creado ninguna sala</b>
• No se ha aplicado ningún cobro
• Puedes crear una nueva sala cuando quieras
• Usa /crear para comenzar de nuevo

🎮 <b>¿Qué puedes hacer ahora?</b>
• /crear - Crear una nueva sala
• /salas - Ver salas disponibles
• /mip - Ver tu perfil`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("❌ Error cancelando creación de sala:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Error cancelando",
    });
  }
}

/**
 * Maneja la verificación de saldo antes de crear sala
 */
async function handleCheckBalanceBeforeCreate(bot, api, callbackQuery) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;
  const userId = from.id;

  try {
    // Obtener datos de la sala en creación
    const userState = userStateManager.getState(userId);
    const salaEnCreacion = userState.creatingSala;

    if (!salaEnCreacion || !salaEnCreacion.waitingForConfirmation) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ No hay sala pendiente de confirmación",
      });
      return;
    }

    let saldo = 0;
    let displayName = from.first_name || "Jugador";

    // Obtener saldo del jugador
    if (!TEST_MODE) {
      try {
        const jugador = await api.findPlayerByTelegram(String(userId));
        if (jugador) {
          displayName =
            jugador.nickname ||
            jugador.firstName ||
            jugador.username ||
            displayName;
          saldo = await api.getPlayerBalance(String(userId));
        }
      } catch (err) {
        console.error("❌ Error obteniendo saldo:", err.message);
      }
    } else {
      saldo = 100000; // Simular saldo en modo TEST
    }

    // Formatear saldo
    const moneyUtils = require("../../utils/money-utils");
    const saldoFormateado = moneyUtils.formatCurrency(saldo, "VES");
    const entradaFormateada = moneyUtils.formatCurrency(
      salaEnCreacion.precioEntrada,
      "VES"
    );
    const diferencia = saldo - salaEnCreacion.precioEntrada;
    const diferenciaFormateada = moneyUtils.formatCurrency(diferencia, "VES");

    const mensajeSaldo = `💰 <b>Tu Saldo Actual</b>

👤 <b>Jugador:</b> ${displayName}
💳 <b>Saldo actual:</b> ${saldoFormateado}
🎯 <b>Entrada requerida:</b> ${entradaFormateada}
${
  diferencia >= 0
    ? `✅ <b>Saldo suficiente</b>`
    : `❌ <b>Saldo insuficiente</b>`
}
${
  diferencia >= 0
    ? `🔄 <b>Saldo restante:</b> ${diferenciaFormateada}`
    : `⚠️ <b>Falta:</b> ${diferenciaFormateada}`
}

${
  diferencia >= 0
    ? `✅ <b>Puedes crear la sala</b>\n• Tu saldo es suficiente para la entrada`
    : `❌ <b>No puedes crear la sala</b>\n• Necesitas recargar tu saldo primero`
}`;

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔄 Volver a confirmación",
              callback_data: "back_to_confirmation",
            },
          ],
          ...(diferencia < 0
            ? [
                [
                  {
                    text: "💰 Recargar saldo",
                    callback_data: "profile_deposit",
                  },
                ],
              ]
            : []),
        ],
      },
    };

    await bot.sendMessage(chatId, mensajeSaldo, {
      parse_mode: "HTML",
      ...inlineKeyboard,
    });

    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "💰 Saldo verificado",
    });
  } catch (err) {
    console.error("❌ Error verificando saldo:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Error verificando saldo",
    });
  }
}

/**
 * Maneja el regreso a la confirmación de creación de sala
 */
async function handleBackToConfirmation(bot, api, callbackQuery) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;
  const userId = from.id;

  try {
    // Obtener datos de la sala en creación
    const userState = userStateManager.getState(userId);
    const salaEnCreacion = userState.creatingSala;

    if (!salaEnCreacion || !salaEnCreacion.waitingForConfirmation) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ No hay sala pendiente de confirmación",
      });
      return;
    }

    const { nombre, juego, modo, precioEntrada, premioCalculado } =
      salaEnCreacion;
    const juegoConfig = BOT_CONFIG.juegos.find((j) => j.id === juego);

    if (!juegoConfig) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Juego no encontrado",
      });
      return;
    }

    // Formatear precios
    const moneyUtils = require("../../utils/money-utils");
    const entradaFormateada = moneyUtils.formatCurrency(precioEntrada, "VES");
    const premioFormateado = moneyUtils.formatCurrency(premioCalculado, "VES");

    // Mostrar confirmación nuevamente
    await mostrarConfirmacionPrecio(bot, chatId, {
      nombreSala: nombre,
      juegoConfig,
      modo,
      entradaFormateada,
      premioFormateado,
      precioEntrada,
    });

    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "🔄 Volviendo a confirmación",
    });
  } catch (err) {
    console.error("❌ Error volviendo a confirmación:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Error",
    });
  }
}

module.exports = {
  handleCreateSalaFinal,
  handleConfirmCreateSala,
  handleCancelCreateSala,
  handleCheckBalanceBeforeCreate,
  handleBackToConfirmation,
};
