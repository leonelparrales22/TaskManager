const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

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

  // Iniciar servidor Express
  const serverApp = express();
  serverApp.use(cors());
  serverApp.use(bodyParser.json());
  serverApp.use(express.static(path.join(__dirname, '.'))); // Servir archivos estáticos

  const DATA_DIR = path.join(__dirname, 'data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }

  const projectsFile = path.join(DATA_DIR, 'projects.json');

  function readProjects() {
    if (fs.existsSync(projectsFile)) {
      return JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
    }
    return [];
  }

  function writeProjects(projects) {
    fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
  }

  // Rutas
  serverApp.get('/api/projects', (req, res) => {
    res.json(readProjects());
  });

  serverApp.post('/api/projects', (req, res) => {
    const { name } = req.body;
    const projects = readProjects();
    if (!projects.includes(name)) {
      projects.push(name);
      writeProjects(projects);
      res.status(201).json({ message: 'Proyecto creado' });
    } else {
      res.status(400).json({ message: 'Proyecto ya existe' });
    }
  });

  serverApp.put('/api/projects/:oldName', (req, res) => {
    const { oldName } = req.params;
    const { newName } = req.body;
    const projects = readProjects();
    const index = projects.indexOf(oldName);
    if (index !== -1 && !projects.includes(newName)) {
      projects[index] = newName;
      writeProjects(projects);
      // Renombrar archivos
      const oldNotes = path.join(DATA_DIR, `notes_${oldName}.txt`);
      const newNotes = path.join(DATA_DIR, `notes_${newName}.txt`);
      if (fs.existsSync(oldNotes)) {
        fs.renameSync(oldNotes, newNotes);
      }
      const oldKv = path.join(DATA_DIR, `kv_${oldName}.json`);
      const newKv = path.join(DATA_DIR, `kv_${newName}.json`);
      if (fs.existsSync(oldKv)) {
        fs.renameSync(oldKv, newKv);
      }
      res.json({ message: 'Proyecto renombrado' });
    } else {
      res.status(400).json({ message: 'Nombre inválido o ya existe' });
    }
  });

  serverApp.get('/api/projects/:name/notes', (req, res) => {
    const { name } = req.params;
    const notesFile = path.join(DATA_DIR, `notes_${name}.txt`);
    if (fs.existsSync(notesFile)) {
      res.send(fs.readFileSync(notesFile, 'utf8'));
    } else {
      res.send('');
    }
  });

  serverApp.post('/api/projects/:name/notes', (req, res) => {
    const { name } = req.params;
    const { content } = req.body;
    const notesFile = path.join(DATA_DIR, `notes_${name}.txt`);
    fs.writeFileSync(notesFile, content);
    res.json({ message: 'Notas guardadas' });
  });

  serverApp.get('/api/projects/:name/kv', (req, res) => {
    const { name } = req.params;
    const kvFile = path.join(DATA_DIR, `kv_${name}.json`);
    if (fs.existsSync(kvFile)) {
      res.json(JSON.parse(fs.readFileSync(kvFile, 'utf8')));
    } else {
      res.json({});
    }
  });

  serverApp.post('/api/projects/:name/kv', (req, res) => {
    const { name } = req.params;
    const { key, value } = req.body;
    const kvFile = path.join(DATA_DIR, `kv_${name}.json`);
    let kv = {};
    if (fs.existsSync(kvFile)) {
      kv = JSON.parse(fs.readFileSync(kvFile, 'utf8'));
    }
    kv[key] = value;
    fs.writeFileSync(kvFile, JSON.stringify(kv, null, 2));
    res.json({ message: 'Llave-valor agregado' });
  });

  serverApp.put('/api/projects/:name/kv/:key', (req, res) => {
    const { name, key } = req.params;
    const { value } = req.body;
    const kvFile = path.join(DATA_DIR, `kv_${name}.json`);
    if (fs.existsSync(kvFile)) {
      let kv = JSON.parse(fs.readFileSync(kvFile, 'utf8'));
      if (kv.hasOwnProperty(key)) {
        kv[key] = value;
        fs.writeFileSync(kvFile, JSON.stringify(kv, null, 2));
        res.json({ message: 'Llave-valor actualizado' });
      } else {
        res.status(404).json({ message: 'Llave no encontrada' });
      }
    } else {
      res.status(404).json({ message: 'Archivo no encontrado' });
    }
  });

  serverApp.delete('/api/projects/:name/kv/:key', (req, res) => {
    const { name, key } = req.params;
    const kvFile = path.join(DATA_DIR, `kv_${name}.json`);
    if (fs.existsSync(kvFile)) {
      let kv = JSON.parse(fs.readFileSync(kvFile, 'utf8'));
      if (kv.hasOwnProperty(key)) {
        delete kv[key];
        fs.writeFileSync(kvFile, JSON.stringify(kv, null, 2));
        res.json({ message: 'Llave-valor eliminado' });
      } else {
        res.status(404).json({ message: 'Llave no encontrada' });
      }
    } else {
      res.status(404).json({ message: 'Archivo no encontrado' });
    }
  });

  server = serverApp.listen(3000, () => {
    console.log('Servidor corriendo en puerto 3000');
  });

  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (server) {
      server.close();
    }
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});