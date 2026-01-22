# 🔄 Flujo Detallado: Modificación de Configuraciones PaymentConfig

## 📋 Resumen Ejecutivo

Este documento explica en detalle cómo funciona el proceso completo de modificación de configuraciones PaymentConfig, desde que el usuario hace clic en "Guardar" en el dashboard hasta que se actualiza la base de datos y se registra en auditoría.

---

## 🔀 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Dashboard)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Usuario edita valor en UI                                  │
│     Ejemplo: Cambia "700 Bs" a "750 Bs"                        │
│                                                                 │
│  2. PaymentConfigInput convierte valor                         │
│     UI: 750 Bs → Backend: 75000 centavos                       │
│                                                                 │
│  3. usePaymentConfig.handleGuardar()                           │
│     - Valida valor                                             │
│     - Prepara datos para API                                   │
│                                                                 │
│  4. api.updatePaymentConfig()                                  │
│     - Construye request HTTP                                  │
│     - Agrega token de autenticación                            │
│                                                                 │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ HTTP PUT /api/payment-config
                        │ Headers: Authorization: Bearer <token>
                        │ Body: {
                        │   configType: "precios",
                        │   configKey: "ludo.1v1",
                        │   configValue: 75000
                        │ }
                        │
┌───────────────────────▼───────────────────────────────────────┐
│                    BACKEND (Express)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  5. Middleware: auth (verificarToken)                          │
│     - Extrae token del header                                  │
│     - Verifica y decodifica JWT                                │
│     - Agrega req.user = { id: "...", ... }                     │
│                                                                 │
│  6. Middleware: verificarMinimo("admin")                      │
│     - Verifica que req.user.rol >= "admin"                    │
│     - Si no es admin, retorna 403                              │
│                                                                 │
│  7. Route: PUT /api/payment-config                           │
│     - Llama a paymentConfigController.updateConfig()           │
│                                                                 │
│  8. Controller: updateConfig()                                │
│     a) Valida datos de entrada                                 │
│     b) Busca configuración existente en BD                     │
│     c) Actualiza o crea configuración                          │
│     d) Registra en auditoría                                   │
│     e) Retorna respuesta                                       │
│                                                                 │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Consultas MongoDB
                        │
┌───────────────────────▼───────────────────────────────────────┐
│                  BASE DE DATOS (MongoDB)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  9. Query: PaymentConfig.findOne()                            │
│     {                                                           │
│       configType: "precios",                                   │
│       configKey: "ludo.1v1",                                   │
│       isActive: true                                            │
│     }                                                           │
│                                                                 │
│  10. Update: config.save() o new PaymentConfig()               │
│      - Si existe: actualiza configValue y updatedBy            │
│      - Si no existe: crea nuevo documento                      │
│                                                                 │
│  11. Insert: PaymentConfigAudit.create()                      │
│      - Registra cambio en tabla de auditoría                   │
│      - Guarda oldValue, newValue, userId, IP, etc.            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                        │
                        │ HTTP 200 OK
                        │ {
                        │   success: true,
                        │   message: "Configuración actualizada...",
                        │   data: { id, configType, configKey, configValue }
                        │ }
                        │
┌───────────────────────▼───────────────────────────────────────┐
│                    FRONTEND (Dashboard)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  12. usePaymentConfig recibe respuesta                        │
│      - Actualiza estado local                                 │
│      - Muestra mensaje de éxito                                │
│      - Cierra modo edición                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Paso a Paso Detallado

### **FASE 1: Frontend - Preparación de Datos**

#### **1.1 Usuario Interactúa con la UI**

**Ubicación:** `elpatio-dashboard/src/components/paymentConfig/PaymentConfigCard.jsx`

```javascript
// Usuario ve: "700 Bs" y hace clic en "Editar"
// Ingresa nuevo valor: "750"
// Hace clic en "Guardar"
```

#### **1.2 Conversión de Valores (Centavos ↔ Bolívares)**

**Ubicación:** `elpatio-dashboard/src/utils/paymentConfig.js`

