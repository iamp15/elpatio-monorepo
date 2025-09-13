/**
 * Configuración centralizada de variables de entorno
 * Este archivo centraliza toda la lógica de variables de entorno
 */

require("dotenv").config();

/**
 * Configuración de variables de entorno
 */
const ENV_CONFIG = {
  // Variables requeridas (el bot no funcionará sin ellas)
  required: {
    BOT_TOKEN: {
      value: process.env.BOT_TOKEN,
      description: "Token del bot de Telegram",
      validate: (value) => value && value.length > 0,
    },
    BACKEND_URL: {
      value: process.env.BACKEND_URL,
      description: "URL del backend",
      validate: (value) =>
        value && (value.startsWith("http://") || value.startsWith("https://")),
    },
    BOT_EMAIL: {
      value: process.env.BOT_EMAIL,
      description: "Email del bot para autenticación",
      validate: (value) => value && value.includes("@"),
    },
    BOT_PASSWORD: {
      value: process.env.BOT_PASSWORD,
      description: "Contraseña del bot para autenticación",
      validate: (value) => value && value.length > 0,
    },
  },

  // Variables opcionales (el bot funcionará con valores por defecto)
  optional: {
    ADMIN_ID: {
      value: process.env.ADMIN_ID,
      description: "ID del administrador del bot",
      defaultValue: null,
      validate: (value) => !value || /^\d+$/.test(value),
    },
    TEST_MODE: {
      value: process.env.TEST_MODE === "true",
      description: "Modo de prueba (true/false)",
      defaultValue: false,
      validate: (value) => typeof value === "boolean",
    },
    MODE: {
      value: process.env.MODE,
      description: "Modo de operación (development/production)",
      defaultValue: "development",
      validate: (value) =>
        !value || ["development", "production", "test"].includes(value),
    },
    BOT_JWT: {
      value: process.env.BOT_JWT,
      description:
        "JWT predefinido del bot (obsoleto, usar BOT_EMAIL + BOT_PASSWORD)",
      defaultValue: null,
      validate: (value) => !value || value.length > 0,
    },
  },

  // Variables de cache (futuras implementaciones)
  cache: {
    CACHE_TYPE: {
      value: process.env.CACHE_TYPE,
      description: "Tipo de cache (local/redis/backend)",
      defaultValue: "local",
      validate: (value) =>
        !value || ["local", "redis", "backend"].includes(value),
    },
    REDIS_HOST: {
      value: process.env.REDIS_HOST,
      description: "Host de Redis",
      defaultValue: "localhost",
      validate: (value) => !value || value.length > 0,
    },
    REDIS_PORT: {
      value: process.env.REDIS_PORT,
      description: "Puerto de Redis",
      defaultValue: 6379,
      validate: (value) =>
        !value || (parseInt(value) > 0 && parseInt(value) < 65536),
    },
  },
};

/**
 * Valida todas las variables de entorno
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];

  // Validar variables requeridas
  Object.entries(ENV_CONFIG.required).forEach(([key, config]) => {
    if (!config.value || !config.validate(config.value)) {
      errors.push(
        `❌ ${key}: ${config.description} - NO CONFIGURADO O INVÁLIDO`
      );
    }
  });

  // Validar variables opcionales
  Object.entries(ENV_CONFIG.optional).forEach(([key, config]) => {
    if (
      config.value !== undefined &&
      config.value !== null &&
      !config.validate(config.value)
    ) {
      warnings.push(
        `⚠️ ${key}: ${config.description} - VALOR INVÁLIDO, usando valor por defecto`
      );
    }
  });

  // Validar variables de cache
  Object.entries(ENV_CONFIG.cache).forEach(([key, config]) => {
    if (
      config.value !== undefined &&
      config.value !== null &&
      !config.validate(config.value)
    ) {
      warnings.push(
        `⚠️ ${key}: ${config.description} - VALOR INVÁLIDO, usando valor por defecto`
      );
    }
  });

  return { errors, warnings };
}

/**
 * Obtiene el valor de una variable de entorno con validación
 */
