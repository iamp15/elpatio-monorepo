"use strict";

/**
 * Validador de nicknames con restricciones avanzadas
 */

// Lista de palabras no permitidas (groserías, insultos, palabras inapropiadas)
const FORBIDDEN_WORDS = [
  // Groserías básicas
  "puto",
  "puta",
  "mierda",
  "joder",
  "coño",
  "cabron",
  "cabrón",
  "hijueputa",
  "malparido",
  "gonorrea",
  "marica",
  "maricon",
  "maricón",
  "idiota",
  "imbecil",
  "imbécil",
  "estupido",
  "estúpido",
  "pendejo",
  "pendeja",
  "culero",
  "culera",

  // Insultos
  "idiota",
  "estupido",
  "estúpido",
  "tonto",
  "bobo",
  "payaso",
  "animal",
  "bestia",
  "cerdo",
  "cochino",
  "sucio",
  "asqueroso",
  "feo",
  "horrible",

  // Palabras ofensivas relacionadas con drogas
  "drogas",
  "marihuana",
  "cocaine",
  "cocaina",
  "heroina",
  "crack",
  "droga",

  // Palabras relacionadas con violencia
  "matar",
  "asesino",
  "muerte",
  "muerto",
  "sangre",
  "violencia",
  "golpear",

  // Palabras sexuales explícitas
  "sexo",
  "pene",
  "vagina",
  "senos",
  "nalgas",
  "culo",
  "tetas",
  "verga",

  // Palabras discriminatorias
  "negro",
  "negra",
  "indio",
  "india",
  "gordo",
  "gorda",
  "flaco",
  "flaca",

  // Palabras relacionadas con apuestas ilegales
  "tramposo",
  "trampa",
  "estafa",
  "estafador",
  "ladron",
  "ladrón",

  // Palabras comunes de spam/bot
  "admin",
  "administrador",
  "moderador",
  "bot",
  "sistema",
  "server",
  "test",
  "oficial",
  "support",
  "ayuda",
  "help",

  // Variaciones con números
  "puto1",
  "puta1",
  "idiota1",
  "tonto1",
  "admin1",
  "bot1",

  // Palabras en inglés ofensivas
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "damn",
  "hell",
  "stupid",
  "idiot",
  "kill",
  "die",
  "death",
  "blood",
  "sex",
  "porn",
  "drug",
  "drugs",
];

// Patrones adicionales no permitidos
const FORBIDDEN_PATTERNS = [
  /^admin/i, // Palabras que empiecen con "admin"
  /^mod/i, // Palabras que empiecen con "mod"
  /^bot/i, // Palabras que empiecen con "bot"
  /^test/i, // Palabras que empiecen con "test"
  /^support/i, // Palabras que empiecen con "support"
  /\d{6,}/, // 6 o más números consecutivos (más permisivo)
  /^[0-9]+$/, // Solo números
  /(.)\1{3,}/, // 4 o más caracteres repetidos consecutivos (aaaa, 1111, etc.)
];

/**
 * Valida el formato básico del nickname
 * @param {string} nickname - El nickname a validar
 * @returns {object} Resultado de la validación
 */
function validateNicknameFormat(nickname) {
  // Verificar longitud
  if (!nickname || nickname.length < 3) {
    return {
      valid: false,
      error: "El nickname debe tener al menos 3 caracteres",
    };
  }

  if (nickname.length > 32) {
    return {
      valid: false,
      error: "El nickname no puede tener más de 32 caracteres",
    };
  }

  // Verificar que sea una sola palabra (sin espacios)
  if (/\s/.test(nickname)) {
    return {
      valid: false,
      error: "El nickname debe ser una sola palabra (sin espacios)",
    };
  }

  // Verificar caracteres permitidos (letras incluyendo ñ, números, guión y guión bajo)
  if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ0-9_-]+$/.test(nickname)) {
    return {
      valid: false,
      error:
        "El nickname solo puede contener letras (incluyendo ñ), números, guiones (-) y guiones bajos (_)",
    };
  }

  // Verificar que no empiece o termine con guión o guión bajo
  if (/^[-_]|[-_]$/.test(nickname)) {
    return {
      valid: false,
      error: "El nickname no puede empezar o terminar con guión o guión bajo",
    };
  }

  // Verificar que tenga al menos una letra
  if (!/[a-zA-Z]/.test(nickname)) {
    return {
      valid: false,
      error: "El nickname debe contener al menos una letra",
    };
  }

  return { valid: true };
}

/**
 * Verifica si el nickname contiene palabras prohibidas
 * @param {string} nickname - El nickname a validar
 * @returns {object} Resultado de la validación
 */
function validateForbiddenWords(nickname) {
  const lowerNickname = nickname.toLowerCase();

  // Verificar palabras exactas prohibidas
  for (const word of FORBIDDEN_WORDS) {
    if (
      lowerNickname === word.toLowerCase() ||
      lowerNickname.includes(word.toLowerCase())
    ) {
      return {
        valid: false,
        error: "El nickname contiene palabras no permitidas",
      };
    }
  }

  // Verificar patrones prohibidos
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(nickname)) {
      return {
        valid: false,
        error: "El nickname contiene un formato no permitido",
      };
    }
  }

  return { valid: true };
}

/**
 * Validación completa del nickname
 * @param {string} nickname - El nickname a validar
 * @returns {object} Resultado de la validación completa
 */
function validateNickname(nickname) {
  if (!nickname) {
    return {
      valid: false,
      error: "El nickname es requerido",
    };
  }

  // Limpiar espacios al inicio y final
  const cleanNickname = nickname.trim();

  // Verificar si el usuario quiere usar su nombre de Telegram
  if (cleanNickname.toLowerCase() === "-no") {
    return {
      valid: true,
      nickname: "SIN_NICKNAME", // Valor único para indicar "sin nickname"
      useTelegramName: true,
    };
  }

  // Validar formato
  const formatValidation = validateNicknameFormat(cleanNickname);
  if (!formatValidation.valid) {
    return formatValidation;
  }

  // Validar palabras prohibidas
  const wordValidation = validateForbiddenWords(cleanNickname);
  if (!wordValidation.valid) {
    return wordValidation;
  }

  return {
    valid: true,
    nickname: cleanNickname,
  };
}

/**
 * Genera sugerencias de nicknames alternativos
 * @param {string} originalNickname - El nickname original
 * @returns {array} Lista de sugerencias
 */
function generateNicknameSuggestions(originalNickname) {
  const base = originalNickname.toLowerCase().replace(/[^a-z0-9]/g, "");
  const suggestions = [];

  if (base.length >= 3) {
    suggestions.push(
      `${base}${Math.floor(Math.random() * 100)}`,
      `${base}_gamer`,
      `${base}_player`,
      `el_${base}`,
      `${base}_pro`
    );
  }

  // Sugerencias genéricas si el base es muy corto
  if (suggestions.length === 0) {
    const genericSuggestions = [
      `gamer_${Math.floor(Math.random() * 1000)}`,
      `player_${Math.floor(Math.random() * 1000)}`,
      `jugador_${Math.floor(Math.random() * 1000)}`,
      `pro_${Math.floor(Math.random() * 1000)}`,
    ];
    suggestions.push(...genericSuggestions);
  }

  return suggestions.slice(0, 3); // Máximo 3 sugerencias
}

module.exports = {
  validateNickname,
  validateNicknameFormat,
  validateForbiddenWords,
  generateNicknameSuggestions,
  FORBIDDEN_WORDS,
  FORBIDDEN_PATTERNS,
};