**Para valores monetarios (precios, limites):**
```javascript
// Función: convertirBolivaresACentavos()
// Input: 750 (bolívares)
// Output: 75000 (centavos)
function convertirBolivaresACentavos(bolivares) {
  // Validar que sea número positivo
  const valor = parseFloat(bolivares);
  if (isNaN(valor) || valor < 0) {
    throw new Error('El valor debe ser un número positivo');
  }
  
  // Convertir a centavos (multiplicar por 100)
  const centavos = Math.round(valor * 100);
  
  // Validar que sea entero
  if (!Number.isInteger(centavos)) {
    throw new Error('El valor debe ser un número entero');
  }
  
  return centavos;
}

// Ejemplo:
// Usuario ingresa: 750
// Se convierte a: 75000 (centavos)
// Se envía al backend: 75000
```

**Para porcentajes (comisiones):**
```javascript
// No se convierte, se envía tal cual
// Usuario ingresa: 1
// Se envía al backend: 1 (representa 1%)
```

**Para cantidades (retiros diarios/semanales):**
```javascript
// No se convierte, se envía tal cual
// Usuario ingresa: 3
// Se envía al backend: 3
```

#### **1.3 Hook usePaymentConfig - handleGuardar()**

**Ubicación:** `elpatio-dashboard/src/hooks/usePaymentConfig.js`

```javascript
const handleGuardar = async (configType, configKey, valorEnUI) => {
  try {
    // 1. Convertir valor según tipo
    let valorParaBackend;
    
    if (['precios', 'limites'].includes(configType)) {
      // Valores monetarios: convertir bolívares a centavos
      valorParaBackend = convertirBolivaresACentavos(valorEnUI);
    } else if (configType === 'comisiones') {
      // Verificar si es porcentaje o valor monetario
      if (configKey.includes('comision_fija')) {
        // Comisión fija: convertir a centavos
        valorParaBackend = convertirBolivaresACentavos(valorEnUI);
      } else {
        // Porcentajes: enviar tal cual
        valorParaBackend = parseFloat(valorEnUI);
      }
    } else {
      // Moneda y otros: enviar tal cual
      valorParaBackend = valorEnUI;
    }
    
    // 2. Validar valor
    if (!validarValor(configType, configKey, valorParaBackend)) {
      throw new Error('El valor no es válido');
    }
    
    // 3. Mostrar loading
    setGuardando(prev => ({ ...prev, [configKey]: true }));
    
    // 4. Llamar API
    await updatePaymentConfig(configType, configKey, valorParaBackend);
    
    // 5. Actualizar estado local
    setConfiguraciones(prev => 
      prev.map(config => 
        config.configType === configType && config.configKey === configKey
          ? { ...config, configValue: valorParaBackend }
          : config
      )
    );
    
    // 6. Cerrar modo edición
    handleCancelar(configKey);
    
    // 7. Mostrar éxito
    alert('✅ Configuración actualizada correctamente');
    
  } catch (error) {
    console.error('Error guardando:', error);
    alert(`❌ Error: ${error.message}`);
  } finally {
    setGuardando(prev => ({ ...prev, [configKey]: false }));
  }
};
```

#### **1.4 API Client - updatePaymentConfig()**

**Ubicación:** `elpatio-dashboard/src/services/api.js`

```javascript
export const updatePaymentConfig = async (configType, configKey, configValue) => {
  // 1. Obtener token de autenticación
  const token = getToken();
  
  // 2. Construir URL
  const url = `${API_BASE_URL}/api/payment-config`;
  
  // 3. Construir headers
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  // 4. Construir body
  const body = JSON.stringify({
    configType,    // "precios"
    configKey,     // "ludo.1v1"
    configValue    // 75000 (centavos)
  });
  
  // 5. Realizar petición HTTP PUT
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body
  });
  
  // 6. Manejar respuesta
  if (response.status === 401) {
    // Token expirado
    logout();
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.mensaje || 'Error en la petición');
  }
  
  return data;
};
```

**Request HTTP Real:**
```http
PUT /api/payment-config HTTP/1.1
Host: api.elpatio.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "configType": "precios",
  "configKey": "ludo.1v1",
  "configValue": 75000
}
```

---

### **FASE 2: Backend - Procesamiento**

#### **2.1 Middleware de Autenticación**

**Ubicación:** `elpatio-backend/middlewares/auth.js`

