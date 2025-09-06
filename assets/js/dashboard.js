const SUPABASE_URL = 'https://wthcwllhzbahvnnjqlko.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aGN3bGxoemJhaHZubmpxbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTk5NjMsImV4cCI6MjA3MDA5NTk2M30.7uzMcp8NsyxYuMmN7nnbBB0dJITJ_C7O7Ck0HFQgbOA';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verificar autenticação
async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
        // Não autenticado, redirecionar para login
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Logout
async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// Inicializar dashboard
async function initializeDashboard() {
    const isAuthenticated = await checkAuth();
    
    if (isAuthenticated) {
        // Carregar dados do dashboard aqui
        console.log('Usuário autenticado, carregando dashboard...');
        document.getElementById('content').style.display = 'block';
        document.getElementById('loader').style.display = 'none';
    }
}

// Iniciar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeDashboard);