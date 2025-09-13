// Backup creado el 2025-08-24T18-59-42-433Z
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
 * Última actualización: 2025-08-24T18:59:14.471Z
 */

const PAYMENT_CONFIG = {
  "precios": {
    "ludo": {
      "1v1": {
        "entrada": 60000,
        "premio": 48000,
        "comision": 12000,
        "descripcion": "Ludo 1v1 - Entrada: 600,00 Bs"
      },
      "2v2": {
        "entrada": 100000,
        "premio": 180000,
        "comision": 20000,
        "descripcion": "Ludo 2 vs 2 - Entrada: 1.000,00 Bs"
      },
      "1v1v1v1": {
        "entrada": 150000,
        "premio": 270000,
        "comision": 30000,
        "descripcion": "Ludo 1 vs 1 vs 1 vs 1 - Entrada: 1.500,00 Bs"
      }
    },
    "domino": {
      "2v2": {
        "entrada": 75000,
        "premio": 135000,
        "comision": 15000,
        "descripcion": "Dominó 2 vs 2 - Entrada: 750,00 Bs"
      },
      "1v1v1v1": {
        "entrada": 125000,
        "premio": 225000,
        "comision": 25000,
        "descripcion": "Dominó 1 vs 1 vs 1 vs 1 - Entrada: 1.250,00 Bs"
      }
    }
  },
  "limites": {
    "deposito": {
      "minimo": 10000,
      "maximo": 10000000,
      "diario": 5000000
    },
    "retiro": {
      "minimo": 50000,
      "maximo": 5000000,
      "diario": 2000000
    },
    "saldo": {
      "maximo": 20000000
    }
  },
  "comisiones": {
    "deposito": {
      "porcentaje": 0,
      "fija": 0
    },
    "retiro": {
      "porcentaje": 2,
      "fija": 1000,
      "maximo": 10000
    },
    "juego": {
      "porcentaje": 20,
      "descripcion": "20% de comisión del sistema"
    }
  },
  "premios": {
    "distribucion": {
      "primer_lugar": 80,
      "segundo_lugar": 15,
      "tercer_lugar": 5
    },
    "minimo_ganador": 1000
  },
  "seguridad": {
    "expiracion_transaccion": 30,
    "max_intentos_hora": 10,
    "tiempo_entre_transacciones": 5,
    "validaciones": {
      "verificar_saldo_antes_pago": true,
      "verificar_limites_diarios": true,
      "verificar_duplicados": true,
      "registrar_auditoria": true
    }
  },
  "moneda": {
    "codigo": "VES",
    "simbolo": "Bs",
    "decimales": 2,
    "formato": "es-VE"
  },
  "mensajes": {
    "saldo_insuficiente": "",
    "pago_exitoso": "",
    "premio_ganado": "",
    "deposito_exitoso": "",
    "retiro_solicitado": "",
    "limite_excedido": "",
    "error_transaccion": ""
  },
  "estados_transaccion": {
    "PENDIENTE": "pendiente",
    "COMPLETADA": "completada",
    "FALLIDA": "fallida",
    "CANCELADA": "cancelada",
    "REVERTIDA": "revertida"
  },
  "tipos_transaccion": {
    "DEPOSITO": "deposito",
    "RETIRO": "retiro",
    "PAGO_ENTRADA": "pago_entrada",
    "PREMIO": "premio",
    "COMISION": "comision",
    "REEMBOLSO": "reembolso"
  }
};

module.exports = PAYMENT_CONFIG;
