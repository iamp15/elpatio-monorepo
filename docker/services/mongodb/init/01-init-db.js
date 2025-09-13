// Script de inicialización de MongoDB para El Patio
db = db.getSiblingDB("elpatio");

// Crear usuario para la aplicación
db.createUser({
  user: "elpatio_user",
  pwd: "elpatio_password",
  roles: [
    {
      role: "readWrite",
      db: "elpatio",
    },
  ],
});

// Crear colecciones básicas
db.createCollection("jugadores");
db.createCollection("salas");
db.createCollection("transacciones");
db.createCollection("pagos");
db.createCollection("admins");
db.createCollection("cajeros");
db.createCollection("logs");
db.createCollection("estadisticas");
db.createCollection("configuraciones");

print("Base de datos El Patio inicializada correctamente");
