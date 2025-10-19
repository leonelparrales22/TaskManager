document.addEventListener("DOMContentLoaded", () => {
  const projectList = document.getElementById("project-list");
  const newProjectBtn = document.getElementById("new-project");
  const projectView = document.getElementById("project-view");
  const currentProjectTitle = document.getElementById("current-project-title");
  const tabNotepad = document.getElementById("tab-notepad");
  const tabKv = document.getElementById("tab-kv");
  const tabTodo = document.getElementById("tab-todo");
  const notepadTab = document.getElementById("notepad-tab");
  const kvTab = document.getElementById("kv-tab");
  const todoTab = document.getElementById("todo-tab");
  const saveNotesBtn = document.getElementById("save-notes");
  const keyInput = document.getElementById("key");
  const valueInput = document.getElementById("value");
  const addKvBtn = document.getElementById("add-kv");
  const kvList = document.getElementById("kv-list");
  const notesTextarea = document.getElementById("notes");
  const todoText = document.getElementById("todo-text");
  const addTodoBtn = document.getElementById("add-todo");
  const pendingList = document.getElementById("pending-list");
  const completedList = document.getElementById("completed-list");
  const pendingCount = document.getElementById("pending-count");
  const completedCount = document.getElementById("completed-count");
  const toggleCompleted = document.getElementById("toggle-completed");
  const backToProjectsBtn = document.getElementById("back-to-projects");
  const confirmModal = document.getElementById("confirm-modal");
  const confirmMessage = document.getElementById("confirm-message");
  const confirmYes = document.getElementById("confirm-yes");
  const confirmNo = document.getElementById("confirm-no");
  const promptModal = document.getElementById("prompt-modal");
  const promptMessage = document.getElementById("prompt-message");
  const promptInput = document.getElementById("prompt-input");
  const promptOk = document.getElementById("prompt-ok");
  const promptCancel = document.getElementById("prompt-cancel");
  const alertModal = document.getElementById("alert-modal");
  const alertMessage = document.getElementById("alert-message");
  const alertOk = document.getElementById("alert-ok");
  const completedProjectList = document.getElementById("completed-project-list");
  const toggleCompletedProjects = document.getElementById("toggle-completed-projects");

  let currentProject = null;
  let confirmCallback = null;
  let promptCallback = null;
  let alertCallback = null;
  let editor = null;

  function showConfirm(message, callback) {
    confirmMessage.textContent = message;
    confirmCallback = callback;
    confirmModal.style.display = "flex";
  }

  function showPrompt(message, defaultValue, callback) {
    promptMessage.textContent = message;
    promptInput.value = defaultValue;
    promptCallback = callback;
    promptModal.style.display = "flex";
    promptInput.focus();
  }

  function showAlert(message, callback = null) {
    alertMessage.textContent = message;
    alertCallback = callback;
    alertModal.style.display = "flex";
  }

  confirmYes.onclick = () => {
    confirmModal.style.display = "none";
    if (confirmCallback) confirmCallback(true);
  };

  confirmNo.onclick = () => {
    confirmModal.style.display = "none";
    if (confirmCallback) confirmCallback(false);
  };

  promptOk.onclick = () => {
    promptModal.style.display = "none";
    if (promptCallback) promptCallback(promptInput.value);
  };

  promptCancel.onclick = () => {
    promptModal.style.display = "none";
    if (promptCallback) promptCallback(null);
  };

  alertOk.onclick = () => {
    alertModal.style.display = "none";
    if (alertCallback) alertCallback();
  };

  // Cargar proyectos
  async function loadProjects() {
    try {
      const response = await fetch("/api/projects");
      const projects = await response.json();
      const activeProjects = projects.filter((p) => !p.completed);
      const completedProjects = projects.filter((p) => p.completed);

      // Populate active projects
      projectList.innerHTML = "";
      for (let index = 0; index < activeProjects.length; index++) {
        const project = activeProjects[index];
        const li = document.createElement("li");
        li.className = "project-item";
        li.draggable = true;
        li.dataset.index = index;

        // Fetch pending tasks count
        let pendingCount = 0;
        try {
          const todoResponse = await fetch(`/api/projects/${encodeURIComponent(project.name)}/todo`);
          const todos = await todoResponse.json();
          pendingCount = todos.filter((todo) => !todo.completed).length;
        } catch (error) {
          console.error(`Error cargando TODO para ${project.name}:`, error);
        }

        li.textContent = project.name;
        li.onclick = () => selectProject(project.name);
        li.addEventListener("dragstart", handleDragStart);
        li.addEventListener("dragover", handleDragOver);
        li.addEventListener("drop", handleDrop);
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "project-actions";
        if (pendingCount > 0) {
          const countSpan = document.createElement("span");
          countSpan.className = "pending-tasks";
          countSpan.textContent = `(${pendingCount} pendientes)`;
          actionsDiv.appendChild(countSpan);
        }
        const finalizeBtn = document.createElement("button");
        finalizeBtn.innerHTML = '<i class="fas fa-check"></i> Finalizar';
        finalizeBtn.onclick = (e) => {
          e.stopPropagation();
          finalizeProject(project.name);
        };
        const editBtn = document.createElement("button");
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar';
        editBtn.onclick = (e) => {
          e.stopPropagation();
          editProject(project.name);
        };
        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
        deleteBtn.className = "delete-btn";
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          deleteProject(project.name);
        };
        actionsDiv.appendChild(finalizeBtn);
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        li.appendChild(actionsDiv);
        projectList.appendChild(li);
      }

      // Populate completed projects
      completedProjectList.innerHTML = "";
      for (const project of completedProjects) {
        const li = document.createElement("li");
        li.className = "project-item completed-project";

        li.textContent = project.name;
        li.onclick = () => selectProject(project.name);
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "project-actions";
        const reactivateBtn = document.createElement("button");
        reactivateBtn.innerHTML = '<i class="fas fa-undo"></i> Reactivar';
        reactivateBtn.onclick = (e) => {
          e.stopPropagation();
          reactivateProject(project.name);
        };
        const editBtn = document.createElement("button");
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar';
        editBtn.onclick = (e) => {
          e.stopPropagation();
          editProject(project.name);
        };
        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
        deleteBtn.className = "delete-btn";
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          deleteProject(project.name);
        };
        actionsDiv.appendChild(reactivateBtn);
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        li.appendChild(actionsDiv);
        completedProjectList.appendChild(li);
      }

      // Show completed section if any
      if (completedProjects.length > 0) {
        document.getElementById("completed-projects").style.display = "block";
        completedProjectList.style.display = "none";
        toggleCompletedProjects.textContent = "Mostrar";
      } else {
        document.getElementById("completed-projects").style.display = "none";
      }
    } catch (error) {
      console.error("Error cargando proyectos:", error);
    }
  }

  // Crear nuevo proyecto
  newProjectBtn.onclick = () => {
    showPrompt("Nombre del nuevo proyecto:", "", async (projectName) => {
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
            showAlert(data.message);
          }
        } catch (error) {
          console.error("Error creando proyecto:", error);
        }
      }
    });
  };

  // Seleccionar proyecto
  function selectProject(project) {
    currentProject = project;
    currentProjectTitle.textContent = project;
    document.getElementById("main-header").style.display = "none";
    document.getElementById("projects").style.display = "none";
    document.getElementById("completed-projects").style.display = "none";
    projectView.style.display = "block";
    loadNotes();
    loadKv();
    loadTodo();
    showTab("notepad");
  }

  // Volver a proyectos
  backToProjectsBtn.onclick = () => {
    document.getElementById("main-header").style.display = "block";
    document.getElementById("projects").style.display = "block";
    projectView.style.display = "none";
    currentProject = null;
    loadProjects();
  };

  // Cambiar pestañas
  tabNotepad.onclick = () => showTab("notepad");
  tabKv.onclick = () => showTab("kv");
  tabTodo.onclick = () => showTab("todo");

  function showTab(tab) {
    if (tab === "notepad") {
      notepadTab.style.display = "block";
      kvTab.style.display = "none";
      todoTab.style.display = "none";
    } else if (tab === "kv") {
      notepadTab.style.display = "none";
      kvTab.style.display = "block";
      todoTab.style.display = "none";
    } else {
      notepadTab.style.display = "none";
      kvTab.style.display = "none";
      todoTab.style.display = "block";
    }
  }

  // Notepad
  async function loadNotes() {
    try {
      const response = await fetch(`/api/projects/${currentProject}/notes`);
      const notes = await response.text();
      if (!editor) {
        editor = new toastui.Editor({
          el: document.querySelector("#editor"),
          height: "500px",
          initialEditType: "markdown",
          previewStyle: "vertical",
        });
        editor.on("change", debounceSave);
      }
      editor.setMarkdown(notes);
      // Scroll to top after loading content with multiple attempts for sync
      setTimeout(() => {
        // Scroll the main editor wrapper
        const editorWrapper = document.querySelector(".toastui-editor-defaultUI");
        if (editorWrapper) {
          editorWrapper.scrollTop = 0;
        }

        // Scroll both editor and preview containers
        const mdContainer = document.querySelector(".toastui-editor-md-container");
        const previewContainer = document.querySelector(".toastui-editor-md-preview");

        if (mdContainer) mdContainer.scrollTop = 0;
        if (previewContainer) previewContainer.scrollTop = 0;

        // Move cursor to start
        try {
          editor.moveCursorToStart();
        } catch (e) {
          editor.focus();
        }
      }, 300);

      // Additional sync after a longer delay
      setTimeout(() => {
        const previewContainer = document.querySelector(".toastui-editor-md-preview");
        if (previewContainer) {
          previewContainer.scrollTop = 0;
        }
      }, 500);
    } catch (error) {
      console.error("Error cargando notas:", error);
    }
  }

  // Función para guardar notas
  async function saveNotes() {
    try {
      const notes = editor.getMarkdown();
      const response = await fetch(`/api/projects/${currentProject}/notes`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: notes,
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

  saveNotesBtn.onclick = saveNotes;

  // Key-Value
  async function loadKv() {
    try {
      const response = await fetch(`/api/projects/${currentProject}/kv`);
      const kv = await response.json();
      kvList.innerHTML = "";
      Object.entries(kv).forEach(([key, value]) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong class="kv-key">${key}:</strong> <span class="kv-value">${value}</span> <button onclick="copyKv('${key}')"><i class="fas fa-copy"></i> Copiar</button> <button onclick="editKv('${key}')"><i class="fas fa-edit"></i> Editar</button> <button class="delete-btn" onclick="deleteKv('${key}')"><i class="fas fa-trash"></i> Eliminar</button>`;
        kvList.appendChild(li);
      });
    } catch (error) {
      console.error("Error cargando kv:", error);
    }
  }

  // TODO
  async function loadTodo() {
    try {
      const response = await fetch(`/api/projects/${currentProject}/todo`);
      const todos = await response.json();
      let pendingCountNum = 0;
      let completedCountNum = 0;
      pendingList.innerHTML = "";
      completedList.innerHTML = "";
      todos.forEach((todo, index) => {
        const li = document.createElement("li");
        li.innerHTML = `<div class="task-content"><input type="checkbox" ${todo.completed ? "checked" : ""} onchange="toggleTodo(${index})"> <span class="${todo.completed ? "completed" : ""}">${
          todo.text
        }</span></div> <button class="delete-btn" onclick="deleteTodo(${index})"><i class="fas fa-trash"></i> Eliminar</button>`;
        if (!todo.completed) {
          li.draggable = true;
          li.dataset.index = index;
          li.addEventListener("dragstart", handleDragStart);
          li.addEventListener("dragover", handleDragOver);
          li.addEventListener("drop", handleDrop);
          pendingList.appendChild(li);
          pendingCountNum++;
        } else {
          completedList.appendChild(li);
          completedCountNum++;
        }
      });
      pendingCount.textContent = pendingCountNum;
      completedCount.textContent = completedCountNum;
      completedList.style.display = "none"; // Collapsed by default
      toggleCompleted.textContent = "Mostrar";
    } catch (error) {
      console.error("Error cargando todo:", error);
    }
  }

  let draggedIndex = null;
  let draggedProjectIndex = null;

  function handleDragStart(e) {
    draggedIndex = parseInt(e.target.dataset.index);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function handleDrop(e) {
    e.preventDefault();
    const targetLi = e.target.closest("li");
    if (!targetLi) return;

    if (targetLi.closest("#pending-list")) {
      // Drop on TODO items
      const targetIndex = parseInt(targetLi.dataset.index);
      if (draggedIndex !== null && draggedIndex !== targetIndex) {
        try {
          const response = await fetch(`/api/projects/${currentProject}/todo/reorder`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from: draggedIndex, to: targetIndex }),
          });
          if (response.ok) {
            loadTodo();
          } else {
            console.error("Error reordering todos:", await response.text());
          }
        } catch (error) {
          console.error("Error reordering todos:", error);
        }
      }
    } else if (targetLi.closest("#project-list")) {
      // Drop on projects
      const targetIndex = parseInt(targetLi.dataset.index);
      if (draggedIndex !== null && draggedIndex !== targetIndex) {
        try {
          const response = await fetch("/api/projects/reorder", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from: draggedIndex, to: targetIndex }),
          });
          if (response.ok) {
            loadProjects();
          } else {
            console.error("Error reordering projects:", await response.text());
          }
        } catch (error) {
          console.error("Error reordering projects:", error);
        }
      }
    }
    draggedIndex = null;
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

  addTodoBtn.onclick = async () => {
    const text = todoText.value.trim();
    if (text) {
      try {
        const response = await fetch(`/api/projects/${currentProject}/todo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (response.ok) {
          todoText.value = "";
          loadTodo();
        }
      } catch (error) {
        console.error("Error agregando todo:", error);
      }
    }
  };

  toggleCompleted.onclick = () => {
    if (completedList.style.display === "none") {
      completedList.style.display = "block";
      toggleCompleted.textContent = "Ocultar";
    } else {
      completedList.style.display = "none";
      toggleCompleted.textContent = "Mostrar";
    }
  };

  window.editKv = async (key) => {
    const kv = await (await fetch(`/api/projects/${currentProject}/kv`)).json();
    showPrompt("Nuevo valor:", kv[key], async (newValue) => {
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
    });
  };

  window.deleteKv = async (key) => {
    showConfirm("¿Eliminar esta entrada?", async (confirmed) => {
      if (confirmed) {
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
    });
  };

  window.toggleTodo = async (index) => {
    try {
      const response = await fetch(`/api/projects/${currentProject}/todo/${index}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggle: true }),
      });
      if (response.ok) {
        loadTodo();
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  };

  window.deleteTodo = async (index) => {
    showConfirm("¿Eliminar esta tarea?", async (confirmed) => {
      if (confirmed) {
        try {
          const response = await fetch(`/api/projects/${currentProject}/todo/${index}`, {
            method: "DELETE",
          });
          if (response.ok) {
            loadTodo();
          }
        } catch (error) {
          console.error("Error eliminando todo:", error);
        }
      }
    });
  };

  window.copyKv = async (key) => {
    try {
      const response = await fetch(`/api/projects/${currentProject}/kv`);
      const kv = await response.json();
      if (kv.hasOwnProperty(key)) {
        await navigator.clipboard.writeText(kv[key]);
        showAlert("Valor copiado al portapapeles");
      }
    } catch (error) {
      console.error("Error copiando:", error);
      showAlert("Error al copiar");
    }
  };

  window.editProject = async (oldName) => {
    showPrompt("Nuevo nombre para el proyecto:", oldName, async (newName) => {
      if (newName && newName !== oldName) {
        try {
          const response = await fetch(`/api/projects/${encodeURIComponent(oldName)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newName }),
          });
          if (response.ok) {
            loadProjects();
            if (currentProject === oldName) {
              currentProject = newName;
              currentProjectTitle.textContent = newName;
            }
          } else {
            const data = await response.json();
            showAlert(data.message);
          }
        } catch (error) {
          console.error("Error editando proyecto:", error);
        }
      }
    });
  };

  window.deleteProject = async (projectName) => {
    showConfirm("¿Eliminar el proyecto '" + projectName + "' y todos sus datos?", async (confirmed) => {
      if (confirmed) {
        try {
          const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}`, {
            method: "DELETE",
          });
          if (response.ok) {
            loadProjects();
            if (currentProject === projectName) {
              backToProjectsBtn.click();
            }
          } else {
            const data = await response.json();
            showAlert(data.message);
          }
        } catch (error) {
          console.error("Error eliminando proyecto:", error);
        }
      }
    });
  };

  window.finalizeProject = async (projectName) => {
    showConfirm("¿Marcar el proyecto '" + projectName + "' como finalizado?", async (confirmed) => {
      if (confirmed) {
        try {
          const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed: true }),
          });
          if (response.ok) {
            loadProjects();
          } else {
            const data = await response.json();
            showAlert(data.message);
          }
        } catch (error) {
          console.error("Error finalizando proyecto:", error);
        }
      }
    });
  };

  window.reactivateProject = async (projectName) => {
    showConfirm("¿Reactivar el proyecto '" + projectName + "'?", async (confirmed) => {
      if (confirmed) {
        try {
          const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed: false }),
          });
          if (response.ok) {
            loadProjects();
          } else {
            const data = await response.json();
            showAlert(data.message);
          }
        } catch (error) {
          console.error("Error reactivando proyecto:", error);
        }
      }
    });
  };

  loadProjects();

  toggleCompletedProjects.onclick = () => {
    if (completedProjectList.style.display === "none") {
      completedProjectList.style.display = "block";
      toggleCompletedProjects.textContent = "Ocultar";
    } else {
      completedProjectList.style.display = "none";
      toggleCompletedProjects.textContent = "Mostrar";
    }
  };
});
