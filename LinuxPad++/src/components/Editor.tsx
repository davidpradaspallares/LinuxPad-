import { useRef, useCallback, useEffect } from "react";
import MonacoEditor, { type OnMount, type OnChange } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { useEditorStore } from "../stores/editorStore";

const LINUXPAD_THEME: monaco.editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "64748b", fontStyle: "italic" },
    { token: "keyword", foreground: "93c5fd" },
    { token: "string", foreground: "86efac" },
    { token: "number", foreground: "fbbf24" },
    { token: "type", foreground: "67e8f9" },
    { token: "function", foreground: "c4b5fd" },
  ],
  colors: {
    "editor.background": "#0f172a",
    "editor.foreground": "#e2e8f0",
    "editor.lineHighlightBackground": "#1e293b",
    "editorLineNumber.foreground": "#334155",
    "editorLineNumber.activeForeground": "#94a3b8",
    "editor.selectionBackground": "#2563eb55",
    "editor.inactiveSelectionBackground": "#1e40af33",
    "editorCursor.foreground": "#93c5fd",
    "editorWhitespace.foreground": "#1e293b",
    "editorIndentGuide.background1": "#1e293b",
    "editorIndentGuide.activeBackground1": "#334155",
    "scrollbarSlider.background": "#33415580",
    "scrollbarSlider.hoverBackground": "#47556980",
    "scrollbarSlider.activeBackground": "#47556999",
    "editorGutter.background": "#0f172a",
    "minimap.background": "#0f172a",
    "editorWidget.background": "#1e293b",
    "input.background": "#0f172a",
    "input.border": "#334155",
    "focusBorder": "#3b82f6",
    "list.hoverBackground": "#1e293b",
    "list.activeSelectionBackground": "#1d4ed8",
  },
};

export default function Editor() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const updateTabContent = useEditorStore((s) => s.updateTabContent);
  const updateTabCursor = useEditorStore((s) => s.updateTabCursor);
  const updateTabScroll = useEditorStore((s) => s.updateTabScroll);

  const tab = tabs.find((t) => t.id === activeTabId);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const prevTabIdRef = useRef<string | null>(null);

  // Save scroll position when switching tabs
  useEffect(() => {
    const prev = prevTabIdRef.current;
    if (prev && prev !== activeTabId && editorRef.current) {
      const scrollTop = editorRef.current.getScrollTop();
      updateTabScroll(prev, scrollTop);
    }
    prevTabIdRef.current = activeTabId;

    // Restore scroll for new active tab
    if (editorRef.current && tab) {
      editorRef.current.setScrollTop(tab.scrollTop);
      editorRef.current.setPosition({
        lineNumber: tab.cursorPosition.line,
        column: tab.cursorPosition.column,
      });
      editorRef.current.focus();
    }
  }, [activeTabId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMount: OnMount = useCallback(
    (editor, monacoInstance) => {
      editorRef.current = editor;

      monacoInstance.editor.defineTheme("linuxpad-dark", LINUXPAD_THEME);
      monacoInstance.editor.setTheme("linuxpad-dark");

      editor.onDidChangeCursorPosition((e) => {
        if (activeTabId) {
          updateTabCursor(activeTabId, {
            line: e.position.lineNumber,
            column: e.position.column,
          });
        }
      });

      if (tab) {
        editor.setScrollTop(tab.scrollTop);
        editor.setPosition({
          lineNumber: tab.cursorPosition.line,
          column: tab.cursorPosition.column,
        });
      }
      editor.focus();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTabId]
  );

  const handleChange: OnChange = useCallback(
    (value) => {
      if (activeTabId && value !== undefined) {
        updateTabContent(activeTabId, value);
      }
    },
    [activeTabId, updateTabContent]
  );

  if (!tab) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-900 text-slate-600 select-none">
        <p className="text-sm">No file open — Ctrl+N for new tab, Ctrl+O to open</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <MonacoEditor
        height="100%"
        language={tab.language}
        value={tab.content}
        theme="linuxpad-dark"
        onMount={handleMount}
        onChange={handleChange}
        path={tab.path ?? `untitled-${tab.id}`}
        options={{
          minimap: { enabled: true, scale: 1 },
          fontSize: 14,
          fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
          fontLigatures: true,
          lineNumbers: "on",
          wordWrap: "off",
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderWhitespace: "selection",
          tabSize: 2,
          insertSpaces: true,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          suggest: { showSnippets: true },
          renderLineHighlight: "all",
          padding: { top: 8, bottom: 8 },
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
            useShadows: false,
          },
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
        }}
      />
    </div>
  );
}
