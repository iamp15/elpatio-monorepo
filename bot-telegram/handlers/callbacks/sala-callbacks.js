"use strict";

const BOT_CONFIG = require("../../config/bot-config");
const userStateManager = require("../../user-state");
const { registerOrFindPlayer } = require("../../utils/helpers");
const abandonLimitManager = require("../../utils/abandon-limits");

// Variables de entorno
const TEST_MODE = process.env.TEST_MODE === "true" || !process.env.BACKEND_URL;

/**
 * Maneja la selección de modo para crear sala
 */
async function handleCreateSalaMode(bot, api, callbackQuery, modo) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;
  const userId = from.id;

  try {
    // Obtener el juego seleccionado
    const selectedGame = userStateManager.getSelectedGame(userId);
    if (!selectedGame) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Primero selecciona un juego.",
      });
      return;
    }

    const juego = BOT_CONFIG.juegos.find((j) => j.id === selectedGame);
    if (!juego) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Juego no encontrado.",
      });
      return;
    }

    // Guardar el modo seleccionado en el estado del usuario
    userStateManager.setState(userId, {
      ...userStateManager.getState(userId),
      creatingSala: {
        modo,
        juego: selectedGame,
      },
    });

    // Acknowledge callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: `Modo seleccionado: ${juego.modos[modo]?.nombre || modo}`,
    });

    // Solicitar nombre de la sala
    await bot.sendMessage(
      chatId,
      `📝 <b>Nombre de la Sala</b>

Escribe el nombre para tu sala de ${juego.nombre} (${
        juego.modos[modo]?.nombre || modo
      }):

💡 <b>Sugerencias:</b>
• Sala de ${from.first_name}
• ${juego.nombre} ${modo}
• Mi ${juego.nombre} favorito

📝 Envía el nombre de la sala:`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("❌ Error en selección de modo:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Error" });
    await bot.sendMessage(
      chatId,
      "❌ Error procesando selección. Intenta de nuevo."
    );
  }
}

/**
 * Maneja el proceso de unirse a una sala
 */
