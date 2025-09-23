# Dockerfile para producción
FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json del backend
COPY elpatio-backend/package.json ./
COPY elpatio-backend/package-lock.json ./

# Instalar dependencias
RUN npm install --only=production

# Copiar código fuente del backend
COPY elpatio-backend/ .

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["npm", "start"]