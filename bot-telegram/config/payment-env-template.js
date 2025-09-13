/**
 * Template de Variables de Entorno para Sistema de Pagos
 * 
 * Copia este archivo como .env y configura las variables necesarias
 * para el sistema de pagos
 */

// ===== CONFIGURACIÓN DE PAGOS =====

# Modo de pagos (virtual | real)
PAYMENT_MODE=virtual

# Configuración de moneda
PAYMENT_CURRENCY=USD
PAYMENT_DECIMALS=2

# Límites de transacciones (en centavos)
PAYMENT_DEPOSIT_MIN=1000
PAYMENT_DEPOSIT_MAX=1000000
PAYMENT_DEPOSIT_DAILY=500000

PAYMENT_WITHDRAWAL_MIN=5000
PAYMENT_WITHDRAWAL_MAX=500000
PAYMENT_WITHDRAWAL_DAILY=200000

PAYMENT_BALANCE_MAX=2000000

# Comisiones (en porcentaje)
PAYMENT_DEPOSIT_FEE_PERCENT=0
PAYMENT_WITHDRAWAL_FEE_PERCENT=2
PAYMENT_GAME_FEE_PERCENT=20

# Comisiones fijas (en centavos)
PAYMENT_WITHDRAWAL_FEE_FIXED=100
PAYMENT_WITHDRAWAL_FEE_MAX=1000

# Configuración de seguridad
PAYMENT_TRANSACTION_EXPIRY=30
PAYMENT_MAX_ATTEMPTS_PER_HOUR=10
PAYMENT_TRANSACTION_DELAY=5

# ===== CONFIGURACIÓN DE PASARELA DE PAGOS =====

# Stripe (para pagos reales)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal (alternativa)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox

# Mercado Pago (para Latinoamérica)
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_PUBLIC_KEY=TEST-...

# ===== CONFIGURACIÓN DE EMAIL =====

# Para confirmaciones de transacciones
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-password-app
EMAIL_FROM=noreply@elpatio.com

# ===== CONFIGURACIÓN DE BASE DE DATOS =====

# Para transacciones (si usas base de datos separada)
PAYMENT_DB_HOST=localhost
PAYMENT_DB_PORT=27017
PAYMENT_DB_NAME=elpatio_payments
PAYMENT_DB_USER=
PAYMENT_DB_PASS=

# ===== CONFIGURACIÓN DE LOGS =====

# Nivel de logging para transacciones
PAYMENT_LOG_LEVEL=info
PAYMENT_LOG_FILE=logs/payments.log

# ===== CONFIGURACIÓN DE AUDITORÍA =====

# Habilitar auditoría completa
PAYMENT_AUDIT_ENABLED=true
PAYMENT_AUDIT_RETENTION_DAYS=365

# ===== CONFIGURACIÓN DE NOTIFICACIONES =====

# Webhook para notificaciones de transacciones
PAYMENT_WEBHOOK_URL=https://tu-dominio.com/webhooks/payment

# ===== CONFIGURACIÓN DE DESARROLLO =====

# Modo de desarrollo (true | false)
PAYMENT_DEV_MODE=true

# Saldo inicial para usuarios de prueba (en centavos)
PAYMENT_TEST_BALANCE=10000

# Habilitar transacciones de prueba
PAYMENT_TEST_TRANSACTIONS=true