async function handleJoinSala(bot, api, callbackQuery, salaId) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    // 1) Buscar o crear jugador en backend (por telegramId)
    const jugador = await registerOrFindPlayer(api, from);

    // 2) Obtener información de la sala para verificar el precio de entrada
    const salas = await api.getSalasDisponibles();
    const sala = salas.find((s) => s._id === salaId);

    if (!sala) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Sala no encontrada",
      });
      await bot.sendMessage(
        chatId,
        "❌ <b>Error:</b> La sala no fue encontrada. Intenta de nuevo.",
        { parse_mode: "HTML" }
      );
      return;
    }

    const precioEntrada = sala.configuracion?.entrada || 0;

    // 3) Verificar saldo del jugador
    const saldoJugador = await api.getPlayerBalance(from.id.toString());

    if (saldoJugador < precioEntrada) {
      // Saldo insuficiente - mostrar mensaje y botón de depósito
      const inlineKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💰 Hacer Depósito",
                callback_data: "deposito:inicio",
              },
            ],
            [
              {
                text: "❌ Cancelar",
                callback_data: "cancelar:entrada",
              },
            ],
          ],
        },
      };

      await bot.sendMessage(
        chatId,
        `❌ <b>Saldo insuficiente</b>
          💰 <b>Tu saldo:</b> ${(saldoJugador / 100).toLocaleString("es-VE")} Bs
          🎮 <b>Precio de entrada:</b> ${(precioEntrada / 100).toLocaleString(
            "es-VE"
          )} Bs 🎯 <b>Sala:</b> ${sala.nombre || sala._id}
          💡 <b>Para unirte a esta sala necesitas más saldo.</b>
          ¿Deseas hacer un depósito?`,
        { parse_mode: "HTML", ...inlineKeyboard }
      );

      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Saldo insuficiente",
      });
      return;
    }

    // 4) Enviar mensaje de confirmación antes de debitar
    const confirmKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Confirmar entrada",
              callback_data: `confirmar_entrada:${salaId}`,
            },
            {
              text: "❌ Cancelar",
              callback_data: "cancelar:entrada",
            },
          ],
        ],
      },
    };

    await bot.sendMessage(
      chatId,
      `⚠️ <b>Confirmación de entrada</b>

🎮 <b>Sala:</b> ${sala.nombre || sala._id}
💰 <b>Precio de entrada:</b> ${(precioEntrada / 100).toLocaleString("es-VE")} Bs
💳 <b>Tu saldo actual:</b> ${(saldoJugador / 100).toLocaleString("es-VE")} Bs
💸 <b>Saldo después del pago:</b> ${(
        (saldoJugador - precioEntrada) /
        100
      ).toLocaleString("es-VE")} Bs

⚠️ <b>Se te descontará el precio de entrada de tu saldo.</b>

¿Confirmas que deseas unirte a la sala?`,
      { parse_mode: "HTML", ...confirmKeyboard }
    );

    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "⏳ Confirmando entrada...",
    });
  } catch (err) {
    console.error("❌ Error en join sala:", err.response?.data || err.message);

    // Manejar errores específicos del backend
    const errorData = err.response?.data || err.message;
    if (errorData && typeof errorData === "object" && errorData.mensaje) {
      const mensaje = errorData.mensaje;

      // Errores específicos de validación
      if (
        mensaje.includes(
          "No puedes unirte a una sala mientras estás jugando"
        ) ||
        (mensaje.includes("estás jugando") && mensaje.includes("unirte"))
      ) {
        await bot.sendMessage(
          chatId,
          `❌ <b>No puedes unirte a una sala mientras estás jugando</b>
            🎮 <b>Estado actual:</b> Jugando 👤 <b>Jugador:</b> ${
              from.first_name || from.username || "Jugador"
            }
            💡 <b>Solución:</b>• Termina tu partida actual • O espera a que
            termine automáticamente • Luego podrás unirte a una sala`,
          { parse_mode: "HTML" }
        );
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Estás jugando, no puedes unirte",
        });
      } else if (mensaje.includes("Ya estás en la sala")) {
        await bot.sendMessage(
          chatId,
          `ℹ️ <b>Ya te encuentras en esta sala</b>

No puedes unirte dos veces a la misma sala.`,
          { parse_mode: "HTML" }
        );
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ya estás en la sala",
        });
      } else if (
        mensaje.includes("Ya estás participando en una sala de modo")
      ) {
        await bot.sendMessage(
          chatId,
          `❌ <b>Límite de participación alcanzado</b>

${mensaje}

💡 <b>Solución:</b> Debes salir de la sala actual antes de unirte a otra del mismo modo.`,
          { parse_mode: "HTML" }
        );
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Límite de modo alcanzado",
        });
      } else if (mensaje.includes("Ya estás participando en 2 salas")) {
        await bot.sendMessage(
          chatId,
          `❌ <b>Límite de participación alcanzado</b>

${mensaje}

💡 <b>Solución:</b> Debes salir de una sala antes de unirte a otra.`,
          { parse_mode: "HTML" }
        );
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Límite de salas alcanzado",
        });
      } else if (mensaje.includes("La sala está llena")) {
        await bot.sendMessage(
          chatId,
          `❌ <b>Sala llena</b>

Esta sala ya no tiene espacio disponible. Busca otra sala o crea una nueva.`,
          { parse_mode: "HTML" }
        );
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Sala llena",
        });
      } else if (
        mensaje.includes("Ya hay 5 salas de") &&
        mensaje.includes("esperando jugadores")
      ) {
        await bot.sendMessage(
          chatId,
          `❌ <b>Límite de salas alcanzado</b>

${mensaje}

💡 <b>Solución:</b> Intenta crear una sala de otro modo o espera a que se complete una sala existente.`,
          { parse_mode: "HTML" }
        );
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Límite de salas alcanzado",
        });
      } else {
        // Otros errores específicos del backend
        await bot.sendMessage(
          chatId,
          `❌ <b>Error al unirse</b>

${mensaje}`,
          { parse_mode: "HTML" }
        );
        await bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Error" });
      }
    } else {
      // Error genérico
      await bot.sendMessage(
        chatId,
        "❌ Error uniéndote a la sala. Intenta de nuevo o contacta al admin."
      );
      await bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Error" });
    }
  }
}

