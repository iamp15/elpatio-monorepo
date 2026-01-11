# 🚀 Guía Completa de Migración a Fly.io - El Patio

Este documento contiene toda la información sobre la migración del backend y bot de Telegram a Fly.io.

## 📊 Arquitectura Actual

```
┌──────────────────────────────────────────────────────┐
│ Producción                                           │
├──────────────────────────────────────────────────────┤
│ Backend:       Fly.io (elpatio-backend.fly.dev)     │
│ Bot Telegram:  Fly.io (elpatio-bot.fly.dev)         │
│ Miniapps:      Vercel (elpatio-miniapps.vercel.app) │
│ MongoDB:       MongoDB Atlas (cloud)                 │
│ Redis:         (Pendiente) Upstash/Fly.io           │
└──────────────────────────────────────────────────────┘
```

## 🎯 Recursos Utilizados (Plan Gratuito)

| Recurso        | Uso Actual   | Límite Gratuito | Estado           |
| -------------- | ------------ | --------------- | ---------------- |
| **VMs Fly.io** | 2 VMs        | 3 VMs           | ✅ 66% usado     |
| **RAM Total**  | 512 MB       | 768 MB          | ✅ 66% usado     |
| **Backend**    | 1 VM (256MB) | -               | ✅ Activo        |
| **Bot**        | 1 VM (256MB) | -               | ✅ Activo        |
| **MongoDB**    | Atlas 512MB  | 512MB           | ✅ Plan gratuito |
| **Bandwidth**  | ~5-10 GB/mes | 100 GB/mes      | ✅ Sobra         |
| **Miniapps**   | Vercel       | Ilimitado       | ✅ Gratis        |

**💰 Costo Total: $0/mes**

## 📁 Estructura del Proyecto

```
proyecto-el-patio/
├── elpatio-backend/
│   ├── Dockerfile              ← Para Fly.io
│   ├── .dockerignore           ← Optimiza builds
│   ├── fly.toml                ← Configuración Fly.io
│   └── FLYIO_SETUP.md          ← Instrucciones de variables
│
├── bot-telegram/
│   ├── Dockerfile              ← Para Fly.io
│   ├── .dockerignore           ← Optimiza builds
│   ├── fly.toml                ← Configuración Fly.io
│   └── FLYIO_SETUP.md          ← Instrucciones de variables
│
├── elpatio-miniapps/
│   └── VERCEL_SETUP.md         ← Configuración de Vercel
│
├── .github/
│   ├── workflows/
│   │   └── deploy-flyio.yml    ← Deploy automático
│   └── FLYIO_GITHUB_ACTIONS_SETUP.md
│
├── DOMINIO_ELPATIO_GAMES.md    ← Configuración de dominio
└── package.json                 ← Scripts de Fly.io
```

## 🛠️ Comandos Rápidos

### Deploy Manual

```bash
# Backend
npm run fly:deploy:backend
# o
cd elpatio-backend && fly deploy

# Bot
npm run fly:deploy:bot
# o
cd bot-telegram && fly deploy
```

### Logs en Tiempo Real

```bash
# Backend
npm run fly:logs:backend
# o
fly logs -a elpatio-backend

# Bot
npm run fly:logs:bot
# o
fly logs -a elpatio-bot
```

### Estado y Monitoreo

```bash
# Ver estado de las apps
fly status -a elpatio-backend
fly status -a elpatio-bot

# Ver apps de la organización
fly apps list

# Dashboard web
# https://fly.io/dashboard
```

### Gestión de Secrets (Variables de Entorno)

```bash
cd elpatio-backend

# Listar secrets
fly secrets list

# Agregar/Actualizar secret
fly secrets set VARIABLE="valor"

# Importar desde archivo .env
fly secrets import < .env.production

# Eliminar secret
fly secrets unset VARIABLE
```

### Escalar Recursos

```bash
# Aumentar RAM (saldrás del plan gratuito)
fly scale memory 512 -a elpatio-backend

# Múltiples instancias (saldrás del plan gratuito)
fly scale count 2 -a elpatio-backend

# Ver configuración actual
fly scale show -a elpatio-backend
```

## 📚 Documentación por Servicio

### Backend

- **Dockerfile**: `elpatio-backend/Dockerfile`
- **Configuración**: `elpatio-backend/fly.toml`
- **Variables**: `elpatio-backend/FLYIO_SETUP.md`
- **URL**: https://elpatio-backend.fly.dev
- **Health Check**: https://elpatio-backend.fly.dev/health

### Bot Telegram

- **Dockerfile**: `bot-telegram/Dockerfile`
- **Configuración**: `bot-telegram/fly.toml`
- **Variables**: `bot-telegram/FLYIO_SETUP.md`
- **Modo**: Polling (no expone HTTP)

### Miniapps

- **Configuración**: `elpatio-miniapps/VERCEL_SETUP.md`
- **URL**: https://elpatio-miniapps.vercel.app
- **Deploy**: Automático desde GitHub

### Dominio Personalizado

- **Guía Completa**: `DOMINIO_ELPATIO_GAMES.md`
- **Dominio**: elpatio.games
- **Subdominios Propuestos**:
  - `api.elpatio.games` → Backend
  - `app.elpatio.games` → Miniapps

## 🔄 Deploy Automático con GitHub Actions

El proyecto está configurado para deploy automático:

### Triggers

