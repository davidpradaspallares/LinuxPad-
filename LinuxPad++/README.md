# LinuxPad++

Un editor de texto moderno para Linux inspirado en Notepad++, construido con Tauri 2, React 18 y Monaco Editor. Incluye un creador de diagramas de flujo integrado basado en XYFlow.

## Funcionalidades

- **Editor de código completo** con resaltado de sintaxis para docenas de lenguajes (Monaco Editor)
- **Pestañas múltiples** con estado dirty indicator y cierre individual
- **Explorador de archivos** en barra lateral con árboles de directorios
- **Buscar y reemplazar** con soporte de expresiones regulares
- **Formateador de código** para JSON, XML, SQL y otros formatos
- **Paleta de comandos** accesible con `Ctrl+Shift+P`
- **Creador de diagramas de flujo** con soporte de nodos estándar ISO 5807:
  - Procesos, decisiones, inicio/fin, subprocesos
  - Entrada/salida, bases de datos, documentos
  - Swimlanes, conectores, formas de almacenamiento
  - Exportación a PNG, SVG y JSON
- **Atajos de teclado** completos (Ctrl+S, Ctrl+O, Ctrl+W, etc.)
- **Barra de estado** con información de línea, columna, codificación y lenguaje

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| UI | React 18 · TypeScript · TailwindCSS |
| Editor | Monaco Editor 0.52 |
| Diagramas | XYFlow (React Flow) 12 |
| Backend | Rust · Tauri 2 |
| Build | Vite 5 · PostCSS |

## Requisitos previos

- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://rustup.rs/) (stable)
- [Tauri CLI v2](https://tauri.app/start/prerequisites/)

```bash
cargo install tauri-cli --version "^2"
```

## Instalación y desarrollo

```bash
# Instalar dependencias frontend
npm install

# Iniciar en modo desarrollo (abre ventana de la app)
npm run tauri dev
```

## Build de producción

```bash
npm run tauri build
```

El instalador/binario se genera en `src-tauri/target/release/bundle/`.

## Estructura del proyecto

```
LinuxPad++/
├── src/                    # Frontend React + TypeScript
│   ├── components/         # Componentes principales del editor
│   ├── CreadorDiagramas/   # Módulo de diagramas de flujo
│   ├── stores/             # Estado global (Zustand)
│   ├── hooks/              # Hooks personalizados
│   └── utils/              # Utilidades y bridges
├── src-tauri/              # Backend Rust (Tauri)
│   └── src/commands/       # Comandos de sistema de archivos
└── public/                 # Assets estáticos
```

## Licencia

MIT
