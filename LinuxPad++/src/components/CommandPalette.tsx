import { useState, useEffect, useRef, useMemo } from "react";
import { Search, FileText, Folder, Command } from "lucide-react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useEditorStore } from "../stores/editorStore";
import type { CommandItem } from "../types";

interface CommandPaletteProps {
  onClose: () => void;
}

export default function CommandPalette({ onClose }: CommandPaletteProps) {
  const store = useEditorStore();
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allCommands = useMemo<CommandItem[]>(() => [
    {
      id: "new-tab",
      label: "New Tab",
      description: "Open a blank editor tab",
      shortcut: "Ctrl+N",
      action: () => store.newTab(),
    },
    {
      id: "open-file",
      label: "Open File…",
      description: "Browse and open a file",
      shortcut: "Ctrl+O",
      action: async () => {
        const path = await open({ multiple: false });
        if (path && typeof path === "string") store.openFile(path);
      },
    },
    {
      id: "save",
      label: "Save",
      shortcut: "Ctrl+S",
      action: async () => {
        const { activeTabId, tabs } = store;
        if (!activeTabId) return;
        const tab = tabs.find((t) => t.id === activeTabId);
        if (!tab) return;
        if (tab.path) {
          await store.saveTab(activeTabId);
        } else {
          const path = await save({ defaultPath: "untitled.txt" });
          if (path) await store.saveTab(activeTabId, path);
        }
      },
    },
    {
      id: "save-as",
      label: "Save As…",
      shortcut: "Ctrl+Shift+S",
      action: async () => {
        const { activeTabId } = store;
        if (!activeTabId) return;
        const path = await save({ filters: [{ name: "All Files", extensions: ["*"] }] });
        if (path) await store.saveTab(activeTabId, path);
      },
    },
    {
      id: "close-tab",
      label: "Close Tab",
      shortcut: "Ctrl+W",
      action: () => {
        if (store.activeTabId) store.closeTab(store.activeTabId);
      },
    },
    {
      id: "toggle-sidebar",
      label: "Toggle Sidebar",
      shortcut: "Ctrl+B",
      action: () => store.toggleSidebar(),
    },
    {
      id: "find-replace",
      label: "Find & Replace",
      shortcut: "Ctrl+F",
      action: () => store.setFindReplaceOpen(true),
    },
    ...store.tabs
      .filter((t) => t.path !== null)
      .map((t) => ({
        id: `goto-${t.id}`,
        label: t.title,
        description: t.path ?? undefined,
        action: () => store.setActiveTab(t.id),
      })),
  ], [store]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (!query) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [query, allCommands]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const run = (cmd: CommandItem) => {
    onClose();
    cmd.action();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIdx]) run(filtered[selectedIdx]);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const item = listRef.current?.children[selectedIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-800 rounded-xl shadow-2xl border border-surface-600 overflow-hidden animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-700">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands or open files…"
            className="flex-1 bg-transparent text-slate-200 outline-none placeholder-slate-500 text-sm"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-surface-700 rounded text-xs text-slate-400 shrink-0">
            <Command size={10} /> K
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">No results</div>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={cmd.id}
                onClick={() => run(cmd)}
                className={[
                  "w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors",
                  idx === selectedIdx
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-surface-700",
                ].join(" ")}
              >
                {cmd.description ? (
                  <FileText size={14} className="shrink-0 opacity-60" />
                ) : (
                  <Folder size={14} className="shrink-0 opacity-60" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium">{cmd.label}</div>
                  {cmd.description && (
                    <div
                      className={`text-xs truncate ${idx === selectedIdx ? "text-blue-200" : "text-slate-500"}`}
                    >
                      {cmd.description}
                    </div>
                  )}
                </div>

                {cmd.shortcut && (
                  <kbd
                    className={`text-xs shrink-0 ${idx === selectedIdx ? "text-blue-200" : "text-slate-500"}`}
                  >
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
