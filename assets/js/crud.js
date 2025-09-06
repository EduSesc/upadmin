// IMPORT SUPABASE
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// -- CONFIGURAÇÕES SUPABASE
const supabaseUrl = "https://wthcwllhzbahvnnjqlko.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aGN3bGxoemJhaHZubmpxbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTk5NjMsImV4cCI6MjA3MDA5NTk2M30.7uzMcp8NsyxYuMmN7nnbBB0dJITJ_C7O7Ck0HFQgbOA";
const supabase = createClient(supabaseUrl, supabaseKey);

// URL fixa do banner
const bannerUrl = "https://i.ibb.co/1f7RWhFP/transpaxup.jpg";

// -- IDs DO HTML
const elements = {
  form: document.getElementById("car-form"),
  list: document.getElementById("vehicle-list"),
  cancelBtn: document.getElementById("cancel-edit"),
  galleryUrlsInput: document.getElementById("gallery_urls"),
  galleryPreview: document.getElementById("gallery-preview"),
  uploadGalleryBtn: document.getElementById("upload-gallery-btn"),
  coverImageUrlInput: document.getElementById("cover_image_url"),
  uploadCoverBtn: document.getElementById("upload-cover-btn"),
  coverPreview: document.getElementById("cover-preview"),
  priceInput: document.getElementById("price"),
  title: document.getElementById("title"),
  brand: document.getElementById("brand"),
  otherBrand: document.getElementById("other_brand"),
  model: document.getElementById("model"),
  version: document.getElementById("version"),
  year: document.getElementById("year"),
  km: document.getElementById("km"),
  color: document.getElementById("color"),
  fuel_type: document.getElementById("fuel_type"),
  transmission: document.getElementById("transmission"),
  location: document.getElementById("location"),
  short_description: document.getElementById("short_description"),
  detailed_description: document.getElementById("detailed_description"),
  category: document.getElementById("category"),
  vehicle_type: document.getElementById("vehicle_type"),
  is_featured: document.getElementById("is_featured"),
  is_active: document.getElementById("is_active"),
  uploadGalleryInputFile: document.getElementById("gallery_file_input"), // opcional (input file)
};

// estado local
let state = {
  editId: null,
  imageUrls: [], // array para gallery_urls
};

// Cloudinary config
const cloudinaryConfig = {
  cloudName: "du53gt50t",
  uploadPreset: "ml_default",
};

// widgets Cloudinary
const widgets = {
  gallery:
    typeof cloudinary !== "undefined"
      ? cloudinary.createUploadWidget(
          {
            ...cloudinaryConfig,
            multiple: true,
            maxFiles: 10,
          },
          handleGalleryUpload
        )
      : null,

  cover:
    typeof cloudinary !== "undefined"
      ? cloudinary.createUploadWidget(
          {
            ...cloudinaryConfig,
            multiple: false,
            cropping: true,
            croppingAspectRatio: 16 / 9,
          },
          handleCoverUpload
        )
      : null,
};

// ----- Cloudinary handlers -----
function handleGalleryUpload(error, result) {
  if (!error && result && result.event === "success") {
    addImageUrl(result.info.secure_url);
  } else if (error) {
    console.error("Cloudinary gallery error:", error);
  }
}
function handleCoverUpload(error, result) {
  if (!error && result && result.event === "success") {
    updateCoverImage(result.info.secure_url);
  } else if (error) {
    console.error("Cloudinary cover error:", error);
  }
}

// ----- imagens (gallery) -----
function addImageUrl(url) {
  if (!url) return;
  if (state.imageUrls.includes(url)) return;
  if (state.imageUrls.length >= 10) {
    alert("Máx. 10 imagens na galeria.");
    return;
  }
  state.imageUrls.push(url);
  updateGalleryInput();
  renderGalleryPreviews();
}

function removeImage(index) {
  if (index < 0 || index >= state.imageUrls.length) return;
  state.imageUrls.splice(index, 1);
  updateGalleryInput();
  renderGalleryPreviews();
}

function renderGalleryPreviews() {
  if (!elements.galleryPreview) return;
  elements.galleryPreview.innerHTML = state.imageUrls
    .map(
      (url, index) => `
      <div class="preview-item">
        <img src="${url}" class="preview-img" />
        <button type="button" class="remove-btn" data-index="${index}">×</button>
      </div>`
    )
    .join("");

  // attach events
  elements.galleryPreview.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.onclick = (e) => removeImage(Number(e.currentTarget.dataset.index));
  });
}

function updateGalleryInput() {
  if (!elements.galleryUrlsInput) return;
  elements.galleryUrlsInput.value = state.imageUrls.join(", ");
}

