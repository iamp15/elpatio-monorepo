# ?? ConfigKeys del Sistema de Pagos - Documentaci�n Completa

## ?? Objetivo

Este documento define las claves de configuraci�n (\configKey\) fijas que utiliza el sistema de pagos para mantener consistencia entre el backend y el bot.

## ??? Estructura de ConfigKeys

### ?? **Tipo: \"precios\"**

Configuraciones relacionadas con los precios de entrada a los juegos.

| ConfigKey         | Descripci�n                   | Valor (centavos) | Ejemplo  |
| ----------------- | ----------------------------- | ---------------- | -------- |
| \ludo.1v1\        | Precio entrada Ludo 1v1       | 70000            | 700 Bs   |
| \ludo.2v2\        | Precio entrada Ludo 2v2       | 120000           | 1.200 Bs |
| \ludo.1v1v1\      | Precio entrada Ludo 1v1v1     | 150000           | 1.500 Bs |
| \ludo.1v1v1v1\    | Precio entrada Ludo 1v1v1v1   | 200000           | 2.000 Bs |
| \domino.1v1\      | Precio entrada Domin� 1v1     | 50000            | 500 Bs   |
| \domino.2v2\      | Precio entrada Domin� 2v2     | 100000           | 1.000 Bs |
| \domino.1v1v1\    | Precio entrada Domin� 1v1v1   | 120000           | 1.200 Bs |
| \domino.1v1v1v1\  | Precio entrada Domin� 1v1v1v1 | 150000           | 1.500 Bs |

### ?? **Tipo: \"limites\"**

Configuraciones relacionadas con l�mites del sistema.

| ConfigKey          | Descripci�n     | Valor (centavos) | Ejemplo    |
| ------------------ | --------------- | ---------------- | ---------- |
| \deposito.minimo\  | Dep�sito m�nimo | 10000            | 100 Bs     |
| \deposito.maximo\  | Dep�sito m�ximo | 15000000         | 150.000 Bs |

| \
etiro.minimo\ | Retiro m�nimo | 50000 | 500 Bs |
| \
etiro.maximo\ | Retiro m�ximo | 10000000 | 100.000 Bs |
| \alance.maximo\ | Balance m�ximo permitido | 50000000 | 500.000 Bs |
| \
etiros.diarios\ | M�ximo retiros por d�a | 3 | 3 retiros |
| \
etiros.semanales\ | M�ximo retiros por semana | 7 | 7 retiros |

### ?? **Tipo: \"comisiones\"**

Configuraciones relacionadas con comisiones y tarifas.

| ConfigKey | Descripci�n | Valor | Ejemplo |
| --------- | ----------- | ----- | ------- |

| \
etiro.frecuencia_semanal.primera_vez\ | Comisi�n 1er retiro semanal (%) | 0 | 0% |
| \
etiro.frecuencia_semanal.segunda_vez\ | Comisi�n 2do retiro semanal (%) | 1 | 1% |
| \
etiro.frecuencia_semanal.tercera_vez\ | Comisi�n 3er retiro semanal (%) | 2 | 2% |
| \
etiro.frecuencia_semanal.adicional\ | Comisi�n retiros adicionales (%) | 5 | 5% |
| \
etiro.frecuencia_semanal.periodo_dias\ | Per�odo de reinicio (d�as) | 7 | 7 d�as |
| \
etiro.comision_fija\ | Comisi�n fija por retiro (centavos) | 1000 | 10 Bs |
| \deposito.comision\ | Comisi�n por dep�sito (%) | 0 | 0% |

### ?? **Tipo: \"moneda\"**

Configuraciones relacionadas con la moneda del sistema.

| ConfigKey    | Descripci�n             | Valor     | Ejemplo     |
| ------------ | ----------------------- | --------- | ----------- |
| \codigo\     | C�digo ISO de la moneda | \"VES\"   | VES         |
| \simbolo\    | S�mbolo de la moneda    | \"Bs\"    | Bs          |
| \ormato\     | Formato de n�mero       | \"es-VE\" | 1.000,00 Bs |
| \decimales\  | N�mero de decimales     | 2         | 2           |

## ?? **C�mo el Bot Reconocen las ConfigKeys**

### **Para Precios de Juegos:**

