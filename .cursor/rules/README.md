# 📋 Reglas de Cursor - El Patio

Este directorio contiene las reglas que guían el comportamiento de los agentes de IA en Cursor para el proyecto El Patio.

## 📁 Estructura

```
.cursor/rules/
├── README.md                    # Este archivo
├── general-estilo.mdc          # Reglas generales (siempre aplicadas)
└── [más reglas...]             # Otras reglas generales
```

## 🎯 Tipos de Reglas

### Reglas Generales

Las reglas generales se aplican a **todo el proyecto** y se encuentran en este directorio (`.cursor/rules/`).

**Características:**
- `alwaysApply: true` - Se aplican siempre
- Sin `globs` o con patrones muy amplios
- Compartidas con todo el equipo vía Git

**Ejemplo actual:**
- `general-estilo.mdc` - Convenciones generales de código y estilo

### Reglas Específicas

Las reglas específicas se aplican a **módulos particulares** y se encuentran en cada módulo (ej: `bot-telegram/.cursor/rules/`).

**Características:**
- `alwaysApply: false` - Se aplican según contexto
- `globs` que apuntan a rutas específicas
- Específicas del módulo

## 📝 Crear Nuevas Reglas

### Método 1: Desde Cursor

1. Abre `Cursor Settings > Rules`
2. Haz clic en `New Cursor Rule`
3. Se creará un archivo en `.cursor/rules/`

### Método 2: Desde el Chat

1. En una conversación con el agente, usa: `/Generate Cursor Rules`
2. Describe las reglas que quieres crear
3. Cursor generará el archivo automáticamente

### Método 3: Manualmente

1. Crea un archivo `.mdc` en `.cursor/rules/`
2. Usa el formato correcto con frontmatter YAML
3. Escribe las instrucciones para el agente

## 📐 Formato de Archivos .mdc

```markdown
---
description: Descripción de la regla
globs: ["patrones/**/*.js"]  # Opcional: para reglas específicas
alwaysApply: true/false      # true para generales, false para específicas
---

# Título de la Regla

Contenido de la regla en Markdown...
```

## 🔄 Flujo de Trabajo Recomendado

1. **Inicio**: Crear reglas generales básicas
2. **Desarrollo**: Agregar reglas específicas cuando sea necesario
3. **Refinamiento**: Dividir reglas extensas en múltiples archivos
4. **Mantenimiento**: Actualizar reglas según evolucione el proyecto

## 📚 Reglas Actuales

### Reglas Generales (Raíz)

- ✅ `general-estilo.mdc` - Convenciones generales de código, estilo y arquitectura

### Reglas Específicas por Módulo

Cada módulo puede tener sus propias reglas en `[modulo]/.cursor/rules/`:

- `bot-telegram/.cursor/rules/` - Reglas para el bot de Telegram
- `elpatio-backend/.cursor/rules/` - Reglas para el backend
- `elpatio-miniapps/.cursor/rules/` - Reglas para las miniapps

## 💡 Mejores Prácticas

1. **Mantén las reglas concisas**: Preferiblemente menos de 500 líneas por archivo
2. **Divide cuando sea necesario**: Si una regla es muy larga, créala en múltiples archivos
3. **Proporciona ejemplos**: Incluye ejemplos concretos en las reglas
4. **Sé específico**: Evita instrucciones vagas
5. **Documenta cambios**: Actualiza este README cuando agregues nuevas reglas

## 🔍 Verificar Reglas Activas

1. Abre `Cursor Settings > Rules`
2. Verás todas las reglas y su estado
3. Las reglas activas aparecen en la barra lateral cuando el agente está trabajando

## 🤝 Compartir con el Equipo

Todas las reglas en `.cursor/rules/` se versionan con Git y se comparten automáticamente con el equipo. Asegúrate de:

- Committear las reglas junto con el código relacionado
- Actualizar este README cuando agregues nuevas reglas
- Revisar las reglas en pull requests

---

**Nota**: Las reglas son una herramienta poderosa para mantener consistencia en el código. Úsalas para codificar el conocimiento del proyecto y las mejores prácticas.
