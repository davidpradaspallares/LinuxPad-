import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import { invoke } from "@tauri-apps/api/core";
import type { Tab, CursorPosition, ColorRule } from "../types";
import type { Language } from "../i18n/translations";
import type { ChatConversation, AiConfig, ChatMessage, ContextItem } from '../types/chat';

function makeDebouncedStorage(delay: number): StateStorage {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.setItem(key, value);
        timer = null;
      }, delay);
    },
    removeItem: (key) => localStorage.removeItem(key),
  };
}

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
    type: "code",
    cursorPosition: { line: 1, column: 1 },
    encoding: "UTF-8",
    scrollTop: 0,
    ...partial,
  };
}

interface EditorStore {
  tabs: Tab[];
  activeTabId: string | null;
  tabsMetaVersion: number;
  activeCursorPosition: CursorPosition;
  wordWrapEnabled: boolean;
  editorFontSize: number;
  sidebarOpen: boolean;
  sidebarPath: string;
  sidebarHomePath: string;
  language: Language;
  commandPaletteOpen: boolean;
  findReplaceOpen: boolean;
  colorRules: ColorRule[];
  diagramSettings: {
    showMiniMap: boolean;
    showControls: boolean;
    showBackground: boolean;
    showToolbar: boolean;
    showPropertiesPanel: boolean;
    showTopPanel: boolean;
    handleHitArea: number;
  };

  // Tab management
  newTab: () => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  setTabContent: (id: string, content: string) => void;
  updateTabCursor: (id: string, pos: CursorPosition) => void;
  updateTabScroll: (id: string, scrollTop: number) => void;
  renameTabPath: (oldPath: string, newPath: string) => void;
  setTabTitle: (id: string, title: string) => void;

  // File I/O
  openFile: (path: string) => Promise<void>;
  saveTab: (id: string, path?: string) => Promise<void>;
  reloadTabFromDisk: (path: string) => Promise<void>;
  newDiagramTab: () => void;

  // UI state
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarPath: (path: string) => void;
  setSidebarHomePath: (path: string) => void;
  setLanguage: (lang: Language) => void;
  toggleWordWrap: () => void;
  adjustEditorFontSize: (delta: number) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setFindReplaceOpen: (open: boolean) => void;
  addColorRule: (trigger: string, color: string) => void;
  removeColorRule: (id: string) => void;
  toggleColorRule: (id: string) => void;
  setDiagramSetting: (key: keyof EditorStore['diagramSettings'], value: boolean | number) => void;

  // Chat / AI
  chatPanelOpen: boolean;
  chatPanelWidth: number;
  chatConversations: ChatConversation[];
  activeChatId: string | null;
  aiConfig: AiConfig;
  pendingChatInput: string | null;

