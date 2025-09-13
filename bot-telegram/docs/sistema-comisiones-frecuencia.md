# 💸 Sistema de Comisiones por Frecuencia Semanal

## 📋 **Resumen del Sistema**

El sistema de comisiones por retiro implementa un modelo de **frecuencia semanal** que incentiva la planificación de retiros y reduce los costos para usuarios responsables.

### **Escala de Comisiones:**

- **1er retiro de la semana:** 0% (sin comisión)
- **2do retiro de la semana:** 1%
- **3er retiro de la semana:** 2%
- **Retiros adicionales:** 5%

### **Período:** 7 días (semanal)

---

## 🎯 **Objetivos del Sistema**

### **1. Incentivar Planificación**

- Usuarios planifican mejor sus retiros
- Reducen costos aprovechando el 0% del primer retiro
- Evitan retiros frecuentes innecesarios

### **2. Generar Ingresos Sostenibles**

- Comisiones escalonadas según frecuencia
- Ingresos predecibles para la plataforma
- Modelo justo para usuarios responsables

### **3. Prevenir Abusos**

- Desincentiva retiros excesivos
- Reduce costos operativos
- Mantiene equilibrio entre usuario y plataforma

---

## ⚙️ **Configuración Técnica**

### **Archivo de Configuración:**

```javascript
// config/payment-config.js
comisiones: {
  retiro: {
    frecuencia_semanal: {
      primera_vez: 0,      // 0% en el primer retiro
      segunda_vez: 1,      // 1% en el segundo retiro
      tercera_vez: 2,      // 2% en el tercer retiro
      adicional: 5,        // 5% para retiros adicionales
      periodo_dias: 7,     // Período de 7 días
      descripcion: "Comisiones por frecuencia semanal"
    },
    fija: 500,            // 5,00 Bs mínimo
    maximo: 5000,         // 50,00 Bs máximo
  }
}
```

### **Funciones Principales:**

```javascript
// utils/money-utils.js
calculateWithdrawalFee(amount, weeklyWithdrawals);
getWeeklyFeeInfo(weeklyWithdrawals);
getNextFeePercentage(nextWithdrawal);
```

---

## 📊 **Ejemplos de Cálculo**

### **Semana 1 - Usuario Responsable:**

| Retiro    | Monto           | Comisión     | Porcentaje  | Neto            |
| --------- | --------------- | ------------ | ----------- | --------------- |
| 1er       | 1.000,00 Bs     | 5,00 Bs      | 0% (mínimo) | 995,00 Bs       |
| 2do       | 500,00 Bs       | 5,00 Bs      | 1% (mínimo) | 495,00 Bs       |
| **Total** | **1.500,00 Bs** | **10,00 Bs** | **0,67%**   | **1.490,00 Bs** |

### **Semana 2 - Usuario Frecuente:**

| Retiro    | Monto           | Comisión     | Porcentaje  | Neto            |
| --------- | --------------- | ------------ | ----------- | --------------- |
| 1er       | 500,00 Bs       | 5,00 Bs      | 0% (mínimo) | 495,00 Bs       |
| 2do       | 300,00 Bs       | 3,00 Bs      | 1%          | 297,00 Bs       |
| 3er       | 200,00 Bs       | 4,00 Bs      | 2%          | 196,00 Bs       |
| 4to       | 100,00 Bs       | 5,00 Bs      | 5%          | 95,00 Bs        |
| **Total** | **1.100,00 Bs** | **17,00 Bs** | **1,55%**   | **1.083,00 Bs** |

---

## 🔧 **Comandos de Administración**

### **Ver Configuración Actual:**

```bash
/verprecios
```

### **Configurar Comisiones por Frecuencia:**

```bash
# Configurar primer retiro (0%)
/configurarcomision retiro frecuencia_primera_vez 0

# Configurar segundo retiro (1%)
/configurarcomision retiro frecuencia_segunda_vez 1

# Configurar tercer retiro (2%)
/configurarcomision retiro frecuencia_tercera_vez 2

# Configurar retiros adicionales (5%)
/configurarcomision retiro frecuencia_adicional 5

# Configurar período (7 días)
/configurarcomision retiro frecuencia_periodo_dias 7
```