```javascript
const verificarToken = (req, res, next) => {
  // 1. Extraer token del header
  const authHeader = req.headers.authorization;
  // authHeader = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ mensaje: "Token no proporcionado" });
  }
  
  // 2. Extraer solo el token (sin "Bearer ")
  const token = authHeader.split(" ")[1];
  
  try {
    // 3. Verificar y decodificar JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id: "507f1f77bcf86cd799439011", rol: "admin", ... }
    
    // 4. Agregar usuario a la request
    req.user = decoded;
    
    // 5. Continuar al siguiente middleware
    next();
  } catch (error) {
    res.status(401).json({ mensaje: "Token inválido" });
  }
};
```

**Resultado:** `req.user = { id: "...", rol: "admin", ... }`

#### **2.2 Middleware de Verificación de Rol**

**Ubicación:** `elpatio-backend/middlewares/verificarMinimo.js`

```javascript
const verificarMinimo = (rolMinimo) => {
  return (req, res, next) => {
    // 1. Verificar que req.user existe (pasó autenticación)
    if (!req.user) {
      return res.status(401).json({ mensaje: "No autenticado" });
    }
    
    // 2. Jerarquía de roles
    const jerarquia = {
      'usuario': 1,
      'cajero': 2,
      'admin': 3,
      'superadmin': 4
    };
    
    // 3. Verificar que el rol del usuario sea suficiente
    const rolUsuario = req.user.rol || 'usuario';
    const nivelUsuario = jerarquia[rolUsuario] || 0;
    const nivelMinimo = jerarquia[rolMinimo] || 0;
    
    if (nivelUsuario < nivelMinimo) {
      return res.status(403).json({ 
        mensaje: "No tienes permisos suficientes" 
      });
    }
    
    // 4. Continuar al controlador
    next();
  };
};
```

**Resultado:** Si el usuario es admin o superadmin, continúa. Si no, retorna 403.

#### **2.3 Route Handler**

**Ubicación:** `elpatio-backend/routes/paymentConfig.js`

```javascript
router.put(
  "/",
  auth,                           // Middleware 1: Autenticación
  verificarMinimo("admin"),        // Middleware 2: Verificación de rol
  paymentConfigController.updateConfig  // Controlador
);
```

#### **2.4 Controller - updateConfig()**

**Ubicación:** `elpatio-backend/controllers/paymentConfigController.js`

