FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY bot-telegram/package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY bot-telegram/ .

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Cambiar propietario de archivos
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exponer puerto (si es necesario)
# EXPOSE 3000

# Comando por defecto
CMD ["npm", "start"]