### **Configurar Comisiones Fijas:**

```bash
# Configurar comisión mínima
/configurarcomision retiro fija 5

# Configurar comisión máxima
/configurarcomision retiro maximo 50
```

---

## 📱 **Experiencia del Usuario**

### **Información en Perfil:**

```
💸 **Comisiones por Retiro (Semanal)**

📊 **Esta semana:** 2 retiros realizados
🎯 **Próximo retiro:** 2% de comisión

📋 **Escala de comisiones:**
• 1er retiro: 0%
• 2do retiro: 1%
• 3er retiro: 2%
• Adicionales: 5%

⏰ **Período:** Cada 7 días
💡 **Consejo:** Planifica tus retiros para aprovechar el 0%
```

### **Confirmación de Retiro:**

```
📋 **Retiro solicitado**

💰 Monto: 1.000,00 Bs
💸 Comisión: 20,00 Bs (Tercer retiro de la semana (2%))
💳 Neto a recibir: 980,00 Bs

📊 Retiro #3 de esta semana
⏳ Procesando... (24-48 horas)

📧 Recibirás confirmación por email.
```

---

## 🧪 **Pruebas y Validación**

### **Script de Pruebas:**

```bash
node scripts/test-comisiones-frecuencia.js
```

### **Casos de Prueba:**

- ✅ Primer retiro: 0% (comisión mínima aplicada)
- ✅ Segundo retiro: 1% (cálculo correcto)
- ✅ Tercer retiro: 2% (cálculo correcto)
- ✅ Retiros adicionales: 5% (cálculo correcto)
- ✅ Comisión mínima: 5,00 Bs (siempre aplicada)
- ✅ Comisión máxima: 50,00 Bs (límite respetado)
- ✅ Información de usuario: correcta y clara

---

## 💡 **Beneficios del Sistema**

### **Para Usuarios:**

1. **Ahorro de Costos:** Primer retiro sin comisión
2. **Transparencia:** Información clara sobre comisiones
3. **Incentivo:** Planificación recompensada
4. **Flexibilidad:** Múltiples retiros permitidos

### **Para la Plataforma:**

1. **Ingresos Predecibles:** Comisiones escalonadas
2. **Reducción de Costos:** Menos retiros frecuentes
3. **Sostenibilidad:** Modelo económico balanceado
4. **Escalabilidad:** Sistema adaptable

### **Para el Sistema:**

1. **Eficiencia:** Menos transacciones pequeñas
2. **Estabilidad:** Flujo de caja predecible
3. **Crecimiento:** Ingresos proporcionales al uso
4. **Equilibrio:** Justo para todos los usuarios

---

## 🔮 **Futuras Mejoras**

### **Funcionalidades Planificadas:**

1. **Historial de Retiros:** Seguimiento detallado
2. **Notificaciones:** Alertas sobre comisiones
3. **Análisis:** Estadísticas de uso
4. **Personalización:** Comisiones por tipo de usuario

### **Optimizaciones:**

1. **Cache de Datos:** Mejor rendimiento
2. **Validaciones:** Mayor seguridad
3. **Reportes:** Informes detallados
4. **Integración:** Con sistemas externos

---

## 📝 **Notas Importantes**

### **Consideraciones Técnicas:**

- Las comisiones se calculan en tiempo real
- El período semanal se reinicia automáticamente
- Los límites mínimos y máximos siempre se aplican
- La información se actualiza en cada retiro

### **Consideraciones de Negocio:**

- El sistema incentiva el uso responsable
- Las comisiones son transparentes y predecibles
- El modelo es sostenible a largo plazo
- Se adapta a diferentes patrones de uso

---

## 🎉 **Conclusión**

El sistema de comisiones por frecuencia semanal proporciona:

✅ **Transparencia total** para los usuarios
✅ **Ingresos sostenibles** para la plataforma  
✅ **Incentivos claros** para uso responsable
✅ **Flexibilidad** para diferentes patrones de uso
✅ **Escalabilidad** para crecimiento futuro

**Estado:** ✅ **IMPLEMENTADO Y FUNCIONAL**
**Pruebas:** ✅ **TODAS PASARON**
**Documentación:** ✅ **COMPLETA**