```javascript
exports.updateConfig = async (req, res) => {
  try {
    // ==========================================
    // PASO 1: Extraer y validar datos
    // ==========================================
    const { configType, configKey, configValue } = req.body;
    const userId = req.user.id; // Del middleware de autenticación
    
    // Validar que todos los campos estén presentes
    if (!configType || !configKey || configValue === undefined) {
      return res.status(400).json({
        success: false,
        error: "configType, configKey y configValue son requeridos",
      });
    }
    
    // ==========================================
    // PASO 2: Buscar configuración existente
    // ==========================================
    let config = await PaymentConfig.findOne({
      configType,      // "precios"
      configKey,       // "ludo.1v1"
      isActive: true   // Solo configuraciones activas
    });
    
    // Query MongoDB equivalente:
    // db.paymentconfigs.findOne({
    //   configType: "precios",
    //   configKey: "ludo.1v1",
    //   isActive: true
    // })
    
    let oldValue = null;
    let action = "CREATE";
    
    // ==========================================
    // PASO 3: Actualizar o crear configuración
    // ==========================================
    if (config) {
      // CONFIGURACIÓN EXISTE: Actualizar
      oldValue = config.configValue;  // Guardar valor anterior (70000)
      action = "UPDATE";
      
      // Actualizar valores
      config.configValue = configValue;  // Nuevo valor (75000)
      config.updatedBy = userId;         // ID del usuario que actualiza
      
      // Guardar en MongoDB
      await config.save();
      
      // MongoDB Update equivalente:
      // db.paymentconfigs.updateOne(
      //   { _id: ObjectId("...") },
      //   {
      //     $set: {
      //       configValue: 75000,
      //       updatedBy: ObjectId("..."),
      //       updatedAt: ISODate("...")
      //     }
      //   }
      // )
      
    } else {
      // CONFIGURACIÓN NO EXISTE: Crear nueva
      action = "CREATE";
      
      config = new PaymentConfig({
        configType,      // "precios"
        configKey,       // "ludo.1v1"
        configValue,      // 75000
        createdBy: userId,
        updatedBy: userId,
        isActive: true
      });
      
      // Guardar en MongoDB
      await config.save();
      
      // MongoDB Insert equivalente:
      // db.paymentconfigs.insertOne({
      //   configType: "precios",
      //   configKey: "ludo.1v1",
      //   configValue: 75000,
      //   isActive: true,
      //   createdBy: ObjectId("..."),
      //   updatedBy: ObjectId("..."),
      //   createdAt: ISODate("..."),
      //   updatedAt: ISODate("...")
      // })
    }
    
    // ==========================================
    // PASO 4: Registrar en auditoría
    // ==========================================
    await PaymentConfigAudit.create({
      configId: config._id,           // ID de la configuración
      action,                          // "UPDATE" o "CREATE"
      oldValue,                        // Valor anterior (70000) o null
      newValue: configValue,          // Nuevo valor (75000)
      userId,                          // ID del usuario que hizo el cambio
      ipAddress: req.ip,               // IP del cliente
      userAgent: req.get("User-Agent") // Navegador del cliente
    });
    
    // MongoDB Insert equivalente:
    // db.paymentconfigaudits.insertOne({
    //   configId: ObjectId("..."),
    //   action: "UPDATE",
    //   oldValue: 70000,
    //   newValue: 75000,
    //   userId: ObjectId("..."),
    //   ipAddress: "192.168.1.1",
    //   userAgent: "Mozilla/5.0...",
    //   createdAt: ISODate("..."),
    //   updatedAt: ISODate("...")
    // })
    
    // ==========================================
    // PASO 5: Retornar respuesta exitosa
    // ==========================================
    res.json({
      success: true,
      message: `Configuración ${
        action === "CREATE" ? "creada" : "actualizada"
      } exitosamente`,
      data: {
        id: config._id,
        configType,
        configKey,
        configValue,
      },
    });
    
  } catch (error) {
    console.error("Error actualizando configuración:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
};
```

---

### **FASE 3: Base de Datos - Almacenamiento**

#### **3.1 Consulta de Configuración Existente**

**Colección:** `paymentconfigs`

**Query MongoDB:**
```javascript
db.paymentconfigs.findOne({
  configType: "precios",
  configKey: "ludo.1v1",
  isActive: true
})
```

**Índice utilizado:**
```javascript
// Índice compuesto definido en el modelo
db.paymentconfigs.createIndex({ 
  configType: 1, 
  configKey: 1 
})
```

**Documento encontrado (ejemplo):**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "configType": "precios",
  "configKey": "ludo.1v1",
  "configValue": 70000,
  "isActive": true,
  "createdBy": ObjectId("507f1f77bcf86cd799439012"),
  "updatedBy": ObjectId("507f1f77bcf86cd799439012"),
  "createdAt": ISODate("2024-01-15T10:00:00Z"),
  "updatedAt": ISODate("2024-01-15T10:00:00Z")
}
```

#### **3.2 Actualización del Documento**

**Operación MongoDB:**
```javascript
db.paymentconfigs.updateOne(
  { 
    _id: ObjectId("507f1f77bcf86cd799439011") 
  },
  {
    $set: {
      configValue: 75000,
      updatedBy: ObjectId("507f1f77bcf86cd799439013"),
      updatedAt: ISODate("2024-01-20T15:30:00Z")
    }
  }
)
```

**Documento actualizado:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "configType": "precios",
  "configKey": "ludo.1v1",
  "configValue": 75000,  // ← Valor actualizado
  "isActive": true,
  "createdBy": ObjectId("507f1f77bcf86cd799439012"),
  "updatedBy": ObjectId("507f1f77bcf86cd799439013"),  // ← Usuario que actualizó
  "createdAt": ISODate("2024-01-15T10:00:00Z"),
  "updatedAt": ISODate("2024-01-20T15:30:00Z")  // ← Fecha de actualización
}
```

#### **3.3 Registro en Auditoría**

**Colección:** `paymentconfigaudits`

