# Dockerfile para bot de Telegram en Fly.io
FROM node:18-alpine

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copiar solo package files primero (mejor aprovechamiento del cache)
COPY --chown=nodejs:nodejs package*.json ./

# Instalar dependencias de producción
RUN npm install --omit=dev && \
    npm cache clean --force

# Copiar código fuente
COPY --chown=nodejs:nodejs . .

# Asegurar permisos de escritura para archivos de estado
RUN touch user-state.json && \
    chown nodejs:nodejs user-state.json && \
    chmod 644 user-state.json

# Cambiar a usuario no-root
USER nodejs

# El bot no expone puertos HTTP (usa polling o webhooks de Telegram)
# No se necesita EXPOSE

# Comando de inicio
CMD ["npm", "start"]

