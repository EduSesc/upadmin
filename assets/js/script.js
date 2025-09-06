// ===== CONFIGURAÇÕES GLOBAIS =====
const supabaseUrl = "https://wthcwllhzbahvnnjqlko.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aGN3bGxoemJhaHZubmpxbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTk5NjMsImV4cCI6MjA3MDA5NTk2M30.7uzMcp8NsyxYuMmN7nnbBB0dJITJ_C7O7Ck0HFQgbOA";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variáveis globais
let isLoggedIn = false;
let currentTab = "vehicles";
const urlParams = new URLSearchParams(window.location.search);
const produtoId = urlParams.get("id");

// ===== FUNÇÕES DE FORMATO =====
function formatarPreco(valor) {
  const valorCorrigido = Number(valor) / 100;
  return valorCorrigido.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ===== CARROSSEL =====
(function () {
  const container = document.querySelector(".carousel-container");
  if (!container) return;

  const slides = container.querySelectorAll(".carousel-slide");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");
  const indicators = document.querySelectorAll(".indicator");
  if (!slides.length) return;

  let current = [...slides].findIndex((s) => s.classList.contains("active"));
  if (current < 0) current = 0;
  const total = slides.length;
  let timer;

  function show(i) {
    slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
    indicators.forEach((d, idx) => d.classList.toggle("active", idx === i));
    current = i;
  }

  function next() {
    show((current + 1) % total);
  }
  function prev() {
    show((current - 1 + total) % total);
  }

  function start() {
    timer = setInterval(next, 5000);
  }
  function reset() {
    clearInterval(timer);
    start();
  }

  nextBtn?.addEventListener("click", () => {
    next();
    reset();
  });
  prevBtn?.addEventListener("click", () => {
    prev();
    reset();
  });
  indicators.forEach((d, idx) =>
    d.addEventListener("click", () => {
      show(idx);
      reset();
    })
  );

  show(current);
  start();
})();

// ===== NAVBAR SCROLL EFFECT =====
function setupNavbarScroll() {
  const navbar = document.querySelector(".navbar");

  if (!navbar) return;

  window.addEventListener("scroll", function () {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
}

// ===== NAVEGAÇÃO =====
function initializeNavigation() {
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");

  // Menu mobile
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      navMenu.classList.toggle("active");
      animateHamburger(navToggle, navMenu.classList.contains("active"));
    });

    // Fechar menu ao clicar fora
    document.addEventListener("click", function (e) {
      if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove("active");
        animateHamburger(navToggle, false);
      }
    });

    // Fechar menu ao clicar nos links
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active");
        animateHamburger(navToggle, false);
      });
    });
  }

  // Scroll suave para links âncora
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Ativar link da página atual
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach((link) => {
    const linkPath = link.getAttribute("href").split("/").pop();
    if (currentPath === linkPath) {
      link.classList.add("active");
    }
  });
}
/*
function animateHamburger(navToggle, isActive) {
  const bars = navToggle.querySelectorAll(".bar");
  bars.forEach((bar, index) => {
    if (isActive) {
      if (index === 0)
        bar.style.transform = "rotate(45deg) translate(5px, 5px)";
      if (index === 1) bar.style.opacity = "0";
      if (index === 2)
        bar.style.transform = "rotate(-45deg) translate(7px, -6px)";
    } else {
      bar.style.transform = "none";
      bar.style.opacity = "1";
    }
  });
}*/

