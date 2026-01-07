/**
 * Mini App de Depósitos - El Patio
 * Aplicación principal para manejar depósitos
 */

class DepositApp {
  constructor() {
    this.telegram = window.Telegram?.WebApp;
    this.currentScreen = "loading-screen";
    this.currentTransaction = null;
    this.pollingInterval = null;
    this.userData = null;

    this.init();
  }

  /**
   * Inicializa la aplicación
   */
  async init() {
    console.log("🚀 Inicializando Mini App de Depósitos");

    try {
      // Configurar tema de Telegram
      this.setupTelegramTheme();

      // Configurar eventos
      this.setupEventListeners();

      // Obtener datos del usuario
      await this.loadUserData();

      // Mostrar pantalla principal
      this.showScreen("main-screen");

      console.log("✅ Mini App inicializada correctamente");
    } catch (error) {
      console.error("❌ Error inicializando Mini App:", error);
      this.showError("Error de inicialización", error.message);
    }
  }

  /**
   * Configura el tema de Telegram
   */
  setupTelegramTheme() {
    if (!this.telegram) {
      console.warn("⚠️ Telegram WebApp no disponible");
      return;
    }

    // Configurar colores del tema
    this.telegram.setHeaderColor("#2481cc");
    this.telegram.setBackgroundColor("#ffffff");

    // Expandir la app
    this.telegram.expand();

    // Configurar botón de cierre
    this.telegram.enableClosingConfirmation();

    console.log("🎨 Tema de Telegram configurado");
  }

