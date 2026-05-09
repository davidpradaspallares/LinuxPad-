import { useEffect, useRef, useState } from "react";
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
  MessageSquare,
} from "lucide-react";

import { open } from "@tauri-apps/plugin-dialog";
import { formatContent, FORMATTABLE_LANGUAGES, sniffLanguage } from "./utils/formatter";
import { editorBridge } from "./utils/editorBridge";
import { openFileWithDialog, saveActiveTab } from "./services/fileService";
import { DEFAULT_COLOR, ERROR_DISPLAY_MS } from "./constants";

import Sidebar from "./components/Sidebar";
import TabBar from "./components/TabBar";
import Editor from "./components/Editor";
import DiagramEditor from "./CreadorDiagramas/DiagramEditor";
import StatusBar from "./components/StatusBar";
import FindReplace from "./components/FindReplace";
import CommandPalette from "./components/CommandPalette";
import InfoModal from "./components/InfoModal";
import ToolbarBtn from "./components/ToolbarBtn";
import ErrorBoundary from "./components/ErrorBoundary";
import ChatPanel from "./components/ChatPanel";

import { useEditorStore } from "./stores/editorStore";
import { useTranslation } from "./i18n";
import { useFileWatcher } from "./hooks/useFileWatcher";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

export default function App() {
  const t = useTranslation();
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [formatError, setFormatError] = useState(false);
  const [triggerInput, setTriggerInput] = useState("");
  const [colorInput, setColorInput] = useState(DEFAULT_COLOR);
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
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const tabs = useEditorStore((s) => s.tabs);
  const restoreSession = useEditorStore((s) => s.restoreSession);
  const colorRules = useEditorStore((s) => s.colorRules);
  const addColorRule = useEditorStore((s) => s.addColorRule);
  const removeColorRule = useEditorStore((s) => s.removeColorRule);
  const toggleColorRule = useEditorStore((s) => s.toggleColorRule);
  const diagramSettings = useEditorStore((s) => s.diagramSettings);
  const setDiagramSetting = useEditorStore((s) => s.setDiagramSetting);
  const sidebarHomePath = useEditorStore((s) => s.sidebarHomePath);
  const setSidebarHomePath = useEditorStore((s) => s.setSidebarHomePath);
  const setSidebarPath = useEditorStore((s) => s.setSidebarPath);
  const language = useEditorStore((s) => s.language);
  const setLanguage = useEditorStore((s) => s.setLanguage);
  const chatPanelOpen = useEditorStore((s) => s.chatPanelOpen);
  const toggleChatPanel = useEditorStore((s) => s.toggleChatPanel);
  const aiConfig = useEditorStore((s) => s.aiConfig);
  const setAiConfig = useEditorStore((s) => s.setAiConfig);

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
      setTimeout(() => setFormatError(false), ERROR_DISPLAY_MS);
    }
  };

  const handlePickHomeFolder = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (selected && typeof selected === "string") {
      setSidebarHomePath(selected);
      setSidebarPath(selected);
    }
  };

  const normalizeHex = (value: string): string => {
    const trimmed = value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
    return "";
  };

  const handleAddColorRule = () => {
    const trigger = triggerInput.trim();
    const color = normalizeHex(colorInput);

    if (!trigger) {
      setSettingsError(t.settings.errorTriggerEmpty);
      return;
    }

    if (!color) {
      setSettingsError(t.settings.errorColorFormat);
      return;
    }

    if (colorRules.some((rule) => rule.trigger === trigger)) {
      setSettingsError(t.settings.errorTriggerDuplicate);
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
        <ToolbarBtn onClick={toggleSidebar} title={t.toolbar.toggleSidebar}>
          <PanelLeft size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={newTab} title={t.toolbar.newTab}>
          <FilePlus size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={newDiagramTab} title={t.toolbar.newDiagram}>
          <GitGraph size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={openFileWithDialog} title={t.toolbar.openFile}>
          <FolderOpen size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={saveActiveTab} title={t.toolbar.save}>
          <Save size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={toggleWordWrap}
          title={t.toolbar.wordWrap(wordWrapEnabled)}
          active={wordWrapEnabled}
        >
          <WrapText size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={handleFormat}
          title={t.toolbar.formatDocument}
          error={formatError}
        >
          <Braces size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={toggleChatPanel} title={t.toolbar.toggleChat} active={chatPanelOpen}>
          <MessageSquare size={15} />
        </ToolbarBtn>
        <div className="flex-1" />

        <ToolbarBtn onClick={() => setFindReplaceOpen(true)} title={t.toolbar.findReplace}>
          <Search size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setCommandPaletteOpen(true)} title={t.toolbar.commandPalette}>
          <Command size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setInfoOpen(true)} title={t.toolbar.info}>
          <Info size={15} />
        </ToolbarBtn>

        <div className="relative" ref={settingsMenuRef}>
          <ToolbarBtn
            onClick={() => setSettingsMenuOpen((prev) => !prev)}
            active={settingsMenuOpen}
            title={t.toolbar.settings}
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
                {t.settings.title}
              </div>

              <div className="px-3 pt-3 pb-2 border-b border-surface-700">
                <div className="text-xs font-semibold text-slate-300 mb-2">{t.settings.colorRules}</div>

                <label className="block text-[11px] text-slate-400 mb-1">{t.settings.triggerLabel}</label>
                <input
                  type="text"
                  value={triggerInput}
                  onChange={(e) => {
                    setTriggerInput(e.target.value);
                    if (settingsError) setSettingsError("");
                  }}
                  placeholder={t.settings.triggerPlaceholder}
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
                      title={t.settings.selectColor}
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
                    {t.settings.add}
                  </button>
                </div>

                {settingsError && (
                  <p className="mt-2 text-[11px] text-red-400">{settingsError}</p>
                )}
              </div>

              <div className="max-h-52 overflow-y-auto p-2">
                {colorRules.length === 0 && (
                  <p className="text-[11px] text-slate-500 px-1 py-2">
                    {t.settings.noRules}
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
                      title={rule.enabled ? t.settings.disableRule : t.settings.enableRule}
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
                      title={t.settings.deleteRule}
                    >
                      Del
                    </button>
                  </div>
                ))}
              </div>

              <div className="px-3 pt-3 pb-2 border-t border-surface-700">
                <div className="text-xs font-semibold text-slate-300 mb-2">{t.settings.homeFolder}</div>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-[11px] text-slate-400 truncate" title={sidebarHomePath}>
                    {sidebarHomePath === "~"
                      ? t.settings.systemHome
                      : sidebarHomePath.replace(/^\/home\/[^/]+/, "~")}
                  </span>
                  <button
                    onClick={handlePickHomeFolder}
                    className="h-7 px-2 rounded bg-surface-700 hover:bg-surface-600 text-[11px] text-slate-200 shrink-0"
                  >
                    {t.settings.change}
                  </button>
                  {sidebarHomePath !== "~" && (
                    <button
                      onClick={() => setSidebarHomePath("~")}
                      className="h-7 px-2 rounded bg-surface-700 hover:bg-surface-600 text-[11px] text-slate-400 shrink-0"
                      title={t.settings.resetHome}
                    >
                      {t.settings.reset}
                    </button>
                  )}
                </div>
              </div>

              <div className="px-3 pt-3 pb-2 border-t border-surface-700">
                <div className="text-xs font-semibold text-slate-300 mb-2">{t.settings.language}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLanguage("es")}
                    className={`h-7 px-3 rounded text-[11px] font-semibold ${language === "es" ? "bg-blue-600 text-white" : "bg-surface-700 hover:bg-surface-600 text-slate-300"}`}
                  >
                    Español
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`h-7 px-3 rounded text-[11px] font-semibold ${language === "en" ? "bg-blue-600 text-white" : "bg-surface-700 hover:bg-surface-600 text-slate-300"}`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="px-3 pt-3 pb-2 border-t border-surface-700">
                <div className="text-xs font-semibold text-slate-300 mb-2">{t.settings.diagrams}</div>
                {([
                  ['showMiniMap',         t.settings.minimap],
                  ['showControls',        t.settings.zoomControls],
                  ['showBackground',      t.settings.background],
                  ['showToolbar',         t.settings.nodeToolbar],
                  ['showPropertiesPanel', t.settings.propertiesPanel],
                  ['showTopPanel',        t.settings.topBar],
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
                  <span className="text-xs text-slate-300">{t.settings.connectionArea}</span>
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

              <div className="px-3 pt-3 pb-3 border-t border-surface-700">
                <div className="text-xs font-semibold text-slate-300 mb-2">{t.ai.title}</div>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setAiConfig({ provider: 'openai' })}
                    className={`h-7 px-3 rounded text-[11px] font-semibold ${aiConfig.provider === 'openai' ? 'bg-blue-600 text-white' : 'bg-surface-700 hover:bg-surface-600 text-slate-300'}`}
                  >
                    OpenAI
                  </button>
                  <button
                    onClick={() => setAiConfig({ provider: 'anthropic' })}
                    className={`h-7 px-3 rounded text-[11px] font-semibold ${aiConfig.provider === 'anthropic' ? 'bg-blue-600 text-white' : 'bg-surface-700 hover:bg-surface-600 text-slate-300'}`}
                  >
                    Anthropic
                  </button>
                  <button
                    onClick={() => setAiConfig({ provider: 'deepseek' })}
                    className={`h-7 px-3 rounded text-[11px] font-semibold ${aiConfig.provider === 'deepseek' ? 'bg-blue-600 text-white' : 'bg-surface-700 hover:bg-surface-600 text-slate-300'}`}
                  >
                    DeepSeek
                  </button>
                </div>
                {aiConfig.provider === 'openai' ? (
                  <>
                    <label className="block text-[11px] text-slate-400 mb-1">{t.ai.openaiKey}</label>
                    <input
                      type="password"
                      value={aiConfig.openaiApiKey}
                      onChange={(e) => setAiConfig({ openaiApiKey: e.target.value })}
                      placeholder={t.ai.keyPlaceholder}
                      className="w-full h-8 px-2 rounded bg-surface-950 border border-surface-700 text-xs text-slate-200 outline-none focus:border-blue-500 mb-2"
                    />
                    <label className="block text-[11px] text-slate-400 mb-1">{t.ai.openaiModel}</label>
                    <input
                      type="text"
                      value={aiConfig.openaiModel}
                      onChange={(e) => setAiConfig({ openaiModel: e.target.value })}
                      className="w-full h-8 px-2 rounded bg-surface-950 border border-surface-700 text-xs text-slate-200 outline-none focus:border-blue-500"
                    />
                  </>
                ) : aiConfig.provider === 'anthropic' ? (
                  <>
                    <label className="block text-[11px] text-slate-400 mb-1">{t.ai.anthropicKey}</label>
                    <input
                      type="password"
                      value={aiConfig.anthropicApiKey}
                      onChange={(e) => setAiConfig({ anthropicApiKey: e.target.value })}
                      placeholder={t.ai.keyPlaceholder}
                      className="w-full h-8 px-2 rounded bg-surface-950 border border-surface-700 text-xs text-slate-200 outline-none focus:border-blue-500 mb-2"
                    />
                    <label className="block text-[11px] text-slate-400 mb-1">{t.ai.anthropicModel}</label>
                    <input
                      type="text"
                      value={aiConfig.anthropicModel}
                      onChange={(e) => setAiConfig({ anthropicModel: e.target.value })}
                      className="w-full h-8 px-2 rounded bg-surface-950 border border-surface-700 text-xs text-slate-200 outline-none focus:border-blue-500"
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-[11px] text-slate-400 mb-1">{t.ai.deepseekKey}</label>
                    <input
                      type="password"
                      value={aiConfig.deepseekApiKey}
                      onChange={(e) => setAiConfig({ deepseekApiKey: e.target.value })}
                      placeholder={t.ai.keyPlaceholder}
                      className="w-full h-8 px-2 rounded bg-surface-950 border border-surface-700 text-xs text-slate-200 outline-none focus:border-blue-500 mb-2"
                    />
                    <label className="block text-[11px] text-slate-400 mb-1">{t.ai.deepseekModel}</label>
                    <input
                      type="text"
                      value={aiConfig.deepseekModel}
                      onChange={(e) => setAiConfig({ deepseekModel: e.target.value })}
                      className="w-full h-8 px-2 rounded bg-surface-950 border border-surface-700 text-xs text-slate-200 outline-none focus:border-blue-500"
                    />
                  </>
                )}
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
          <ErrorBoundary>
            {(() => {
              const activeTab = tabs.find((t) => t.id === activeTabId);
              if (activeTab?.type === "diagram") {
                return <DiagramEditor key={activeTab.id} tabId={activeTab.id} content={activeTab.content} />;
              }
              return <Editor />;
            })()}
          </ErrorBoundary>
        </div>

        {/* Chat panel */}
        {chatPanelOpen && <ChatPanel />}
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

