# Configuración del Dominio elpatio.games en Fly.io

Este documento explica cómo configurar tu dominio personalizado `elpatio.games` para usarlo con tus aplicaciones en Fly.io.

## Arquitectura Propuesta

```
elpatio.games
├── api.elpatio.games       → Backend (Fly.io)
├── bot.elpatio.games       → Bot Telegram (Fly.io) [opcional]
└── app.elpatio.games       → Miniapps (Vercel)
```

O estructura alternativa:

```
elpatio.games
├── elpatio.games           → Landing/Website principal
├── api.elpatio.games       → Backend API
└── play.elpatio.games      → Miniapps
```

## Paso 1: Certificado SSL en Fly.io

Fly.io genera automáticamente certificados SSL gratuitos mediante Let's Encrypt.

### Agregar dominio al Backend

```bash
cd elpatio-backend

# Agregar el dominio
fly certs create api.elpatio.games

# Verificar estado del certificado
fly certs show api.elpatio.games

# Lista todos los certificados
fly certs list
```

### Agregar dominio al Bot (Opcional)

```bash
cd bot-telegram

# Solo si el bot necesita ser accesible vía web (webhooks)
fly certs create bot.elpatio.games
```

## Paso 2: Configurar DNS

Ve a tu proveedor de dominio (donde compraste `elpatio.games`) y agrega estos registros DNS:

### Opción A: Registros CNAME (Recomendado)

| Tipo  | Nombre | Valor                     | TTL  |
| ----- | ------ | ------------------------- | ---- |
| CNAME | `api`  | `elpatio-backend.fly.dev` | 3600 |
| CNAME | `bot`  | `elpatio-bot.fly.dev`     | 3600 |

### Opción B: Registros A e AAAA (Alternativa)

Fly.io te dará las IPs cuando ejecutes `fly certs show`:

| Tipo | Nombre | Valor              | TTL  |
| ---- | ------ | ------------------ | ---- |
| A    | `api`  | `[IPv4 de Fly.io]` | 3600 |
| AAAA | `api`  | `[IPv6 de Fly.io]` | 3600 |

### Dominio Principal (Opcional)

Si quieres que `elpatio.games` (sin subdominios) apunte al backend:

| Tipo | Nombre | Valor              | TTL  |
| ---- | ------ | ------------------ | ---- |
| A    | `@`    | `[IPv4 de Fly.io]` | 3600 |
| AAAA | `@`    | `[IPv6 de Fly.io]` | 3600 |

⚠️ **Nota**: No puedes usar CNAME para el dominio raíz (`@`), debes usar registros A/AAAA.

## Paso 3: Verificar Propagación DNS

Espera 5-30 minutos para que los cambios DNS se propaguen. Verifica con:

```bash
# Windows PowerShell
nslookup api.elpatio.games

# O usa herramientas online
# https://dnschecker.org
# https://www.whatsmydns.net
```

## Paso 4: Verificar Certificado SSL

Una vez que DNS esté propagado:

```bash
cd elpatio-backend
fly certs check api.elpatio.games

# Deberías ver:
# ✓ Certificate is configured correctly
```

Si hay problemas:

```bash
fly certs show api.elpatio.games
# Muestra detalles y posibles errores
```

## Paso 5: Actualizar Variables de Entorno

### Backend

Actualiza CORS para permitir el nuevo dominio:

```bash
cd elpatio-backend
fly secrets set CORS_ORIGIN="https://elpatio.games,https://api.elpatio.games,https://app.elpatio.games,https://elpatio-miniapps.vercel.app"
```

### Bot

Si el bot necesita conocer la URL del backend:

```bash
cd bot-telegram
fly secrets set BACKEND_URL="https://api.elpatio.games"
```

### Miniapps en Vercel

En el dashboard de Vercel, actualiza:

```env
API_BASE_URL=https://api.elpatio.games
```

## Paso 6: Configurar Dominio en Vercel (Miniapps)

Para las miniapps en Vercel con subdominios personalizados:

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. **Settings** → **Domains**
3. Agrega `app.elpatio.games` (o `play.elpatio.games`)
4. Vercel te dará instrucciones sobre qué registros DNS agregar

Típicamente necesitarás:

| Tipo  | Nombre | Valor                  | TTL  |
| ----- | ------ | ---------------------- | ---- |
| CNAME | `app`  | `cname.vercel-dns.com` | 3600 |

## Paso 7: Probar la Configuración

### Backend

```bash
# Probar con HTTPS
curl https://api.elpatio.games/health

# Debería retornar:
# {"status":"OK","timestamp":"..."}
```

### Verificar certificado SSL

```bash
# Windows
curl -I https://api.elpatio.games

# Debería mostrar: HTTP/2 200
```

### Desde el navegador

Visita:

- https://api.elpatio.games/health
- https://app.elpatio.games (miniapps)

Verifica que el candado SSL esté presente (🔒).

## Configuración Avanzada

### Redirigir www a dominio principal

Si quieres que `www.elpatio.games` redirija a `elpatio.games`:

1. En tu proveedor DNS, agrega:

   ```
   CNAME www elpatio.games
   ```

2. En Fly.io (si usas el dominio raíz):
   ```bash
   fly certs create www.elpatio.games
   ```

### Múltiples Dominios

Puedes tener varios dominios apuntando a la misma app:

```bash
fly certs create api.elpatio.games
fly certs create backend.elpatio.games
fly certs create v1.api.elpatio.games
```

### Wildcard Certificate

Para cubrir todos los subdominios:

```bash
fly certs create *.elpatio.games
```

⚠️ Requiere validación DNS especial.

## Troubleshooting

### "Certificate validation failed"

- Verifica que el DNS esté propagado correctamente
- Espera más tiempo (puede tomar hasta 48 horas en casos extremos)
- Verifica que el registro DNS sea correcto

### "CORS error" en las miniapps

- Verifica que `CORS_ORIGIN` en el backend incluya todos tus dominios
- Asegúrate de usar `https://` (no `http://`)

### "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"

- El certificado aún se está generando, espera unos minutos
- Ejecuta: `fly certs check api.elpatio.games`

### Backend accesible por fly.dev y dominio personalizado

Esto es normal. Tu app será accesible en:

- `https://elpatio-backend.fly.dev` (URL de Fly.io)
- `https://api.elpatio.games` (tu dominio personalizado)

Ambas URLs funcionarán. Si quieres forzar el uso de solo una, puedes configurar redirecciones en tu código.

## Resumen de URLs Finales

Después de la configuración completa:

| Servicio     | URL Fly.io (por defecto)            | URL Personalizada         |
| ------------ | ----------------------------------- | ------------------------- |
| **Backend**  | https://elpatio-backend.fly.dev     | https://api.elpatio.games |
| **Bot**      | https://elpatio-bot.fly.dev         | https://bot.elpatio.games |
| **Miniapps** | https://elpatio-miniapps.vercel.app | https://app.elpatio.games |

## Comandos Útiles

```bash
# Ver certificados configurados
fly certs list

# Ver detalles de un certificado
fly certs show api.elpatio.games

# Forzar renovación de certificado
fly certs check api.elpatio.games

# Eliminar certificado
fly certs delete api.elpatio.games

# Ver información de la app
fly info
```

## Próximos Pasos

1. ✅ Configura los registros DNS en tu proveedor
2. ✅ Agrega los certificados en Fly.io
3. ✅ Espera a que DNS se propague
4. ✅ Verifica los certificados SSL
5. ✅ Actualiza las variables de entorno
6. ✅ Prueba todas las URLs
7. ✅ Actualiza la documentación de tu proyecto con las nuevas URLs
