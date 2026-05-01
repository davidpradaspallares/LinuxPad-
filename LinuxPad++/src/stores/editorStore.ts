import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { invoke } from "@tauri-apps/api/core";
import type { Tab, CursorPosition } from "../types";

const LANGUAGE_MAP: Record<string, string> = {
  ts: "typescript", tsx: "typescript",
  js: "javascript", jsx: "javascript",
  mjs: "javascript", cjs: "javascript",
  rs: "rust",
  py: "python",
  go: "go",
  java: "java",
  c: "c", h: "c",
  cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp",
  cs: "csharp",
  rb: "ruby",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  sh: "shell", bash: "shell", zsh: "shell",
  html: "html", htm: "html",
  css: "css",
  scss: "scss", sass: "scss",
  less: "less",
  json: "json",
  yaml: "yaml", yml: "yaml",
  toml: "toml",
  xml: "xml",
  md: "markdown",
  sql: "sql",
  dockerfile: "dockerfile",
  lua: "lua",
  r: "r",
  tex: "latex",
};

function detectLanguage(path: string | null): string {
  if (!path) return "plaintext";
  const filename = path.split("/").pop()?.toLowerCase() ?? "";
  if (filename === "dockerfile") return "dockerfile";
  if (filename === "makefile") return "makefile";
  const ext = filename.split(".").pop() ?? "";
  return LANGUAGE_MAP[ext] ?? "plaintext";
}

function makeTab(partial: Partial<Tab> = {}): Tab {
  return {
    id: crypto.randomUUID(),
    title: "Untitled",
    path: null,
    content: "",
    isDirty: false,
    language: "plaintext",
    cursorPosition: { line: 1, column: 1 },
    encoding: "UTF-8",
    scrollTop: 0,
    ...partial,
  };
}

interface EditorStore {
  tabs: Tab[];
  activeTabId: string | null;
  sidebarOpen: boolean;
  sidebarPath: string;
  commandPaletteOpen: boolean;
  findReplaceOpen: boolean;

  // Tab management
  newTab: () => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  updateTabCursor: (id: string, pos: CursorPosition) => void;
  updateTabScroll: (id: string, scrollTop: number) => void;

  // File I/O
  openFile: (path: string) => Promise<void>;
  saveTab: (id: string, path?: string) => Promise<void>;
  reloadTabFromDisk: (path: string) => Promise<void>;

  // UI state
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarPath: (path: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setFindReplaceOpen: (open: boolean) => void;

  // Session restore
  restoreSession: () => Promise<void>;
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      sidebarOpen: true,
      sidebarPath: "~",
      commandPaletteOpen: false,
      findReplaceOpen: false,

      newTab: () => {
        const tab = makeTab();
        set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
      },

      closeTab: (id) => {
        const { tabs, activeTabId } = get();
        const idx = tabs.findIndex((t) => t.id === id);
        const remaining = tabs.filter((t) => t.id !== id);

        let nextActive = activeTabId;
        if (activeTabId === id) {
          nextActive =
            remaining[idx]?.id ?? remaining[idx - 1]?.id ?? null;
        }

        if (remaining.length === 0) {
          const blank = makeTab();
          set({ tabs: [blank], activeTabId: blank.id });
        } else {
          set({ tabs: remaining, activeTabId: nextActive });
        }
      },

      setActiveTab: (id) => set({ activeTabId: id }),

      updateTabContent: (id, content) =>
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === id ? { ...t, content, isDirty: true } : t
          ),
        })),

      updateTabCursor: (id, pos) =>
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === id ? { ...t, cursorPosition: pos } : t
          ),
        })),

      updateTabScroll: (id, scrollTop) =>
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === id ? { ...t, scrollTop } : t
          ),
        })),

      openFile: async (path) => {
        const { tabs } = get();

        // If already open, switch to it
        const existing = tabs.find((t) => t.path === path);
        if (existing) {
          set({ activeTabId: existing.id });
          return;
        }

        const content = await invoke<string>("read_file", { path });
        const filename = path.split("/").pop() ?? path;
        const language = detectLanguage(path);

        // Replace a blank untitled tab if it's the only one and unmodified
        const { tabs: currentTabs, activeTabId } = get();
        const active = currentTabs.find((t) => t.id === activeTabId);
        if (
          currentTabs.length === 1 &&
          active &&
          active.path === null &&
          !active.isDirty &&
          active.content === ""
        ) {
          set({
            tabs: [{ ...active, title: filename, path, content, language, isDirty: false }],
          });
          return;
        }

        const tab = makeTab({ title: filename, path, content, language });
        set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
      },

      saveTab: async (id, savePath) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.id === id);
        if (!tab) return;

        const targetPath = savePath ?? tab.path;
        if (!targetPath) return;

        await invoke("write_file", { path: targetPath, content: tab.content });

        const filename = targetPath.split("/").pop() ?? targetPath;
        const language = detectLanguage(targetPath);
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === id
              ? { ...t, path: targetPath, title: filename, isDirty: false, language }
              : t
          ),
        }));
      },

      reloadTabFromDisk: async (path) => {
        const content = await invoke<string>("read_file", { path });
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.path === path ? { ...t, content, isDirty: false } : t
          ),
        }));
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarPath: (path) => set({ sidebarPath: path }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setFindReplaceOpen: (open) => set({ findReplaceOpen: open }),

      restoreSession: async () => {
        const { tabs } = get();
        if (tabs.length === 0) {
          get().newTab();
          return;
        }

        // Re-read files that have a path (refresh from disk)
        const updated = await Promise.all(
          tabs.map(async (tab) => {
            if (!tab.path) return tab;
            try {
              const exists = await invoke<boolean>("path_exists", { path: tab.path });
              if (!exists) return { ...tab, path: null, title: tab.title, isDirty: true };
              const content = await invoke<string>("read_file", { path: tab.path });
              return { ...tab, content, isDirty: false };
            } catch {
              return tab;
            }
          })
        );
        set({ tabs: updated });
      },
    }),
    {
      name: "linuxpad-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        tabs: s.tabs,
        activeTabId: s.activeTabId,
        sidebarOpen: s.sidebarOpen,
        sidebarPath: s.sidebarPath,
      }),
    }
  )
);
