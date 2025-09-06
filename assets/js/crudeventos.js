// --- CONFIGURAÇÕES ---
const SUPABASE_URL = "https://wthcwllhzbahvnnjqlko.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aGN3bGxoemJhaHZubmpxbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTk5NjMsImV4cCI6MjA3MDA5NTk2M30.7uzMcp8NsyxYuMmN7nnbBB0dJITJ_C7O7Ck0HFQgbOA";

// Configurações do Cloudinary
const CLOUD_NAME = "du53gt50t";
const UPLOAD_PRESET = "ml_default";

// Inicializa Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("Supabase inicializado");

// --- FUNÇÕES AUXILIARES ---
function showAlert(message, type) {
  const alertElement =
    type === "success"
      ? document.getElementById("alert-success")
      : document.getElementById("alert-error");

  alertElement.textContent = message;
  alertElement.style.display = "block";

  // Esconder o alerta após 5 segundos
  setTimeout(() => {
    alertElement.style.display = "none";
  }, 5000);
}

// Função para cancelar a edição
function cancelEdit() {
  document.getElementById("event-form").reset();
  document.getElementById("event-id").value = "";
  document.getElementById("image-upload").value = "";
  hideImagePreview();

  // Esconder o botão de cancelar e o indicador de edição
  document.getElementById("cancel-edit").style.display = "none";
  document.getElementById("editing-indicator").style.display = "none";

  showAlert("Edição cancelada", "success");
}

// Função para esconder o preview da imagem
function hideImagePreview() {
  document.getElementById("image-preview").style.display = "none";
}

// Função para verificar se uma URL de imagem é válida
function isValidImageUrl(url) {
  if (!url) return false;
  try {
    const parsedUrl = new URL(url);
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(parsedUrl.pathname);
  } catch {
    return false;
  }
}

// Função para lidar com erro de carregamento de imagem
function handleImageError(imgElement) {
  imgElement.parentElement.innerHTML =
    '<div class="no-image">Imagem não carregada</div>';
}

// --- EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", function () {
  // Configurar event listeners após o DOM estar carregado
  document.getElementById("events").addEventListener("click", function (e) {
    const target = e.target;

    // Verifica se é um botão de editar
    if (
      target.textContent === "Editar" &&
      target.classList.contains("edit-btn")
    ) {
      const eventId = target.getAttribute("data-id");
      console.log("Clicou em editar evento:", eventId);
      editEvent(eventId);
    }

    // Verifica se é um botão de excluir
    if (
      target.textContent === "Excluir" &&
      target.classList.contains("delete-btn")
    ) {
      const eventId = target.getAttribute("data-id");
      console.log("Clicou em excluir evento:", eventId);
      deleteEvent(eventId);
    }
  });

  // Event listener para o botão de cancelar
  document.getElementById("cancel-edit").addEventListener("click", cancelEdit);

  // Event listener para preview de imagem quando a URL muda
  document.getElementById("image-url").addEventListener("input", function () {
    const url = this.value;
    updateImagePreview(url);
  });

  // Event listener para upload de imagem
  document
    .getElementById("image-upload")
    .addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      try {
        showAlert("Fazendo upload da imagem...", "success");
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          formData
        );
        document.getElementById("image-url").value = res.data.secure_url;
        updateImagePreview(res.data.secure_url);
        showAlert("Imagem enviada com sucesso!", "success");
      } catch (err) {
        console.error("Erro no upload:", err);
        showAlert("Erro no upload da imagem", "error");
      }
    });

  // Event listener para o formulário
  document
    .getElementById("event-form")
    .addEventListener("submit", handleFormSubmit);

  // Inicializar a página
  initializePage();
});

// Função para atualizar o preview da imagem
function updateImagePreview(url) {
  const previewContainer = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");

  if (isValidImageUrl(url)) {
    previewImg.src = url;
    previewContainer.style.display = "block";

    // Verificar se a imagem carrega corretamente
    previewImg.onerror = function () {
      hideImagePreview();
    };
  } else {
    hideImagePreview();
  }
}