/**
 * Maneja la confirmación para abandonar una sala
 */
async function handleConfirmLeaveSala(bot, api, callbackQuery, salaId) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    // Obtener información de la sala para mostrar en la confirmación
    let salaInfo = { nombre: `Sala ${salaId.slice(-6)}`, _id: salaId };

    // Usar el nuevo endpoint para obtener información específica de la sala
    if (!process.env.TEST_MODE && process.env.BACKEND_URL) {
      try {
        console.log(`🔍 Intentando obtener información de sala: ${salaId}`);

        // Usar el nuevo endpoint GET api/salas/:salaId
        const sala = await api.getSalaById(salaId);

        console.log(
          `📊 Respuesta del endpoint:`,
          JSON.stringify(sala, null, 2)
        );

        if (sala && sala.nombre) {
          console.log(`✅ Sala encontrada con nombre: ${sala.nombre}`);
          salaInfo = sala;
        } else if (sala) {
          // Si la sala existe pero no tiene nombre, usar un nombre más descriptivo
          console.log(`⚠️ Sala encontrada sin nombre, usando fallback`);
          salaInfo.nombre = `Sala ${sala._id.slice(-6)}`;
        } else {
          console.log(`❌ Sala no encontrada en el endpoint`);
        }
      } catch (err) {
        console.log(
          "❌ Error obteniendo info de sala para confirmación:",
          err.message
        );
        console.log("📋 Stack trace:", err.stack);
        // Mantener el nombre por defecto con ID parcial
      }
    } else {
      console.log(`🔧 TEST_MODE o BACKEND_URL no configurado:`, {
        TEST_MODE: process.env.TEST_MODE,
        BACKEND_URL: process.env.BACKEND_URL,
      });

      // En modo de prueba, intentar obtener información de las salas disponibles
      if (api) {
        try {
          console.log(`🔍 Modo de prueba: buscando sala en salas disponibles`);
          const salas = await api.getSalasDisponibles();
          const sala = salas.find((s) => s._id === salaId);

          if (sala && sala.nombre) {
            console.log(`✅ Sala encontrada en modo de prueba: ${sala.nombre}`);
            salaInfo = sala;
          } else if (sala) {
            console.log(`⚠️ Sala encontrada sin nombre en modo de prueba`);
            salaInfo.nombre = `Sala ${sala._id.slice(-6)}`;
          }
        } catch (err) {
          console.log(`❌ Error en modo de prueba: ${err.message}`);
        }
      }
    }

    // Crear botones de confirmación
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Sí, abandonar",
              callback_data: `leave:${salaId}`,
            },
            {
              text: "❌ Cancelar",
              callback_data: `cancel_leave:${salaId}`,
            },
          ],
        ],
      },
    };

    // Obtener información de límites de abandonos del jugador
    const abandonLimits = abandonLimitManager.getPlayerStats(from.id);
    let mensajeConfirmacion = "";

    if (abandonLimits) {
      const abandonosRestantesHora = 3 - abandonLimits.abandonosHora;

      if (abandonosRestantesHora > 1) {
        // Mensaje normal para múltiples abandonos restantes
        mensajeConfirmacion = `⚠️ <b>¿Estás seguro de que quieres abandonar la sala?</b>

🎮 <b>Sala:</b> ${salaInfo.nombre || salaInfo._id}
👤 <b>Usuario:</b> ${from.first_name || from.username || "Jugador"}

⚠️ <b>Recuerda:</b> Solo puedes abandonar ${abandonosRestantesHora} veces más en la próxima hora.

<b>¿Deseas continuar?</b>`;
      } else if (abandonosRestantesHora === 1) {
        // Mensaje de advertencia para último abandono
        mensajeConfirmacion = `⚠️ <b>¿Estás seguro de que quieres abandonar la sala?</b>

🎮 <b>Sala:</b> ${salaInfo.nombre || salaInfo._id}
👤 <b>Usuario:</b> ${from.first_name || from.username || "Jugador"}

🚨 <b>¡CUIDADO!</b> Solo puedes abandonar 1 vez más antes de ser bloqueado.

<b>¿Deseas continuar?</b>`;
      } else {
        // Mensaje cuando ya no puede abandonar (aunque no debería llegar aquí)
        mensajeConfirmacion = `⚠️ <b>¿Estás seguro de que quieres abandonar la sala?</b>

🎮 <b>Sala:</b> ${salaInfo.nombre || salaInfo._id}
👤 <b>Usuario:</b> ${from.first_name || from.username || "Jugador"}

❌ <b>No puedes abandonar más salas en este momento.</b>

<b>¿Deseas continuar?</b>`;
      }
    } else {
      // Mensaje para jugador sin historial
      mensajeConfirmacion = `⚠️ <b>¿Estás seguro de que quieres abandonar la sala?</b>

🎮 <b>Sala:</b> ${salaInfo.nombre || salaInfo._id}
👤 <b>Usuario:</b> ${from.first_name || from.username || "Jugador"}

⚠️ <b>Recuerda:</b> Solo puedes abandonar 3 veces en la próxima hora.

<b>¿Deseas continuar?</b>`;
    }

    // Mensaje de confirmación
    await bot.sendMessage(chatId, mensajeConfirmacion, {
      parse_mode: "HTML",
      ...inlineKeyboard,
    });

    // Acknowledge callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Confirmando abandono...",
    });
  } catch (err) {
    console.error("❌ Error en confirmación de abandono:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Error en confirmación",
    });
    await bot.sendMessage(
      chatId,
      "❌ Error procesando la confirmación. Intenta de nuevo."
    );
  }
}

