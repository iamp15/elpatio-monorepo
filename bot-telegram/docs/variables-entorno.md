# 🚀 Sistema de Variables de Entorno - Bot Telegram El Patio

## 📋 Descripción General

Este documento explica cómo usar el nuevo sistema centralizado de variables de entorno que soluciona los problemas de configuración que estabas experimentando.

## 🔧 Archivos del Sistema

### 1. `config/env-config.js`

- **Propósito**: Configuración centralizada de todas las variables de entorno
- **Funcionalidades**: Validación automática, valores por defecto, manejo de errores
- **Uso**: Importar funciones para usar en scripts y aplicaciones

### 2. `scripts/check-env.js`

- **Propósito**: Verificar el estado del entorno
- **Uso**: `npm run env:check` o `node scripts/check-env.js`
- **Salida**: Estado detallado de todas las variables

### 3. `scripts/generate-env-example.js`

- **Propósito**: Generar archivo `.env.example` automáticamente
- **Uso**: `npm run env:example` o `node scripts/generate-env-example.js`
- **Salida**: Archivo `.env.example` completo en la raíz del proyecto

### 4. `scripts/example-usage.js`

- **Propósito**: Demostrar cómo usar el nuevo sistema
- **Uso**: `npm run env:demo` o `node scripts/example-usage.js`
- **Salida**: Ejemplos prácticos de uso

## 🎯 Variables Disponibles

### 🔴 Variables Requeridas (Obligatorias)

| Variable       | Descripción               | Validación         |
| -------------- | ------------------------- | ------------------ |
| `BOT_TOKEN`    | Token del bot de Telegram | No vacío           |
| `BACKEND_URL`  | URL del backend           | Formato http/https |
| `BOT_EMAIL`    | Email del bot             | Debe contener @    |
| `BOT_PASSWORD` | Contraseña del bot        | No vacío           |

### 📋 Variables Opcionales

| Variable    | Descripción                | Valor por Defecto | Validación                  |
| ----------- | -------------------------- | ----------------- | --------------------------- |
| `ADMIN_ID`  | ID del administrador       | `null`            | Número o vacío              |
| `TEST_MODE` | Modo de prueba             | `false`           | true/false                  |
| `MODE`      | Modo de operación          | `development`     | development/production/test |
| `BOT_JWT`   | JWT predefinido (obsoleto) | `null`            | Cualquier string            |

### 📋 Variables de Cache (Futuras)

| Variable     | Descripción     | Valor por Defecto | Validación          |
| ------------ | --------------- | ----------------- | ------------------- |
| `CACHE_TYPE` | Tipo de cache   | `local`           | local/redis/backend |
| `REDIS_HOST` | Host de Redis   | `localhost`       | Cualquier string    |
| `REDIS_PORT` | Puerto de Redis | `6379`            | 1-65535             |

## 🚀 Cómo Usar el Nuevo Sistema

### 1. Verificar el Entorno

```bash
# Usando npm script
npm run env:check

# Usando node directamente
node scripts/check-env.js
```

### 2. Generar Archivo de Ejemplo

```bash
# Usando npm script
npm run env:example

# Usando node directamente
node scripts/generate-env-example.js
```

### 3. Ver Ejemplo de Uso

```bash
# Usando npm script
npm run env:demo

# Usando node directamente
node scripts/example-usage.js
```

## 💻 Uso en Código

### Antes (Sistema Anterior)

```javascript
// ❌ Forma antigua - propensa a errores
const token = process.env.BOT_TOKEN;
const url = process.env.BACKEND_URL || "http://localhost:5000";
const testMode = process.env.TEST_MODE === "true";

// Validación manual
if (!token) {
  console.error("BOT_TOKEN no configurado");
  process.exit(1);
}
```

### Después (Nuevo Sistema)

```javascript
// ✅ Forma nueva - robusta y validada
const { getEnvVar, isEnvironmentValid } = require("./config/env-config");

// Verificar entorno antes de continuar
if (!isEnvironmentValid()) {
  console.error("❌ Entorno no configurado correctamente");
  process.exit(1);
}

// Obtener variables con validación automática
const token = getEnvVar("BOT_TOKEN");
const url = getEnvVar("BACKEND_URL");
const testMode = getEnvVar("TEST_MODE", false); // Con valor por defecto
```

