import type { DiagramNodeType } from "../CreadorDiagramas/types";

export type Language = "es" | "en";

export type Translations = {
  toolbar: {
    toggleSidebar: string;
    newTab: string;
    newDiagram: string;
    openFile: string;
    save: string;
    wordWrap: (on: boolean) => string;
    formatDocument: string;
    findReplace: string;
    commandPalette: string;
    info: string;
    settings: string;
    toggleChat: string;
  };
  settings: {
    title: string;
    colorRules: string;
    triggerLabel: string;
    triggerPlaceholder: string;
    selectColor: string;
    add: string;
    errorTriggerEmpty: string;
    errorColorFormat: string;
    errorTriggerDuplicate: string;
    noRules: string;
    enableRule: string;
    disableRule: string;
    deleteRule: string;
    homeFolder: string;
    systemHome: string;
    change: string;
    resetHome: string;
    reset: string;
    diagrams: string;
    minimap: string;
    zoomControls: string;
    background: string;
    nodeToolbar: string;
    propertiesPanel: string;
    topBar: string;
    connectionArea: string;
    language: string;
  };
  sidebar: {
    title: string;
    newFile: string;
    newFolder: string;
    goHome: string;
    refresh: string;
    loading: string;
    emptyDir: string;
    delete: string;
    rename: string;
    confirmDelete: (name: string) => string;
    newFilePrompt: string;
    newFolderPrompt: string;
    newNamePrompt: string;
  };
  tabBar: {
    newTab: string;
    closeTab: string;
    rename: string;
  };
  statusBar: {
    modified: string;
    lines: (n: number) => string;
  };
  findReplace: {
    findPlaceholder: string;
    caseSensitive: string;
    wholeWord: string;
    useRegex: string;
    invalidRegex: string;
    matches: (n: number) => string;
    replacePlaceholder: string;
    replace: string;
    replaceAll: string;
    toggleReplace: string;
  };
  commandPalette: {
    searchPlaceholder: string;
    noResults: string;
    newTab: string;
    newTabDesc: string;
    openFile: string;
    openFileDesc: string;
    save: string;
    saveAs: string;
    closeTab: string;
    toggleSidebar: string;
    findReplace: string;
  };
  infoModal: {
    subtitle: string;
    close: string;
    shortcuts: string;
    commands: string;
    shortcutList: { action: string; keys: string }[];
    commandList: string[];
  };
  editor: {
    noFileOpen: string;
  };
  errorBoundary: {
    title: string;
    retry: string;
  };
  diagram: {
    undo: string;
    undoTitle: string;
    redo: string;
    redoTitle: string;
    arrow: string;
    curved: string;
    straight: string;
    orthogonal: string;
    organize: string;
    organizeTitle: string;
    alignSection: string;
    distributeSection: string;
    sizeSection: string;
    alignLeft: string;
    alignRight: string;
    alignTop: string;
    alignBottom: string;
    centerH: string;
    centerV: string;
    distributeH: string;
    distributeV: string;
    equalWidth: string;
    equalHeight: string;
    export: string;
    codeLabel: string;
    codePseudo: string;
    generate: string;
    fitView: string;
    fitViewTitle: string;
    generatedCode: string;
    copy: string;
    edgeLabelPlaceholder: string;
    edgeLabelHint: string;
    addNode: string;
    catBasics: string;
    catData: string;
    catConnectors: string;
    catOperations: string;
    dragOrClick: (label: string) => string;
    nodeTypes: Record<DiagramNodeType, string>;
  };
  properties: {
    empty: string;
    connector: string;
    label: string;
    noLabel: string;
    type: string;
    from: string;
    to: string;
    editInline: string;
    title: string;
    color: string;
    description: string;
  };
  chat: {
    newConversation: string;
    defaultTitle: string;
    deleteConversation: string;
    inputPlaceholder: string;
    send: string;
    loading: string;
    errorNoKey: string;
    errorRequest: string;
    addFolderContext: string;
    addFileContext: string;
    addTabContext: string;
    contextSection: string;
    removeContext: string;
    noContext: string;
    selectTab: string;
    noOpenTabs: string;
    youLabel: string;
    aiLabel: string;
    emptyConversation: string;
    sendToChat: string;
    conversations: string;
    generateContextTitle: string;
    generatedContextModal: string;
    copyContext: string;
    copiedContext: string;
    closeModal: string;
  };
  ai: {
    title: string;
    provider: string;
    openaiKey: string;
    anthropicKey: string;
    deepseekKey: string;
    openaiModel: string;
    anthropicModel: string;
    deepseekModel: string;
    keyPlaceholder: string;
  };
};

