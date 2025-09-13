"use strict";

/**
 * Utilidades para el manejo seguro de dinero
 *
 * Este módulo proporciona funciones para:
 * - Conversión entre centavos y dólares
 * - Cálculos precisos de dinero
 * - Validaciones de montos
 * - Formateo de moneda
 */

const Decimal = require("decimal.js");
const validator = require("validator");
const PAYMENT_CONFIG = require("../config/payment-config");

class MoneyUtils {
  constructor() {
    // Configurar Decimal.js para precisión en cálculos monetarios
    Decimal.set({
      precision: 20,
      rounding: Decimal.ROUND_HALF_UP,
      toExpNeg: -7,
      toExpPos: 21,
      modulo: Decimal.ROUND_HALF_UP,
      crypto: false,
      maxE: 9e15,
      minE: -9e15,
    });
  }

  /**
   * Convierte dólares a centavos (para almacenamiento)
   * @param {number|string} dollars - Cantidad en dólares
   * @returns {number} Cantidad en centavos
   */
  dollarsToCents(dollars) {
    try {
      const decimal = new Decimal(dollars);
      return decimal.mul(100).toNumber();
    } catch (error) {
      throw new Error(
        `Error convirtiendo dólares a centavos: ${error.message}`
      );
    }
  }

  /**
   * Convierte centavos a dólares (para display)
   * @param {number} cents - Cantidad en centavos
   * @returns {number} Cantidad en dólares
   */
  centsToDollars(cents) {
    try {
      const decimal = new Decimal(cents);
      return decimal.div(100).toNumber();
    } catch (error) {
      throw new Error(
        `Error convirtiendo centavos a dólares: ${error.message}`
      );
    }
  }

