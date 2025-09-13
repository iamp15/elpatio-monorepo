# Guía de Migración a Monorepo

Esta guía te ayudará a migrar tus repositorios existentes (`elpatio-backend` y `elpatio-miniapps`) al nuevo monorepo.

## 📋 Prerrequisitos

- Node.js >= 18.0.0
- npm >= 8.0.0
- Docker y Docker Compose (opcional)
- Git

## 🚀 Pasos de Migración

### 1. Preparar el Monorepo

```bash
# Clonar o descargar el monorepo
git clone <tu-repo-monorepo> el-patio-monorepo
cd el-patio-monorepo

# Instalar dependencias
npm run install:deps
```

### 2. Migrar Repositorios Existentes

#### Opción A: Usar el Script Automático

```bash
# Ejecutar script de migración
npm run migrate:repos
```

El script te pedirá:

- URL del repositorio `elpatio-backend`
- URL del repositorio `elpatio-miniapps`
- Rama a migrar (por defecto: `main`)

#### Opción B: Migración Manual

```bash
# Crear directorios temporales
mkdir temp-migration
cd temp-migration

# Clonar repositorios existentes
git clone <url-elpatio-backend> elpatio-backend
git clone <url-elpatio-miniapps> elpatio-miniapps

# Copiar archivos al monorepo
cp -r elpatio-backend/* ../elpatio-backend/
cp -r elpatio-miniapps/* ../elpatio-miniapps/

# Limpiar
cd ..
rm -rf temp-migration
```

### 3. Configurar Variables de Entorno

```bash
# Crear archivos .env para cada servicio
npm run setup:env
```

Luego edita cada archivo `.env` con tus valores reales:

- `bot-telegram/.env`
- `elpatio-backend/.env`
- `elpatio-miniapps/.env`
- `.env` (para Docker)

### 4. Instalar Dependencias

```bash
# Instalar todas las dependencias
npm run install:deps
```

### 5. Probar la Configuración

#### Desarrollo Local

```bash
# Ejecutar todos los servicios
npm run dev
```

#### Con Docker

```bash
# Ejecutar con Docker
npm run docker:dev
```

## 🔧 Configuración Post-Migración

### Backend (elpatio-backend)

1. **Actualizar conexión a MongoDB:**

   - El archivo `config/db.js` ya está configurado para usar `MONGODB_URI`
   - Asegúrate de que tu `.env` tenga la URL correcta

2. **Verificar rutas de API:**
   - Las rutas deben estar en `routes/`
   - Los controladores en `controllers/`
   - Los modelos en `models/`

### Miniapps (elpatio-miniapps)

1. **Configurar URLs de API:**

   - Actualiza `config.js` con la URL correcta del backend
   - Verifica que las miniapps apunten al backend correcto

2. **Verificar archivos estáticos:**
   - Los archivos HTML, CSS y JS deben estar en el directorio raíz
   - Cada miniapp debe tener su propio subdirectorio

### Bot Telegram (bot-telegram)

1. **Configurar webhook:**
   - Actualiza la URL del webhook en las variables de entorno
   - Verifica que el bot pueda comunicarse con el backend

## 🐳 Configuración Docker

### Desarrollo

```bash
# Levantar solo servicios de base de datos
docker-compose up mongodb redis

# O levantar todos los servicios
npm run docker:dev
```

### Producción

```bash
# Construir imágenes
npm run build

# Ejecutar en producción
npm run docker:prod
```

## 📁 Estructura Final del Monorepo

```
el-patio-monorepo/
├── bot-telegram/              # Bot de Telegram
│   ├── handlers/
│   ├── utils/
│   ├── config/
│   └── package.json
├── elpatio-backend/           # API Backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   └── package.json
├── elpatio-miniapps/          # Mini Apps
│   ├── depositos/
│   ├── retiros/
│   ├── salas/
│   └── package.json
├── packages/                  # Paquetes compartidos
├── docker/                    # Configuración Docker
│   ├── compose/
│   └── services/
├── scripts/                   # Scripts de utilidad
├── package.json              # Configuración del monorepo
└── README.md
```

## 🚨 Resolución de Problemas

### Error de Dependencias

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules
rm -rf */node_modules
npm run install:deps
```

### Error de Conexión a Base de Datos

1. Verifica que MongoDB esté ejecutándose
2. Revisa la URL de conexión en `.env`
3. Asegúrate de que las credenciales sean correctas

### Error de Docker

```bash
# Limpiar contenedores y volúmenes
npm run clean

# Reconstruir imágenes
npm run build
```

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Revisa los logs: `npm run logs`
2. Verifica las variables de entorno
3. Asegúrate de que todos los servicios estén ejecutándose
4. Consulta la documentación específica de cada servicio

## ✅ Checklist de Migración

- [ ] Repositorios migrados exitosamente
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas
- [ ] Servicios ejecutándose localmente
- [ ] Docker funcionando (opcional)
- [ ] Pruebas básicas pasando
- [ ] Documentación actualizada

¡Felicitaciones! Tu monorepo está listo para usar. 🎉