  toggleChatPanel: () => void;
  setChatPanelOpen: (open: boolean) => void;
  setChatPanelWidth: (w: number) => void;
  newChatConversation: () => void;
  setActiveChatId: (id: string) => void;
  deleteChatConversation: (id: string) => void;
  addChatMessage: (convId: string, msg: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
  addContextItem: (convId: string, item: Omit<ContextItem, 'id'>) => void;
  removeContextItem: (convId: string, itemId: string) => void;
  updateChatConversationTitle: (convId: string, title: string) => void;
  setAiConfig: (patch: Partial<AiConfig>) => void;
  setPendingChatInput: (text: string | null) => void;

  // Session restore
  restoreSession: () => Promise<void>;
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      tabsMetaVersion: 0,
      activeCursorPosition: { line: 1, column: 1 },
      wordWrapEnabled: false,
      editorFontSize: 14,
      sidebarOpen: true,
      sidebarPath: "~",
      sidebarHomePath: "~",
      language: "es" as Language,
      commandPaletteOpen: false,
      findReplaceOpen: false,
      colorRules: [],
      chatPanelOpen: false,
      chatPanelWidth: 320,
      chatConversations: [],
      activeChatId: null,
      aiConfig: {
        provider: 'openai',
        openaiApiKey: '',
        openaiModel: 'gpt-4o',
        anthropicApiKey: '',
        anthropicModel: 'claude-sonnet-4-5',
        deepseekApiKey: '',
        deepseekModel: 'deepseek-chat',
      },
      pendingChatInput: null,
      diagramSettings: {
        showMiniMap: true,
        showControls: true,
        showBackground: true,
        showToolbar: true,
        showPropertiesPanel: true,
        showTopPanel: true,
        handleHitArea: 20,
      },

      newTab: () => {
        const tab = makeTab();
        set((s) => ({
          tabs: [...s.tabs, tab],
          activeTabId: tab.id,
          activeCursorPosition: tab.cursorPosition,
          tabsMetaVersion: s.tabsMetaVersion + 1,
        }));
      },

      newDiagramTab: () => {
        const tab = makeTab({ title: "Diagram", type: "diagram", language: "diagram", content: "{}" });
        set((s) => ({
          tabs: [...s.tabs, tab],
          activeTabId: tab.id,
          activeCursorPosition: tab.cursorPosition,
          tabsMetaVersion: s.tabsMetaVersion + 1,
        }));
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
          set((s) => ({
            tabs: [blank],
            activeTabId: blank.id,
            activeCursorPosition: blank.cursorPosition,
            tabsMetaVersion: s.tabsMetaVersion + 1,
          }));
        } else {
          const nextTab = remaining.find((t) => t.id === nextActive) ?? remaining[0];
          set((s) => ({
            tabs: remaining,
            activeTabId: nextActive,
            activeCursorPosition: nextTab?.cursorPosition ?? { line: 1, column: 1 },
            tabsMetaVersion: s.tabsMetaVersion + 1,
          }));
        }
      },

      setActiveTab: (id) =>
        set((s) => {
          const tab = s.tabs.find((candidate) => candidate.id === id);
          return {
            activeTabId: id,
            activeCursorPosition: tab?.cursorPosition ?? { line: 1, column: 1 },
          };
        }),

      updateTabContent: (id, content) => {
        const tab = get().tabs.find((t) => t.id === id);
        if (!tab || tab.content === content) return;

        const wasDirty = tab.isDirty;
        tab.content = content;
        tab.isDirty = true;

        if (!wasDirty) {
          set((s) => ({ tabsMetaVersion: s.tabsMetaVersion + 1 }));
        }
      },

      setTabContent: (id, content) =>
        set((s) => {
          const idx = s.tabs.findIndex((t) => t.id === id);
          if (idx === -1) return {};
          const tab = s.tabs[idx];
          if (tab.content === content) return {};
          const newTabs = [...s.tabs];
          newTabs[idx] = { ...tab, content, isDirty: true };
          return { tabs: newTabs, tabsMetaVersion: s.tabsMetaVersion + 1 };
        }),

      updateTabCursor: (id, pos) => {
        const s = get();
        const tab = s.tabs.find((t) => t.id === id);
        if (!tab) return;

        tab.cursorPosition = pos;

        if (s.activeTabId === id) {
          set(() => ({ activeCursorPosition: pos }));
        }
      },

      updateTabScroll: (id, scrollTop) =>
        set((s) => {
          const tab = s.tabs.find((candidate) => candidate.id === id);
          if (!tab || tab.scrollTop === scrollTop) return {};
          tab.scrollTop = scrollTop;
          return {};
        }),

      renameTabPath: (oldPath, newPath) =>
        set((s) => {
          const idx = s.tabs.findIndex((t) => t.path === oldPath);
          if (idx === -1) return {};
          const newTabs = [...s.tabs];
          newTabs[idx] = {
            ...newTabs[idx],
            path: newPath,
            title: newPath.split("/").pop() ?? newPath,
          };
          return { tabs: newTabs, tabsMetaVersion: s.tabsMetaVersion + 1 };
        }),

