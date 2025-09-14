# 🐳 Guía de Docker para El Patio

Esta guía te ayudará a manejar los contenedores de Docker del proyecto El Patio.

## 📋 Comandos Básicos

### Iniciar todos los servicios

```bash
# Linux/Mac
docker-compose -f docker/compose/docker-compose.dev.yml up -d

# Windows PowerShell
docker-compose -f docker/compose/docker-compose.dev.yml up -d
```

### Detener todos los servicios

```bash
docker-compose -f docker/compose/docker-compose.dev.yml down
```

### Ver estado de los contenedores

```bash
docker-compose -f docker/compose/docker-compose.dev.yml ps
```

### Ver logs de un servicio

```bash
docker-compose -f docker/compose/docker-compose.dev.yml logs -f [servicio]
```

## 🔄 Actualizar después de cambios

### Opción 1: Usar el script automático (Recomendado)

#### En Linux/Mac:

```bash
# Actualizar todos los servicios
./scripts/docker-update.sh

# Actualizar solo el bot
./scripts/docker-update.sh bot-telegram

# Actualizar con reconstrucción forzada
./scripts/docker-update.sh -f backend

# Actualizar y mostrar logs
./scripts/docker-update.sh -l miniapps
```

#### En Windows PowerShell:

```powershell
# Actualizar todos los servicios
.\scripts\docker-update.ps1

# Actualizar solo el bot
.\scripts\docker-update.ps1 bot-telegram

# Actualizar con reconstrucción forzada
.\scripts\docker-update.ps1 -Force backend

# Actualizar y mostrar logs
.\scripts\docker-update.ps1 -Logs miniapps
```

### Opción 2: Comandos manuales

#### Actualizar un servicio específico:

```bash
# 1. Detener el servicio
docker-compose -f docker/compose/docker-compose.dev.yml stop bot-telegram

# 2. Eliminar el contenedor
docker-compose -f docker/compose/docker-compose.dev.yml rm -f bot-telegram

# 3. Reconstruir (si es necesario)
docker-compose -f docker/compose/docker-compose.dev.yml build bot-telegram

# 4. Iniciar el servicio
docker-compose -f docker/compose/docker-compose.dev.yml up -d bot-telegram
```

#### Actualizar todos los servicios:

```bash
# 1. Detener todos los servicios
docker-compose -f docker/compose/docker-compose.dev.yml down

# 2. Reconstruir (si es necesario)
docker-compose -f docker/compose/docker-compose.dev.yml build

# 3. Iniciar todos los servicios
docker-compose -f docker/compose/docker-compose.dev.yml up -d
```

## 🏗️ Servicios Disponibles

| Servicio       | Puerto | Descripción                        |
| -------------- | ------ | ---------------------------------- |
| `bot-telegram` | -      | Bot de Telegram                    |
| `backend`      | 3001   | API Backend (puerto interno: 5000) |
| `miniapps`     | 3002   | Mini Apps (puerto interno: 3000)   |
| `mongodb`      | 27017  | Base de datos MongoDB              |
| `redis`        | 6379   | Cache Redis                        |

## 🔧 Comandos Útiles

### Ver logs en tiempo real

```bash
# Todos los servicios
docker-compose -f docker/compose/docker-compose.dev.yml logs -f

# Servicio específico
docker-compose -f docker/compose/docker-compose.dev.yml logs -f bot-telegram
```

### Entrar a un contenedor

```bash
# Entrar al contenedor del bot
docker exec -it elpatio-bot bash

# Entrar al contenedor del backend
docker exec -it elpatio-backend bash
```

### Ver uso de recursos

```bash
docker stats
```

### Limpiar contenedores no utilizados

```bash
# Eliminar contenedores parados
docker container prune

# Eliminar imágenes no utilizadas
docker image prune

# Limpieza completa (¡CUIDADO!)
docker system prune -a
```

## 🚨 Solución de Problemas

### El contenedor no se actualiza

```bash
# Forzar reconstrucción completa
docker-compose -f docker/compose/docker-compose.dev.yml build --no-cache bot-telegram
```

### Puerto ya está en uso

```bash
# Ver qué proceso usa el puerto
netstat -tulpn | grep :3001

# Detener el proceso o cambiar el puerto en docker-compose.dev.yml
```

### Problemas de permisos (Linux/Mac)

```bash
# Dar permisos de ejecución al script
chmod +x scripts/docker-update.sh
```

### Problemas de políticas de ejecución (Windows)

```powershell
# Permitir ejecución de scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📁 Estructura de Volúmenes

Los volúmenes están configurados para desarrollo con hot-reload:

- `../../bot-telegram:/app` - Código del bot
- `../../elpatio-backend:/app` - Código del backend
- `../../elpatio-miniapps:/app` - Código de las mini apps
- `/app/node_modules` - Dependencias de Node.js (no se sobrescriben)

## 🔄 Flujo de Trabajo Recomendado

1. **Hacer cambios en el código**
2. **Usar el script de actualización:**

   ```bash
   # Linux/Mac
   ./scripts/docker-update.sh bot-telegram

   # Windows
   .\scripts\docker-update.ps1 bot-telegram
   ```

3. **Verificar que funcione:**
   ```bash
   docker-compose -f docker/compose/docker-compose.dev.yml logs -f bot-telegram
   ```

## 💡 Tips

- **Para desarrollo:** Los volúmenes están montados, así que los cambios se reflejan automáticamente
- **Para producción:** Usa `docker-compose.prod.yml` y reconstruye las imágenes
- **Para debugging:** Usa `docker logs` para ver errores
- **Para limpieza:** Usa `docker system prune` periódicamente para liberar espacio

## 🆘 Comandos de Emergencia

### Reiniciar todo desde cero

```bash
# Detener y eliminar todo
docker-compose -f docker/compose/docker-compose.dev.yml down -v

# Eliminar imágenes
docker-compose -f docker/compose/docker-compose.dev.yml down --rmi all

# Reconstruir todo
docker-compose -f docker/compose/docker-compose.dev.yml up -d --build
```

### Ver todos los contenedores (incluyendo parados)

```bash
docker ps -a
```

### Ver logs de un contenedor específico

```bash
docker logs elpatio-bot
```