  /**
   * Formatea una cantidad de centavos como moneda
   * @param {number} cents - Cantidad en centavos
   * @param {string} currency - Código de moneda (default: VES)
   * @returns {string} Cantidad formateada
   */
  formatCurrency(cents, currency = "VES") {
    try {
      const dollars = this.centsToDollars(cents);

      // Formato personalizado para Venezuela
      if (currency === "VES") {
        return (
          dollars.toLocaleString("es-VE", {
            minimumFractionDigits: PAYMENT_CONFIG.moneda.decimales,
            maximumFractionDigits: PAYMENT_CONFIG.moneda.decimales,
          }) + " Bs"
        );
      }

      // Formato estándar para otras monedas
      return new Intl.NumberFormat(PAYMENT_CONFIG.moneda.formato, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: PAYMENT_CONFIG.moneda.decimales,
        maximumFractionDigits: PAYMENT_CONFIG.moneda.decimales,
      }).format(dollars);
    } catch (error) {
      throw new Error(`Error formateando moneda: ${error.message}`);
    }
  }

  /**
   * Valida si un monto es válido
   * @param {number|string} amount - Monto a validar
   * @param {string} type - Tipo de validación ('deposito', 'retiro', 'general')
   * @returns {object} Resultado de la validación
   */
  validateAmount(amount, type = "general") {
    try {
      // Validar que sea un número válido
      if (!validator.isNumeric(String(amount))) {
        return {
          valid: false,
          error: "El monto debe ser un número válido",
        };
      }

      const decimal = new Decimal(amount);
      const cents = this.dollarsToCents(decimal.toNumber());

      // Validar que sea positivo
      if (decimal.lte(0)) {
        return {
          valid: false,
          error: "El monto debe ser mayor a cero",
        };
      }

      // Validar límites según el tipo
      const limites =
        PAYMENT_CONFIG.limites[type] || PAYMENT_CONFIG.limites.deposito;

      if (cents < limites.minimo) {
        return {
          valid: false,
          error: `El monto mínimo es ${this.formatCurrency(limites.minimo)}`,
        };
      }

      if (cents > limites.maximo) {
        return {
          valid: false,
          error: `El monto máximo es ${this.formatCurrency(limites.maximo)}`,
        };
      }

      return {
        valid: true,
        cents: cents,
        dollars: decimal.toNumber(),
      };
    } catch (error) {
      return {
        valid: false,
        error: `Error validando monto: ${error.message}`,
      };
    }
  }

  /**
   * Calcula comisión por retiro basada en frecuencia semanal
   * @param {number} amount - Monto en centavos
   * @param {number} weeklyWithdrawals - Número de retiros en la semana actual
   * @returns {object} Comisión calculada con información detallada
   */
  calculateWithdrawalFee(amount, weeklyWithdrawals = 0) {
    try {
      const config = PAYMENT_CONFIG.comisiones.retiro;
      const decimal = new Decimal(amount);

      // Determinar porcentaje según frecuencia semanal
      let percentage;
      let feeType;

      if (weeklyWithdrawals === 0) {
        percentage = config.frecuencia_semanal.primera_vez;
        feeType = "Primer retiro de la semana (0%)";
      } else if (weeklyWithdrawals === 1) {
        percentage = config.frecuencia_semanal.segunda_vez;
        feeType = "Segundo retiro de la semana (1%)";
      } else if (weeklyWithdrawals === 2) {
        percentage = config.frecuencia_semanal.tercera_vez;
        feeType = "Tercer retiro de la semana (2%)";
      } else {
        percentage = config.frecuencia_semanal.adicional;
        feeType = `Retiro adicional (${percentage}%)`;
      }

      // Calcular comisión por porcentaje
      const percentageFee = decimal.mul(percentage).div(100);

      // Aplicar comisión fija mínima
      const totalFee = Decimal.max(percentageFee, config.fija);

      // Aplicar comisión máxima
      const finalFee = Decimal.min(totalFee, config.maximo);

      return {
        fee: Math.round(finalFee.toNumber()),
        percentage: percentage,
        feeType: feeType,
        weeklyWithdrawals: weeklyWithdrawals + 1,
        nextFeePercentage: this.getNextFeePercentage(weeklyWithdrawals + 1),
      };
    } catch (error) {
      throw new Error(`Error calculando comisión: ${error.message}`);
    }
  }

  /**
   * Obtiene el porcentaje de comisión para el próximo retiro
   * @param {number} nextWithdrawal - Número del próximo retiro
   * @returns {number} Porcentaje de comisión
   */
  getNextFeePercentage(nextWithdrawal) {
    const config = PAYMENT_CONFIG.comisiones.retiro;

    if (nextWithdrawal === 1) return config.frecuencia_semanal.primera_vez;
    if (nextWithdrawal === 2) return config.frecuencia_semanal.segunda_vez;
    if (nextWithdrawal === 3) return config.frecuencia_semanal.tercera_vez;
    return config.frecuencia_semanal.adicional;
  }

  /**
   * Obtiene información de comisiones por frecuencia semanal
   * @param {number} weeklyWithdrawals - Número de retiros en la semana actual
   * @returns {object} Información detallada de comisiones
   */
  getWeeklyFeeInfo(weeklyWithdrawals = 0) {
    const config = PAYMENT_CONFIG.comisiones.retiro;

    return {
      currentWithdrawals: weeklyWithdrawals,
      periodDays: config.frecuencia_semanal.periodo_dias,
      nextWithdrawalNumber: weeklyWithdrawals + 1,
      nextFeePercentage: this.getNextFeePercentage(weeklyWithdrawals + 1),
      feeSchedule: {
        "1er retiro": `${config.frecuencia_semanal.primera_vez}%`,
        "2do retiro": `${config.frecuencia_semanal.segunda_vez}%`,
        "3er retiro": `${config.frecuencia_semanal.tercera_vez}%`,
        Adicionales: `${config.frecuencia_semanal.adicional}%`,
      },
      description: config.frecuencia_semanal.descripcion,
    };
  }

  /**
   * Calcula el monto neto después de comisión
   * @param {number} grossAmount - Monto bruto en centavos
   * @param {string} type - Tipo de transacción
   * @returns {object} Monto neto y comisión
   */
  calculateNetAmount(grossAmount, type = "retiro") {
    try {
      const fee = this.calculateWithdrawalFee(grossAmount);
      const netAmount = grossAmount - fee;

      return {
        grossAmount: grossAmount,
        fee: fee,
        netAmount: netAmount,
        feeFormatted: this.formatCurrency(fee),
        netFormatted: this.formatCurrency(netAmount),
      };
    } catch (error) {
      throw new Error(`Error calculando monto neto: ${error.message}`);
    }
  }

  /**
   * Valida si un usuario puede realizar una transacción
   * @param {number} currentBalance - Saldo actual en centavos
   * @param {number} transactionAmount - Monto de la transacción en centavos
   * @param {string} transactionType - Tipo de transacción
   * @returns {object} Resultado de la validación
   */
  validateTransaction(currentBalance, transactionAmount, transactionType) {
    try {
      const balance = new Decimal(currentBalance);
      const amount = new Decimal(transactionAmount);

      // Para pagos, verificar que tenga saldo suficiente
      if (transactionType === "pago_entrada") {
        if (balance.lt(amount)) {
          return {
            valid: false,
            error: "Saldo insuficiente",
            currentBalance: currentBalance,
            requiredAmount: transactionAmount,
            shortfall: amount.sub(balance).toNumber(),
          };
        }
      }

      // Para depósitos, verificar límite de saldo máximo
      if (transactionType === "deposito") {
        const newBalance = balance.add(amount);
        if (newBalance.gt(PAYMENT_CONFIG.limites.saldo.maximo)) {
          return {
            valid: false,
            error: "Excedería el límite máximo de saldo",
            currentBalance: currentBalance,
            depositAmount: transactionAmount,
            maxBalance: PAYMENT_CONFIG.limites.saldo.maximo,
          };
        }
      }

      return {
        valid: true,
        currentBalance: currentBalance,
        transactionAmount: transactionAmount,
        newBalance:
          transactionType === "pago_entrada"
            ? balance.sub(amount).toNumber()
            : balance.add(amount).toNumber(),
      };
    } catch (error) {
      return {
        valid: false,
        error: `Error validando transacción: ${error.message}`,
      };
    }
  }

  /**
   * Genera un ID único para transacciones
   * @returns {string} ID único
   */
  generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `TXN_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Valida formato de ID de transacción
   * @param {string} transactionId - ID a validar
   * @returns {boolean} True si es válido
   */
  validateTransactionId(transactionId) {
    return /^TXN_\d+_[A-Z0-9]{9}$/.test(transactionId);
  }

  /**
   * Redondea un monto a 2 decimales
   * @param {number} amount - Monto a redondear
   * @returns {number} Monto redondeado
   */
  roundToCents(amount) {
    try {
      const decimal = new Decimal(amount);
      return decimal.toDecimalPlaces(2).toNumber();
    } catch (error) {
      throw new Error(`Error redondeando monto: ${error.message}`);
    }
  }

  /**
   * Suma múltiples montos de forma segura
   * @param {...number} amounts - Montos a sumar
   * @returns {number} Suma total
   */
  sumAmounts(...amounts) {
    try {
      let total = new Decimal(0);
      amounts.forEach((amount) => {
        total = total.add(new Decimal(amount));
      });
      return total.toNumber();
    } catch (error) {
      throw new Error(`Error sumando montos: ${error.message}`);
    }
  }

  /**
   * Resta múltiples montos de forma segura
   * @param {number} baseAmount - Monto base
   * @param {...number} amounts - Montos a restar
   * @returns {number} Resultado de la resta
   */
  subtractAmounts(baseAmount, ...amounts) {
    try {
      let result = new Decimal(baseAmount);
      amounts.forEach((amount) => {
        result = result.sub(new Decimal(amount));
      });
      return result.toNumber();
    } catch (error) {
      throw new Error(`Error restando montos: ${error.message}`);
    }
  }
}

// Crear instancia singleton
const moneyUtils = new MoneyUtils();

module.exports = moneyUtils;
