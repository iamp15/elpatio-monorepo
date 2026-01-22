# Guía de Git Submodules - El Patio Monorepo

Este proyecto utiliza **Git Submodules** para manejar los repositorios de `bot-telegram`, `elpatio-backend`, `elpatio-miniapps`, `elpatio-dashboard` y `elpatio-appCajeros` como repositorios independientes dentro del monorepo.

## ¿Qué son los Submodules?

Los submodules permiten mantener repositorios Git separados dentro de un repositorio principal. Esto es útil cuando:
- Tienes repositorios independientes que forman parte de un proyecto más grande
- Quieres mantener el historial y las versiones de cada repositorio separados
- Necesitas trabajar con diferentes equipos en diferentes partes del proyecto

## Estructura de Repositorios

- **elpatio-monorepo**: Repositorio principal (ignora `bot-telegram`, `elpatio-backend`, `elpatio-miniapps`, `elpatio-dashboard` y `elpatio-appCajeros`)
- **bot-telegram**: Repositorio del bot de Telegram (submodule)
- **elpatio-backend**: Repositorio del backend (submodule)
- **elpatio-miniapps**: Repositorio de las miniapps (submodule)
- **elpatio-dashboard**: Repositorio del dashboard (submodule)
- **elpatio-appCajeros**: Repositorio de la app de cajeros (submodule)

## Clonar el Proyecto Completo en una Nueva Máquina

### Opción 1: Clonar con submodules desde el inicio (Recomendado)

```bash
git clone --recurse-submodules https://github.com/iamp15/elpatio-monorepo.git
cd elpatio-monorepo
```

Este comando clonará el repositorio principal y automáticamente inicializará y clonará todos los submodules.

### Opción 2: Si ya clonaste sin submodules

Si ya clonaste el repositorio principal pero las carpetas `bot-telegram`, `elpatio-backend` y `elpatio-miniapps` están vacías:

```bash
cd elpatio-monorepo
git submodule update --init --recursive
```

## Trabajar con Submodules

### Actualizar submodules después de un pull

Cuando trabajas desde múltiples máquinas (oficina y casa), después de hacer `git pull` en el monorepo:

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

### Trabajar dentro de un submodule

Para hacer cambios en el backend o las miniapps:

```bash
# Entrar al directorio del submodule
cd elpatio-backend

# Trabajar normalmente con Git
git status
git add .
git commit -m "Tu mensaje de commit"
git push

# Volver al directorio raíz
cd ..
```

### Actualizar la referencia del submodule en el monorepo

**⚠️ IMPORTANTE:** Después de hacer push desde un submodule, **debes actualizar la referencia en el monorepo** y hacer push también del monorepo.

**¿Por qué?** El monorepo guarda una referencia al commit específico de cada submodule. Si haces push desde el submodule pero no actualizas el monorepo, el monorepo seguirá apuntando al commit anterior del submodule.

### Opción 1: Usar los scripts automáticos (Recomendado)

Los scripts `commit-push-*.bat` hacen esto automáticamente:

```bash
# Ejecutar el script correspondiente
scripts\commit-push-bot-telegram.bat
# o
scripts\commit-push-backend.bat
# o
scripts\commit-push-miniapps.bat
```

**Los scripts actualizan automáticamente el monorepo después del push del submodule.**

### Opción 2: Manualmente

Si prefieres hacerlo manualmente:

```bash
# 1. Push del submodule
cd bot-telegram  # o elpatio-backend, elpatio-miniapps, elpatio-dashboard, elpatio-appCajeros
git push

# 2. Actualizar referencia en el monorepo
cd ..
git add bot-telegram  # o el submodule correspondiente
git commit -m "Actualizar referencia de submodule"
git push
```

**Nota:** Si trabajas en múltiples máquinas (casa y oficina), es **muy recomendable** usar los scripts automáticos para mantener todo sincronizado.

## Flujo de Trabajo Recomendado

### Desde la Oficina (Laptop)

1. **Al iniciar el día:**
   ```bash
   cd elpatio-monorepo
   git pull
   git submodule update --remote
   ```

2. **Hacer cambios en el backend:**
   ```bash
   cd elpatio-backend
   # Hacer tus cambios
   git add .
   git commit -m "Descripción de cambios"
   git push  # Push al repositorio del submodule
   cd ..
   git add elpatio-backend
   git commit -m "Actualizar backend"
   git push  # Push al repositorio principal (monorepo)
   ```