- **Push a `main`/`master`** con cambios en:
  - `elpatio-backend/` → Despliega backend
  - `bot-telegram/` → Despliega bot
- **Commit con `[backend]` o `[bot]`** en el mensaje
- **Manual** desde GitHub Actions

### Configuración

1. Obtén token: `fly auth token`
2. Agrégalo en GitHub:
   - **Settings** → **Secrets** → **Actions**
   - Name: `FLY_API_TOKEN`

Ver: `.github/FLYIO_GITHUB_ACTIONS_SETUP.md`

## 🔐 Variables de Entorno Requeridas

### Backend

```bash
NODE_ENV=production
PORT=3000
MONGODB_URI="mongodb+srv://..."
JWT_SECRET="tu-secret"
JWT_EXPIRES_IN="24h"
CORS_ORIGIN="https://elpatio-miniapps.vercel.app,https://api.elpatio.games"
```

### Bot

```bash
NODE_ENV=production
BOT_TOKEN="tu-bot-token"
BACKEND_URL="https://elpatio-backend.fly.dev"
BOT_EMAIL="email"
BOT_PASSWORD="password"
```

### Miniapps (Vercel)

```bash
API_BASE_URL="https://elpatio-backend.fly.dev"
NODE_ENV="production"
MERCADOPAGO_PUBLIC_KEY="tu-key"
```

## 🚨 Troubleshooting

### Backend no responde

```bash
# Ver logs
fly logs -a elpatio-backend -f

# Verificar estado
fly status -a elpatio-backend

# Reiniciar
fly apps restart elpatio-backend
```

### Bot no responde a comandos

```bash
# Ver logs
fly logs -a elpatio-bot -f

# Verificar estado
fly status -a elpatio-bot

# Verificar variables
fly secrets list -a elpatio-bot
```

### Error de CORS

- Verifica que `CORS_ORIGIN` incluya todas las URLs necesarias
- Recuerda usar `https://` (no `http://`)
- Formato: URLs separadas por comas, sin espacios

### MongoDB connection timeout

- Verifica que MongoDB Atlas permita IPs de Fly.io
- En Atlas → Network Access → Add IP Address → `0.0.0.0/0` (para desarrollo)
- O agrega IPs específicas de Fly.io

### Deploy falla en GitHub Actions

- Verifica que `FLY_API_TOKEN` esté configurado
- Revisa los logs en GitHub Actions
- Prueba deploy manual: `fly deploy`

## 📈 Monitoreo y Límites

### Verificar Uso de Recursos

```bash
# Dashboard web (recomendado)
# https://fly.io/dashboard

# Ver métricas de la app
fly status -a elpatio-backend
fly status -a elpatio-bot
```

### Límites del Plan Gratuito

- ✅ 3 VMs shared-cpu-1x (256MB cada una)
- ✅ 160 GB bandwidth entrante/mes
- ✅ 100 GB bandwidth saliente/mes
- ✅ 3 GB volúmenes persistentes
- ⚠️ Auto-suspend desactivado (consumirá horas 24/7)

**Nota**: Con `auto_stop_machines = 'off'` y `min_machines_running = 1`, tus apps están siempre activas, lo cual es ideal para un bot de Telegram.

## 🔮 Próximas Mejoras

### Implementar Redis

Cuando necesites Redis:

```bash
# Opción 1: Upstash (recomendado para plan gratuito)
# https://upstash.com/

# Opción 2: Redis en Fly.io (usa 3ra VM gratuita)
fly apps create elpatio-redis
# Configurar volumen y desplegar Redis
```

### Agregar Dominio Personalizado

Ver guía completa: `DOMINIO_ELPATIO_GAMES.md`

```bash
# Agregar certificado SSL
fly certs create api.elpatio.games

# Configurar DNS en tu proveedor
# CNAME api → elpatio-backend.fly.dev
```

### Implementar CI/CD Completo

- ✅ Deploy automático (ya configurado)
- ⏳ Tests automáticos antes de deploy
- ⏳ Rollback automático si falla health check
- ⏳ Notificaciones a Telegram/Discord

## 📞 Soporte

### Documentación Oficial

- Fly.io Docs: https://fly.io/docs
- Fly.io Community: https://community.fly.io
- Fly.io Status: https://status.fly.io

### Comandos de Ayuda

```bash
# Ayuda general
fly help

# Ayuda de un comando específico
fly deploy --help

# Versión de fly
fly version
```

## ✅ Checklist de Migración

- [x] Limpiar configuración Docker innecesaria
- [x] Optimizar Dockerfiles para Fly.io
- [x] Instalar y configurar Fly CLI
- [x] Crear aplicación backend en Fly.io
- [x] Crear aplicación bot en Fly.io
- [x] Configurar variables de entorno (pendiente: valores reales)
- [x] Configurar GitHub Actions
- [x] Documentar configuración de Vercel
- [x] Documentar configuración de dominio
- [ ] Configurar secrets con valores reales
- [ ] Hacer primer deploy del backend
- [ ] Hacer primer deploy del bot
- [ ] Probar endpoints del backend
- [ ] Probar comandos del bot
- [ ] Configurar dominio elpatio.games
- [ ] Actualizar URLs en miniapps
- [ ] Probar integración completa

---

**🎉 ¡Migración a Fly.io completada con éxito!**

Para cualquier duda, revisa la documentación específica en cada carpeta o contacta al equipo.
