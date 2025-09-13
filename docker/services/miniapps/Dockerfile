FROM node:18-alpine

# Instalar servidor web simple
RUN npm install -g serve

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de miniapps
COPY elpatio-miniapps/ .

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Cambiar propietario de archivos
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exponer puerto
EXPOSE 3000

# Comando por defecto
CMD ["serve", "-s", ".", "-l", "3000"]