// ===== CARROS EM DESTAQUE =====
async function loadFeaturedCars() {
  const grid = document.getElementById("featured-grid");
  if (!grid) return;

  try {
    const { data, error } = await supabase
      .from("cars")
      .select("id, title, short_description, price, cover_image_url, km, year")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;
    if (!data || data.length === 0) return;

    // Renderizar os carros em destaque
    grid.innerHTML = data
      .map(
        (car) => `
      <div class="featured-card">
        <div class="card-image">
          <img src="${
            car.cover_image_url || "assets/img/default-car.jpg"
          }" alt="${car.title}">
        </div>
        <div class="card-content">
          <h3>${car.title}</h3>
          <p class="car-info">${car.year} • ${car.km.toLocaleString(
          "pt-BR"
        )} km</p>
          <p class="short-description">${car.short_description}</p>
          <p class="price">${formatarPreco(car.price)}</p>
          <p><a href="detalhes.html?id=${produto.id}">Ver detalhes</a></p>
          </div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Erro ao carregar carros:", error);
  }
}

// ===== FILTROS =====
function initializeFilters() {
  const filters = ["marca-filter", "ano-filter", "preco-filter"];

  filters.forEach((filterId) => {
    const filter = document.getElementById(filterId);
    if (filter) filter.addEventListener("change", applyFilters);
  });

  const clearButton = document.querySelector(".filter-clear");
  if (clearButton) clearButton.addEventListener("click", clearFilters);
}

function applyFilters() {
  const marcaFilter = document.getElementById("marca-filter")?.value;
  const anoFilter = document.getElementById("ano-filter")?.value;
  const precoFilter = document.getElementById("preco-filter")?.value;

  document.querySelectorAll(".vehicle-card").forEach((card) => {
    const marca = card.getAttribute("data-marca");
    const ano = parseInt(card.getAttribute("data-ano"));
    const preco = parseInt(card.getAttribute("data-preco"));

    let showCard = true;

    // Filtro por marca
    if (marcaFilter && marca !== marcaFilter) showCard = false;

    // Filtro por ano
    if (showCard && anoFilter) {
      const [minAno, maxAno] = anoFilter.split("-").map(Number);
      if (ano < minAno || ano > maxAno) showCard = false;
    }

    // Filtro por preço
    if (showCard && precoFilter) {
      if (precoFilter.includes("+")) {
        const minPreco = parseInt(precoFilter.replace("+", ""));
        if (preco < minPreco) showCard = false;
      } else {
        const [minPreco, maxPreco] = precoFilter.split("-").map(Number);
        if (preco < minPreco || preco > maxPreco) showCard = false;
      }
    }

    // Aplicar efeito de transição
    card.style.opacity = showCard ? "1" : "0";
    card.style.transform = showCard ? "translateY(0)" : "translateY(20px)";
    setTimeout(
      () => {
        card.style.display = showCard ? "block" : "none";
      },
      showCard ? 0 : 300
    );
  });
}

function clearFilters() {
  ["marca-filter", "ano-filter", "preco-filter"].forEach((id) => {
    const filter = document.getElementById(id);
    if (filter) filter.value = "";
  });

  document.querySelectorAll(".vehicle-card").forEach((card) => {
    card.style.display = "block";
    card.style.opacity = "1";
    card.style.transform = "translateY(0)";
  });
}

// ===== MODAL DE VÍDEO =====
function initializeVideoModal() {
  const videoModal = document.getElementById("video-modal");
  if (!videoModal) return;

  document.querySelectorAll(".video-card").forEach((card) => {
    card.addEventListener("click", () => {
      const videoId = card.getAttribute("data-video");
      openVideoModal(videoId);
    });
  });

  document
    .querySelector(".close-modal")
    ?.addEventListener("click", closeVideoModal);

  videoModal.addEventListener("click", (e) => {
    if (e.target === videoModal) closeVideoModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && videoModal.style.display === "block") {
      closeVideoModal();
    }
  });
}

function openVideoModal(videoId) {
  const videoModal = document.getElementById("video-modal");
  if (videoModal) {
    videoModal.style.display = "block";
    document.body.style.overflow = "hidden";
    // Aqui você pode carregar o vídeo real usando o videoId
  }
}

function closeVideoModal() {
  const videoModal = document.getElementById("video-modal");
  if (videoModal) {
    videoModal.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

// ===== ANIMAÇÕES =====
function initializeAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in-up");
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );

  document
    .querySelectorAll(
      ".category-card, .featured-card, .vehicle-card, .video-card, .event-card, .raffle-card, .winner-card, .step-item, .testimonial-card"
    )
    .forEach((el) => observer.observe(el));

  // Efeitos hover em botões
  document
    .querySelectorAll(
      ".cta-button, .card-button, .vehicle-btn, .event-btn, .raffle-btn"
    )
    .forEach((button) => {
      button.addEventListener(
        "mouseenter",
        () => (button.style.transform = "translateY(-2px)")
      );
      button.addEventListener(
        "mouseleave",
        () => (button.style.transform = "translateY(0)")
      );
    });
}

// ===== COUNTDOWN =====
function initializeCountdowns() {
  document.querySelectorAll(".countdown").forEach((element) => {
    const targetDate = element.getAttribute("data-date");
    if (targetDate) {
      updateCountdown(element, targetDate);
      setInterval(() => updateCountdown(element, targetDate), 1000);
    }
  });
}

function updateCountdown(element, targetDate) {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const difference = target - now;

  if (difference > 0) {
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      element.textContent = `${days} dias`;
    } else if (hours > 0) {
      element.textContent = `${hours} horas`;
    } else {
      element.textContent = `${minutes} minutos`;
    }
  } else {
    element.textContent = "Encerrado";
  }
}

// ===== INICIALIZAÇÃO DA APLICAÇÃO =====

function initializeApp() {
  setupNavbarScroll();
  initializeNavigation();
  loadFeaturedCars();
  initializeFilters();
  initializeVideoModal();
  initializeAnimations();
  initializeCountdowns();
}

// Iniciar a aplicação quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", initializeApp);
