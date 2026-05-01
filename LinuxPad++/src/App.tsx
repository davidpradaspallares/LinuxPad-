import React, { useEffect } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  PanelLeft,
  FilePlus,
  FolderOpen,
  Save,
  Search,
  Command,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import TabBar from "./components/TabBar";
import Editor from "./components/Editor";
import StatusBar from "./components/StatusBar";
import FindReplace from "./components/FindReplace";
import CommandPalette from "./components/CommandPalette";

import { useEditorStore } from "./stores/editorStore";
import { useFileWatcher } from "./hooks/useFileWatcher";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

export default function App() {
  const sidebarOpen = useEditorStore((s) => s.sidebarOpen);
  const toggleSidebar = useEditorStore((s) => s.toggleSidebar);
  const commandPaletteOpen = useEditorStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useEditorStore((s) => s.setCommandPaletteOpen);
  const findReplaceOpen = useEditorStore((s) => s.findReplaceOpen);
  const setFindReplaceOpen = useEditorStore((s) => s.setFindReplaceOpen);

  const newTab = useEditorStore((s) => s.newTab);
  const openFile = useEditorStore((s) => s.openFile);
  const saveTab = useEditorStore((s) => s.saveTab);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const tabs = useEditorStore((s) => s.tabs);
  const restoreSession = useEditorStore((s) => s.restoreSession);

  // Activate hooks
  useFileWatcher();
  useKeyboardShortcuts();

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        <ToolbarBtn onClick={handleOpenFile} title="Open file (Ctrl+O)">
          <FolderOpen size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleSave} title="Save (Ctrl+S)">
          <Save size={15} />
        </ToolbarBtn>

        <div className="flex-1" />

        <ToolbarBtn onClick={() => setFindReplaceOpen(true)} title="Find & replace (Ctrl+F)">
          <Search size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setCommandPaletteOpen(true)} title="Command palette (Ctrl+K)">
          <Command size={15} />
        </ToolbarBtn>
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

          {/* Monaco editor */}
          <Editor />
        </div>
      </div>

      {/* ── Status bar ───────────────────────────────────────────── */}
      <StatusBar />

      {/* ── Overlays ─────────────────────────────────────────────── */}
      {commandPaletteOpen && (
        <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
      )}
    </div>
  );
}

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:text-slate-100 hover:bg-surface-700 transition-colors"
    >
      {children}
    </button>
  );
}
