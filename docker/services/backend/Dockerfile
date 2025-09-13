FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY elpatio-backend/package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY elpatio-backend/ .

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Cambiar propietario de archivos
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exponer puerto
EXPOSE 3001

# Comando por defecto
CMD ["npm", "start"]
