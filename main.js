const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");

let mainWindow;
let server;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Abrir enlaces externos en el navegador predeterminado
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("http") && !url.includes("localhost:3000")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Iniciar servidor Express
  const serverApp = express();
  serverApp.use(cors());
  serverApp.use(bodyParser.json());
  serverApp.use(bodyParser.text());

  const DATA_DIR = path.join(process.cwd(), "data");
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }

  const projectsFile = path.join(DATA_DIR, "projects.json");

  function readProjects() {
    if (fs.existsSync(projectsFile)) {
      let projects = JSON.parse(fs.readFileSync(projectsFile, "utf8"));
      // Migrate old format if needed
      if (projects.length > 0 && typeof projects[0] === "string") {
        projects = projects.map((name) => ({ name, completed: false }));
        writeProjects(projects);
      }
      return projects;
    }
    return [];
  }

  function writeProjects(projects) {
    fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
  }

  // Rutas
  serverApp.get("/api/projects", (req, res) => {
    res.json(readProjects());
  });

  serverApp.post("/api/projects", (req, res) => {
    const { name } = req.body;
    const projects = readProjects();
    if (!projects.find((p) => p.name === name)) {
      projects.push({ name, completed: false });
      writeProjects(projects);
      res.status(201).json({ message: "Proyecto creado" });
    } else {
      res.status(400).json({ message: "Proyecto ya existe" });
    }
  });

  serverApp.put("/api/projects/:name/status", (req, res) => {
    const { name } = req.params;
    const { completed } = req.body;
    const projects = readProjects();
    const project = projects.find((p) => p.name === name);
    if (project) {
      project.completed = completed;
      writeProjects(projects);
      res.json({ message: `Proyecto ${completed ? "finalizado" : "reactivado"}` });
    } else {
      res.status(404).json({ message: "Proyecto no encontrado" });
    }
  });

  serverApp.delete("/api/projects/:name", (req, res) => {
    const { name } = req.params;
    const projects = readProjects();
    const index = projects.findIndex((p) => p.name === name);
    if (index !== -1) {
      projects.splice(index, 1);
      writeProjects(projects);
      // Eliminar archivos
      const notesFile = path.join(DATA_DIR, `notes_${name}.md`);
      if (fs.existsSync(notesFile)) {
        fs.unlinkSync(notesFile);
      }
      const kvFile = path.join(DATA_DIR, `kv_${name}.json`);
      if (fs.existsSync(kvFile)) {
        fs.unlinkSync(kvFile);
      }
      const todoFile = path.join(DATA_DIR, `todo_${name}.json`);
      if (fs.existsSync(todoFile)) {
        fs.unlinkSync(todoFile);
      }
      res.json({ message: "Proyecto eliminado" });
    } else {
      res.status(404).json({ message: "Proyecto no encontrado" });
    }
  });

  serverApp.get("/api/projects/:name/notes", (req, res) => {
    const { name } = req.params;
    const notesFile = path.join(DATA_DIR, `notes_${name}.md`);
    if (fs.existsSync(notesFile)) {
      res.send(fs.readFileSync(notesFile, "utf8"));
    } else {
      res.send("");
    }
  });

  serverApp.post("/api/projects/:name/notes", (req, res) => {
    const { name } = req.params;
    const content = req.body;
    const notesFile = path.join(DATA_DIR, `notes_${name}.md`);
    fs.writeFileSync(notesFile, content);
    res.json({ message: "Notas guardadas" });
  });

  serverApp.get("/api/projects/:name/kv", (req, res) => {
    const { name } = req.params;
    const kvFile = path.join(DATA_DIR, `kv_${name}.json`);
    if (fs.existsSync(kvFile)) {
      res.json(JSON.parse(fs.readFileSync(kvFile, "utf8")));
    } else {
      res.json({});
    }
  });

  serverApp.post("/api/projects/:name/kv", (req, res) => {
    const { name } = req.params;
    const { key, value } = req.body;
    const kvFile = path.join(DATA_DIR, `kv_${name}.json`);
    let kv = {};
    if (fs.existsSync(kvFile)) {
      kv = JSON.parse(fs.readFileSync(kvFile, "utf8"));
    }
    kv[key] = value;
    fs.writeFileSync(kvFile, JSON.stringify(kv, null, 2));
    res.json({ message: "Llave-valor agregado" });
  });

  serverApp.put("/api/projects/:name/kv/:key", (req, res) => {
    const { name, key } = req.params;
    const { value } = req.body;
    const kvFile = path.join(DATA_DIR, `kv_${name}.json`);
    if (fs.existsSync(kvFile)) {
      let kv = JSON.parse(fs.readFileSync(kvFile, "utf8"));
      if (kv.hasOwnProperty(key)) {
        kv[key] = value;
        fs.writeFileSync(kvFile, JSON.stringify(kv, null, 2));
        res.json({ message: "Llave-valor actualizado" });
      } else {
        res.status(404).json({ message: "Llave no encontrada" });
      }
    } else {
      res.status(404).json({ message: "Archivo no encontrado" });
    }
  });

  serverApp.delete("/api/projects/:name/kv/:key", (req, res) => {
    const { name, key } = req.params;
    const kvFile = path.join(DATA_DIR, `kv_${name}.json`);
    if (fs.existsSync(kvFile)) {
      let kv = JSON.parse(fs.readFileSync(kvFile, "utf8"));
      if (kv.hasOwnProperty(key)) {
        delete kv[key];
        fs.writeFileSync(kvFile, JSON.stringify(kv, null, 2));
        res.json({ message: "Llave-valor eliminado" });
      } else {
        res.status(404).json({ message: "Llave no encontrada" });
      }
    } else {
      res.status(404).json({ message: "Archivo no encontrado" });
    }
  });

  serverApp.get("/api/projects/:name/todo", (req, res) => {
    const { name } = req.params;
    const todoFile = path.join(DATA_DIR, `todo_${name}.json`);
    if (fs.existsSync(todoFile)) {
      res.json(JSON.parse(fs.readFileSync(todoFile, "utf8")));
    } else {
      res.json([]);
    }
  });

  serverApp.post("/api/projects/:name/todo", (req, res) => {
    const { name } = req.params;
    const { text } = req.body;
    const todoFile = path.join(DATA_DIR, `todo_${name}.json`);
    let todos = [];
    if (fs.existsSync(todoFile)) {
      todos = JSON.parse(fs.readFileSync(todoFile, "utf8"));
    }
    todos.push({ text, completed: false });
    fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2));
    res.json({ message: "Tarea agregada" });
  });

  serverApp.put("/api/projects/:name/todo/reorder", (req, res) => {
    const { name } = req.params;
    const { from, to } = req.body;
    const todoFile = path.join(DATA_DIR, `todo_${name}.json`);
    if (fs.existsSync(todoFile)) {
      let todos = JSON.parse(fs.readFileSync(todoFile, "utf8"));
      if (todos[from] && todos[to] !== undefined) {
        const [moved] = todos.splice(from, 1);
        todos.splice(to, 0, moved);
        fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2));
        res.json({ message: "Tareas reordenadas" });
      } else {
        res.status(404).json({ message: "Índices inválidos" });
      }
    } else {
      res.status(404).json({ message: "Archivo no encontrado" });
    }
  });

  serverApp.put("/api/projects/:name/todo/:index", (req, res) => {
    const { name, index } = req.params;
    const { toggle } = req.body;
    const todoFile = path.join(DATA_DIR, `todo_${name}.json`);
    if (fs.existsSync(todoFile)) {
      let todos = JSON.parse(fs.readFileSync(todoFile, "utf8"));
      if (todos[index]) {
        if (toggle) {
          todos[index].completed = !todos[index].completed;
        }
        fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2));
        res.json({ message: "Tarea actualizada" });
      } else {
        res.status(404).json({ message: "Tarea no encontrada" });
      }
    } else {
      res.status(404).json({ message: "Archivo no encontrado" });
    }
  });

  serverApp.put("/api/projects/:name/todo/move/:index", (req, res) => {
    const { name, index } = req.params;
    const { direction } = req.body;
    const todoFile = path.join(DATA_DIR, `todo_${name}.json`);
    if (fs.existsSync(todoFile)) {
      let todos = JSON.parse(fs.readFileSync(todoFile, "utf8"));
      const idx = parseInt(index);
      if (todos[idx]) {
        if (direction === "up" && idx > 0) {
          [todos[idx - 1], todos[idx]] = [todos[idx], todos[idx - 1]];
        } else if (direction === "down" && idx < todos.length - 1) {
          [todos[idx], todos[idx + 1]] = [todos[idx + 1], todos[idx]];
        }
        fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2));
        res.json({ message: "Tarea movida" });
      } else {
        res.status(404).json({ message: "Tarea no encontrada" });
      }
    } else {
      res.status(404).json({ message: "Archivo no encontrado" });
    }
  });

  serverApp.delete("/api/projects/:name/todo/:index", (req, res) => {
    const { name, index } = req.params;
    const todoFile = path.join(DATA_DIR, `todo_${name}.json`);
    if (fs.existsSync(todoFile)) {
      let todos = JSON.parse(fs.readFileSync(todoFile, "utf8"));
      if (todos[index]) {
        todos.splice(index, 1);
        fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2));
        res.json({ message: "Tarea eliminada" });
      } else {
        res.status(404).json({ message: "Tarea no encontrada" });
      }
    } else {
      res.status(404).json({ message: "Archivo no encontrado" });
    }
  });

  serverApp.use(express.static(path.join(__dirname, "."))); // Servir archivos estáticos

  server = serverApp.listen(3000, () => {
    console.log("Servidor corriendo en puerto 3000");
  });

  mainWindow.loadURL("http://localhost:3000");

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (server) {
      server.close();
    }
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