// --- FUNÇÕES PRINCIPAIS ---
async function editEvent(id) {
  try {
    console.log("Editando evento ID:", id);
    const { data, error } = await supabaseClient
      .from("eventos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Preencher o formulário com os dados do evento
    document.getElementById("event-id").value = data.id;
    document.getElementById("title").value = data.titulo;
    document.getElementById("description").value = data.descricao || "";
    document.getElementById("type").value = data.tipo_evento || "";
    document.getElementById("date").value = data.data_evento;
    document.getElementById("start-time").value = data.hora_inicio || "";
    document.getElementById("end-time").value = data.hora_fim || "";
    document.getElementById("location").value = data.localizacao || "";
    document.getElementById("image-url").value = data.imagem_url || "";
    document.getElementById("participants").value =
      data.participantes_estimados || "";
    document.getElementById("vehicles").value = data.veiculos_estimados || "";
    document.getElementById("is-active").checked = data.status === "ativo";

    // Atualizar preview da imagem se houver URL
    if (data.imagem_url) {
      updateImagePreview(data.imagem_url);
    } else {
      hideImagePreview();
    }

    // Mostrar botão de cancelar e indicador de edição
    document.getElementById("cancel-edit").style.display = "block";
    document.getElementById("editing-indicator").style.display = "block";

    showAlert("Evento carregado para edição!", "success");

    // Rolar para o formulário
    document
      .getElementById("event-form")
      .scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Erro ao editar evento:", error);
    showAlert("Erro ao carregar dados do evento", "error");
  }
}

async function deleteEvent(id) {
  if (!confirm("Tem certeza que deseja excluir este evento?")) return;

  try {
    const { error } = await supabaseClient
      .from("eventos")
      .delete()
      .eq("id", id);

    if (error) throw error;

    showAlert("Evento excluído com sucesso!", "success");
    loadEvents();
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    showAlert("Erro ao excluir evento", "error");
  }
}

// --- LISTAR EVENTOS ---
async function loadEvents() {
  try {
    const { data, error } = await supabaseClient
      .from("eventos")
      .select("*")
      .order("data_evento", { ascending: false });

    if (error) throw error;

    const container = document.getElementById("events");

    if (data.length === 0) {
      container.innerHTML = "<p>Nenhum evento cadastrado</p>";
      return;
    }

    container.innerHTML = "";

    data.forEach((event) => {
      // Formatar data
      const eventDate = new Date(event.data_evento);
      const formattedDate = eventDate
        .toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .toUpperCase();

      // Verificar se é evento passado
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPastEvent = eventDate < today;

      const div = document.createElement("div");
      div.classList.add("event-card");

      // Gerar HTML para a imagem - usar placeholder se não houver imagem
      let imageHtml = "";
      if (event.imagem_url && isValidImageUrl(event.imagem_url)) {
        imageHtml = `
                    <div class="event-image">
                        <img src="${event.imagem_url}" 
                             alt="${event.titulo}" 
                             onerror="handleImageError(this)">
                    </div>
                `;
      } else {
        imageHtml =
          '<div class="event-image"><div class="no-image">Sem imagem</div></div>';
      }

      div.innerHTML = `
                ${imageHtml}
                <div class="event-info">
                    <span class="event-date">${formattedDate}</span>
                    <h3>${event.titulo}</h3>
                    <p>${event.descricao || "Sem descrição"}</p>
                    <p><strong>Local:</strong> ${
                      event.localizacao || "Não especificado"
                    }</p>
                    <p><strong>Tipo:</strong> ${
                      event.tipo_evento || "Não especificado"
                    }</p>
                    <div class="stats">
                        ${
                          event.participantes_estimados
                            ? `<span class="stat-item">👥 ${event.participantes_estimados} participantes</span>`
                            : ""
                        }
                        ${
                          event.veiculos_estimados
                            ? `<span class="stat-item">🚗 ${event.veiculos_estimados} veículos</span>`
                            : ""
                        }
                    </div>
                    <p><strong>Status:</strong> <span class="status-badge ${
                      event.status === "ativo"
                        ? "status-active"
                        : "status-inactive"
                    }">${
        event.status === "ativo" ? "Ativo" : "Inativo"
      }</span></p>
                    <p class="event-type ${
                      isPastEvent ? "past-event" : "upcoming-event"
                    }">
                        ${isPastEvent ? "Evento passado" : "Evento futuro"}
                    </p>
                </div>
                <div class="actions">
                    <button class="edit-btn" data-id="${
                      event.id
                    }">Editar</button>
                    <button class="delete-btn" data-id="${
                      event.id
                    }">Excluir</button>
                </div>
            `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error("Erro ao carregar eventos:", error);
    document.getElementById(
      "events"
    ).innerHTML = `<div class="error">Erro ao carregar eventos: ${error.message}</div>`;
  }
}

// --- SALVAR/EDITAR ---
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("event-id").value;
  const imageUrl = document.getElementById("image-url").value;

  // Validar URL da imagem se fornecida
  if (imageUrl && !isValidImageUrl(imageUrl)) {
    showAlert(
      "Por favor, insira uma URL válida de imagem (jpg, jpeg, png, webp ou gif)",
      "error"
    );
    return;
  }

  const newEvent = {
    titulo: document.getElementById("title").value,
    descricao: document.getElementById("description").value,
    tipo_evento: document.getElementById("type").value,
    data_evento: document.getElementById("date").value,
    hora_inicio: document.getElementById("start-time").value,
    hora_fim: document.getElementById("end-time").value,
    localizacao: document.getElementById("location").value,
    imagem_url: imageUrl || null,
    participantes_estimados: document.getElementById("participants").value
      ? parseInt(document.getElementById("participants").value)
      : null,
    veiculos_estimados: document.getElementById("vehicles").value
      ? parseInt(document.getElementById("vehicles").value)
      : null,
    status: document.getElementById("is-active").checked ? "ativo" : "inativo",
  };

  try {
    let error;
    if (id) {
      ({ error } = await supabaseClient
        .from("eventos")
        .update(newEvent)
        .eq("id", id));
    } else {
      ({ error } = await supabaseClient.from("eventos").insert(newEvent));
    }

    if (error) throw error;

    showAlert("Evento salvo com sucesso!", "success");

    // Limpar formulário e esconder botão de cancelar
    document.getElementById("event-form").reset();
    document.getElementById("event-id").value = "";
    document.getElementById("image-upload").value = "";
    hideImagePreview();
    document.getElementById("cancel-edit").style.display = "none";
    document.getElementById("editing-indicator").style.display = "none";

    loadEvents();
  } catch (error) {
    console.error("Erro ao salvar evento:", error);
    showAlert("Erro ao salvar evento: " + error.message, "error");
  }
}

// --- INICIALIZAÇÃO ---
function initializePage() {
  // Definir data mínima como hoje para o campo de data
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("date").min = today;

  loadEvents();
}