// cover
function updateCoverImage(url) {
  elements.coverImageUrlInput.value = url || "";
  elements.coverPreview.innerHTML = url
    ? `<img src="${url}" class="cover-preview-img">`
    : "";
  if (state.editId) {
    const vehicleItem = document.querySelector(
      `.vehicle-item[data-id="${state.editId}"]`
    );
    if (vehicleItem) {
      const img = vehicleItem.querySelector(".vehicle-thumbnail");
      if (img) img.src = url || "";
    }
  }
}

// ----- CRUD / Load -----
async function checkFeaturedLimit() {
  const { count, error } = await supabase
    .from("cars")
    .select("*", { count: "exact", head: false })
    .eq("is_featured", true);
  if (error) {
    console.error("Erro ao checar destaques:", error);
    return 0;
  }
  return count || 0;
}

async function loadVehicles() {
  try {
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const listHtml = (data || [])
      .map((vehicle) => {
        const priceInReais = (vehicle.price || 0) / 100;
        const formattedPrice = priceInReais.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        // transforma gallery_urls em array
        const gallery = vehicle.gallery_urls
          ? Array.isArray(vehicle.gallery_urls)
            ? vehicle.gallery_urls
            : vehicle.gallery_urls
                .split(",")
                .map((u) => u.trim())
                .filter(Boolean)
          : [];

        // gera o carrossel se tiver imagens
        const carouselHtml =
          gallery.length > 0
            ? `
          <div class="carousel-container" id="carousel-${vehicle.id}">
            ${gallery
              .map(
                (url, idx) => `
              <div class="carousel-slide ${idx === 0 ? "active" : ""}">
                <img src="${url}" alt="Imagem ${idx + 1}" />
              </div>
            `
              )
              .join("")}
            <div class="carousel-controls">
              <button class="carousel-btn prev">‹</button>
              <button class="carousel-btn next">›</button>
            </div>
            <div class="carousel-indicators">
              ${gallery
                .map(
                  (_, idx) => `
                <span class="indicator ${idx === 0 ? "active" : ""}"></span>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : `<div class="no-image">Sem imagem</div>`;

        return `
        <li class="vehicle-item ${vehicle.is_active ? "" : "sold"}" data-id="${
          vehicle.id
        }">
          <div class="vehicle-content">
            <div class="vehicle-info">
              <h3>${vehicle.title || "Sem título"}</h3>
              <p>Ano: ${vehicle.year || "----"} | Preço: ${formattedPrice}</p>
              ${
                vehicle.is_featured
                  ? '<span class="featured-badge">★ Destaque</span>'
                  : ""
              }
            </div>
            <div class="vehicle-image-container">
              ${carouselHtml}
              ${
                !vehicle.is_active
                  ? '<div class="sold-banner">VENDIDO</div>'
                  : ""
              }
            </div>
            <div class="vehicle-actions">
              <button type="button" class="btn-edit" data-id="${
                vehicle.id
              }">Editar</button>
              <button type="button" class="btn-delete" data-id="${
                vehicle.id
              }">Excluir</button>
            </div>
          </div>
        </li>
      `;
      })
      .join("");

    elements.list.innerHTML = listHtml;

    // bind botões dinâmicos (editar/excluir)
    document
      .querySelectorAll(".btn-edit")
      .forEach((b) =>
        b.addEventListener("click", (e) =>
          editVehicle(e.currentTarget.getAttribute("data-id"))
        )
      );
    document
      .querySelectorAll(".btn-delete")
      .forEach((b) =>
        b.addEventListener("click", (e) =>
          deleteVehicle(e.currentTarget.getAttribute("data-id"))
        )
      );

    // inicializa todos os carrosseis renderizados
    initCarousels();
  } catch (error) {
    console.error("Erro ao carregar veículos:", error);
    alert("Erro ao carregar veículos. Veja console.");
  }
}

