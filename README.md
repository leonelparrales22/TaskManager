# Gestor de Apuntes por Proyecto

Una aplicación de escritorio para gestionar apuntes organizados por proyectos, con almacenamiento local en archivos.

## Características

- Crear y gestionar proyectos.
- Notepad con guardado automático.
- Almacén llave-valor con operaciones CRUD.
- Interfaz responsive.
- Portable: ejecutable sin instalar Node.js.

## Instalación y Uso

### Desarrollo

1. Clona el repositorio:
   ```
   git clone https://github.com/leonelparrales22/TaskManager.git
   cd TaskManager
   ```

2. Instala dependencias:
   ```
   npm install
   ```

3. Inicia en modo desarrollo:
   ```
   npm start
   ```

### Construir Ejecutable

Para crear un ejecutable portable:

1. Instala dependencias de desarrollo:
   ```
   npm install
   ```

3. Construye la aplicación:
   ```
   npm run build
   ```

3. El ejecutable se generará en `build/win-unpacked/`. Ejecuta `TaskManager.exe` para usar la app.

## Portabilidad

Los datos se almacenan en el directorio `data/` dentro del directorio de la aplicación.

Para transferir datos:

1. Copia el directorio `data/` completo.
2. Pégalo en el directorio de la aplicación en la nueva máquina.
3. Ejecuta la app; los datos se cargarán automáticamente.

No requiere instalación de Node.js en otras máquinas; el ejecutable incluye todo lo necesario.

## Uso

- Crea un proyecto con "Nuevo Proyecto".
- Selecciona un proyecto para acceder al notepad y llave-valor.
- En notepad, escribe y se guarda automáticamente.
- En llave-valor, agrega, edita, elimina pares, y copia valores al portapapeles.

## Tecnologías

- Electron para la aplicación de escritorio.
- Node.js con Express para el backend.
- HTML, CSS, JavaScript puro.