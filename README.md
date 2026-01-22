# El Patio - Monorepo

Este es el monorepo principal para el proyecto El Patio, que incluye:

- **bot-telegram**: Bot de Telegram para gestión de salas de juego
- **elpatio-backend**: API REST para el backend del sistema
- **elpatio-miniapps**: Mini aplicaciones web para Telegram
- **packages**: Paquetes compartidos entre servicios

## Estructura del Proyecto

```
el-patio-monorepo/
├── bot-telegram/          # Bot de Telegram
├── elpatio-backend/       # API Backend
├── elpatio-miniapps/      # Mini Apps
├── packages/              # Paquetes compartidos
├── docker/                # Configuración Docker
└── scripts/               # Scripts de utilidad
```

## Requisitos

- Node.js >= 18.0.0
- npm >= 8.0.0
- Docker y Docker Compose

## Instalación

### Clonar el proyecto completo (con submodules)

Este proyecto utiliza Git Submodules para manejar los repositorios de `bot-telegram`, `elpatio-backend`, `elpatio-miniapps`, `elpatio-dashboard` y `elpatio-appCajeros`. Para clonar el proyecto completo en una nueva máquina:

```bash
# Clonar el repositorio principal con todos los submodules
git clone --recurse-submodules https://github.com/iamp15/elpatio-monorepo.git

# O si ya clonaste sin submodules, inicialízalos después:
cd elpatio-monorepo
git submodule update --init --recursive
```

### Actualizar submodules después de un pull

Si trabajas desde múltiples máquinas (oficina y casa), después de hacer `git pull` en el monorepo, actualiza los submodules:

```bash
# Actualizar todos los submodules a sus últimas versiones
git submodule update --remote

# O para actualizar un submodule específico
git submodule update --remote bot-telegram
git submodule update --remote elpatio-backend
git submodule update --remote elpatio-miniapps
git submodule update --remote elpatio-dashboard
git submodule update --remote elpatio-appCajeros
```

### Instalar dependencias

```bash
# Instalar dependencias de todos los workspaces
npm run install:all

# O instalar individualmente
npm install
```

## Desarrollo

```bash
# Ejecutar todos los servicios en modo desarrollo
npm run dev

# Ejecutar con Docker
npm run docker:dev
```

## Producción

```bash
# Ejecutar en producción
npm run prod

# Ejecutar con Docker en producción
npm run docker:prod
```

## Scripts Disponibles

- `npm run dev` - Desarrollo local
- `npm run prod` - Producción local
- `npm run docker:dev` - Desarrollo con Docker
- `npm run docker:prod` - Producción con Docker
- `npm run build` - Construir imágenes Docker
- `npm run up` - Levantar servicios
- `npm run down` - Detener servicios
- `npm run logs` - Ver logs de todos los servicios
- `npm run logs:bot` - Ver logs del bot
- `npm run logs:backend` - Ver logs del backend
- `npm run logs:miniapps` - Ver logs de miniapps

## Servicios Docker

- **bot-telegram**: Bot de Telegram
- **backend**: API REST
- **miniapps**: Mini aplicaciones web
- **mongodb**: Base de datos MongoDB
- **redis**: Cache Redis

## Configuración

Cada servicio tiene su propio archivo de configuración en su directorio correspondiente. Los archivos `.env` deben ser configurados según las necesidades del entorno.
