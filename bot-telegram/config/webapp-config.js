/**
 * Configuración de Mini Apps (Web Apps) de Telegram
 */

const WEBAPP_CONFIG = {
  // URLs de las Mini Apps
  URLS: {
    // Mini App de depósitos - URL de producción de Vercel
    DEPOSITO:
      process.env.WEBAPP_DEPOSITO_URL ||
      "https://elpatio-miniapps-4858oihdx-igors-projects-bc0633eb.vercel.app/depositos/",

    // Mini App de retiros (futuro)
    RETIRO:
      process.env.WEBAPP_RETIRO_URL ||
      "https://elpatio-miniapps-4858oihdx-igors-projects-bc0633eb.vercel.app/retiros/",

    // Mini App de salas (futuro)
    SALAS:
      process.env.WEBAPP_SALAS_URL ||
      "https://elpatio-miniapps-4858oihdx-igors-projects-bc0633eb.vercel.app/salas/",

    // Mini App de configuración (futuro)
    CONFIG:
      process.env.WEBAPP_CONFIG_URL ||
      "https://elpatio-miniapps-4858oihdx-igors-projects-bc0633eb.vercel.app/configuracion/",
  },

  // Configuración de desarrollo
  DEVELOPMENT: {
    // URL local para desarrollo
    LOCAL_URL: "http://localhost:3000/depositos/",

    // Usar URL local en desarrollo (cambiar a false para usar producción)
    USE_LOCAL: false,

    // URL de desarrollo de Vercel (opcional)
    DEV_URL:
      "https://elpatio-miniapps-git-main-igors-projects-bc0633eb.vercel.app",
  },

  // Configuración de la Mini App de depósitos
  DEPOSITO: {
    // Nombre de la Mini App
    NAME: "Depósitos - El Patio",

    // Descripción
    DESCRIPTION: "Realiza depósitos de forma segura y rápida",

    // Versión
    VERSION: "1.0.0",

    // Configuración de montos
    AMOUNTS: {
      MIN: 1, // Monto mínimo en Bs
      MAX: 10000, // Monto máximo en Bs
      DEFAULT: 50, // Monto por defecto en Bs
    },

    // Configuración de timeouts
    TIMEOUTS: {
      CAJERO_ASSIGNMENT: 30000, // 30 segundos para asignar cajero
      PAYMENT_CONFIRMATION: 300000, // 5 minutos para confirmar pago
      TRANSACTION_EXPIRY: 1800000, // 30 minutos para expirar transacción
    },
  },

  // Configuración de comunicación con el backend
  BACKEND: {
    // URL del backend del bot
    URL: process.env.BACKEND_URL || "http://localhost:3000/api",

    // Endpoints para Mini Apps
    ENDPOINTS: {
      // Webhook para recibir datos de Mini Apps
      WEBAPP_WEBHOOK: "/webapp",

      // Endpoints específicos de depósitos
      DEPOSITO: {
        CREATE_REQUEST: "/transacciones/solicitud",
        GET_TRANSACTION: "/transacciones",
        CONFIRM_PAYMENT: "/transacciones",
        GET_CAJEROS: "/transacciones/cajeros-disponibles",
        ASSIGN_CAJERO: "/transacciones",
        GET_HISTORY: "/transacciones/jugador",
      },
    },

    // Configuración de autenticación
    AUTH: {
      // Token para autenticar requests de Mini Apps
      WEBAPP_TOKEN: process.env.WEBAPP_TOKEN || "webapp-secret-token",

      // Headers requeridos
      HEADERS: {
        "Content-Type": "application/json",
        "X-WebApp-Token": process.env.WEBAPP_TOKEN || "webapp-secret-token",
      },
    },
  },

  // Configuración de notificaciones
  NOTIFICATIONS: {
    // Habilitar notificaciones push
    ENABLED: true,

    // Configuración de notificaciones por estado
    STATES: {
      CAJERO_ASSIGNED: {
        ENABLED: true,
        MESSAGE:
          "¡Cajero asignado! Revisa los datos bancarios para realizar tu pago.",
      },
      PAYMENT_CONFIRMED: {
        ENABLED: true,
        MESSAGE: "Pago confirmado. El cajero verificará tu transacción.",
      },
      TRANSACTION_COMPLETED: {
        ENABLED: true,
        MESSAGE: "¡Depósito completado! Tu saldo ha sido acreditado.",
      },
      TRANSACTION_REJECTED: {
        ENABLED: true,
        MESSAGE:
          "Transacción rechazada. Contacta al soporte para más información.",
      },
    },
  },

  // Configuración de logging
  LOGGING: {
    // Habilitar logs detallados
    ENABLED: true,

    // Nivel de logs
    LEVEL: process.env.LOG_LEVEL || "info",

    // Logs específicos de Mini Apps
    WEBAPP_LOGS: {
      ENABLED: true,
      PREFIX: "[WEBAPP]",
    },
  },
};