const es: Translations = {
  toolbar: {
    toggleSidebar: "Alternar sidebar (Ctrl+B)",
    newTab: "Nueva pestaña (Ctrl+N)",
    newDiagram: "Nuevo diagrama (Ctrl+D)",
    openFile: "Abrir archivo (Ctrl+O)",
    save: "Guardar (Ctrl+S)",
    wordWrap: (on) => `Ajuste de línea: ${on ? "ACTIVADO" : "DESACTIVADO"}`,
    formatDocument: "Formatear documento",
    findReplace: "Buscar y reemplazar (Ctrl+F)",
    commandPalette: "Paleta de comandos (Ctrl+K)",
    info: "Información",
    settings: "Configuración",
    toggleChat: "Panel de IA (Ctrl+I)",
  },
  settings: {
    title: "Configuración",
    colorRules: "Reglas de color",
    triggerLabel: "Trigger literal",
    triggerPlaceholder: "Ej: |, 3, if",
    selectColor: "Seleccionar color",
    add: "Agregar",
    errorTriggerEmpty: "El trigger no puede estar vacío.",
    errorColorFormat: "El color debe tener formato #RRGGBB.",
    errorTriggerDuplicate: "Ya existe una regla con ese trigger exacto.",
    noRules: "No hay reglas aún.",
    enableRule: "Activar regla",
    disableRule: "Desactivar regla",
    deleteRule: "Eliminar regla",
    homeFolder: "Carpeta de inicio",
    systemHome: "~ (home del sistema)",
    change: "Cambiar",
    resetHome: "Restaurar home del sistema",
    reset: "Reset",
    diagrams: "Diagramas",
    minimap: "Minimapa",
    zoomControls: "Controles de zoom",
    background: "Fondo (puntos)",
    nodeToolbar: "Barra de nodos",
    propertiesPanel: "Panel de propiedades",
    topBar: "Barra superior",
    connectionArea: "Área de conexión",
    language: "Idioma",
  },
  sidebar: {
    title: "Explorador",
    newFile: "Nuevo archivo",
    newFolder: "Nueva carpeta",
    goHome: "Ir al inicio",
    refresh: "Actualizar",
    loading: "Cargando…",
    emptyDir: "Directorio vacío",
    delete: "Eliminar",
    rename: "Renombrar",
    confirmDelete: (name) => `¿Eliminar "${name}"?`,
    newFilePrompt: "Nombre del archivo:",
    newFolderPrompt: "Nombre de la carpeta:",
    newNamePrompt: "Nuevo nombre:",
  },
  tabBar: {
    newTab: "Nueva pestaña (Ctrl+N)",
    closeTab: "Cerrar pestaña",
    rename: "Renombrar",
  },
  statusBar: {
    modified: "● Modificado",
    lines: (n) => `${n} línea${n !== 1 ? "s" : ""}`,
  },
  findReplace: {
    findPlaceholder: "Buscar…",
    caseSensitive: "Distinguir mayúsculas",
    wholeWord: "Palabra completa",
    useRegex: "Expresión regular",
    invalidRegex: "Expresión regular inválida",
    matches: (n) => `${n} coincidencia${n !== 1 ? "s" : ""}`,
    replacePlaceholder: "Reemplazar con…",
    replace: "Reemplazar",
    replaceAll: "Reemplazar todo",
    toggleReplace: "Mostrar/ocultar reemplazo",
  },
  commandPalette: {
    searchPlaceholder: "Buscar comandos o abrir archivos…",
    noResults: "Sin resultados",
    newTab: "Nueva pestaña",
    newTabDesc: "Abrir una pestaña en blanco",
    openFile: "Abrir archivo…",
    openFileDesc: "Explorar y abrir un archivo",
    save: "Guardar",
    saveAs: "Guardar como…",
    closeTab: "Cerrar pestaña",
    toggleSidebar: "Mostrar/ocultar sidebar",
    findReplace: "Buscar y reemplazar",
  },
  infoModal: {
    subtitle: "Editor de texto para Linux",
    close: "Cerrar",
    shortcuts: "Atajos de teclado",
    commands: "Comandos disponibles",
    shortcutList: [
      { action: "Nuevo archivo",           keys: "Ctrl+N" },
      { action: "Abrir archivo",           keys: "Ctrl+O" },
      { action: "Guardar",                 keys: "Ctrl+S" },
      { action: "Guardar como",            keys: "Ctrl+Shift+S" },
      { action: "Cerrar pestaña",          keys: "Ctrl+W" },
      { action: "Buscar y reemplazar",     keys: "Ctrl+F" },
      { action: "Paleta de comandos",      keys: "Ctrl+K" },
      { action: "Mostrar/ocultar sidebar", keys: "Ctrl+B" },
      { action: "Cambiar a pestaña 1–9",   keys: "Ctrl+1…9" },
      { action: "Pestaña siguiente",       keys: "Ctrl+Tab" },
      { action: "Pestaña anterior",        keys: "Ctrl+Shift+Tab" },
    ],
    commandList: [
      "Nuevo archivo — abre una pestaña en blanco",
      "Abrir archivo — selector de archivos del sistema",
      "Guardar / Guardar como — escribe en disco",
      "Cerrar pestaña — cierra la pestaña activa",
      "Buscar y reemplazar — panel integrado en el editor",
      "Paleta de comandos — acceso rápido a todas las acciones",
      "Mostrar/ocultar sidebar — explorador de archivos",
      "Ajuste de línea — activa/desactiva el word wrap",
      "Reglas de color — resaltado personalizado por trigger",
    ],
  },
  editor: {
    noFileOpen: "Sin archivo — Ctrl+N nueva pestaña, Ctrl+O abrir",
  },
  errorBoundary: {
    title: "Algo salió mal",
    retry: "Reintentar",
  },
  diagram: {
    undo: "↩ Deshacer",
    undoTitle: "Deshacer (Ctrl+Z)",
    redo: "↪ Rehacer",
    redoTitle: "Rehacer (Ctrl+Y)",
    arrow: "Flecha:",
    curved: "Curva",
    straight: "Recta",
    orthogonal: "Ortogonal",
    organize: "📐 Organizar ▾",
    organizeTitle: "Organizar nodos seleccionados",
    alignSection: "Alinear / Centrar",
    distributeSection: "Distribuir",
    sizeSection: "Igualar tamaño",
    alignLeft: "Alinear izquierda (Ctrl+Shift+L)",
    alignRight: "Alinear derecha (Ctrl+Shift+R)",
    alignTop: "Alinear arriba (Ctrl+Shift+T)",
    alignBottom: "Alinear abajo (Ctrl+Shift+B)",
    centerH: "Centrar horizontal (Ctrl+Shift+H)",
    centerV: "Centrar vertical (Ctrl+Shift+V)",
    distributeH: "Distribuir horizontal (Ctrl+Shift+D)",
    distributeV: "Distribuir vertical (Ctrl+Shift+G)",
    equalWidth: "Igualar ancho",
    equalHeight: "Igualar alto",
    export: "⬇ Exportar ▾",
    codeLabel: "Código:",
    codePseudo: "Pseudocódigo",
    generate: "⚙ Generar",
    fitView: "⊞ Ajustar",
    fitViewTitle: "Ajustar vista",
    generatedCode: "Código generado",
    copy: "Copiar",
    edgeLabelPlaceholder: "Etiqueta del conector…",
    edgeLabelHint: "Enter = guardar · Esc = cancelar",
    addNode: "Añadir nodo",
    catBasics: "Básicos",
    catData: "Datos",
    catConnectors: "Conectores",
    catOperations: "Operaciones",
    dragOrClick: (label) => `Arrastrar o clic: ${label}`,
    nodeTypes: {
      startend:              "Inicio/Fin",
      process:               "Proceso",
      decision:              "Decisión",
      io:                    "E / S",
      subprocess:            "Subproceso",
      preparation:           "Preparación",
      database:              "Base de Datos",
      document:              "Documento",
      multidocument:         "Multidoc.",
      internal_storage:      "Alm. Interno",
      manual_input:          "E. Manual",
      sequential_data:       "D. Secuencial",
      page_connector:        "Conn. Página",
      offpage_connector:     "Fuera Página",
      annotation:            "Anotación",
      swimlane:              "Swimlane",
      summing_junction:      "Unión",
      manual_operation:      "Op. Manual",
      delay:                 "Retraso",
      display:               "Display",
      reference:             "Referencia",
      direct_access_storage: "Acc. Directo",
    },
  },
  properties: {
    empty: "Selecciona un nodo o conector para editar sus propiedades",
    connector: "Conector",
    label: "Etiqueta",
    noLabel: "Sin etiqueta",
    type: "Tipo",
    from: "De",
    to: "A",
    editInline: "Doble clic sobre el conector para editar inline",
    title: "Propiedades",
    color: "Color",
    description: "Descripción",
  },
  chat: {
    newConversation: "Nueva conversación",
    defaultTitle: "Conversación",
    deleteConversation: "Eliminar conversación",
    inputPlaceholder: "Escribe un mensaje…",
    send: "Enviar",
    loading: "Pensando…",
    errorNoKey: "Configura una API key en Ajustes → IA",
    errorRequest: "Error al contactar la API",
    addFolderContext: "Carpeta",
    addFileContext: "Archivo",
    addTabContext: "Pestaña abierta",
    contextSection: "Contexto",
    removeContext: "Quitar",
    noContext: "Sin contexto",
    selectTab: "Seleccionar pestaña",
    noOpenTabs: "No hay pestañas abiertas",
    youLabel: "Tú",
    aiLabel: "IA",
    emptyConversation: "Inicia la conversación…",
    sendToChat: "Enviar selección al chat",
    conversations: "Conversaciones",
    generateContextTitle: "Generar prompt con el contexto actual",
    generatedContextModal: "Contexto generado",
    copyContext: "Copiar",
    copiedContext: "¡Copiado!",
    closeModal: "Cerrar",
  },
  ai: {
    title: "Inteligencia Artificial",
    provider: "Proveedor",
    openaiKey: "API Key de OpenAI",
    anthropicKey: "API Key de Anthropic",
    deepseekKey: "API Key de DeepSeek",
    openaiModel: "Modelo OpenAI",
    anthropicModel: "Modelo Anthropic",
    deepseekModel: "Modelo DeepSeek",
    keyPlaceholder: "sk-…",
  },
};

