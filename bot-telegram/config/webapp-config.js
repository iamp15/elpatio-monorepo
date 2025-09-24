/**
 * Configuración de Mini Apps (Web Apps) de Telegram
 * Versión: 2.0.0 - Configuración limpia y profesional
 */

const WEBAPP_CONFIG = {
  // Configuración por ambiente
  ENVIRONMENT: process.env.NODE_ENV || "development",

  // URLs base por ambiente
  BASE_URLS: {
    development: {
      miniapps: "https://elpatio-miniapps.vercel.app", // Usar Vercel para HTTPS
      backend: "https://elpatio-backend-production.up.railway.app/api", // Usar Railway también en development
    },
    production: {
      miniapps: "https://elpatio-miniapps.vercel.app",
      backend: "https://elpatio-backend-production.up.railway.app/api", // Usar Railway en production
    },
  },

  // URLs de las Mini Apps
  URLS: {
    DEPOSITO: null, // Se calcula dinámicamente
    RETIRO: null, // Se calcula dinámicamente
    SALAS: null, // Se calcula dinámicamente
    CONFIG: null, // Se calcula dinámicamente
  },

  // Configuración de la Mini App de depósitos
  DEPOSITO: {
    NAME: "Depósitos - El Patio",
    DESCRIPTION: "Realiza depósitos de forma segura y rápida",
    VERSION: "1.0.0",

    AMOUNTS: {
      MIN: 1, // Monto mínimo en Bs
      MAX: 10000, // Monto máximo en Bs
      DEFAULT: 50, // Monto por defecto en Bs
    },

    TIMEOUTS: {
      CAJERO_ASSIGNMENT: 30000, // 30 segundos
      PAYMENT_CONFIRMATION: 300000, // 5 minutos
      TRANSACTION_EXPIRY: 1800000, // 30 minutos
    },
  },

  // Configuración de comunicación con el backend
  BACKEND: {
    ENDPOINTS: {
      SALDO: "/jugadores/:telegramId/saldo",
      TRANSACCIONES: "/transacciones",
      CAJEROS: "/cajeros",
    },

    AUTH: {
      WEBAPP_TOKEN: process.env.WEBAPP_TOKEN || "webapp-secret-token",
      HEADERS: {
        "Content-Type": "application/json",
        "X-WebApp-Token": process.env.WEBAPP_TOKEN || "webapp-secret-token",
      },
    },
  },

  // Configuración de logging
  LOGGING: {
    ENABLED: process.env.LOG_LEVEL !== "silent",
    LEVEL: process.env.LOG_LEVEL || "info",
    WEBAPP_PREFIX: "[WEBAPP]",
  },
};

/**
 * Inicializa las URLs dinámicamente basado en el ambiente
 */
function initializeUrls() {
  const env = WEBAPP_CONFIG.ENVIRONMENT;
  const baseUrls =
    WEBAPP_CONFIG.BASE_URLS[env] || WEBAPP_CONFIG.BASE_URLS.development;

  // Calcular URLs de mini apps
  WEBAPP_CONFIG.URLS.DEPOSITO = `${baseUrls.miniapps}/depositos/`;
  WEBAPP_CONFIG.URLS.RETIRO = `${baseUrls.miniapps}/retiros/`;
  WEBAPP_CONFIG.URLS.SALAS = `${baseUrls.miniapps}/salas/`;
  WEBAPP_CONFIG.URLS.CONFIG = `${baseUrls.miniapps}/configuracion/`;

  // Actualizar URL del backend
  WEBAPP_CONFIG.BACKEND.URL = baseUrls.backend;

  if (WEBAPP_CONFIG.LOGGING.ENABLED) {
    console.log(
      `${WEBAPP_CONFIG.LOGGING.WEBAPP_PREFIX} URLs inicializadas para ambiente: ${env}`
    );
    console.log(
      `${WEBAPP_CONFIG.LOGGING.WEBAPP_PREFIX} Backend: ${baseUrls.backend}`
    );
    console.log(
      `${WEBAPP_CONFIG.LOGGING.WEBAPP_PREFIX} Mini Apps: ${baseUrls.miniapps}`
    );
  }
}

/**
 * Obtiene la URL de una Mini App específica
 * @param {string} appName - Nombre de la Mini App (DEPOSITO, RETIRO, etc.)
 * @returns {string} URL de la Mini App
 */
function getWebAppUrl(appName) {
  // Inicializar URLs si no están configuradas
  if (!WEBAPP_CONFIG.URLS.DEPOSITO) {
    initializeUrls();
  }

  const url = WEBAPP_CONFIG.URLS[appName.toUpperCase()];
  if (!url) {
    throw new Error(`Mini App '${appName}' no encontrada en la configuración`);
  }

  if (WEBAPP_CONFIG.LOGGING.ENABLED) {
    console.log(
      `${WEBAPP_CONFIG.LOGGING.WEBAPP_PREFIX} URL para ${appName}: ${url}`
    );
  }

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
 * Obtiene el endpoint completo del backend
 * @param {string} endpoint - Endpoint relativo
 * @param {Object} params - Parámetros para reemplazar en el endpoint
 * @returns {string} URL completa del endpoint
 */
function getBackendEndpoint(endpoint, params = {}) {
  // Inicializar URLs si no están configuradas
  if (!WEBAPP_CONFIG.BACKEND.URL) {
    initializeUrls();
  }

  let fullEndpoint = endpoint;

  // Reemplazar parámetros en el endpoint
  Object.keys(params).forEach((key) => {
    fullEndpoint = fullEndpoint.replace(`:${key}`, params[key]);
  });

  return `${WEBAPP_CONFIG.BACKEND.URL}${fullEndpoint}`;
}

/**
 * Valida la configuración de Mini Apps
 * @returns {boolean} true si la configuración es válida
 */
function validateWebAppConfig() {
  const errors = [];

  // Validar ambiente
  if (!["development", "production"].includes(WEBAPP_CONFIG.ENVIRONMENT)) {
    errors.push(`Ambiente inválido: ${WEBAPP_CONFIG.ENVIRONMENT}`);
  }

  // Validar URLs base
  const baseUrls = WEBAPP_CONFIG.BASE_URLS[WEBAPP_CONFIG.ENVIRONMENT];
  if (!baseUrls) {
    errors.push(
      `No hay configuración para ambiente: ${WEBAPP_CONFIG.ENVIRONMENT}`
    );
  } else {
    if (!baseUrls.miniapps || !baseUrls.backend) {
      errors.push("URLs base incompletas para el ambiente actual");
    }
  }

  // Validar configuración de depósitos
  const depositoConfig = WEBAPP_CONFIG.DEPOSITO;
  if (depositoConfig.AMOUNTS.MIN >= depositoConfig.AMOUNTS.MAX) {
    errors.push("Monto mínimo debe ser menor al monto máximo");
  }

  if (errors.length > 0) {
    console.error(
      `${WEBAPP_CONFIG.LOGGING.WEBAPP_PREFIX} Errores de configuración:`,
      errors
    );
    return false;
  }

  if (WEBAPP_CONFIG.LOGGING.ENABLED) {
    console.log(
      `${WEBAPP_CONFIG.LOGGING.WEBAPP_PREFIX} Configuración validada correctamente`
    );
  }

  return true;
}

// Inicializar URLs al cargar el módulo
initializeUrls();

module.exports = {
  WEBAPP_CONFIG,
  getWebAppUrl,
  getWebAppConfig,
  getBackendEndpoint,
  validateWebAppConfig,
};