  /**
   * Configura los event listeners
   */
  setupEventListeners() {
    // Formulario de depósito
    const depositForm = document.getElementById("deposit-form");
    if (depositForm) {
      depositForm.addEventListener("submit", (e) =>
        this.handleDepositSubmit(e)
      );
    }

    // Botón cancelar solicitud
    const cancelRequestBtn = document.getElementById("cancel-request");
    if (cancelRequestBtn) {
      cancelRequestBtn.addEventListener("click", () =>
        this.cancelDepositRequest()
      );
    }

    // Botón confirmar pago
    const confirmPaymentBtn = document.getElementById("confirm-payment");
    if (confirmPaymentBtn) {
      confirmPaymentBtn.addEventListener("click", () =>
        this.showPaymentConfirmation()
      );
    }

    // Botón cancelar pago
    const cancelPaymentBtn = document.getElementById("cancel-payment");
    if (cancelPaymentBtn) {
      cancelPaymentBtn.addEventListener("click", () => this.cancelPayment());
    }

    // Formulario de confirmación de pago
    const paymentForm = document.getElementById("payment-form");
    if (paymentForm) {
      paymentForm.addEventListener("submit", (e) =>
        this.handlePaymentSubmit(e)
      );
    }

    // Botón volver a datos bancarios
    const backToBankBtn = document.getElementById("back-to-bank-info");
    if (backToBankBtn) {
      backToBankBtn.addEventListener("click", () =>
        this.showScreen("bank-info-screen")
      );
    }

    // Botón cerrar app
    const closeAppBtn = document.getElementById("close-app");
    if (closeAppBtn) {
      closeAppBtn.addEventListener("click", () => this.closeApp());
    }

    // Botones de error
    const retryBtn = document.getElementById("retry-action");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => this.retryAction());
    }

    const closeErrorBtn = document.getElementById("close-error");
    if (closeErrorBtn) {
      closeErrorBtn.addEventListener("click", () => this.closeApp());
    }

    console.log("🎯 Event listeners configurados");
  }

  /**
   * Carga los datos del usuario
   */
  async loadUserData() {
    try {
      if (!this.telegram) {
        console.warn("⚠️ Telegram WebApp no disponible - Modo desarrollo");
        // Crear datos de usuario simulados para desarrollo
        this.userData = {
          id: 123456789,
          first_name: "Usuario",
          last_name: "Prueba",
          username: "usuario_prueba",
          is_bot: false,
        };
        console.log("👤 Usando datos de usuario simulados:", this.userData);
      } else {
        // Obtener datos del usuario desde Telegram
        this.userData = this.telegram.initDataUnsafe?.user;

        if (!this.userData) {
          throw new Error("No se pudieron obtener los datos del usuario");
        }

        console.log("👤 Datos del usuario cargados:", this.userData);
      }

      // Cargar saldo del usuario (simulado por ahora)
      await this.loadUserBalance();
    } catch (error) {
      console.error("❌ Error cargando datos del usuario:", error);
      throw new Error("Error de autenticación");
    }
  }

  /**
   * Carga el saldo del usuario
   */
  async loadUserBalance() {
    try {
      // Por ahora simulamos el saldo
      const balance = 0; // Aquí harías la petición real al backend

      const balanceElement = document.getElementById("current-balance");
      if (balanceElement) {
        balanceElement.textContent = formatAmount(balance);
      }
    } catch (error) {
      console.error("❌ Error cargando saldo:", error);
      // No mostramos error, solo dejamos "Cargando..."
    }
  }

  /**
   * Maneja el envío del formulario de depósito
   */
  async handleDepositSubmit(event) {
    event.preventDefault();

    const amountInput = document.getElementById("amount");
    const amount = parseFloat(amountInput.value);

    // Validar monto
    const validation = validateAmount(amount);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    try {
      // Mostrar pantalla de espera
      this.showScreen("waiting-screen");

      // Actualizar información en pantalla de espera
      document.getElementById("waiting-amount").textContent =
        formatAmount(amount);
      document.getElementById("waiting-status").textContent = "Pendiente";

      // Crear solicitud de depósito (simulado)
      const transaction = await this.createDepositRequest(amount);

      this.currentTransaction = transaction;
      document.getElementById("waiting-id").textContent =
        transaction.id || "N/A";

      // Simular asignación de cajero después de 3 segundos
      setTimeout(() => {
        this.simulateCashierAssignment();
      }, 3000);
    } catch (error) {
      console.error("❌ Error creando solicitud de depósito:", error);
      this.showError("Error al crear solicitud", error.message);
    }
  }

  /**
   * Crea una solicitud de depósito (simulado)
   */
  async createDepositRequest(amount) {
    // Simular petición al backend
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: "TXN-" + Date.now(),
          amount: toCents(amount),
          status: "pending",
          createdAt: new Date().toISOString(),
        });
      }, 1000);
    });
  }

  /**
   * Simula la asignación de un cajero
   */
  simulateCashierAssignment() {
    // Datos simulados del cajero
    const cashierData = {
      bank: "Banco de Venezuela",
      phone: "0412-1234567",
      id: "12345678",
      amount: formatAmount(toBolivares(this.currentTransaction.amount)),
    };

    // Actualizar pantalla de datos bancarios
    document.getElementById("bank-name").textContent = cashierData.bank;
    document.getElementById("bank-phone").textContent = cashierData.phone;
    document.getElementById("bank-id").textContent = cashierData.id;
    document.getElementById("bank-amount").textContent = cashierData.amount;

    // Mostrar pantalla de datos bancarios
    this.showScreen("bank-info-screen");
  }

  /**
   * Muestra la pantalla de confirmación de pago
   */
  showPaymentConfirmation() {
    this.showScreen("payment-confirmation-screen");

    // Establecer fecha actual como valor por defecto
    const dateInput = document.getElementById("payment-date");
    if (dateInput) {
      dateInput.value = new Date().toISOString().split("T")[0];
    }
  }

  /**
   * Maneja el envío del formulario de confirmación de pago
   */
  async handlePaymentSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const paymentData = {
      bank: formData.get("payment-bank"),
      phone: formData.get("payment-phone"),
      date: formData.get("payment-date"),
      amount: toBolivares(this.currentTransaction.amount), // Usar el monto de la transacción original
    };

    try {
      // Mostrar pantalla de confirmación final
      this.showScreen("final-confirmation-screen");

      // Actualizar información final
      document.getElementById("final-amount").textContent = formatAmount(
        paymentData.amount
      );
      document.getElementById("final-id").textContent =
        this.currentTransaction.id;

      // Simular confirmación de pago
      await this.confirmUserPayment(paymentData);
    } catch (error) {
      console.error("❌ Error confirmando pago:", error);
      this.showError("Error al confirmar pago", error.message);
    }
  }

  /**
   * Confirma el pago del usuario (simulado)
   */
  async confirmUserPayment(paymentData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("✅ Pago confirmado:", paymentData);
        resolve();
      }, 1000);
    });
  }

  /**
   * Cancela la solicitud de depósito
   */
  cancelDepositRequest() {
    if (confirm("¿Estás seguro de que quieres cancelar la solicitud?")) {
      this.currentTransaction = null;
      this.showScreen("main-screen");
    }
  }

  /**
   * Cancela el pago
   */
  cancelPayment() {
    if (confirm("¿Estás seguro de que quieres cancelar el pago?")) {
      this.showScreen("main-screen");
    }
  }

  /**
   * Muestra una pantalla específica
   */
  showScreen(screenId) {
    // Ocultar todas las pantallas
    const screens = document.querySelectorAll(".screen");
    screens.forEach((screen) => {
      screen.classList.remove("active");
    });

    // Mostrar la pantalla solicitada
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add("active");
      this.currentScreen = screenId;
      console.log(`📱 Mostrando pantalla: ${screenId}`);
    }
  }

  /**
   * Muestra un error
   */
  showError(title, message) {
    document.getElementById("error-title").textContent = title;
    document.getElementById("error-message").textContent = message;
    this.showScreen("error-screen");
  }

  /**
   * Reintenta la acción anterior
   */
  retryAction() {
    if (this.currentScreen === "error-screen") {
      // Volver a la pantalla principal
      this.showScreen("main-screen");
    }
  }

  /**
   * Cierra la aplicación
   */
  closeApp() {
    if (this.telegram) {
      this.telegram.close();
    } else {
      // Fallback para desarrollo
      window.close();
    }
  }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  new DepositApp();
});
