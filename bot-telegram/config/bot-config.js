/**
 * Configuración del Bot de Telegram - El Patio
 * Archivo refactorizado y organizado
 */

const BOT_CONFIG = {
  // Juegos disponibles con sus modos y límites específicos
  juegos: [
    {
      id: "ludo",
      nombre: "🎲 Ludo",
      descripcion: "El clásico juego de mesa",
      disponible: true,
      modos: {
        "1v1": { nombre: "1 vs 1", limiteJugadores: 2 },
        "2v2": { nombre: "2 vs 2", limiteJugadores: 4 },
        "1v1v1v1": { nombre: "1 vs 1 vs 1 vs 1", limiteJugadores: 4 },
      },
    },
    {
      id: "domino",
      nombre: "🂋 Dominó",
      descripcion: "Juego de fichas",
      disponible: false,
      modos: {
        // Modos futuros para dominó
        "2v2": { nombre: "2 vs 2", limiteJugadores: 4 },
        "1v1v1v1": { nombre: "1 vs 1 vs 1 vs 1", limiteJugadores: 4 },
      },
    },
  ],

  // Comandos implementados del bot (aparecen en el menú)
  commands: [
    // Comandos principales
    { command: "start", description: "🚀 Iniciar el bot" },
    { command: "juegos", description: "🎮 Seleccionar juego" },
    { command: "mijuego", description: "👁️ Ver mi juego" },
    { command: "cambiarjuego", description: "🔄 Cambiar juego" },
    { command: "salas", description: "🏠 Ver salas disponibles" },
    { command: "crearsala", description: "🏗️ Crear sala (en desarrollo)" },
    { command: "miperfil", description: "👤 Ver mi perfil" },
    { command: "ayuda", description: "❓ Ver ayuda" },

    // Comandos de administración
    { command: "stats", description: "📊 Ver estadísticas (admin)" },
    { command: "token", description: "🔐 Ver estado del token (admin)" },
    { command: "setwelcome", description: "🔧 Configurar comandos (admin)" },
    { command: "setupmeta", description: "📝 Configurar metadatos (admin)" },
    { command: "cleanup", description: "🧹 Limpiar configuración (admin)" },
    { command: "restore", description: "♻️ Restaurar configuración (admin)" },
    {
      command: "abandonlimits",
      description: "🚫 Ver límites de abandono (admin)",
    },
    {
      command: "abandonsystem",
      description: "📊 Estadísticas del sistema de límites (admin)",
    },
    {
      command: "debug-webapp",
      description: "🔧 Debug configuración Mini Apps (admin)",
    },
    {
      command: "checkabandons",
      description: "🔍 Verificar estado de abandonos de un jugador (admin)",
    },
    {
      command: "resetabandons",
      description: "🔄 Resetear contadores de abandonos (admin)",
    },
  ],

  // Teclado personalizado que aparece después de /start
  customKeyboard: {
    keyboard: [
      ["🎮 Seleccionar Juego", "🏠 Ver Salas"],
      ["🏗️ Crear Sala", "❓ Ayuda"],
      ["👤 Mi Perfil"],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  },

  // Configuración de cache preparada para migración futura
  cache: {
    // Estrategia de cache actual: 'local' | 'backend' | 'redis'
    type: process.env.CACHE_TYPE || "local",

    // Configuración para Redis futuro
    redis: {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      ttl: {
        displayName: 3600, // 1 hora
        salaInfo: 1800, // 30 minutos
        userProfile: 7200, // 2 horas
        onlineStatus: 300, // 5 minutos
        gameStats: 14400, // 4 horas
      },
    },

    // Configuración para backend con cache
    backend: {
      useCache: process.env.BACKEND_USE_CACHE === "true",
      cacheEndpoints: {
        displayName: "/api/users/display-name",
        salas: "/api/salas/disponibles",
        userProfile: "/api/users/profile",
        onlineUsers: "/api/users/online",
      },
    },

    // Configuración para cache local (actual)
    local: {
      ttl: {
        displayName: 3600, // 1 hora
        userState: 86400, // 24 horas
        gameSelection: 1800, // 30 minutos
      },
      cleanupInterval: 86400000, // 24 horas en ms
      maxInactiveDays: 30,
    },
  },

  // Mensajes informativos
  messages: {
    start: (nombre) => `¡Hola ${nombre}! Bienvenido a El Patio.

📋 <b>Para comenzar:</b>
• Selecciona un juego y automáticamente verás las salas disponibles
• Si no hay salas, puedes crear una nueva

¿Qué te gustaría hacer?`,

    help: `📋 <b>Comandos disponibles:</b>

🎮 <b>Comandos principales:</b>
• /start - Iniciar el bot
• /juegos - Seleccionar juego
• /mijuego - Ver mi juego seleccionado
• /cambiarjuego - Cambiar de juego
• /salas - Ver salas disponibles
• /crearsala - Crear nueva sala
• /miperfil - Ver mi perfil
• /ayuda - Ver esta ayuda

👤 <b>Perfil:</b>
• 👤 Mi Perfil - Ver mi información (botón)
• /miperfil - Ver mi perfil completo

     🔧 <b>Administración:</b> (solo admin)
     • /stats - Ver estadísticas de uso
     • /setwelcome - Configurar comandos del bot
     • /setupmeta - Configurar metadatos del bot
     • /abandonlimits - Ver límites de abandono de un jugador
     • /abandonsystem - Ver estadísticas del sistema de límites
     • /checkabandons - Verificar estado de abandonos de un jugador
     • /resetabandons - Resetear contadores de abandonos de un jugador

💡 <b>Flujo automático:</b>
1. Selecciona un juego con /juegos
2. Automáticamente verás las salas disponibles
3. Si no hay salas, puedes crear una nueva

¿Necesitas ayuda con algo específico?`,

    profile: (displayName, user) => `👤 **Tu Perfil:**

🎮 Nickname: ${displayName}
🆔 ID: ${user.id}
📅 Usuario desde: ${new Date().toLocaleDateString("es-ES")}

⚠️ **Funciones próximas:**
• Estadísticas de juego
• Historial de partidas
• Configuración de perfil`,

    noSalas: "No hay salas disponibles por ahora.",
    error: "Error procesando tu solicitud. Intenta de nuevo.",
    unknown:
      "No entiendo ese comando. Escribe /ayuda para ver las opciones disponibles.",

    // Mensajes para selección de juegos
    seleccionJuego: `🎮 **Selecciona un juego:**

Elige el juego que quieres jugar:`,

    juegoNoDisponible: (nombreJuego) => `🚧 **${nombreJuego} - Próximamente**

¡Gracias por tu interés! ${nombreJuego} estará disponible muy pronto.

🎲 **Por ahora puedes jugar:**
• Ludo - El clásico juego de mesa

¡Mantente atento a las actualizaciones!`,

    noJuegoSeleccionado:
      "❌ Primero debes seleccionar un juego. Usa /juegos o el botón '🎮 Seleccionar Juego'.",

    // Mensajes para salas
    tituloSalas: (nombreJuego) => `🏠 **Salas disponibles para ${nombreJuego}**

Selecciona una sala para unirte:`,

    noSalasDisponibles: (
      nombreJuego
    ) => `❌ **No hay salas disponibles para ${nombreJuego}**

💡 **Opciones:**
• Crea una nueva sala con /crearsala
• Cambia de juego con /juegos
• Espera a que otros creen salas`,

    // Mensajes de desarrollo
    enDesarrollo:
      "⚠️ **Función en desarrollo**\nEsta funcionalidad estará disponible pronto.",
  },
};

module.exports = BOT_CONFIG;