\\\javascript
// El bot puede extraer informaci�n del configKey
const configKey = \"ludo.2v2\";
const [juego, modo] = configKey.split(\".\");
// juego = \"ludo\", modo = \"2v2\"

// Obtener precio espec�fico
const precio = await paymentConfigManager.getGamePrice(juego, modo);
\\\

### **Para L�mites:**

\\\javascript
// El bot puede obtener l�mites espec�ficos
const limiteDeposito = await paymentConfigManager.getLimit(\"deposito.maximo\");
const limiteRetiro = await paymentConfigManager.getLimit(\"retiro.minimo\");
\\\

### **Para Comisiones:**

\\\javascript
// El bot puede obtener comisiones de retiro
const comisiones = await paymentConfigManager.getCommission(\"retiro.frecuencia_semanal\");
const comisionFija = await paymentConfigManager.getCommission(\"retiro.comision_fija\");
\\\

## ?? **Ejemplos de Uso en el Backend**

### **Crear/Actualizar Precio:**

\\\javascript
// Actualizar precio Ludo 1v1
await PaymentConfig.findOneAndUpdate(
{ configType: \"precios\", configKey: \"ludo.1v1\" },
{ configValue: 70000 },
{ upsert: true, new: true }
);
\\\

### **Crear/Actualizar L�mite:**

\\\javascript
// Actualizar l�mite de dep�sito
await PaymentConfig.findOneAndUpdate(
{ configType: \"limites\", configKey: \"deposito.maximo\" },
{ configValue: 15000000 },
{ upsert: true, new: true }
);
\\\

### **Crear/Actualizar Comisi�n:**

\\\javascript
// Actualizar comisi�n de retiro
await PaymentConfig.findOneAndUpdate(
{ configType: \"comisiones\", configKey: \"retiro.frecuencia_semanal.primera_vez\" },
{ configValue: 0 },
{ upsert: true, new: true }
);
\\\

## ?? **Reglas Importantes**

1. **Consistencia**: Siempre usar las configKeys exactas definidas aqu�
2. **Valores en Centavos**: Todos los valores monetarios se almacenan en centavos
3. **Separador por Puntos**: Usar \".\" como separador en configKeys compuestas
4. **Min�sculas**: Todas las configKeys deben estar en min�sculas
5. **Sin Espacios**: No usar espacios en las configKeys

## ?? **Migraci�n de Datos**

Si ya existen configuraciones con configKeys diferentes, se debe migrar a esta estructura fija:

\\\javascript
// Ejemplo de migraci�n
const migraciones = [
{ oldKey: \"ludo1v1\", newKey: \"ludo.1v1\" },
{ oldKey: \"maxDeposit\", newKey: \"deposito.maximo\" },
{ oldKey: \"withdrawalRates\", newKey: \"retiro.frecuencia_semanal\" }
];
\\\

## ?? **Validaci�n en el Backend**

El backend debe validar que las configKeys cumplan con esta estructura:

\\\javascript
const configKeysValidas = {
precios: /^(ludo|domino)\.(1v1|2v2|1v1v1|1v1v1v1)$/,
  limites: /^(deposito|retiro|balance)\.(minimo|maximo)$|^retiros\.(diarios|semanales)$/,
  comisiones: /^retiro\.(frecuencia_semanal|comision_fija)$|^deposito\.comision$/,
  moneda: /^(codigo|simbolo|formato|decimales)$/
};
\\\

## ?? **Sistema de Valores en Centavos**

### **�Por qu� usar centavos?**

En el sistema de pagos, **todos los valores monetarios se almacenan en centavos** para evitar problemas de precisi�n con n�meros decimales. Esto es una pr�ctica est�ndar en sistemas financieros.

### **Conversi�n:**

- **1 Bol�var = 100 centavos**
- **700 Bs = 700 � 100 = 70,000 centavos**

### **Ejemplos de Conversi�n:**

| Bol�vares  | Centavos   | Explicaci�n   |
| ---------- | ---------- | ------------- |
| 1 Bs       | 100        | 1 � 100       |
| 10 Bs      | 1,000      | 10 � 100      |
| 100 Bs     | 10,000     | 100 � 100     |
| 700 Bs     | 70,000     | 700 � 100     |
| 1,200 Bs   | 120,000    | 1,200 � 100   |
| 150,000 Bs | 15,000,000 | 150,000 � 100 |

### **En el C�digo:**

\\\javascript
// Almacenamiento (en centavos)
const precioLudo1v1 = 70000; // 700 Bs

// Conversi�n para mostrar al usuario
const precioEnBs = precioLudo1v1 / 100; // 700

// Formateo para mostrar
const precioFormateado = \\ Bs\; // \"700 Bs\"
\\\

## ?? **Modos de Juego Definidos**

### **Ludo:**

- \1v1\ - 2 jugadores
- \2v2\ - 4 jugadores
- \1v1v1\ - 3 jugadores
- \1v1v1v1\ - 4 jugadores

### **Domin�:**

- \1v1\ - 2 jugadores
- \2v2\ - 4 jugadores
- \1v1v1\ - 3 jugadores
- \1v1v1v1\ - 4 jugadores

## ?? **Resumen de ConfigKeys por Tipo**

### **Precios (8 configKeys):**

- ludo.1v1, ludo.2v2, ludo.1v1v1, ludo.1v1v1v1
- domino.1v1, domino.2v2, domino.1v1v1, domino.1v1v1v1

### **L�mites (7 configKeys):**

- deposito.minimo, deposito.maximo
- retiro.minimo, retiro.maximo
- balance.maximo
- retiros.diarios, retiros.semanales

### **Comisiones (8 configKeys):**

- retiro.frecuencia_semanal.primera_vez
- retiro.frecuencia_semanal.segunda_vez
- retiro.frecuencia_semanal.tercera_vez
- retiro.frecuencia_semanal.adicional
- retiro.frecuencia_semanal.periodo_dias
- retiro.comision_fija
- deposito.comision
- porcentaje_ganancias

### **Moneda (4 configKeys):**

- codigo, simbolo, formato, decimales

**Total: 27 configKeys fijas**
