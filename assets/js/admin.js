// Inicializar Supabase
const SUPABASE_URL = "https://wthcwllhzbahvnnjqlko.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aGN3bGxoemJhaHZubmpxbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTk5NjMsImV4cCI6MjA3MDA5NTk2M30.7uzMcp8NsyxYuMmN7nnbBB0dJITJ_C7O7Ck0HFQgbOA";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos do DOM
const initialLoader = document.getElementById("initial-loader");
const loginContainer = document.getElementById("login-container");
const loginForm = document.getElementById("admin-login-form");
const errorMessage = document.getElementById("error-message");
const successMessage = document.getElementById("success-message");
const loader = document.getElementById("loader");

// Função para verificar autenticação
async function checkAuth() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (session) {
      // Usuário já está autenticado, redirecionar diretamente
      window.location.href = "dashboard.html";
      return true;
    }

    return false;
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    return false;
  }
}

// Função para mostrar o formulário de login
function showLoginForm() {
  initialLoader.style.display = "none";
  loginContainer.style.display = "block";
}

// Função para fazer login
async function handleLogin(email, password) {
  try {
    loader.style.display = "block";
    errorMessage.style.display = "none";
    successMessage.style.display = "none";

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      throw error;
    }

    showSuccess("Login bem-sucedido! Redirecionando...");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);
  } catch (error) {
    showError("Erro: " + error.message);
  } finally {
    loader.style.display = "none";
  }
}

// Função para mostrar mensagem de erro
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  successMessage.style.display = "none";
}

// Função para mostrar mensagem de sucesso
function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.style.display = "block";
  errorMessage.style.display = "none";
}

// Inicializar a página
async function initializePage() {
  try {
    // Verificar se já está autenticado
    const isAuthenticated = await checkAuth();

    if (!isAuthenticated) {
      // Mostrar formulário de login apenas se não estiver autenticado
      showLoginForm();

      // Preencher automaticamente para teste (apenas desenvolvimento)
      setTimeout(() => {
        document.getElementById("email").value = "admin@up7antigos.com";
        document.getElementById("password").value = "senha123";
      }, 500);
    }
  } catch (error) {
    console.error("Erro na inicialização:", error);
    showLoginForm();
  }
}

// Event listener para o formulário
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showError("Por favor, preencha todos os campos");
    return;
  }

  await handleLogin(email, password);
});

// Iniciar quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", function () {
  // Pequeno delay para evitar flicker
  setTimeout(initializePage, 100);
});

// Listener para mudanças de autenticação
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN" && session) {
    window.location.href = "dashboard.html";
  }
});
