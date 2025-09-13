# Adaptación Venezolana - Sistema de Pagos

## 🇻🇪 **Resumen de Cambios Implementados**

Se han realizado las siguientes adaptaciones para el público venezolano:

### **1. Cambio de Moneda Principal**

- **Antes:** USD (Dólares estadounidenses)
- **Ahora:** VES (Bolívares venezolanos)
- **Símbolo:** Bs
- **Código ISO:** VES

### **2. Formato de Moneda Venezolano**

- **Formato:** `1.000,00 Bs` (punto para separar miles, coma para decimales)
- **Ejemplos:**
  - `500,00 Bs` (quinientos bolívares)
  - `1.000,00 Bs` (mil bolívares)
  - `15.000,00 Bs` (quince mil bolívares)
  - `1.234.567,89 Bs` (un millón doscientos treinta y cuatro mil quinientos sesenta y siete bolívares con ochenta y nueve céntimos)

### **3. Configuración de Precios Actualizada**

#### **Ludo:**

- **1v1:** 500,00 Bs entrada, 900,00 Bs premio (80%), 100,00 Bs comisión (20%)
- **2v2:** 1.000,00 Bs entrada, 1.800,00 Bs premio (80%), 200,00 Bs comisión (20%)
- **1v1v1v1:** 1.500,00 Bs entrada, 2.700,00 Bs premio (80%), 300,00 Bs comisión (20%)

#### **Dominó:**

- **2v2:** 750,00 Bs entrada, 1.350,00 Bs premio (80%), 150,00 Bs comisión (20%)
- **1v1v1v1:** 1.250,00 Bs entrada, 2.250,00 Bs premio (80%), 250,00 Bs comisión (20%)

### **4. Límites Adaptados para Venezuela**

- **Depósito:** 100,00 Bs mínimo, 100.000,00 Bs máximo, 50.000,00 Bs diario
- **Retiro:** 500,00 Bs mínimo, 50.000,00 Bs máximo, 20.000,00 Bs diario
- **Saldo:** 200.000,00 Bs máximo

### **5. Comisiones en Bolívares**

- **Depósito:** 0% (sin comisión)
- **Retiro:** 2% (mínimo 10,00 Bs, máximo 100,00 Bs)
- **Juego:** 20% del total de entradas

## 🔧 **Sistema de Administración de Precios**

### **Comandos de Administración Disponibles:**

#### **Ver Configuración Actual:**

```
/verprecios
```

Muestra toda la configuración actual de precios, límites y comisiones.

#### **Configurar Precio de Juego:**

```
/configurarprecio <juego> <modo> <precio>
```

**Ejemplos:**

- `/configurarprecio ludo 1v1 500`
- `/configurarprecio domino 2v2 750`
- `/configurarprecio ludo 1v1v1v1 1500`

#### **Configurar Límites:**

```
/configurarlimite <tipo> <campo> <valor>
```

**Ejemplos:**

- `/configurarlimite deposito minimo 100`
- `/configurarlimite retiro maximo 50000`
- `/configurarlimite saldo maximo 200000`

#### **Configurar Comisiones:**

```
/configurarcomision <tipo> <campo> <valor>
```

**Ejemplos:**

- `/configurarcomision retiro porcentaje 2`
- `/configurarcomision retiro fija 10`
- `/configurarcomision juego porcentaje 20`

#### **Restaurar Configuración:**

```
/restaurarprecios
```

Restaura la configuración desde el último backup.

#### **Ayuda:**

```
/ayudaprecios
```

Muestra ayuda sobre todos los comandos de configuración.

### **Parámetros Disponibles:**

#### **Juegos:**

- `ludo` - Juego de Ludo
- `domino` - Juego de Dominó

#### **Modos:**

- `1v1` - Uno contra uno
- `2v2` - Dos contra dos
- `1v1v1v1` - Cuatro jugadores individuales

#### **Tipos de Límite:**

- `deposito` - Límites de depósito
- `retiro` - Límites de retiro
- `saldo` - Límite máximo de saldo

#### **Campos de Límite:**

- `minimo` - Valor mínimo
- `maximo` - Valor máximo
- `diario` - Límite diario

#### **Tipos de Comisión:**

- `deposito` - Comisión por depósito
- `retiro` - Comisión por retiro
- `juego` - Comisión por partida

#### **Campos de Comisión:**

- `porcentaje` - Porcentaje de comisión (0-100)
- `fija` - Comisión fija en bolívares
- `maximo` - Comisión máxima en bolívares

## 📊 **Archivos Modificados**

### **1. Configuración de Pagos:**

- `config/payment-config.js` - Configuración principal adaptada a bolívares

### **2. Utilidades de Dinero:**

- `utils/money-utils.js` - Formato venezolano implementado

### **3. Sistema de Administración:**

- `utils/payment-config-manager.js` - Gestor de configuración de precios
- `handlers/commands/admin-payment-commands.js` - Comandos de administración
- `handlers/commands/admin-commands.js` - Integración de comandos
- `index.js` - Registro de nuevos comandos

### **4. Scripts de Prueba:**

- `scripts/test-venezuelan-config.js` - Pruebas de configuración venezolana

## 🧪 **Pruebas Implementadas**

### **Formato Venezolano:**

- ✅ Formateo correcto: `1.000,00 Bs`
- ✅ Separadores de miles: punto (.)
- ✅ Separador decimal: coma (,)
- ✅ Símbolo de moneda: Bs

### **Conversión de Moneda:**

- ✅ Bolívares a centavos
- ✅ Centavos a bolívares
- ✅ Manejo de decimales

### **Validaciones:**

- ✅ Montos válidos e inválidos
- ✅ Límites mínimos y máximos
- ✅ Validaciones específicas para Venezuela

### **Sistema de Administración:**

- ✅ Actualización de precios
- ✅ Configuración de límites
- ✅ Configuración de comisiones
- ✅ Backup y restauración
- ✅ Resumen de configuración

## 🎯 **Beneficios de la Adaptación**

1. **Localización Completa:** Formato de moneda familiar para usuarios venezolanos
2. **Precios Apropiados:** Montos adaptados al poder adquisitivo venezolano
3. **Administración Flexible:** Sistema completo para gestionar precios y límites
4. **Seguridad:** Backup automático antes de cada cambio
5. **Escalabilidad:** Preparado para futuras monedas o ajustes

## 🔮 **Futuras Mejoras**

1. **Múltiples Monedas:** Soporte para USD y otras monedas en paralelo
2. **Conversión Automática:** Cambio automático según preferencia del usuario
3. **Historial de Cambios:** Registro de todas las modificaciones de precios
4. **Notificaciones:** Alertas a usuarios sobre cambios de precios
5. **Análisis de Precios:** Estadísticas de precios y rentabilidad

## 📝 **Notas Importantes**

- **Solo Administradores:** Los comandos de configuración solo están disponibles para administradores
- **Backup Automático:** Se crea un backup antes de cada modificación
- **Validaciones:** Todos los cambios pasan por validaciones de seguridad
- **Formato Consistente:** Todos los mensajes usan el formato venezolano
- **Compatibilidad:** El sistema mantiene compatibilidad con futuras expansiones

---

**Fecha de implementación:** $(date)
**Estado:** ✅ Completado
**Pruebas:** ✅ Todas pasaron
**Documentación:** ✅ Completa
