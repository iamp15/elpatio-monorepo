# Configuración de Variables de Entorno para el Bot en Fly.io

## Bot Telegram (bot-telegram)

Ejecuta estos comandos desde el directorio `bot-telegram`:

```bash
# Variables obligatorias
fly secrets set NODE_ENV=production
fly secrets set BOT_TOKEN="tu_bot_token_de_telegram"
fly secrets set BACKEND_URL="https://elpatio-backend.fly.dev"

# Credenciales del bot para autenticarse en el backend
fly secrets set BOT_EMAIL="email_del_bot@example.com"
fly secrets set BOT_PASSWORD="password_seguro"

# JWT del bot (si se usa pre-token)
# fly secrets set BOT_JWT="token_jwt_si_lo_usas"
```

## Verificar secrets configurados

```bash
fly secrets list
```

## Notas importantes

1. **BOT_TOKEN**: Obtén este token de @BotFather en Telegram
2. **BACKEND_URL**: Usa la URL de Fly.io del backend: `https://elpatio-backend.fly.dev`
3. **BOT_EMAIL/PASSWORD**: Estas credenciales deben coincidir con un usuario tipo "bot" en tu backend
4. El bot usa polling por defecto (no webhooks), por lo que no necesita exponer un puerto HTTP

## Verificar que el bot esté corriendo

Después del deploy:

```bash
fly logs -a elpatio-bot

# Deberías ver algo como:
# ✅ Bot autenticado en el backend
# 🤖 Bot iniciado correctamente
```

## Cambiar de polling a webhooks (opcional)

Si en el futuro quieres usar webhooks en lugar de polling:

1. Modifica el código del bot para usar webhooks
2. Actualiza `fly.toml` para agregar `http_service`
3. Configura el webhook de Telegram:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://elpatio-bot.fly.dev/webhook"
   ```