const en: Translations = {
  toolbar: {
    toggleSidebar: "Toggle sidebar (Ctrl+B)",
    newTab: "New tab (Ctrl+N)",
    newDiagram: "New diagram (Ctrl+D)",
    openFile: "Open file (Ctrl+O)",
    save: "Save (Ctrl+S)",
    wordWrap: (on) => `Word wrap: ${on ? "ON" : "OFF"}`,
    formatDocument: "Format document",
    findReplace: "Find & replace (Ctrl+F)",
    commandPalette: "Command palette (Ctrl+K)",
    info: "Information",
    settings: "Settings",
    toggleChat: "AI panel (Ctrl+I)",
  },
  settings: {
    title: "Settings",
    colorRules: "Color rules",
    triggerLabel: "Literal trigger",
    triggerPlaceholder: "e.g. |, 3, if",
    selectColor: "Select color",
    add: "Add",
    errorTriggerEmpty: "Trigger cannot be empty.",
    errorColorFormat: "Color must be in #RRGGBB format.",
    errorTriggerDuplicate: "A rule with that trigger already exists.",
    noRules: "No rules yet.",
    enableRule: "Enable rule",
    disableRule: "Disable rule",
    deleteRule: "Delete rule",
    homeFolder: "Home folder",
    systemHome: "~ (system home)",
    change: "Change",
    resetHome: "Restore system home",
    reset: "Reset",
    diagrams: "Diagrams",
    minimap: "Mini-map",
    zoomControls: "Zoom controls",
    background: "Background (dots)",
    nodeToolbar: "Node toolbar",
    propertiesPanel: "Properties panel",
    topBar: "Top bar",
    connectionArea: "Connection area",
    language: "Language",
  },
  sidebar: {
    title: "Explorer",
    newFile: "New file",
    newFolder: "New folder",
    goHome: "Go home",
    refresh: "Refresh",
    loading: "Loading…",
    emptyDir: "Empty directory",
    delete: "Delete",
    rename: "Rename",
    confirmDelete: (name) => `Delete "${name}"?`,
    newFilePrompt: "File name:",
    newFolderPrompt: "Folder name:",
    newNamePrompt: "New name:",
  },
  tabBar: {
    newTab: "New tab (Ctrl+N)",
    closeTab: "Close tab",
    rename: "Rename",
  },
  statusBar: {
    modified: "● Modified",
    lines: (n) => `${n} line${n !== 1 ? "s" : ""}`,
  },
  findReplace: {
    findPlaceholder: "Find…",
    caseSensitive: "Case sensitive",
    wholeWord: "Whole word",
    useRegex: "Use regex",
    invalidRegex: "Invalid regex",
    matches: (n) => `${n} match${n !== 1 ? "es" : ""}`,
    replacePlaceholder: "Replace with…",
    replace: "Replace",
    replaceAll: "Replace All",
    toggleReplace: "Toggle replace",
  },
  commandPalette: {
    searchPlaceholder: "Search commands or open files…",
    noResults: "No results",
    newTab: "New Tab",
    newTabDesc: "Open a blank editor tab",
    openFile: "Open File…",
    openFileDesc: "Browse and open a file",
    save: "Save",
    saveAs: "Save As…",
    closeTab: "Close Tab",
    toggleSidebar: "Toggle Sidebar",
    findReplace: "Find & Replace",
  },
  infoModal: {
    subtitle: "Text editor for Linux",
    close: "Close",
    shortcuts: "Keyboard shortcuts",
    commands: "Available commands",
    shortcutList: [
      { action: "New file",            keys: "Ctrl+N" },
      { action: "Open file",           keys: "Ctrl+O" },
      { action: "Save",                keys: "Ctrl+S" },
      { action: "Save as",             keys: "Ctrl+Shift+S" },
      { action: "Close tab",           keys: "Ctrl+W" },
      { action: "Find & replace",      keys: "Ctrl+F" },
      { action: "Command palette",     keys: "Ctrl+K" },
      { action: "Toggle sidebar",      keys: "Ctrl+B" },
      { action: "Switch to tab 1–9",   keys: "Ctrl+1…9" },
      { action: "Next tab",            keys: "Ctrl+Tab" },
      { action: "Previous tab",        keys: "Ctrl+Shift+Tab" },
    ],
    commandList: [
      "New file — opens a blank tab",
      "Open file — system file picker",
      "Save / Save as — write to disk",
      "Close tab — closes the active tab",
      "Find & replace — built-in editor panel",
      "Command palette — quick access to all actions",
      "Toggle sidebar — file explorer",
      "Word wrap — toggle line wrapping",
      "Color rules — custom highlight by trigger",
    ],
  },
  editor: {
    noFileOpen: "No file open — Ctrl+N for new tab, Ctrl+O to open",
  },
  errorBoundary: {
    title: "Something went wrong",
    retry: "Retry",
  },
  diagram: {
    undo: "↩ Undo",
    undoTitle: "Undo (Ctrl+Z)",
    redo: "↪ Redo",
    redoTitle: "Redo (Ctrl+Y)",
    arrow: "Arrow:",
    curved: "Curved",
    straight: "Straight",
    orthogonal: "Orthogonal",
    organize: "📐 Arrange ▾",
    organizeTitle: "Arrange selected nodes",
    alignSection: "Align / Center",
    distributeSection: "Distribute",
    sizeSection: "Equal size",
    alignLeft: "Align left (Ctrl+Shift+L)",
    alignRight: "Align right (Ctrl+Shift+R)",
    alignTop: "Align top (Ctrl+Shift+T)",
    alignBottom: "Align bottom (Ctrl+Shift+B)",
    centerH: "Center horizontally (Ctrl+Shift+H)",
    centerV: "Center vertically (Ctrl+Shift+V)",
    distributeH: "Distribute horizontally (Ctrl+Shift+D)",
    distributeV: "Distribute vertically (Ctrl+Shift+G)",
    equalWidth: "Equal width",
    equalHeight: "Equal height",
    export: "⬇ Export ▾",
    codeLabel: "Code:",
    codePseudo: "Pseudocode",
    generate: "⚙ Generate",
    fitView: "⊞ Fit",
    fitViewTitle: "Fit view",
    generatedCode: "Generated code",
    copy: "Copy",
    edgeLabelPlaceholder: "Connector label…",
    edgeLabelHint: "Enter = save · Esc = cancel",
    addNode: "Add node",
    catBasics: "Basics",
    catData: "Data",
    catConnectors: "Connectors",
    catOperations: "Operations",
    dragOrClick: (label) => `Drag or click: ${label}`,
    nodeTypes: {
      startend:              "Start/End",
      process:               "Process",
      decision:              "Decision",
      io:                    "I / O",
      subprocess:            "Subprocess",
      preparation:           "Preparation",
      database:              "Database",
      document:              "Document",
      multidocument:         "Multi-doc.",
      internal_storage:      "Int. Storage",
      manual_input:          "Man. Input",
      sequential_data:       "Seq. Data",
      page_connector:        "Page Conn.",
      offpage_connector:     "Off-page Conn.",
      annotation:            "Annotation",
      swimlane:              "Swimlane",
      summing_junction:      "Junction",
      manual_operation:      "Man. Op.",
      delay:                 "Delay",
      display:               "Display",
      reference:             "Reference",
      direct_access_storage: "Dir. Access",
    },
  },
  properties: {
    empty: "Select a node or connector to edit its properties",
    connector: "Connector",
    label: "Label",
    noLabel: "No label",
    type: "Type",
    from: "From",
    to: "To",
    editInline: "Double-click the connector to edit inline",
    title: "Properties",
    color: "Color",
    description: "Description",
  },
  chat: {
    newConversation: "New conversation",
    defaultTitle: "Conversation",
    deleteConversation: "Delete conversation",
    inputPlaceholder: "Type a message…",
    send: "Send",
    loading: "Thinking…",
    errorNoKey: "Set an API key in Settings → AI",
    errorRequest: "Error contacting the API",
    addFolderContext: "Folder",
    addFileContext: "File",
    addTabContext: "Open tab",
    contextSection: "Context",
    removeContext: "Remove",
    noContext: "No context",
    selectTab: "Select tab",
    noOpenTabs: "No open tabs",
    youLabel: "You",
    aiLabel: "AI",
    emptyConversation: "Start the conversation…",
    sendToChat: "Send selection to chat",
    conversations: "Conversations",
    generateContextTitle: "Generate prompt with current context",
    generatedContextModal: "Generated context",
    copyContext: "Copy",
    copiedContext: "Copied!",
    closeModal: "Close",
  },
  ai: {
    title: "Artificial Intelligence",
    provider: "Provider",
    openaiKey: "OpenAI API Key",
    anthropicKey: "Anthropic API Key",
    deepseekKey: "DeepSeek API Key",
    openaiModel: "OpenAI model",
    anthropicModel: "Anthropic model",
    deepseekModel: "DeepSeek model",
    keyPlaceholder: "sk-…",
  },
};

export const translations: Record<Language, Translations> = { es, en };