// ----- Edit / Delete -----
window.editVehicle = async function (id) {
  try {
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;

    state.editId = id;

    // Preencher TODOS os campos do formulário
    elements.title.value = data.title || "";
    elements.brand.value = data.brand || "";
    // se marca não está na lista, mostra campo other_brand
    if (
      data.brand &&
      !document.querySelector(`#brand option[value="${data.brand}"]`)
    ) {
      elements.brand.value = "outro";
      elements.otherBrand.style.display = "block";
      elements.otherBrand.value = data.brand;
    } else {
      elements.otherBrand.style.display = "none";
      elements.otherBrand.value = "";
    }

    elements.model.value = data.model || "";
    elements.version.value = data.version || "";
    elements.year.value = data.year || "";
    elements.km.value = data.km || "";

    // preço formatado (centavos -> reais)
    const priceInReais = (data.price || 0) / 100;
    elements.priceInput.value = priceInReais.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    elements.color.value = data.color || "";
    elements.fuel_type.value = data.fuel_type || "Gasolina";
    elements.transmission.value = data.transmission || "Manual";
    elements.location.value = data.location || "Brasília";
    elements.short_description.value = data.short_description || "";
    elements.detailed_description.value = data.detailed_description || "";
    elements.category.value = data.category || "antigo";
    elements.vehicle_type.value = data.vehicle_type || "carro";

    // checkboxes
    elements.is_featured.checked = !!data.is_featured;
    elements.is_active.checked = data.is_active !== false;

    // gallery_urls normalizado pra array
    state.imageUrls = [];
    if (data.gallery_urls) {
      if (Array.isArray(data.gallery_urls)) {
        state.imageUrls = [...data.gallery_urls];
      } else if (typeof data.gallery_urls === "string") {
        state.imageUrls = data.gallery_urls
          .split(",")
          .map((u) => u.trim())
          .filter(Boolean);
      }
    }
    updateGalleryInput();
    renderGalleryPreviews();

    // cover
    updateCoverImage(data.cover_image_url || "");

    // marca atributo para saber se já era destaque (evita duplicar lógica)
    if (data.is_featured) {
      elements.is_featured.setAttribute("data-was-featured", "1");
    } else {
      elements.is_featured.removeAttribute("data-was-featured");
    }

    elements.form.querySelector('button[type="submit"]').textContent =
      "Atualizar";
    elements.cancelBtn.style.display = "inline";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Erro ao editar:", error);
    alert("Erro ao carregar dados do veículo. Veja console.");
  }
};

window.deleteVehicle = async function (id) {
  if (!confirm("Tem certeza que deseja excluir este veículo?")) return;
  try {
    const { error } = await supabase.from("cars").delete().eq("id", id);
    if (error) throw error;
    await loadVehicles();
    alert("Veículo excluído com sucesso!");
  } catch (error) {
    console.error("Erro ao excluir:", error);
    alert("Erro ao excluir veículo.");
  }
};

// ----- Reset form -----
function resetForm() {
  state = { editId: null, imageUrls: [] };
  elements.form.reset();
  if (elements.galleryUrlsInput) elements.galleryUrlsInput.value = "";
  elements.galleryPreview.innerHTML = "";
  elements.coverImageUrlInput.value = "";
  elements.coverPreview.innerHTML = "";
  elements.otherBrand.style.display = "none";
  elements.otherBrand.value = "";
  elements.form.querySelector('button[type="submit"]').textContent = "Salvar";
  elements.cancelBtn.style.display = "none";
  elements.is_featured.checked = false;
  elements.is_featured.removeAttribute("data-was-featured");
  elements.is_active.checked = true;
  elements.priceInput.value = "";
}