**Operación MongoDB:**
```javascript
db.paymentconfigaudits.insertOne({
  configId: ObjectId("507f1f77bcf86cd799439011"),
  action: "UPDATE",
  oldValue: 70000,
  newValue: 75000,
  userId: ObjectId("507f1f77bcf86cd799439013"),
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  createdAt: ISODate("2024-01-20T15:30:00Z"),
  updatedAt: ISODate("2024-01-20T15:30:00Z")
})
```

**Documento de auditoría creado:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439020"),
  "configId": ObjectId("507f1f77bcf86cd799439011"),
  "action": "UPDATE",
  "oldValue": 70000,
  "newValue": 75000,
  "userId": ObjectId("507f1f77bcf86cd799439013"),
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "createdAt": ISODate("2024-01-20T15:30:00Z"),
  "updatedAt": ISODate("2024-01-20T15:30:00Z")
}
```

---

### **FASE 4: Frontend - Actualización de UI**

#### **4.1 Recepción de Respuesta**

**Ubicación:** `elpatio-dashboard/src/hooks/usePaymentConfig.js`

```javascript
// Respuesta del backend:
{
  success: true,
  message: "Configuración actualizada exitosamente",
  data: {
    id: "507f1f77bcf86cd799439011",
    configType: "precios",
    configKey: "ludo.1v1",
    configValue: 75000
  }
}

// Actualizar estado local
setConfiguraciones(prev => 
  prev.map(config => 
    config.configType === "precios" && config.configKey === "ludo.1v1"
      ? { ...config, configValue: 75000 }
      : config
  )
);
```

#### **4.2 Conversión para Mostrar en UI**

```javascript
// Valor en backend: 75000 (centavos)
// Convertir para mostrar: 750 (bolívares)

function convertirCentavosABolivares(centavos) {
  return centavos / 100;
}

// Mostrar en UI: "750 Bs"
```

---

## 🔍 Consultas MongoDB Detalladas

### **Consulta 1: Buscar Configuración Existente**

```javascript
// Query generado por Mongoose
PaymentConfig.findOne({
  configType: "precios",
  configKey: "ludo.1v1",
  isActive: true
})

// Equivalente en MongoDB Shell
db.paymentconfigs.findOne({
  configType: "precios",
  configKey: "ludo.1v1",
  isActive: true
})

// Plan de ejecución (usando explain)
db.paymentconfigs.find({
  configType: "precios",
  configKey: "ludo.1v1",
  isActive: true
}).explain("executionStats")

// Resultado esperado:
// {
//   executionStats: {
//     executionTimeMillis: 2,
//     totalDocsExamined: 1,
//     indexesUsed: ["configType_1_configKey_1"]
//   }
// }
```

### **Consulta 2: Actualizar Configuración**

```javascript
// Operación generada por Mongoose
config.save()

// Equivalente en MongoDB Shell
db.paymentconfigs.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  {
    $set: {
      configValue: 75000,
      updatedBy: ObjectId("507f1f77bcf86cd799439013"),
      updatedAt: new Date()
    }
  }
)

// Resultado:
// {
//   acknowledged: true,
//   modifiedCount: 1,
//   matchedCount: 1
// }
```

### **Consulta 3: Insertar en Auditoría**

```javascript
// Operación generada por Mongoose
PaymentConfigAudit.create({ ... })

// Equivalente en MongoDB Shell
db.paymentconfigaudits.insertOne({
  configId: ObjectId("507f1f77bcf86cd799439011"),
  action: "UPDATE",
  oldValue: 70000,
  newValue: 75000,
  userId: ObjectId("507f1f77bcf86cd799439013"),
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  createdAt: new Date(),
  updatedAt: new Date()
})

// Resultado:
// {
//   acknowledged: true,
//   insertedId: ObjectId("507f1f77bcf86cd799439020")
// }
```

---

## 📊 Estructura de Datos Completa

### **Request HTTP Completo**

```http
PUT /api/payment-config HTTP/1.1
Host: api.elpatio.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMyIsInJvbCI6ImFkbWluIiwiaWF0IjoxNzA1NzU4MDAwfQ.xyz...

{
  "configType": "precios",
  "configKey": "ludo.1v1",
  "configValue": 75000
}
```

### **Response HTTP Exitoso**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Configuración actualizada exitosamente",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "configType": "precios",
    "configKey": "ludo.1v1",
    "configValue": 75000
  }
}
```

