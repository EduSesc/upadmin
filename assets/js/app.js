const botaoNotif = document.getElementById("ativarNotificacoes");
const iconeSino = document.getElementById("iconeSino");

// Registrar Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("SW teste registrado:", reg))
      .catch((err) => console.error("Erro SW teste:", err));
  });
}

// Gerenciar o botão de instalação
let deferredPrompt;
const installButton = document.getElementById("installButton");

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevenir que o browser mostre o prompt automaticamente
  e.preventDefault();
  // Guardar o evento para que possa ser acionado depois
  deferredPrompt = e;
  // Mostrar o botão de instalação
  installButton.style.display = "block";

  installButton.addEventListener("click", (e) => {
    // Esconder o botão
    installButton.style.display = "none";
    // Mostrar o prompt de instalação
    deferredPrompt.prompt();
    // Aguardar que o usuário responda ao prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("Usuário aceitou a instalação");
      } else {
        console.log("Usuário recusou a instalação");
      }
      deferredPrompt = null;
    });
  });
});

// Esconder o botão se o app já estiver instalado
window.addEventListener("appinstalled", (evt) => {
  console.log("Aplicativo instalado com sucesso.");
  installButton.style.display = "none";
});

async function subscribeUser() {
  console.log("Clicou no sino");

  try {
    const registration = await navigator.serviceWorker.ready;
    console.log("Service Worker pronto:", registration);

    const permission = await Notification.requestPermission();
    console.log("Permissão de notificação:", permission);

    if (permission !== "granted") {
      alert("Permissão negada para notificações.");
      return;
    }

    // Tenta criar a subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        "BADK4NkBEFaIpNDPiCDPybf-8j2NZkJHo3np9g5L19hQ1OcXeUJCRl33TRTMCF-s4CBNu7PVe6nfOojVonQMuUM"
      ),
    });

    console.log("Usuário inscrito:", subscription);

    // Muda o ícone
    iconeSino.className = "fa-solid fa-bell";
    console.log("Ícone atualizado para ativo");
  } catch (err) {
    console.error("Erro no subscribe:", err);
  }
}

// Converter chave pública VAPID (base64 → Uint8Array)
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Chame quando quiser inscrever (ex: botão “Ativar Notificações”)
document
  .getElementById("ativarNotificacoes")
  ?.addEventListener("click", subscribeUser);