function getEnvVar(key, defaultValue = null) {
  // Buscar en variables requeridas
  if (ENV_CONFIG.required[key]) {
    return ENV_CONFIG.required[key].value;
  }

  // Buscar en variables opcionales
  if (ENV_CONFIG.optional[key]) {
    const config = ENV_CONFIG.optional[key];
    return config.value !== undefined && config.value !== null
      ? config.value
      : config.defaultValue;
  }

  // Buscar en variables de cache
  if (ENV_CONFIG.cache[key]) {
    const config = ENV_CONFIG.cache[key];
    return config.value !== undefined && config.value !== null
      ? config.value
      : config.defaultValue;
  }

  // Variable no encontrada
  return defaultValue;
}

/**
 * Obtiene todas las variables de entorno validadas
 */
function getAllEnvVars() {
  const result = {};

  // Agregar variables requeridas
  Object.keys(ENV_CONFIG.required).forEach((key) => {
    result[key] = getEnvVar(key);
  });

  // Agregar variables opcionales
  Object.keys(ENV_CONFIG.optional).forEach((key) => {
    result[key] = getEnvVar(key);
  });

  // Agregar variables de cache
  Object.keys(ENV_CONFIG.cache).forEach((key) => {
    result[key] = getEnvVar(key);
  });

  return result;
}

/**
 * Verifica si el entorno está configurado correctamente
 */
function isEnvironmentValid() {
  const { errors } = validateEnvironment();
  return errors.length === 0;
}

/**
 * Muestra el estado del entorno
 */
function showEnvironmentStatus() {
  console.log("🔍 **ESTADO DEL ENTORNO**\n");

  const { errors, warnings } = validateEnvironment();

  // Mostrar variables requeridas
  console.log("🔴 **Variables Requeridas:**");
  Object.entries(ENV_CONFIG.required).forEach(([key, config]) => {
    const value = config.value;
    const isValid = config.validate(value);
    const status = isValid ? "✅" : "❌";
    const displayValue =
      key.includes("TOKEN") || key.includes("PASSWORD")
        ? value
          ? value.substring(0, 8) + "..."
          : "NO CONFIGURADO"
        : value || "NO CONFIGURADO";

    console.log(`   ${status} ${key}: ${displayValue}`);
  });

  // Mostrar variables opcionales
  console.log("\n📋 **Variables Opcionales:**");
  Object.entries(ENV_CONFIG.optional).forEach(([key, config]) => {
    const value = config.value;
    const isValid = !value || config.validate(value);
    const status = isValid ? "✅" : "⚠️";
    const displayValue =
      value !== undefined && value !== null ? value : config.defaultValue;

    console.log(`   ${status} ${key}: ${displayValue}`);
  });

  // Mostrar variables de cache
  console.log("\n📋 **Variables de Cache:**");
  Object.entries(ENV_CONFIG.cache).forEach(([key, config]) => {
    const value = config.value;
    const isValid = !value || config.validate(value);
    const status = isValid ? "✅" : "⚠️";
    const displayValue =
      value !== undefined && value !== null ? value : config.defaultValue;

    console.log(`   ${status} ${key}: ${displayValue}`);
  });

  // Mostrar errores y advertencias
  if (errors.length > 0) {
    console.log("\n❌ **Errores Críticos:**");
    errors.forEach((error) => console.log(`   ${error}`));
  }

  if (warnings.length > 0) {
    console.log("\n⚠️ **Advertencias:**");
    warnings.forEach((warning) => console.log(`   ${warning}`));
  }

  // Resumen
  console.log("\n" + "=".repeat(60));
  if (errors.length === 0) {
    console.log("✅ **Entorno configurado correctamente**");
    console.log("\n🚀 Para iniciar el bot:");
    console.log("   npm run dev");
  } else {
    console.log("❌ **El entorno tiene errores críticos**");
    console.log(
      "\n📝 Crea o actualiza tu archivo .env con las variables requeridas"
    );
  }

  return { errors, warnings };
}

module.exports = {
  ENV_CONFIG,
  validateEnvironment,
  getEnvVar,
  getAllEnvVars,
  isEnvironmentValid,
  showEnvironmentStatus,
};
