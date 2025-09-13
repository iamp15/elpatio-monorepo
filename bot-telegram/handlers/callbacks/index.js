"use strict";

// Importar todos los módulos de callbacks
const gameCallbacks = require("./game-callbacks");
const salaCallbacks = require("./sala-callbacks");
const adminCallbacks = require("./admin-callbacks");
const profileCallbacks = require("./profile-callbacks");

// Importar las funciones de creación de sala
const {
  handleCreateSalaFinal,
  handleConfirmCreateSala,
  handleCancelCreateSala,
  handleCheckBalanceBeforeCreate,
  handleBackToConfirmation,
} = require("./sala-creation");

/**
 * Maneja todas las callback queries
 */
async function handleCallbackQuery(bot, api, callbackQuery) {
  const { data, message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    if (data && data.startsWith("select_game:")) {
      // Selección de juego
      const gameId = data.split(":")[1];
      await gameCallbacks.handleSelectGame(bot, api, callbackQuery, gameId);
    } else if (data && data.startsWith("join:")) {
      // Unirse a sala
      const salaId = data.split(":")[1];
      await salaCallbacks.handleJoinSala(bot, api, callbackQuery, salaId);
    } else if (data && data.startsWith("confirm_leave:")) {
      // Confirmar abandono de sala
      const salaId = data.split(":")[1];
      await salaCallbacks.handleConfirmLeaveSala(
        bot,
        api,
        callbackQuery,
        salaId
      );
    } else if (data && data.startsWith("leave:")) {
      // Abandonar sala (confirmado)
      const salaId = data.split(":")[1];
      await salaCallbacks.handleLeaveSala(bot, api, callbackQuery, salaId);
    } else if (data && data.startsWith("cancel_leave:")) {
      // Cancelar abandono de sala
      const salaId = data.split(":")[1];
      await salaCallbacks.handleCancelLeaveSala(
        bot,
        api,
        callbackQuery,
        salaId
      );
    } else if (data && data.startsWith("create_sala_mode:")) {
      // Crear sala - selección de modo
      const modo = data.split(":")[1];
      await salaCallbacks.handleCreateSalaMode(bot, api, callbackQuery, modo);
    } else if (data && data.startsWith("ver_salas_after_create:")) {
      // Ver salas después de crear
      const juego = data.split(":")[1];
      await gameCallbacks.handleVerSalasAfterCreate(
        bot,
        api,
        callbackQuery,
        juego
      );
    } else if (data === "refresh_token") {
      // Renovar token manualmente
      await adminCallbacks.handleRefreshToken(bot, api, callbackQuery);
    } else if (data === "view_stats") {
      // Ver estadísticas
      await adminCallbacks.handleViewStats(bot, api, callbackQuery);
    } else if (data === "profile_create_nickname") {
      // Crear nickname
      await profileCallbacks.handleCreateNickname(bot, api, callbackQuery);
    } else if (data === "profile_change_nickname") {
      // Cambiar nickname
      await profileCallbacks.handleChangeNickname(bot, api, callbackQuery);
    } else if (data === "profile_deposit") {
      // Depositar
      await profileCallbacks.handleDeposit(bot, api, callbackQuery);
    } else if (data === "profile_withdraw") {
      // Retirar
      await profileCallbacks.handleWithdraw(bot, api, callbackQuery);
    } else if (data === "profile_detailed_stats") {
      // Estadísticas detalladas
      await profileCallbacks.handleDetailedStats(bot, api, callbackQuery);
    } else if (data === "profile_deposit_history") {
      // Historial de depósitos
      await profileCallbacks.handleDepositHistory(bot, api, callbackQuery);
    } else if (data && data.startsWith("confirmar_entrada:")) {
      // Confirmar entrada a sala
      const salaId = data.split(":")[1];
      await salaCallbacks.handleConfirmEntrada(bot, api, callbackQuery, salaId);
    } else if (data === "cancelar:entrada") {
      // Cancelar entrada a sala
      await salaCallbacks.handleCancelarEntrada(bot, api, callbackQuery);
    } else if (data === "deposito:inicio") {
      // Iniciar proceso de depósito
      await salaCallbacks.handleDepositoInicio(bot, api, callbackQuery);
    } else if (data && data.startsWith("reset_abandons:")) {
      // Resetear contadores de abandonos de un jugador
      const telegramId = data.split(":")[1];
      await adminCallbacks.handleResetAbandonsConfirm(
        bot,
        api,
        callbackQuery,
        telegramId
      );
    } else if (data === "cancel_reset_abandons") {
      // Cancelar reset de contadores de abandonos
      await adminCallbacks.handleCancelResetAbandons(bot, api, callbackQuery);
    } else if (data === "confirm_create_sala") {
      // Confirmar creación de sala
      await handleConfirmCreateSala(bot, api, callbackQuery);
    } else if (data === "cancel_create_sala") {
      // Cancelar creación de sala
      await handleCancelCreateSala(bot, api, callbackQuery);
    } else if (data === "check_balance_before_create") {
      // Verificar saldo antes de crear sala
      await handleCheckBalanceBeforeCreate(bot, api, callbackQuery);
    } else if (data === "back_to_confirmation") {
      // Volver a la confirmación de creación de sala
      await handleBackToConfirmation(bot, api, callbackQuery);
    } else {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Acción desconocida.",
      });
    }
  } catch (err) {
    console.error("❌ Error en callback:", err.response?.data || err.message);
    await bot.sendMessage(
      chatId,
      "Error procesando la acción. Intenta de nuevo o contacta al admin."
    );
    await bot.answerCallbackQuery(callbackQuery.id, { text: "Error" });
  }
}

module.exports = {
  handleCallbackQuery,
  handleCreateSalaFinal,
  handleConfirmCreateSala,
  handleCancelCreateSala,
  handleCheckBalanceBeforeCreate,
  handleBackToConfirmation,
};
