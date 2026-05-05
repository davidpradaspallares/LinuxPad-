import React, { useEffect, useRef, useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  PanelLeft,
  FilePlus,
  FolderOpen,
  Save,
  Search,
  Command,
  WrapText,
  Settings,
  Info,
  Braces,
  GitGraph,
} from "lucide-react";

import { formatContent, FORMATTABLE_LANGUAGES, sniffLanguage } from "./utils/formatter";
import { editorBridge } from "./utils/editorBridge";

import Sidebar from "./components/Sidebar";
import TabBar from "./components/TabBar";
import Editor from "./components/Editor";
import DiagramEditor from "./CreadorDiagramas/DiagramEditor";
import StatusBar from "./components/StatusBar";
import FindReplace from "./components/FindReplace";
import CommandPalette from "./components/CommandPalette";
import InfoModal from "./components/InfoModal";

import { useEditorStore } from "./stores/editorStore";
import { useFileWatcher } from "./hooks/useFileWatcher";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

export default function App() {
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [formatError, setFormatError] = useState(false);
  const [triggerInput, setTriggerInput] = useState("");
  const [colorInput, setColorInput] = useState("#22c55e");
  const [settingsError, setSettingsError] = useState("");
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);

  const sidebarOpen = useEditorStore((s) => s.sidebarOpen);
  const toggleSidebar = useEditorStore((s) => s.toggleSidebar);
  const wordWrapEnabled = useEditorStore((s) => s.wordWrapEnabled);
  const toggleWordWrap = useEditorStore((s) => s.toggleWordWrap);
  const commandPaletteOpen = useEditorStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useEditorStore((s) => s.setCommandPaletteOpen);
  const findReplaceOpen = useEditorStore((s) => s.findReplaceOpen);
  const setFindReplaceOpen = useEditorStore((s) => s.setFindReplaceOpen);

  const newTab = useEditorStore((s) => s.newTab);
  const newDiagramTab = useEditorStore((s) => s.newDiagramTab);
  const openFile = useEditorStore((s) => s.openFile);
  const saveTab = useEditorStore((s) => s.saveTab);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const tabs = useEditorStore((s) => s.tabs);
  const restoreSession = useEditorStore((s) => s.restoreSession);
  const colorRules = useEditorStore((s) => s.colorRules);
  const addColorRule = useEditorStore((s) => s.addColorRule);
  const removeColorRule = useEditorStore((s) => s.removeColorRule);
  const toggleColorRule = useEditorStore((s) => s.toggleColorRule);
  const diagramSettings = useEditorStore((s) => s.diagramSettings);
  const setDiagramSetting = useEditorStore((s) => s.setDiagramSetting);

  // Activate hooks
  useFileWatcher();
  useKeyboardShortcuts();

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!settingsMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!settingsMenuRef.current) return;
      if (!settingsMenuRef.current.contains(event.target as Node)) {
        setSettingsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsMenuOpen]);

  const handleOpenFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        { name: "Text / Code", extensions: ["txt", "md", "json", "ts", "tsx", "js", "jsx", "rs", "py", "go", "css", "html", "yaml", "toml"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    if (selected && typeof selected === "string") {
      openFile(selected);
    }
  };

  const handleSave = async () => {
    if (!activeTabId) return;
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;

    if (tab.path) {
      await saveTab(activeTabId);
    } else {
      const path = await save({
        defaultPath: "untitled.txt",
        filters: [{ name: "All Files", extensions: ["*"] }],
      });
      if (path) await saveTab(activeTabId, path);
    }
  };

  const setTabContent = useEditorStore((s) => s.setTabContent);

  const handleFormat = () => {
    if (!activeTabId) return;
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;
    const lang = FORMATTABLE_LANGUAGES.has(tab.language)
      ? tab.language
      : sniffLanguage(tab.content);
    if (!lang) return;
    try {
      const formatted = formatContent(tab.content, lang);
      setTabContent(activeTabId, formatted);
      editorBridge.applyContent?.(formatted);
    } catch {
      setFormatError(true);
      setTimeout(() => setFormatError(false), 2000);
    }
  };

  const normalizeHex = (value: string) => {
    const trimmed = value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
    return "";
  };

  const handleAddColorRule = () => {
    const trigger = triggerInput.trim();
    const color = normalizeHex(colorInput);

    if (!trigger) {
      setSettingsError("El trigger no puede estar vacio.");
      return;
    }

    if (!color) {
      setSettingsError("El color debe tener formato #RRGGBB.");
      return;
    }

    if (colorRules.some((rule) => rule.trigger === trigger)) {
      setSettingsError("Ya existe una regla con ese trigger exacto.");
      return;
    }

    addColorRule(trigger, color);
    setTriggerInput("");
    setSettingsError("");
  };

  return (
    <div className="flex flex-col h-full bg-surface-900 text-slate-200 dark">
      {/* ── Titlebar / toolbar ───────────────────────────────────── */}
      <header className="flex items-center gap-1 px-2 h-10 bg-surface-950 border-b border-surface-700 shrink-0 select-none">
        {/* App name */}
        <span className="text-sm font-bold text-blue-400 mr-2 tracking-tight">
          LinuxPad<span className="text-slate-400">++</span>
        </span>

        {/* Toolbar buttons */}
        <ToolbarBtn onClick={toggleSidebar} title="Toggle sidebar (Ctrl+B)">
          <PanelLeft size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={newTab} title="New tab (Ctrl+N)">
          <FilePlus size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={newDiagramTab} title="New diagram (Ctrl+D)">
          <GitGraph size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleOpenFile} title="Open file (Ctrl+O)">
          <FolderOpen size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleSave} title="Save (Ctrl+S)">
          <Save size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={toggleWordWrap}
          title={`Word wrap: ${wordWrapEnabled ? "ON" : "OFF"}`}
          active={wordWrapEnabled}
        >
          <WrapText size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={handleFormat}
          title="Formatear documento"
          error={formatError}
        >
          <Braces size={15} />
        </ToolbarBtn>
        <div className="flex-1" />

        <ToolbarBtn onClick={() => setFindReplaceOpen(true)} title="Find & replace (Ctrl+F)">
          <Search size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setCommandPaletteOpen(true)} title="Command palette (Ctrl+K)">
          <Command size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setInfoOpen(true)} title="Información">
          <Info size={15} />
        </ToolbarBtn>

        <div className="relative" ref={settingsMenuRef}>
          <ToolbarBtn
            onClick={() => setSettingsMenuOpen((prev) => !prev)}
            title="Settings"
            active={settingsMenuOpen}
          >
            <Settings size={15} />
          </ToolbarBtn>

          {settingsMenuOpen && (
            <div
              className="absolute right-0 top-9 w-80 rounded-md border border-surface-700 bg-surface-900 shadow-lg z-40"
              role="menu"
              aria-label="Settings menu"
            >
              <div className="px-3 py-2 border-b border-surface-700 text-sm font-medium text-slate-200">
                Configuracion
              </div>

              <div className="px-3 pt-3 pb-2 border-b border-surface-700">
                <div className="text-xs font-semibold text-slate-300 mb-2">Reglas de color</div>

                <label className="block text-[11px] text-slate-400 mb-1">Trigger literal</label>
                <input
                  type="text"
                  value={triggerInput}
                  onChange={(e) => {
                    setTriggerInput(e.target.value);
                    if (settingsError) setSettingsError("");
                  }}
                  placeholder="Ej: |, 3, if"
                  className="w-full h-8 px-2 rounded bg-surface-950 border border-surface-700 text-xs text-slate-200 outline-none focus:border-blue-500"
                />

                <div className="mt-2 flex gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={normalizeHex(colorInput) || "#22c55e"}
                      onChange={(e) => {
                        setColorInput(e.target.value);
                        if (settingsError) setSettingsError("");
                      }}
                      className="h-8 w-9 rounded border border-surface-700 bg-surface-950 p-0"
                      title="Seleccionar color"
                    />
                  </div>
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => {
                      setColorInput(e.target.value);
                      if (settingsError) setSettingsError("");
                    }}
                    placeholder="#22c55e"
                    className="flex-1 h-8 px-2 rounded bg-surface-950 border border-surface-700 text-xs text-slate-200 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddColorRule}
                    className="h-8 px-3 rounded bg-blue-600 hover:bg-blue-500 text-[11px] font-semibold text-white"
                  >
                    Agregar
                  </button>
                </div>

                {settingsError && (
                  <p className="mt-2 text-[11px] text-red-400">{settingsError}</p>
                )}
              </div>

              <div className="max-h-52 overflow-y-auto p-2">
                {colorRules.length === 0 && (
                  <p className="text-[11px] text-slate-500 px-1 py-2">
                    No hay reglas aun.
                  </p>
                )}

                {colorRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-2 px-1 py-1 rounded hover:bg-surface-800"
                  >
                    <button
                      onClick={() => toggleColorRule(rule.id)}
                      className={`h-5 px-2 rounded text-[10px] font-semibold ${
                        rule.enabled
                          ? "bg-emerald-700/60 text-emerald-100"
                          : "bg-surface-700 text-slate-300"
                      }`}
                      title={rule.enabled ? "Desactivar regla" : "Activar regla"}
                    >
                      {rule.enabled ? "ON" : "OFF"}
                    </button>

                    <span
                      className="inline-block w-3 h-3 rounded border border-surface-600"
                      style={{ backgroundColor: rule.color }}
                      title={rule.color}
                    />

                    <span className="flex-1 text-xs text-slate-200 truncate" title={rule.trigger}>
                      {rule.trigger}
                    </span>

                    <button
                      onClick={() => removeColorRule(rule.id)}
                      className="h-6 px-2 rounded text-[10px] font-semibold text-red-300 hover:text-red-200 hover:bg-red-500/15"
                      title="Eliminar regla"
                    >
                      Del
                    </button>
                  </div>
                ))}
              </div>

              <div className="px-3 pt-3 pb-2 border-t border-surface-700">
                <div className="text-xs font-semibold text-slate-300 mb-2">Diagramas</div>
                {([
                  ['showMiniMap',         'Minimapa'],
                  ['showControls',        'Controles de zoom'],
                  ['showBackground',      'Fondo (puntos)'],
                  ['showToolbar',         'Barra de nodos'],
                  ['showPropertiesPanel', 'Panel de propiedades'],
                  ['showTopPanel',        'Barra superior'],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-300">{label}</span>
                    <button
                      onClick={() => setDiagramSetting(key, !diagramSettings[key])}
                      className={`h-5 px-2 rounded text-[10px] font-semibold ${
                        diagramSettings[key]
                          ? "bg-emerald-700/60 text-emerald-100"
                          : "bg-surface-700 text-slate-300"
                      }`}
                    >
                      {diagramSettings[key] ? "ON" : "OFF"}
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-slate-300">Área de conexión</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="range" min={8} max={60} step={1}
                      value={diagramSettings.handleHitArea}
                      onChange={e => setDiagramSetting('handleHitArea', +e.target.value)}
                      className="w-16 accent-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 w-5 text-right">{diagramSettings.handleHitArea}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        {sidebarOpen && <Sidebar />}

        {/* Editor pane */}
        <div className="flex flex-col flex-1 min-w-0">
          <TabBar />

          {/* Find/Replace panel */}
          {findReplaceOpen && (
            <FindReplace onClose={() => setFindReplaceOpen(false)} />
          )}

          {/* Editor area — Monaco for code tabs, DiagramEditor for diagram tabs */}
          {(() => {
            const activeTab = tabs.find((t) => t.id === activeTabId);
            if (activeTab?.type === "diagram") {
              return <DiagramEditor key={activeTab.id} tabId={activeTab.id} content={activeTab.content} />;
            }
            return <Editor />;
          })()}
        </div>
      </div>

      {/* ── Status bar ───────────────────────────────────────────── */}
      <StatusBar />

      {/* ── Overlays ─────────────────────────────────────────────── */}
      {commandPaletteOpen && (
        <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
      )}
      {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}
    </div>
  );
}

function ToolbarBtn({
  onClick,
  title,
  active,
  error,
  children,
}: {
  onClick: () => void;
  title?: string;
  active?: boolean;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
        error
          ? "text-red-400 bg-red-500/20"
          : active
          ? "text-blue-300 bg-surface-700"
          : "text-slate-400 hover:text-slate-100 hover:bg-surface-700"
      }`}
    >
      {children}
    </button>
  );
}