### **Response HTTP de Error**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": "configType, configKey y configValue son requeridos"
}
```

---

## 🔐 Seguridad y Validaciones

### **Validaciones en Frontend**

1. **Validación de tipo de dato:**
   - Valores monetarios: deben ser números positivos
   - Porcentajes: deben estar entre 0 y 100
   - Cantidades: deben ser enteros positivos

2. **Validación de conversión:**
   - Verificar que la conversión centavos/bolívares sea correcta
   - Validar que el resultado sea un entero

### **Validaciones en Backend**

1. **Autenticación:**
   - Token JWT válido y no expirado
   - Usuario existe en la base de datos

2. **Autorización:**
   - Usuario tiene rol de admin o superior

3. **Validación de datos:**
   - `configType` debe ser uno de: "precios", "comisiones", "limites", "moneda"
   - `configKey` debe ser string no vacío
   - `configValue` debe estar presente (puede ser 0, null, string, etc.)

4. **Validación de negocio:**
   - ⚠️ **ACTUALMENTE NO IMPLEMENTADA** - Debería validar estructura de configKey según regex del documento

---

## 🎯 Resumen de Endpoints

| Método | Endpoint | Autenticación | Rol Requerido | Descripción |
|--------|----------|---------------|---------------|-------------|
| GET | `/api/payment-config` | ✅ | - | Obtener todas las configuraciones |
| GET | `/api/payment-config/:configType` | ✅ | - | Obtener configuraciones por tipo |
| PUT | `/api/payment-config` | ✅ | ✅ admin | Actualizar/crear configuración |
| GET | `/api/payment-config/audit` | ✅ | ✅ admin | Obtener historial de auditoría |
| DELETE | `/api/payment-config/:id` | ✅ | ✅ admin | Eliminar configuración (soft delete) |
| PATCH | `/api/payment-config/:id/restore` | ✅ | ✅ admin | Restaurar configuración eliminada |

---

## 🔄 Flujo de Conversión de Valores

### **Ejemplo Completo: Precio Ludo 1v1**

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuario ve en UI: "700 Bs"                          │
└─────────────────────────────────────────────────────────┘
                    │
                    │ Usuario hace clic en "Editar"
                    │
┌───────────────────▼─────────────────────────────────────┐
│ 2. Usuario ingresa: "750"                              │
│    (valor en bolívares)                                │
└─────────────────────────────────────────────────────────┘
                    │
                    │ Conversión en frontend
                    │
┌───────────────────▼─────────────────────────────────────┐
│ 3. convertirBolivaresACentavos(750)                   │
│    → 750 * 100 = 75000 centavos                        │
└─────────────────────────────────────────────────────────┘
                    │
                    │ HTTP PUT Request
                    │
┌───────────────────▼─────────────────────────────────────┐
│ 4. Backend recibe: configValue = 75000                 │
│    (almacenado en MongoDB como 75000)                   │
└─────────────────────────────────────────────────────────┘
                    │
                    │ Response HTTP
                    │
┌───────────────────▼─────────────────────────────────────┐
│ 5. Frontend recibe: configValue = 75000                │
│    convertirCentavosABolivares(75000)                 │
│    → 75000 / 100 = 750                                 │
└─────────────────────────────────────────────────────────┘
                    │
                    │ Actualizar UI
                    │
┌───────────────────▼─────────────────────────────────────┐
│ 6. Usuario ve en UI: "750 Bs"                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Notas Importantes

1. **Valores siempre en centavos en el backend:**
   - El backend NUNCA debe recibir valores en bolívares
   - La conversión debe hacerse SIEMPRE en el frontend

2. **Auditoría automática:**
   - Cada cambio se registra automáticamente
   - Se guarda valor anterior, nuevo valor, usuario, IP, fecha

3. **Upsert automático:**
   - Si la configuración no existe, se crea automáticamente
   - No es necesario crear configuraciones manualmente

4. **Soft delete:**
   - Las configuraciones no se eliminan físicamente
   - Se marca `isActive: false`
   - Se pueden restaurar después

5. **Índices optimizados:**
   - Búsqueda por `configType` y `configKey` es muy rápida
   - Índice compuesto: `{ configType: 1, configKey: 1 }`

---

**Última actualización:** 2024-01-20
