# Guía de Git Submodules - El Patio Monorepo

Este proyecto utiliza **Git Submodules** para manejar los repositorios de `elpatio-backend` y `elpatio-miniapps` como repositorios independientes dentro del monorepo.

## ¿Qué son los Submodules?

Los submodules permiten mantener repositorios Git separados dentro de un repositorio principal. Esto es útil cuando:
- Tienes repositorios independientes que forman parte de un proyecto más grande
- Quieres mantener el historial y las versiones de cada repositorio separados
- Necesitas trabajar con diferentes equipos en diferentes partes del proyecto

## Estructura de Repositorios

- **elpatio-monorepo**: Repositorio principal (ignora `elpatio-backend` y `elpatio-miniapps`)
- **elpatio-backend**: Repositorio del backend (submodule)
- **elpatio-miniapps**: Repositorio de las miniapps (submodule)

## Clonar el Proyecto Completo en una Nueva Máquina

### Opción 1: Clonar con submodules desde el inicio (Recomendado)

```bash
git clone --recurse-submodules https://github.com/iamp15/elpatio-monorepo.git
cd elpatio-monorepo
```

Este comando clonará el repositorio principal y automáticamente inicializará y clonará todos los submodules.

### Opción 2: Si ya clonaste sin submodules

Si ya clonaste el repositorio principal pero las carpetas `elpatio-backend` y `elpatio-miniapps` están vacías:

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
git submodule update --remote elpatio-backend
git submodule update --remote elpatio-miniapps
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

Después de hacer cambios y push en un submodule, necesitas actualizar la referencia en el monorepo:

```bash
# Desde el directorio raíz del monorepo
git add elpatio-backend  # o elpatio-miniapps
git commit -m "Actualizar referencia de submodule"
git push
```

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
   git push
   cd ..
   git add elpatio-backend
   git commit -m "Actualizar backend"
   git push
   ```

3. **Hacer cambios en las miniapps:**
   ```bash
   cd elpatio-miniapps
   # Hacer tus cambios
   git add .
   git commit -m "Descripción de cambios"
   git push
   cd ..
   git add elpatio-miniapps
   git commit -m "Actualizar miniapps"
   git push
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
cd elpatio-backend  # o el submodule correspondiente
git stash
cd ..
git submodule update --remote
cd elpatio-backend
git stash pop
```

## Notas Importantes

1. **Siempre haz commit y push en el submodule primero**, luego actualiza la referencia en el monorepo
2. **No ignores los archivos `.gitmodules`** - este archivo debe estar versionado
3. **Cuando clones en una nueva máquina**, usa `--recurse-submodules` o ejecuta `git submodule update --init --recursive`
4. **Después de cada `git pull`**, ejecuta `git submodule update --remote` para obtener los últimos cambios