/**
 * Obtiene la URL de una Mini App específica
 * @param {string} appName - Nombre de la Mini App (DEPOSITO, RETIRO, etc.)
 * @returns {string} URL de la Mini App
 */
function getWebAppUrl(appName) {
  const config = WEBAPP_CONFIG;

  // Si estamos en desarrollo y queremos usar local
  if (config.DEVELOPMENT.USE_LOCAL && process.env.NODE_ENV !== "production") {
    console.log(
      `[WEBAPP] Usando URL local para ${appName}: ${config.DEVELOPMENT.LOCAL_URL}`
    );
    return config.DEVELOPMENT.LOCAL_URL;
  }

  // Usar URL de producción
  const url = config.URLS[appName.toUpperCase()];
  if (!url) {
    throw new Error(`Mini App '${appName}' no encontrada en la configuración`);
  }

  console.log(`[WEBAPP] Usando URL de producción para ${appName}: ${url}`);
  return url;
}

/**
 * Obtiene la configuración de una Mini App específica
 * @param {string} appName - Nombre de la Mini App
 * @returns {Object} Configuración de la Mini App
 */
function getWebAppConfig(appName) {
  const config = WEBAPP_CONFIG[appName.toUpperCase()];
  if (!config) {
    throw new Error(`Configuración para Mini App '${appName}' no encontrada`);
  }
  return config;
}

/**
 * Valida la configuración de Mini Apps
 * @returns {boolean} true si la configuración es válida
 */
function validateWebAppConfig() {
  const config = WEBAPP_CONFIG;
  const errors = [];

  // Validar URLs
  Object.keys(config.URLS).forEach((appName) => {
    const url = config.URLS[appName];
    if (!url || !url.startsWith("https://")) {
      errors.push(`URL de ${appName} debe ser HTTPS: ${url}`);
    }
  });

  // Validar configuración de depósitos
  const depositoConfig = config.DEPOSITO;
  if (depositoConfig.AMOUNTS.MIN >= depositoConfig.AMOUNTS.MAX) {
    errors.push("Monto mínimo debe ser menor al monto máximo");
  }

  if (errors.length > 0) {
    console.error("[WEBAPP] Errores de configuración:", errors);
    return false;
  }

  console.log("[WEBAPP] Configuración validada correctamente");
  return true;
}

/**
 * Obtiene el endpoint completo del backend
 * @param {string} endpoint - Endpoint relativo
 * @returns {string} URL completa del endpoint
 */
function getBackendEndpoint(endpoint) {
  const baseUrl = WEBAPP_CONFIG.BACKEND.URL;
  return `${baseUrl}${endpoint}`;
}

module.exports = {
  WEBAPP_CONFIG,
  getWebAppUrl,
  getWebAppConfig,
  validateWebAppConfig,
  getBackendEndpoint,
};