/**
 * Maneja la cancelación del abandono de sala
 */
async function handleCancelLeaveSala(bot, api, callbackQuery, salaId) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    // Acknowledge callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Abandono cancelado",
    });

    // Mensaje de cancelación
    await bot.sendMessage(
      chatId,
      `✅ <b>Abandono cancelado</b>

Has decidido permanecer en la sala. ¡Disfruta tu partida!`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("❌ Error cancelando abandono:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Error",
    });
  }
}

/**
 * Maneja el proceso de abandonar una sala
 * El backend ahora maneja automáticamente el reembolso
 */
async function handleLeaveSala(bot, api, callbackQuery, salaId) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;
  const telegramId = from.id;

  try {
    // 0) Verificar si el jugador puede abandonar (sistema de límites)
    console.log(
      `🔍 [LEAVESALA] Verificando permisos para usuario: ${telegramId}`
    );
    console.log(
      `📊 [LEAVESALA] Cache antes de verificar:`,
      abandonLimitManager.cache.size,
      "usuarios"
    );

    const permisoAbandono = abandonLimitManager.canAbandon(telegramId);

    console.log(
      `📊 [LEAVESALA] Resultado de canAbandon:`,
      JSON.stringify(permisoAbandono, null, 2)
    );
    console.log(
      `📊 [LEAVESALA] Cache después de verificar:`,
      abandonLimitManager.cache.size,
      "usuarios"
    );

    if (!permisoAbandono.canAbandon) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ No puedes abandonar temporalmente",
        show_alert: true,
      });

      await bot.sendMessage(chatId, permisoAbandono.mensaje, {
        parse_mode: "HTML",
      });
      return;
    }

    // 1) Buscar o crear jugador en backend (por telegramId)
    const jugador = await registerOrFindPlayer(api, from);

    // 2) Llamar al endpoint que ahora maneja reembolso automáticamente
    const leaveRes = await api.eliminarJugadorDeSala(
      salaId,
      jugador._id || jugador.id
    );

    const sala = leaveRes.sala || leaveRes;
    const salaCancelada = leaveRes.cancelada || false;
    const reembolsoInfo = leaveRes.reembolso || null; // Información del backend

    console.log(`✅ Jugador ${jugador._id} eliminado de sala ${salaId}`);
    if (reembolsoInfo) {
      console.log(
        `💰 Reembolso ${reembolsoInfo.procesado ? "exitoso" : "falló"}: ${
          reembolsoInfo.referencia || reembolsoInfo.error
        }`
      );
    }

    // 3) Responder al jugador según si la sala fue cancelada o no
    if (salaCancelada) {
      let mensajeCancelacion = `✅ <b>¡Has abandonado la sala exitosamente!</b>

🎮 <b>Sala:</b> ${sala.nombre || sala._id}
⚠️ <b>La sala ha sido cancelada</b> porque quedó sin jugadores.`;

      // Agregar información del reembolso del backend
      if (reembolsoInfo && reembolsoInfo.procesado) {
        mensajeCancelacion += `

💰 <b>Reembolso procesado automáticamente:</b>
• <b>Monto devuelto:</b> ${(reembolsoInfo.monto / 100).toLocaleString(
          "es-VE"
        )} Bs
• <b>Saldo actual:</b> ${(reembolsoInfo.saldoNuevo / 100).toLocaleString(
          "es-VE"
        )} Bs
`;
      } else if (reembolsoInfo && !reembolsoInfo.procesado) {
        mensajeCancelacion += `

⚠️ <b>Reembolso pendiente:</b>
• Hubo un problema procesando el reembolso de ${(
          reembolsoInfo.monto / 100
        ).toLocaleString("es-VE")} Bs
• Contacta al administrador con esta información`;
      }

      mensajeCancelacion += `

📋 <b>Próximos pasos:</b>
• Puedes crear una nueva sala
• O unirte a otra sala disponible
• ¡Gracias por participar!`;

      await bot.sendMessage(chatId, mensajeCancelacion, {
        parse_mode: "HTML",
      });

      // Registrar el abandono VOLUNTARIO en el sistema de límites
      const resultadoAbandono =
        abandonLimitManager.registerAbandonVoluntario(telegramId);

      // Mostrar información sobre el estado de límites
      if (resultadoAbandono.mensaje) {
        await bot.sendMessage(chatId, resultadoAbandono.mensaje, {
          parse_mode: "HTML",
        });
      }

      await bot.answerCallbackQuery(callbackQuery.id, {
        text: reembolsoInfo?.procesado
          ? "✅ Sala abandonada, cancelada y reembolsada"
          : "✅ Sala abandonada y cancelada",
      });
    } else {
      let mensajeAbandono = `✅ <b>¡Has abandonado la sala exitosamente!</b>

🎮 <b>Sala:</b> ${sala.nombre || sala._id}
👥 <b>Jugadores restantes:</b> ${sala.jugadores?.length || 0}`;

      // Agregar información del reembolso del backend
      if (reembolsoInfo && reembolsoInfo.procesado) {
        mensajeAbandono += `

💰 <b>Reembolso procesado automáticamente:</b>
• <b>Monto devuelto:</b> ${(reembolsoInfo.monto / 100).toLocaleString(
          "es-VE"
        )} Bs
• <b>Saldo actual:</b> ${(reembolsoInfo.saldoNuevo / 100).toLocaleString(
          "es-VE"
        )} Bs
`;
      } else if (reembolsoInfo && !reembolsoInfo.procesado) {
        mensajeAbandono += `

⚠️ <b>Reembolso pendiente:</b>
• Hubo un problema procesando el reembolso de ${(
          reembolsoInfo.monto / 100
        ).toLocaleString("es-VE")} Bs
• Contacta al administrador`;
      }

      mensajeAbandono += `

📋 <b>Próximos pasos:</b>
• Puedes unirte a otra sala
• O crear una nueva sala
• ¡Gracias por participar!`;

      await bot.sendMessage(chatId, mensajeAbandono, {
        parse_mode: "HTML",
      });

      // Notificar a los jugadores restantes sobre el abandono
      if (sala.jugadores && sala.jugadores.length > 0) {
        const {
          notificarJugadorAbandono,
        } = require("../../utils/sala-notifications");
        await notificarJugadorAbandono(bot, api, sala, jugador);
      }

      // Registrar el abandono VOLUNTARIO en el sistema de límites
      const resultadoAbandono =
        abandonLimitManager.registerAbandonVoluntario(telegramId);

      // Mostrar información sobre el estado de límites
      if (resultadoAbandono.mensaje) {
        await bot.sendMessage(chatId, resultadoAbandono.mensaje, {
          parse_mode: "HTML",
        });
      }

      await bot.answerCallbackQuery(callbackQuery.id, {
        text: reembolsoInfo?.procesado
          ? "✅ Abandonado la sala y reembolsado"
          : "✅ Abandonado la sala exitosamente",
      });
    }
  } catch (err) {
    console.error("❌ Error en leave sala:", err.response?.data || err.message);

    // Manejar errores específicos del backend
    const errorData = err.response?.data || err.message;
    if (errorData && typeof errorData === "object" && errorData.mensaje) {
      const mensaje = errorData.mensaje;

      // Errores específicos de validación
      if (mensaje.includes("No estás en esta sala")) {
        await bot.sendMessage(
          chatId,
          `ℹ️ <b>No estás en esta sala</b>

No puedes abandonar una sala en la que no estás participando.`,
          { parse_mode: "HTML" }
        );
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "No estás en esta sala",
        });
      } else if (mensaje.includes("No puedes abandonar")) {
        await bot.sendMessage(
          chatId,
          `❌ <b>No puedes abandonar esta sala</b>

${mensaje}`,
          { parse_mode: "HTML" }
        );
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "No puedes abandonar",
        });
      } else {
        // Otros errores específicos del backend
        await bot.sendMessage(
          chatId,
          `❌ <b>Error al abandonar</b>

${mensaje}`,
          { parse_mode: "HTML" }
        );
        await bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Error" });
      }
    } else {
      // Error genérico
      await bot.sendMessage(
        chatId,
        "❌ Error abandonando la sala. Intenta de nuevo o contacta al admin.",
        { parse_mode: "HTML" }
      );
      await bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Error" });
    }
  }
}

