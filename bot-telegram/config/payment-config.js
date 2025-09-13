/**
 * Configuración del Sistema de Pagos - El Patio
 *
 * Este archivo contiene toda la configuración relacionada con:
 * - Precios de entrada por juego/modo
 * - Límites de depósito y retiro
 * - Comisiones del sistema
 * - Configuración de premios
 * - Validaciones de seguridad
 *
 * Última actualización: 2025-08-24T18:59:42.446Z
 */

const PAYMENT_CONFIG = {
  precios: {
    ludo: {
      "1v1": {
        entrada: 60000,
        premio: 48000,
        comision: 12000,
        descripcion: "Ludo 1v1 - Entrada: 600,00 Bs",
      },
      "2v2": {
        entrada: 100000,
        premio: 180000,
        comision: 20000,
        descripcion: "Ludo 2 vs 2 - Entrada: 1.000,00 Bs",
      },
      "1v1v1v1": {
        entrada: 150000,
        premio: 270000,
        comision: 30000,
        descripcion: "Ludo 1 vs 1 vs 1 vs 1 - Entrada: 1.500,00 Bs",
      },
    },
    domino: {
      "2v2": {
        entrada: 75000,
        premio: 135000,
        comision: 15000,
        descripcion: "Dominó 2 vs 2 - Entrada: 750,00 Bs",
      },
      "1v1v1v1": {
        entrada: 125000,
        premio: 225000,
        comision: 25000,
        descripcion: "Dominó 1 vs 1 vs 1 vs 1 - Entrada: 1.250,00 Bs",
      },
    },
  },
  limites: {
    deposito: {
      minimo: 10000,
      maximo: 10000000,
      diario: 5000000,
    },
    retiro: {
      minimo: 50000,
      maximo: 5000000,
      diario: 2000000,
    },
    saldo: {
      maximo: 20000000,
    },
  },
  comisiones: {
    deposito: {
      porcentaje: 0,
      fija: 0,
    },
    retiro: {
      // Comisiones por frecuencia semanal (cada 7 días)
      frecuencia_semanal: {
        primera_vez: 0, // 0% en el primer retiro de la semana
        segunda_vez: 1, // 1% en el segundo retiro de la semana
        tercera_vez: 2, // 2% en el tercer retiro de la semana
        adicional: 5, // 5% para retiros adicionales
        periodo_dias: 7, // Período de 7 días
        descripcion: "Comisiones por frecuencia semanal",
      },
      // Comisiones fijas (mínimo y máximo)
      fija: 500, // 5,00 Bs mínimo
      maximo: 5000, // 50,00 Bs máximo
    },
    juego: {
      porcentaje: 20,
      descripcion: "20% de comisión del sistema",
    },
  },
  premios: {
    distribucion: {
      primer_lugar: 80,
      segundo_lugar: 15,
      tercer_lugar: 5,
    },
    minimo_ganador: 1000,
  },
  seguridad: {
    expiracion_transaccion: 30,
    max_intentos_hora: 10,
    tiempo_entre_transacciones: 5,
    validaciones: {
      verificar_saldo_antes_pago: true,
      verificar_limites_diarios: true,
      verificar_duplicados: true,
      registrar_auditoria: true,
    },
  },
  moneda: {
    codigo: "VES",
    simbolo: "Bs",
    decimales: 2,
    formato: "es-VE",
  },
  mensajes: {
    saldo_insuficiente: (saldo, costo) =>
      `❌ **Saldo insuficiente**\n\n💰 Tu saldo: ${(saldo / 100).toLocaleString(
        "es-VE",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )} Bs\n💸 Costo de entrada: ${(costo / 100).toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} Bs\n\n💳 **Deposita dinero** para continuar.`,

    pago_exitoso: (juego, modo, costo) =>
      `✅ **Pago exitoso**\n\n🎮 ${juego} - ${modo}\n💸 Entrada: ${(
        costo / 100
      ).toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} Bs\n\n🎯 ¡Que comience la partida!`,

    premio_ganado: (monto, posicion) =>
      `🏆 **¡Premio ganado!**\n\n💰 Monto: ${(monto / 100).toLocaleString(
        "es-VE",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )} Bs\n🥇 Posición: ${posicion}\n\n💳 Se ha acreditado a tu saldo.`,

    deposito_exitoso: (monto) =>
      `✅ **Depósito exitoso**\n\n💰 Monto: ${(monto / 100).toLocaleString(
        "es-VE",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )} Bs\n💳 Se ha acreditado a tu saldo.`,

    retiro_solicitado: (monto, comision, tipoComision, retirosSemana) =>
      `📋 **Retiro solicitado**\n\n💰 Monto: ${(monto / 100).toLocaleString(
        "es-VE",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )} Bs\n💸 Comisión: ${(comision / 100).toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} Bs (${tipoComision})\n💳 Neto a recibir: ${(
        (monto - comision) /
        100
      ).toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} Bs\n\n📊 Retiro #${retirosSemana} de esta semana\n⏳ Procesando... (24-48 horas)\n\n📧 Recibirás confirmación por email.`,

    limite_excedido: (tipo, limite) =>
      `⚠️ **Límite excedido**\n\n${tipo}: ${(limite / 100).toLocaleString(
        "es-VE",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )} Bs\n\n📅 Intenta mañana o contacta soporte.`,

    error_transaccion: (error) =>
      `❌ **Error en transacción**\n\n${error}\n\n🔄 Intenta de nuevo o contacta soporte.`,

    comisiones_info: (weeklyWithdrawals, nextFeePercentage) =>
      `💸 **Comisiones por Retiro (Semanal)**\n\n📊 **Esta semana:** ${weeklyWithdrawals} retiros realizados\n🎯 **Próximo retiro:** ${nextFeePercentage}% de comisión\n\n📋 **Escala de comisiones:**\n• 1er retiro: 0%\n• 2do retiro: 1%\n• 3er retiro: 2%\n• Adicionales: 5%\n\n⏰ **Período:** Cada 7 días\n💡 **Consejo:** Planifica tus retiros para aprovechar el 0%`,
  },
  estados_transaccion: {
    PENDIENTE: "pendiente",
    COMPLETADA: "completada",
    FALLIDA: "fallida",
    CANCELADA: "cancelada",
    REVERTIDA: "revertida",
  },
  tipos_transaccion: {
    DEPOSITO: "deposito",
    RETIRO: "retiro",
    PAGO_ENTRADA: "pago_entrada",
    PREMIO: "premio",
    COMISION: "comision",
    REEMBOLSO: "reembolso",
  },
};

module.exports = PAYMENT_CONFIG;
