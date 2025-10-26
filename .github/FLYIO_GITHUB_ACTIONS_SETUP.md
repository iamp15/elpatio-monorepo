# Configuración de GitHub Actions para Fly.io

Este documento explica cómo configurar el deploy automático a Fly.io mediante GitHub Actions.

## Paso 1: Obtener el Token de Fly.io

Ejecuta este comando en tu terminal:

```bash
fly auth token
```

Copia el token que se muestra. Este token tiene la forma: `fo1_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Paso 2: Configurar el Secret en GitHub

1. Ve a tu repositorio en GitHub
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral, haz clic en **Secrets and variables** → **Actions**
4. Haz clic en **New repository secret**
5. Configura:
   - **Name**: `FLY_API_TOKEN`
   - **Secret**: Pega el token que copiaste en el Paso 1
6. Haz clic en **Add secret**

## Paso 3: Verificar el Workflow

El workflow se ejecutará automáticamente cuando:

- Hagas push a `main` o `master` Y:
  - Cambies archivos en `elpatio-backend/` (despliega el backend)
  - Cambies archivos en `bot-telegram/` (despliega el bot)
  - Incluyas `[backend]` o `[bot]` en el mensaje del commit
- Ejecutes manualmente desde la pestaña **Actions** en GitHub

## Forzar Deploy Manual

### Opción 1: Desde GitHub (interfaz web)

1. Ve a tu repositorio en GitHub
2. Haz clic en **Actions**
3. Selecciona el workflow "Deploy to Fly.io"
4. Haz clic en **Run workflow**
5. Selecciona la rama y haz clic en **Run workflow**

### Opción 2: Con mensaje de commit

```bash
# Deploy solo el backend
git commit -m "fix: corrección en API [backend]"

# Deploy solo el bot
git commit -m "feat: nuevo comando [bot]"

# Deploy ambos
git commit -m "refactor: actualización general [backend] [bot]"
```

## Monitoreo de Deploys

Puedes ver el progreso del deploy en:

1. **GitHub**: Pestaña **Actions** → selecciona el workflow en ejecución
2. **Fly.io Dashboard**: https://fly.io/dashboard
3. **Logs en tiempo real** (desde tu terminal):
   ```bash
   fly logs -a elpatio-backend
   fly logs -a elpatio-bot
   ```

## Troubleshooting

### Error: "FLY_API_TOKEN not found"

- Verifica que hayas agregado el secret correctamente en GitHub
- Asegúrate de que el nombre sea exactamente `FLY_API_TOKEN`

### Error: "Could not find App"

- Verifica que las aplicaciones existan en Fly.io:
  ```bash
  fly apps list
  ```

### El workflow no se ejecuta

- Verifica que tu branch sea `main` o `master`
- Asegúrate de que hay cambios en los paths especificados
- Revisa el archivo `.github/workflows/deploy-flyio.yml`

## Desactivar Deploy Automático

Si prefieres hacer deploys manuales, simplemente:

1. Elimina o renombra el archivo `.github/workflows/deploy-flyio.yml`
2. O modifica el `on:` del workflow para que solo responda a `workflow_dispatch`

## Alternativa: Deploy Manual

Siempre puedes hacer deploy manualmente desde tu terminal:

```bash
# Backend
cd elpatio-backend
fly deploy

# Bot
cd bot-telegram
fly deploy
```