      setTabTitle: (id, title) =>
        set((s) => {
          const idx = s.tabs.findIndex((t) => t.id === id);
          if (idx === -1) return {};
          const newTabs = [...s.tabs];
          newTabs[idx] = { ...newTabs[idx], title };
          return { tabs: newTabs, tabsMetaVersion: s.tabsMetaVersion + 1 };
        }),

      openFile: async (path) => {
        const { tabs } = get();

        // If already open, switch to it
        const existing = tabs.find((t) => t.path === path);
        if (existing) {
          set({ activeTabId: existing.id, activeCursorPosition: existing.cursorPosition });
          return;
        }

        const content = await invoke<string>("read_file", { path });
        const filename = path.split("/").pop() ?? path;
        const isDiagram = path.endsWith(".diagram");
        const language = isDiagram ? "diagram" : detectLanguage(path);
        const tabType: Tab["type"] = isDiagram ? "diagram" : "code";

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
          const nextTab = { ...active, title: filename, path, content, language, type: tabType, isDirty: false };
          set((s) => ({
            tabs: [nextTab],
            activeCursorPosition: nextTab.cursorPosition,
            tabsMetaVersion: s.tabsMetaVersion + 1,
          }));
          return;
        }

        const tab = makeTab({ title: filename, path, content, language, type: tabType });
        set((s) => ({
          tabs: [...s.tabs, tab],
          activeTabId: tab.id,
          activeCursorPosition: tab.cursorPosition,
          tabsMetaVersion: s.tabsMetaVersion + 1,
        }));
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
        set((s) => {
          const targetTab = s.tabs.find((candidate) => candidate.id === id);
          if (!targetTab) return {};

          targetTab.path = targetPath;
          targetTab.title = filename;
          targetTab.isDirty = false;
          targetTab.language = language;

          return { tabsMetaVersion: s.tabsMetaVersion + 1 };
        });
      },

      reloadTabFromDisk: async (path) => {
        const content = await invoke<string>("read_file", { path });
        set((s) => {
          let shouldBumpMeta = false;

          for (const tab of s.tabs) {
            if (tab.path !== path) continue;
            shouldBumpMeta = shouldBumpMeta || tab.isDirty;
            tab.content = content;
            tab.isDirty = false;
          }

          return shouldBumpMeta ? { tabsMetaVersion: s.tabsMetaVersion + 1 } : {};
        });
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarPath: (path) => set({ sidebarPath: path }),
      setSidebarHomePath: (path) => set({ sidebarHomePath: path }),
      setLanguage: (lang) => set({ language: lang }),
      toggleWordWrap: () => set((s) => ({ wordWrapEnabled: !s.wordWrapEnabled })),
      adjustEditorFontSize: (delta) =>
        set((s) => ({
          editorFontSize: Math.max(10, Math.min(40, s.editorFontSize + delta)),
        })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setFindReplaceOpen: (open) => set({ findReplaceOpen: open }),
      addColorRule: (trigger, color) =>
        set((s) => ({
          colorRules: [
            ...s.colorRules,
            {
              id: crypto.randomUUID(),
              trigger,
              color,
              enabled: true,
              createdAt: Date.now(),
            },
          ],
        })),
      removeColorRule: (id) =>
        set((s) => ({
          colorRules: s.colorRules.filter((rule) => rule.id !== id),
        })),
      toggleColorRule: (id) =>
        set((s) => ({
          colorRules: s.colorRules.map((rule) =>
            rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
          ),
        })),
      setDiagramSetting: (key, value) =>
        set((s) => ({ diagramSettings: { ...s.diagramSettings, [key]: value } })),

      toggleChatPanel: () => set((s) => ({ chatPanelOpen: !s.chatPanelOpen })),
      setChatPanelOpen: (open) => set({ chatPanelOpen: open }),
      setChatPanelWidth: (w) => set({ chatPanelWidth: Math.max(240, Math.min(800, w)) }),

      newChatConversation: () => {
        const conv: ChatConversation = {
          id: crypto.randomUUID(),
          title: 'Conversación',
          createdAt: Date.now(),
          messages: [],
          contextItems: [],
        };
        set((s) => {
          const updated = [...s.chatConversations, conv].slice(-20);
          return { chatConversations: updated, activeChatId: conv.id, chatPanelOpen: true };
        });
      },

      setActiveChatId: (id) => set({ activeChatId: id }),

      deleteChatConversation: (id) =>
        set((s) => {
          const updated = s.chatConversations.filter((c) => c.id !== id);
          const nextActive = s.activeChatId === id
            ? (updated[updated.length - 1]?.id ?? null)
            : s.activeChatId;
          return { chatConversations: updated, activeChatId: nextActive };
        }),

      addChatMessage: (convId, msg) =>
        set((s) => {
          const idx = s.chatConversations.findIndex((c) => c.id === convId);
          if (idx === -1) return {};
          const conv = s.chatConversations[idx];
          const messages = conv.messages.length >= 100
            ? [...conv.messages.slice(1), { id: crypto.randomUUID(), createdAt: Date.now(), ...msg }]
            : [...conv.messages, { id: crypto.randomUUID(), createdAt: Date.now(), ...msg }];
          const updated = [...s.chatConversations];
          updated[idx] = { ...conv, messages };
          return { chatConversations: updated };
        }),

      addContextItem: (convId, item) =>
        set((s) => {
          const idx = s.chatConversations.findIndex((c) => c.id === convId);
          if (idx === -1) return {};
          const conv = s.chatConversations[idx];
          const newItem: ContextItem = { id: crypto.randomUUID(), ...item };
          const updated = [...s.chatConversations];
          updated[idx] = { ...conv, contextItems: [...conv.contextItems, newItem] };
          return { chatConversations: updated };
        }),

      removeContextItem: (convId, itemId) =>
        set((s) => {
          const idx = s.chatConversations.findIndex((c) => c.id === convId);
          if (idx === -1) return {};
          const conv = s.chatConversations[idx];
          const updated = [...s.chatConversations];
          updated[idx] = { ...conv, contextItems: conv.contextItems.filter((i) => i.id !== itemId) };
          return { chatConversations: updated };
        }),

      updateChatConversationTitle: (convId, title) =>
        set((s) => {
          const idx = s.chatConversations.findIndex((c) => c.id === convId);
          if (idx === -1) return {};
          const updated = [...s.chatConversations];
          updated[idx] = { ...updated[idx], title };
          return { chatConversations: updated };
        }),

      setAiConfig: (patch) =>
        set((s) => ({ aiConfig: { ...s.aiConfig, ...patch } })),

      setPendingChatInput: (text) =>
        set(text !== null ? { pendingChatInput: text, chatPanelOpen: true } : { pendingChatInput: null }),

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
        const activeTab = updated.find((tab) => tab.id === get().activeTabId) ?? updated[0];
        set((s) => ({
          tabs: updated,
          activeCursorPosition: activeTab?.cursorPosition ?? { line: 1, column: 1 },
          tabsMetaVersion: s.tabsMetaVersion + 1,
        }));
      },
    }),
    {
      name: "linuxpad-session",
      storage: createJSONStorage(() => makeDebouncedStorage(1000)),
      partialize: (s) => ({
        tabs: s.tabs.map((t) => ({
          ...t,
          content: t.path === null ? t.content : "",
          cursorPosition: { line: 1, column: 1 },
          scrollTop: 0,
        })),
        activeTabId: s.activeTabId,
        wordWrapEnabled: s.wordWrapEnabled,
        editorFontSize: s.editorFontSize,
        sidebarOpen: s.sidebarOpen,
        sidebarPath: s.sidebarPath,
        sidebarHomePath: s.sidebarHomePath,
        language: s.language,
        colorRules: s.colorRules,
        diagramSettings: s.diagramSettings,
        chatPanelOpen: s.chatPanelOpen,
        chatPanelWidth: s.chatPanelWidth,
        chatConversations: s.chatConversations,
        activeChatId: s.activeChatId,
        aiConfig: s.aiConfig,
      }),
    }
  )
);
