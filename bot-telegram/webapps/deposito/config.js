/**
 * Configuración de la Mini App de Depósitos
 */

const CONFIG = {
  // URL del backend
  BACKEND_URL: process.env.BACKEND_URL || "https://tu-backend.com",

  // Endpoints de la API
  ENDPOINTS: {
    CREATE_DEPOSIT_REQUEST: "/api/transacciones/solicitud",
    CONFIRM_USER_PAYMENT: "/api/transacciones/:id/confirmar-pago-usuario",
    GET_TRANSACTION_DETAILS: "/api/transacciones/:id",
    GET_AVAILABLE_CASHIERS: "/api/transacciones/cajeros-disponibles",
    ASSIGN_CASHIER: "/api/transacciones/:id/asignar-cajero",
    CONFIRM_CASHIER_TRANSACTION: "/api/transacciones/:id/confirmar",
    REJECT_CASHIER_TRANSACTION: "/api/transacciones/:id/rechazar",
  },

  // Configuración de la app
  APP: {
    MIN_AMOUNT: 1, // Bs
    MAX_AMOUNT: 1000000, // Bs
    POLLING_INTERVAL: 5000, // 5 segundos
    TIMEOUT: 300000, // 5 minutos
    RETRY_ATTEMPTS: 3,
  },

  // Estados de transacción
  TRANSACTION_STATES: {
    PENDING: "pending",
    IN_PROCESS: "in_process",
    CONFIRMED: "confirmed",
    COMPLETED: "completed",
    REJECTED: "rejected",
  },

  // Bancos disponibles
  BANKS: [
    { id: "banco-venezuela", name: "Banco de Venezuela" },
    { id: "banesco", name: "Banesco" },
    { id: "mercantil", name: "Mercantil" },
    { id: "provincial", name: "Provincial" },
    { id: "bicentenario", name: "Bicentenario" },
    { id: "100-banco", name: "100% Banco" },
    { id: "banco-caribe", name: "Banco del Caribe" },
    { id: "banco-exterior", name: "Banco Exterior" },
    { id: "banco-plaza", name: "Banco Plaza" },
    { id: "banco-sofitasa", name: "Sofitasa" },
  ],

  // Mensajes
  MESSAGES: {
    LOADING: "Cargando...",
    ERROR_AUTH: "Error de autenticación",
    ERROR_NETWORK: "Error de conexión",
    ERROR_SERVER: "Error del servidor",
    SUCCESS_PAYMENT: "Pago confirmado exitosamente",
    CASHIER_ASSIGNED: "Cajero asignado",
    TRANSACTION_COMPLETED: "Transacción completada",
  },

  // Configuración de polling
  POLLING: {
    ENABLED: true,
    INTERVAL: 5000,
    MAX_ATTEMPTS: 60, // 5 minutos máximo
  },
};

/**
 * Obtiene la URL completa de un endpoint
 * @param {string} endpoint - Nombre del endpoint
 * @param {Object} params - Parámetros para reemplazar en la URL
 * @returns {string} URL completa
 */
function getEndpointUrl(endpoint, params = {}) {
  let url = CONFIG.BACKEND_URL + CONFIG.ENDPOINTS[endpoint];

  // Reemplazar parámetros en la URL
  Object.keys(params).forEach((key) => {
    url = url.replace(`:${key}`, params[key]);
  });

  return url;
}

/**
 * Realiza una petición HTTP
 * @param {string} url - URL de la petición
 * @param {Object} options - Opciones de la petición
 * @returns {Promise} Respuesta de la petición
 */
async function makeRequest(url, options = {}) {
  const defaultOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${window.Telegram?.WebApp?.initData || ""}`,
    },
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, finalOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en petición:", error);
    throw error;
  }
}

/**
 * Valida el monto ingresado
 * @param {number} amount - Monto a validar
 * @returns {Object} Resultado de la validación
 */
function validateAmount(amount) {
  const numAmount = Number(amount);

  if (isNaN(numAmount)) {
    return { valid: false, message: "El monto debe ser un número válido" };
  }

  if (numAmount < CONFIG.APP.MIN_AMOUNT) {
    return {
      valid: false,
      message: `El monto mínimo es ${CONFIG.APP.MIN_AMOUNT} Bs`,
    };
  }

  if (numAmount > CONFIG.APP.MAX_AMOUNT) {
    return {
      valid: false,
      message: `El monto máximo es ${CONFIG.APP.MAX_AMOUNT} Bs`,
    };
  }

  return { valid: true, message: "Monto válido" };
}

/**
 * Formatea un monto para mostrar
 * @param {number} amount - Monto a formatear
 * @returns {string} Monto formateado
 */
function formatAmount(amount) {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convierte bolívares a centavos
 * @param {number} bolivares - Monto en bolívares
 * @returns {number} Monto en centavos
 */
function toCents(bolivares) {
  return Math.round(bolivares * 100);
}

/**
 * Convierte centavos a bolívares
 * @param {number} cents - Monto en centavos
 * @returns {number} Monto en bolívares
 */
function toBolivares(cents) {
  return cents / 100;
}

// Exportar configuración y funciones
window.CONFIG = CONFIG;
window.getEndpointUrl = getEndpointUrl;
window.makeRequest = makeRequest;
window.validateAmount = validateAmount;
window.formatAmount = formatAmount;
window.toCents = toCents;
window.toBolivares = toBolivares;