## 🔍 Funciones Disponibles

### `getEnvVar(key, defaultValue)`

Obtiene una variable de entorno con validación automática.

```javascript
const token = getEnvVar("BOT_TOKEN");
const testMode = getEnvVar("TEST_MODE", false);
const cacheType = getEnvVar("CACHE_TYPE", "local");
```

### `getAllEnvVars()`

Obtiene todas las variables de entorno validadas.

```javascript
const allVars = getAllEnvVars();
console.log("Variables disponibles:", Object.keys(allVars));
```

### `isEnvironmentValid()`

Verifica si el entorno está configurado correctamente.

```javascript
if (!isEnvironmentValid()) {
  console.error("❌ Corrige las variables de entorno antes de continuar");
  process.exit(1);
}
```

### `showEnvironmentStatus()`

Muestra el estado completo del entorno.

```javascript
const { errors, warnings } = showEnvironmentStatus();
if (errors.length > 0) {
  console.log("❌ Errores críticos encontrados");
}
```

## 📝 Flujo de Configuración

### 1. Primera Vez

```bash
# Generar archivo de ejemplo
npm run env:example

# Copiar .env.example como .env
cp .env.example .env

# Editar .env con valores reales
# (usar tu editor preferido)
```

### 2. Configuración Diaria

```bash
# Verificar entorno antes de trabajar
npm run env:check

# Si hay errores, corregir .env
# Si todo está bien, continuar
```

### 3. Desarrollo

```bash
# Usar funciones del sistema en tu código
const { getEnvVar } = require('./config/env-config');
const token = getEnvVar('BOT_TOKEN');

# Iniciar bot
npm run dev
```

## 🛠️ Migración de Scripts Existentes

### Script Antiguo

```javascript
// ❌ ANTES
require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL;

if (!BOT_TOKEN || !BACKEND_URL) {
  console.error("Faltan variables de entorno. Revisa .env");
  process.exit(1);
}
```

### Script Migrado

```javascript
// ✅ DESPUÉS
const { getEnvVar, isEnvironmentValid } = require("../config/env-config");

// Verificar entorno
if (!isEnvironmentValid()) {
  console.error("❌ Variables de entorno no configuradas correctamente");
  process.exit(1);
}

// Obtener variables
const BOT_TOKEN = getEnvVar("BOT_TOKEN");
const BACKEND_URL = getEnvVar("BACKEND_URL");
```

## 🔒 Seguridad

- **Valores sensibles**: Los tokens y contraseñas se ocultan automáticamente en la salida
- **Validación**: Todas las variables se validan antes de ser utilizadas
- **Fallbacks**: Valores por defecto seguros para variables opcionales
- **Errores tempranos**: Los problemas se detectan antes de que el bot inicie

## 📊 Beneficios del Nuevo Sistema

1. **✅ Validación Automática**: No más errores por variables mal configuradas
2. **✅ Valores por Defecto**: Variables opcionales funcionan sin configuración
3. **✅ Manejo Centralizado**: Una sola fuente de verdad para la configuración
4. **✅ Detección Temprana**: Errores se identifican antes de que fallen los scripts
5. **✅ Documentación Automática**: Todas las variables están documentadas
6. **✅ Compatibilidad**: Funciona con scripts existentes
7. **✅ Seguridad**: Valores sensibles se ocultan automáticamente

## 🚨 Solución de Problemas

### Error: "Cannot find module '../config/env-config'"

- **Causa**: El archivo `config/env-config.js` no existe
- **Solución**: Ejecuta `npm run env:example` para generar todos los archivos

### Error: "Variables de entorno no configuradas"

- **Causa**: Faltan variables requeridas en `.env`
- **Solución**: Ejecuta `npm run env:check` para ver qué falta

### Error: "Valor inválido para variable"

- **Causa**: Variable configurada con formato incorrecto
- **Solución**: Revisa el formato según la validación en `env-config.js`

## 🎉 Conclusión

El nuevo sistema de variables de entorno resuelve completamente los problemas que estabas experimentando:

- **No más fallos** por variables mal configuradas
- **Validación automática** de todos los valores
- **Manejo centralizado** y robusto
- **Compatibilidad total** con tu código existente

¡Ahora puedes ejecutar tus scripts con confianza de que las variables de entorno estarán correctamente configuradas!