/**
 * Maneja la confirmación de entrada a una sala
 */
async function handleConfirmEntrada(bot, api, callbackQuery, salaId) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    // 1) Buscar o crear jugador en backend (por telegramId)
    const jugador = await registerOrFindPlayer(api, from);

    // 2) Obtener información de la sala
    const salas = await api.getSalasDisponibles();
    const sala = salas.find((s) => s._id === salaId);

    if (!sala) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Sala no encontrada",
      });
      await bot.sendMessage(
        chatId,
        "❌ <b>Error:</b> La sala no fue encontrada. Intenta de nuevo.",
        { parse_mode: "HTML" }
      );
      return;
    }

    const precioEntrada = sala.configuracion?.entrada || 0;

    // 3) Verificar saldo nuevamente (por seguridad)
    const saldoJugador = await api.getPlayerBalance(from.id.toString());

    if (saldoJugador < precioEntrada) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Saldo insuficiente",
      });
      await bot.sendMessage(
        chatId,
        "❌ <b>Error:</b> Tu saldo ha cambiado y ya no es suficiente para entrar a esta sala.",
        { parse_mode: "HTML" }
      );
      return;
    }

    // 4) Procesar pago usando el nuevo sistema de transacciones
    const resultadoPago = await api.procesarPagoEntrada(
      jugador._id || jugador.id,
      precioEntrada,
      salaId
    );

    if (!resultadoPago.exito) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Error procesando pago",
      });
      await bot.sendMessage(
        chatId,
        `❌ <b>Error procesando el pago:</b> ${
          resultadoPago.error || "Error desconocido"
        }`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // 5) Unir al jugador a la sala
    const joinRes = await api.joinSala(salaId, jugador._id || jugador.id);
    const salaActualizada = joinRes.sala || joinRes;

    // 6) Responder al jugador con información de la transacción
    const saldoRestante =
      resultadoPago.saldoNuevo || saldoJugador - precioEntrada;

    await bot.sendMessage(
      chatId,
      `✅ <b>¡Te has unido a la sala exitosamente!</b>

🎮 <b>Sala:</b> ${sala.nombre || sala._id}
💰 <b>Entrada pagada:</b> ${(precioEntrada / 100).toLocaleString("es-VE")} Bs
💳 <b>Saldo restante:</b> ${(saldoRestante / 100).toLocaleString("es-VE")} Bs
👥 <b>Jugadores:</b> ${salaActualizada.jugadores?.length || 0}

📋 <b>Próximos pasos:</b>
• Espera a que se complete la sala
• ¡Disfruta tu partida!`,
      { parse_mode: "HTML" }
    );

    // 7) Notificar a todos los jugadores de la sala sobre el nuevo jugador
    console.log(
      "🔍 [JOINSALA] Antes de notificar - salaActualizada:",
      JSON.stringify(salaActualizada, null, 2)
    );
    console.log(
      "🔍 [JOINSALA] Antes de notificar - jugador:",
      JSON.stringify(jugador, null, 2)
    );

    const { notificarNuevoJugador } = require("../../utils/sala-notifications");
    await notificarNuevoJugador(bot, api, salaActualizada, jugador);

    // 8) Verificar si la sala está completa y notificar
    console.log("🔍 [JOINSALA] Verificando si la sala está completa...");
    console.log(
      "🔍 [JOINSALA] salaActualizada.jugadores:",
      salaActualizada.jugadores
    );
    console.log(
      "🔍 [JOINSALA] Cantidad de jugadores:",
      salaActualizada.jugadores?.length
    );
    console.log(
      "🔍 [JOINSALA] salaActualizada.configuracion:",
      salaActualizada.configuracion
    );
    console.log(
      "🔍 [JOINSALA] maxJugadores:",
      salaActualizada.configuracion?.maxJugadores
    );
    console.log(
      "🔍 [JOINSALA] maxJugadores (fallback):",
      salaActualizada.configuracion?.maxJugadores || 999
    );

    // Obtener maxJugadores del modo de la sala
    const modo = salaActualizada.modo;
    let maxJugadores = salaActualizada.configuracion?.maxJugadores;

    console.log("🔍 [JOINSALA] salaActualizada.modo:", salaActualizada.modo);
    console.log(
      "🔍 [JOINSALA] salaActualizada.estado:",
      salaActualizada.estado
    );

    // Si no está en configuración, obtener del modo
    if (!maxJugadores && modo) {
      const juego = BOT_CONFIG.juegos.find(
        (j) => j.id === salaActualizada.juego
      );
      if (juego && juego.modos && juego.modos[modo]) {
        maxJugadores = juego.modos[modo].maxJugadores;
        console.log(
          "🔍 [JOINSALA] maxJugadores obtenido del modo:",
          maxJugadores
        );
      }
    }

    // Fallback final
    if (!maxJugadores) {
      maxJugadores = 999;
      console.log("🔍 [JOINSALA] maxJugadores usando fallback:", maxJugadores);
    }

    const jugadoresActuales = salaActualizada.jugadores?.length || 0;
    const salaCompleta = jugadoresActuales >= maxJugadores;

    // También verificar si el backend ya marcó la sala como completa
    const salaMarcadaCompleta = salaActualizada.estado === "completa";

    console.log("🔍 [JOINSALA] Condición de sala completa:");
    console.log("🔍 [JOINSALA] - jugadoresActuales:", jugadoresActuales);
    console.log("🔍 [JOINSALA] - maxJugadores:", maxJugadores);
    console.log(
      "🔍 [JOINSALA] - jugadoresActuales >= maxJugadores:",
      salaCompleta
    );
    console.log(
      "🔍 [JOINSALA] - sala marcada como completa por backend:",
      salaMarcadaCompleta
    );

    if (salaCompleta || salaMarcadaCompleta) {
      console.log(
        "🎯 [JOINSALA] ¡SALA COMPLETA! Llamando a notificarSalaCompleta..."
      );
      const {
        notificarSalaCompleta,
      } = require("../../utils/sala-notifications");
      await notificarSalaCompleta(bot, api, salaActualizada);
      console.log("✅ [JOINSALA] notificarSalaCompleta completada");
    } else {
      console.log(
        "⏳ [JOINSALA] Sala no está completa aún, no se envía notificación"
      );
    }

    // Acknowledge callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "✅ Unido a la sala exitosamente",
    });
  } catch (err) {
    console.error(
      "❌ Error en confirmación de entrada:",
      err.response?.data || err.message
    );

    // Manejar errores específicos del backend
    const errorData = err.response?.data || err.message;
    if (errorData && typeof errorData === "object" && errorData.mensaje) {
      const mensaje = errorData.mensaje;

      if (mensaje.includes("Saldo insuficiente")) {
        await bot.sendMessage(
          chatId,
          "❌ <b>Error:</b> Tu saldo no es suficiente para entrar a esta sala.",
          { parse_mode: "HTML" }
        );
      } else {
        await bot.sendMessage(
          chatId,
          `❌ <b>Error al confirmar entrada:</b>

${mensaje}`,
          { parse_mode: "HTML" }
        );
      }
    } else {
      await bot.sendMessage(
        chatId,
        "❌ Error confirmando la entrada. Intenta de nuevo o contacta al admin."
      );
    }

    await bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Error" });
  }
}