3. **Hacer cambios en el bot de Telegram:**
   ```bash
   cd bot-telegram
   # Hacer tus cambios
   git add .
   git commit -m "Descripción de cambios"
   git push  # Push al repositorio del submodule
   cd ..
   git add bot-telegram
   git commit -m "Actualizar bot-telegram"
   git push  # Push al repositorio principal (monorepo)
   ```

4. **Hacer cambios en las miniapps:**
   ```bash
   cd elpatio-miniapps
   # Hacer tus cambios
   git add .
   git commit -m "Descripción de cambios"
   git push  # Push al repositorio del submodule
   cd ..
   git add elpatio-miniapps
   git commit -m "Actualizar miniapps"
   git push  # Push al repositorio principal (monorepo)
   ```

### Desde la Casa (Desktop)

1. **Al iniciar el día:**
   ```bash
   cd elpatio-monorepo
   git pull
   git submodule update --remote
   ```

2. **Continuar con el mismo flujo de trabajo**

## Comandos Útiles

### Ver el estado de los submodules

```bash
git submodule status
```

### Ver qué commit está usando cada submodule

```bash
git submodule foreach git log -1
```

### Actualizar todos los submodules a la última versión

```bash
git submodule update --remote --merge
```

### Sincronizar submodules con el commit guardado en el monorepo

```bash
git submodule update
```

## Solución de Problemas

### Las carpetas de submodules están vacías

```bash
git submodule update --init --recursive
```

### Error: "fatal: reference is not a tree"

Esto puede pasar si el commit referenciado en el monorepo no existe en el submodule. Actualiza el submodule:

```bash
git submodule update --remote
```

### Cambios no guardados en un submodule

Si tienes cambios sin commitear en un submodule y quieres actualizarlo:

```bash
cd bot-telegram  # o el submodule correspondiente (elpatio-backend, elpatio-miniapps)
git stash
cd ..
git submodule update --remote
cd bot-telegram  # o el submodule correspondiente
git stash pop
```

## Scripts de Commit y Push Automáticos

Para facilitar el trabajo con los subrepositorios, existen scripts que permiten hacer commit y push independientes desde cada subrepositorio. **Estos scripts también actualizan automáticamente la referencia en el monorepo y hacen push del monorepo**, perfecto para trabajar en múltiples máquinas.

### Scripts disponibles

#### Script para bot-telegram

```bash
# Desde cualquier directorio del proyecto
scripts\commit-push-bot-telegram.bat
```

#### Script para elpatio-backend

```bash
# Desde cualquier directorio del proyecto
scripts\commit-push-backend.bat
```

#### Script para elpatio-miniapps

```bash
# Desde cualquier directorio del proyecto
scripts\commit-push-miniapps.bat
```

### Funcionalidades de los scripts

Todos los scripts realizan automáticamente:

1. **Detección automática del monorepo**: Buscan automáticamente el directorio del monorepo (detectando `.gitmodules`)
2. **Incremento de versión**: Permite elegir entre PATCH, MINOR o MAJOR
3. **Commit con formato convencional**: Usa prefijos automáticos (fix:, feat:, BREAKING CHANGE:)
4. **Tag de versión**: Crea automáticamente un tag con la nueva versión
5. **Push del submodule**: Hace push al repositorio remoto del submodule
6. **Actualización del monorepo**: Actualiza automáticamente la referencia del submodule en el monorepo
7. **Push del monorepo**: Hace push del monorepo con la nueva referencia

### Flujo completo automático

Cuando ejecutas uno de estos scripts:

```
1. Detecta el monorepo automáticamente
2. Incrementa la versión en package.json
3. Hace commit y push del submodule
4. Actualiza la referencia en el monorepo
5. Hace commit y push del monorepo
```

**Todo en un solo comando!** Perfecto para trabajar en múltiples máquinas (casa y oficina).

## Notas Importantes

1. **Siempre haz commit y push en el submodule primero**, luego actualiza la referencia en el monorepo
2. **No ignores los archivos `.gitmodules`** - este archivo debe estar versionado
3. **Cuando clones en una nueva máquina**, usa `--recurse-submodules` o ejecuta `git submodule update --init --recursive`
4. **Después de cada `git pull`**, ejecuta `git submodule update --remote` para obtener los últimos cambios
