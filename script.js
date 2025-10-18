document.addEventListener("DOMContentLoaded", () => {
  const projectList = document.getElementById("project-list");
  const newProjectBtn = document.getElementById("new-project");
  const projectView = document.getElementById("project-view");
  const currentProjectTitle = document.getElementById("current-project-title");
  const tabNotepad = document.getElementById("tab-notepad");
  const tabKv = document.getElementById("tab-kv");
  const notepadTab = document.getElementById("notepad-tab");
  const kvTab = document.getElementById("kv-tab");
  const notesTextarea = document.getElementById("notes");
  const saveNotesBtn = document.getElementById("save-notes");
  const keyInput = document.getElementById("key");
  const valueInput = document.getElementById("value");
  const addKvBtn = document.getElementById("add-kv");
  const kvList = document.getElementById("kv-list");
  const backToProjectsBtn = document.getElementById("back-to-projects");

  let currentProject = null;

  // Cargar proyectos
  async function loadProjects() {
    try {
      const response = await fetch("/api/projects");
      const projects = await response.json();
      projectList.innerHTML = "";
      projects.forEach((project) => {
        const li = document.createElement("li");
        li.textContent = project;
        const selectBtn = document.createElement("button");
        selectBtn.textContent = "Seleccionar";
        selectBtn.onclick = () => selectProject(project);
        li.appendChild(selectBtn);
        projectList.appendChild(li);
      });
    } catch (error) {
      console.error("Error cargando proyectos:", error);
    }
  }

  // Crear nuevo proyecto
  newProjectBtn.onclick = async () => {
    const projectName = prompt("Nombre del nuevo proyecto:");
    if (projectName) {
      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: projectName }),
        });
        if (response.ok) {
          loadProjects();
        } else {
          const data = await response.json();
          alert(data.message);
        }
      } catch (error) {
        console.error("Error creando proyecto:", error);
      }
    }
  };

  // Seleccionar proyecto
  function selectProject(project) {
    currentProject = project;
    currentProjectTitle.textContent = project;
    document.getElementById("projects").style.display = "none";
    projectView.style.display = "block";
    loadNotes();
    loadKv();
    showTab("notepad");
  }

  // Volver a proyectos
  backToProjectsBtn.onclick = () => {
    document.getElementById("projects").style.display = "block";
    projectView.style.display = "none";
    currentProject = null;
  };

  // Cambiar pestañas
  tabNotepad.onclick = () => showTab("notepad");
  tabKv.onclick = () => showTab("kv");

  function showTab(tab) {
    if (tab === "notepad") {
      notepadTab.style.display = "block";
      kvTab.style.display = "none";
    } else {
      notepadTab.style.display = "none";
      kvTab.style.display = "block";
    }
  }

  // Notepad
  async function loadNotes() {
    try {
      const response = await fetch(`/api/projects/${currentProject}/notes`);
      const notes = await response.text();
      notesTextarea.value = notes;
    } catch (error) {
      console.error("Error cargando notas:", error);
    }
  }

  // Función para guardar notas
  async function saveNotes() {
    try {
      const response = await fetch(`/api/projects/${currentProject}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: notesTextarea.value }),
      });
      if (response.ok) {
        console.log("Notas guardadas automáticamente.");
      }
    } catch (error) {
      console.error("Error guardando notas:", error);
    }
  }

  // Debounce para auto-guardado
  let saveTimeout;
  function debounceSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveNotes, 1000); // Guardar después de 1 segundo sin escribir
  }

  // Event listener para auto-guardado
  notesTextarea.addEventListener("input", debounceSave);

  saveNotesBtn.onclick = saveNotes;

  // Key-Value
  async function loadKv() {
    try {
      const response = await fetch(`/api/projects/${currentProject}/kv`);
      const kv = await response.json();
      kvList.innerHTML = "";
      Object.entries(kv).forEach(([key, value]) => {
        const li = document.createElement("li");
                li.innerHTML = `<strong class="kv-key">${key}:</strong> <span class="kv-value">${value}</span> <button onclick="copyKv('${key}')">Copiar</button> <button onclick="editKv('${key}')">Editar</button> <button onclick="deleteKv('${key}')">Eliminar</button>`;
        kvList.appendChild(li);
      });
    } catch (error) {
      console.error("Error cargando kv:", error);
    }
  }

  addKvBtn.onclick = async () => {
    const key = keyInput.value.trim();
    const value = valueInput.value.trim();
    if (key && value) {
      try {
        const response = await fetch(`/api/projects/${currentProject}/kv`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (response.ok) {
          keyInput.value = "";
          valueInput.value = "";
          loadKv();
        }
      } catch (error) {
        console.error("Error agregando kv:", error);
      }
    }
  };

  window.editKv = async (key) => {
    const kv = await (await fetch(`/api/projects/${currentProject}/kv`)).json();
    const newValue = prompt("Nuevo valor:", kv[key]);
    if (newValue !== null) {
      try {
        const response = await fetch(`/api/projects/${currentProject}/kv/${key}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: newValue }),
        });
        if (response.ok) {
          loadKv();
        }
      } catch (error) {
        console.error("Error editando kv:", error);
      }
    }
  };

  window.deleteKv = async (key) => {
    if (confirm("¿Eliminar esta entrada?")) {
      try {
        const response = await fetch(`/api/projects/${currentProject}/kv/${key}`, {
          method: "DELETE",
        });
        if (response.ok) {
          loadKv();
        }
      } catch (error) {
        console.error("Error eliminando kv:", error);
      }
    }
  };

  window.copyKv = async (key) => {
    try {
      const response = await fetch(`/api/projects/${currentProject}/kv`);
      const kv = await response.json();
      if (kv.hasOwnProperty(key)) {
        await navigator.clipboard.writeText(kv[key]);
        alert("Valor copiado al portapapeles");
      }
    } catch (error) {
      console.error("Error copiando:", error);
      alert("Error al copiar");
    }
  };

  loadProjects();
});