/**
 * Maneja la cancelación de entrada a una sala
 */
async function handleCancelarEntrada(bot, api, callbackQuery) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    // Acknowledge callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Entrada cancelada",
    });

    // Mensaje de cancelación
    await bot.sendMessage(
      chatId,
      `✅ <b>Entrada cancelada</b>

Has decidido no unirte a la sala. Puedes intentar de nuevo cuando quieras.`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("❌ Error cancelando entrada:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Error",
    });
  }
}

/**
 * Maneja el inicio del proceso de depósito (placeholder)
 */
async function handleDepositoInicio(bot, api, callbackQuery) {
  const { message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    // Acknowledge callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "💰 Procesando depósito...",
    });

    // Mensaje temporal hasta que se implemente la funcionalidad de depósito
    await bot.sendMessage(
      chatId,
      `💰 <b>Sistema de Depósitos</b>

⚠️ <b>Funcionalidad en desarrollo</b>

La funcionalidad de depósitos estará disponible próximamente.

📋 <b>Métodos de pago que se implementarán:</b>
• Transferencias bancarias
• Pagos móviles  
• Tarjetas de crédito/débito

💡 <b>Por ahora, contacta al administrador para realizar depósitos.</b>

Gracias por tu paciencia.`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("❌ Error en inicio de depósito:", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Error",
    });
  }
}

module.exports = {
  handleCreateSalaMode,
  handleJoinSala,
  handleConfirmLeaveSala,
  handleCancelLeaveSala,
  handleLeaveSala,
  handleConfirmEntrada,
  handleCancelarEntrada,
  handleDepositoInicio,
};