// ----- Event listeners / form submit -----
function setupEventListeners() {
  // cloudinary opens
  if (widgets.gallery && elements.uploadGalleryBtn) {
    elements.uploadGalleryBtn.addEventListener("click", () =>
      widgets.gallery.open()
    );
  }
  if (widgets.cover && elements.uploadCoverBtn) {
    elements.uploadCoverBtn.addEventListener("click", () =>
      widgets.cover.open()
    );
  }

  // se tiver input file para upload manual via fetch
  if (elements.uploadGalleryInputFile) {
    elements.uploadGalleryInputFile.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      // upload via fetch para Cloudinary (se desejar)
      const urls = await uploadFilesToCloudinary(files);
      urls.forEach((u) => addImageUrl(u));
    });
  }

  // formatação de preço: formata enquanto digita (automatic currency)
  elements.priceInput.addEventListener("input", (e) => {
    const el = e.currentTarget;
    // só dígitos
    let digits = el.value.replace(/\D/g, "");
    if (!digits) {
      el.value = "";
      return;
    }
    // evitar overflow muito grande: manter até 12 dígitos (ajustável)
    if (digits.length > 12) digits = digits.slice(0, 12);
    // transformar em centavos
    const number = parseInt(digits, 10);
    const value = (number / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    el.value = value;
    // coloca o cursor no final (simplificação)
    el.setSelectionRange(el.value.length, el.value.length);
  });

  // foco -> mostra sem R$
  elements.priceInput.addEventListener("focus", function () {
    if (this.value && this.value !== "R$ 0,00") {
      const numericValue = this.value.replace(/[^\d,]/g, "");
      const decimalValue = numericValue.replace(",", ".");
      this.value = parseFloat(decimalValue).toFixed(2).replace(".", ",");
    } else {
      this.value = "";
    }
  });

  // blur -> formata (garantia)
  elements.priceInput.addEventListener("blur", function () {
    if (this.value) {
      const numericValue = this.value.replace(/[^\d,]/g, "").replace(",", ".");
      const numberValue = parseFloat(numericValue) || 0;
      this.value = numberValue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    } else {
      this.value = "R$ 0,00";
    }
  });

  // brand change (mostrar outro)
  elements.brand.addEventListener("change", function () {
    elements.otherBrand.style.display =
      this.value === "outro" ? "block" : "none";
    if (this.value !== "outro") elements.otherBrand.value = "";
  });

  // contadores de caracteres (se existirem)
  document
    .querySelectorAll("textarea[maxlength], input[maxlength]")
    .forEach((el) => {
      const counter = el.parentElement.querySelector(".char-count");
      if (counter) {
        el.addEventListener("input", () => {
          counter.textContent = `${el.value.length}/${el.maxLength} caracteres`;
        });
        counter.textContent = `${el.value.length}/${el.maxLength} caracteres`;
      }
    });

  // submit do formulário
  elements.form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const isFeaturedChecked = elements.is_featured.checked;
      const wasFeatured =
        !!elements.is_featured.getAttribute("data-was-featured");

      if (isFeaturedChecked && !wasFeatured) {
        const featuredCount = await checkFeaturedLimit();
        if (featuredCount >= 3) {
          alert("Limite de 3 destaques atingido!");
          return;
        }
      }

      // brand final
      const brandValue =
        elements.brand.value === "outro"
          ? elements.otherBrand.value.trim()
          : elements.brand.value;

      // preço: converte o valor formatado para centavos com segurança
      let rawPrice = elements.priceInput.value || "0";
      rawPrice = rawPrice.replace(/[^\d,]/g, "").replace(",", ".");
      const priceInCents = Math.round(Number(rawPrice) * 100);

      // gallery_urls: usamos state.imageUrls (array). Se estiver vazio, enviamos null
      const galleryArray =
        Array.isArray(state.imageUrls) && state.imageUrls.length > 0
          ? state.imageUrls.filter(
              (u) => typeof u === "string" && u.trim().length > 0
            )
          : null;

      const carData = {
        title: elements.title.value.trim(),
        brand: brandValue,
        model: elements.model.value.trim(),
        version: elements.version.value.trim(),
        year: Number(elements.year.value) || null,
        km: Number(elements.km.value) || 0,
        price: priceInCents,
        color: elements.color.value.trim(),
        fuel_type: elements.fuel_type.value,
        transmission: elements.transmission.value,
        location: elements.location.value,
        short_description: elements.short_description.value.trim(),
        detailed_description: elements.detailed_description.value.trim(),
        cover_image_url: elements.coverImageUrlInput.value.trim() || null,
        gallery_urls: galleryArray ? [...galleryArray, bannerUrl] : [bannerUrl],
        category: elements.category.value,
        vehicle_type: elements.vehicle_type.value,
        is_featured: elements.is_featured.checked,
        is_active: elements.is_active.checked,
      };

      // validação mínima
      if (
        !carData.title ||
        !carData.brand ||
        !carData.model ||
        isNaN(carData.year)
      ) {
        alert("Preencha os campos obrigatórios corretamente");
        return;
      }

      if (state.editId) {
        const { error } = await supabase
          .from("cars")
          .update(carData)
          .eq("id", state.editId);
        if (error) throw error;
        alert("Veículo atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("cars").insert([carData]);
        if (error) throw error;
        alert("Veículo cadastrado com sucesso!");
      }

      resetForm();
      await loadVehicles();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert(`Erro: ${error.message || error}`);
    }
  });

  // cancelar edição
  elements.cancelBtn.addEventListener("click", resetForm);
}

// ----- helper: upload via fetch para Cloudinary (opcional) -----
async function uploadFilesToCloudinary(files) {
  const uploaded = [];
  for (const file of files) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", cloudinaryConfig.uploadPreset);
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: "POST",
          body: fd,
        }
      );
      const json = await res.json();
      if (json.secure_url) uploaded.push(json.secure_url);
    } catch (err) {
      console.error("Erro upload Cloudinary (fetch):", err);
    }
  }
  return uploaded;
}

// ----- inicialização -----
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  loadVehicles();
});

function initCarousels() {
  document.querySelectorAll(".carousel-container").forEach((container) => {
    const slides = container.querySelectorAll(".carousel-slide");
    const indicators = container.querySelectorAll(".indicator");
    let current = 0;

    function showSlide(index) {
      slides.forEach((s, i) => {
        s.classList.toggle("active", i === index);
        indicators[i]?.classList.toggle("active", i === index);
      });
      current = index;
    }

    container
      .querySelector(".carousel-btn.next")
      ?.addEventListener("click", () => {
        showSlide((current + 1) % slides.length);
      });

    container
      .querySelector(".carousel-btn.prev")
      ?.addEventListener("click", () => {
        showSlide((current - 1 + slides.length) % slides.length);
      });

    indicators.forEach((dot, i) =>
      dot.addEventListener("click", () => showSlide(i))
    );
  });
}
