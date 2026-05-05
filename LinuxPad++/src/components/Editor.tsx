import { useRef, useCallback, useEffect } from "react";
import MonacoEditor, { type OnMount, type OnChange } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { useEditorStore } from "../stores/editorStore";
import type { ColorRule } from "../types";
import { editorBridge } from "../utils/editorBridge";

const END_MARKER = "fn|";
const COLOR_STYLE_ELEMENT_ID = "linuxpad-color-rules-style";
const MAX_COLOR_DECORATIONS = 600;

type ColorSegment = {
  start: number;
  end: number;
  ruleId: string;
};

function getRuleClassName(ruleId: string) {
  const safeId = ruleId.replace(/[^a-zA-Z0-9_-]/g, "-");
  return `lp-color-rule-${safeId}`;
}

function findNextTrigger(content: string, start: number, rules: ColorRule[]) {
  let best: { index: number; rule: ColorRule } | null = null;

  for (const rule of rules) {
    if (!rule.trigger) continue;
    const idx = content.indexOf(rule.trigger, start);
    if (idx === -1) continue;

    if (!best || idx < best.index) {
      best = { index: idx, rule };
      continue;
    }

    if (best && idx === best.index && rule.trigger.length > best.rule.trigger.length) {
      best = { index: idx, rule };
    }
  }

  return best;
}

function isDoubleTriggerAt(content: string, index: number, trigger: string) {
  if (!trigger) return false;
  const secondIndex = index + trigger.length;
  return content.startsWith(trigger, secondIndex);
}

function findLineEndExclusive(content: string, start: number) {
  const newlineIndex = content.indexOf("\n", start);
  return newlineIndex === -1 ? content.length : newlineIndex;
}

function findClosingTriggerInSameLine(
  content: string,
  lineStart: number,
  trigger: string,
  lineEndExclusive: number
) {
  if (!trigger) return -1;

  const closeIndex = content.indexOf(trigger, lineStart + trigger.length);
  if (closeIndex === -1 || closeIndex >= lineEndExclusive) {
    return -1;
  }

  return closeIndex;
}

function buildColorSegments(content: string, rules: ColorRule[]): ColorSegment[] {
  const segments: ColorSegment[] = [];
  const activeRules = rules.filter((rule) => rule.enabled && rule.trigger.length > 0);

  if (activeRules.length === 0 || content.length === 0) {
    return segments;
  }

  let cursor = 0;
  let activeRule: ColorRule | null = null;
  let segmentStart = -1;

  while (cursor < content.length) {
    if (!activeRule) {
      const next = findNextTrigger(content, cursor, activeRules);
      if (!next) break;

      const triggerLen = Math.max(next.rule.trigger.length, 1);
      const doubled = isDoubleTriggerAt(content, next.index, next.rule.trigger);

      if (doubled) {
        activeRule = next.rule;
        segmentStart = next.index;
        cursor = next.index + triggerLen * 2;
        continue;
      }

      const lineEndExclusive = findLineEndExclusive(content, next.index);
      const closeIndex = findClosingTriggerInSameLine(
        content,
        next.index,
        next.rule.trigger,
        lineEndExclusive
      );

      const segmentEnd = closeIndex !== -1 ? closeIndex + triggerLen : lineEndExclusive;

      if (next.index < segmentEnd) {
        segments.push({
          start: next.index,
          end: segmentEnd,
          ruleId: next.rule.id,
        });
      }

      if (closeIndex !== -1) {
        cursor = closeIndex + triggerLen;
      } else {
        cursor = Math.max(next.index + triggerLen, lineEndExclusive);
      }
      continue;
    }

    const nextTrigger = findNextTrigger(content, cursor, activeRules);
    const nextEndIndex = content.indexOf(END_MARKER, cursor);

    if (nextTrigger && (nextEndIndex === -1 || nextTrigger.index < nextEndIndex)) {
      if (segmentStart < nextTrigger.index) {
        segments.push({
          start: segmentStart,
          end: nextTrigger.index,
          ruleId: activeRule.id,
        });
      }

      activeRule = nextTrigger.rule;
      segmentStart = nextTrigger.index;
      cursor = nextTrigger.index + Math.max(nextTrigger.rule.trigger.length, 1);
      continue;
    }

    if (nextEndIndex !== -1) {
      const endExclusive = nextEndIndex + END_MARKER.length;
      if (segmentStart < endExclusive) {
        segments.push({
          start: segmentStart,
          end: endExclusive,
          ruleId: activeRule.id,
        });
      }
      activeRule = null;
      segmentStart = -1;
      cursor = endExclusive;
      continue;
    }

    if (segmentStart < content.length) {
      segments.push({
        start: segmentStart,
        end: content.length,
        ruleId: activeRule.id,
      });
    }
    break;
  }

  return segments;
}

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
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const tab = useEditorStore((s) => s.tabs.find((candidate) => candidate.id === s.activeTabId) ?? null);
  const wordWrapEnabled = useEditorStore((s) => s.wordWrapEnabled);
  const editorFontSize = useEditorStore((s) => s.editorFontSize);
  const adjustEditorFontSize = useEditorStore((s) => s.adjustEditorFontSize);
  const updateTabContent = useEditorStore((s) => s.updateTabContent);
  const updateTabCursor = useEditorStore((s) => s.updateTabCursor);
  const updateTabScroll = useEditorStore((s) => s.updateTabScroll);
  const colorRules = useEditorStore((s) => s.colorRules);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const prevTabIdRef = useRef<string | null>(null);
  const activeTabIdRef = useRef<string | null>(activeTabId);
  const decorationsRef = useRef<string[]>([]);
  const contentListenerRef = useRef<monaco.IDisposable | null>(null);
  const rafRef = useRef<number | null>(null);
  const colorRulesRef = useRef(colorRules);

  useEffect(() => {
    activeTabIdRef.current = activeTabId;
  }, [activeTabId]);

  useEffect(() => {
    colorRulesRef.current = colorRules;
  }, [colorRules]);

  const applyColorDecorations = useCallback(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return;

    const enabledRules = colorRulesRef.current.filter((rule) => rule.enabled && rule.trigger.length > 0);
    if (enabledRules.length === 0) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      return;
    }

    const content = model.getValue();
    const segments = buildColorSegments(content, enabledRules);

    const decorations: monaco.editor.IModelDeltaDecoration[] = segments
      .slice(0, MAX_COLOR_DECORATIONS)
      .map((segment) => {
        const startPos = model.getPositionAt(segment.start);
        const endPos = model.getPositionAt(segment.end);

        return {
          range: {
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column,
          },
          options: {
            inlineClassName: getRuleClassName(segment.ruleId),
          },
        };
      });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);
  }, []);

  const scheduleApplyColorDecorations = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      applyColorDecorations();
      rafRef.current = null;
    });
  }, [applyColorDecorations]);

  // Ctrl+Wheel zoom — capture at window level so it fires before WebView native zoom
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      adjustEditorFontSize(e.deltaY < 0 ? 1 : -1);
    };
    window.addEventListener("wheel", handler, { capture: true, passive: false });
    return () => window.removeEventListener("wheel", handler, { capture: true });
  }, [adjustEditorFontSize]);

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
        if (activeTabIdRef.current) {
          updateTabCursor(activeTabIdRef.current, {
            line: e.position.lineNumber,
            column: e.position.column,
          });
        }
      });

      contentListenerRef.current?.dispose();
      contentListenerRef.current = editor.onDidChangeModelContent(() => {
        scheduleApplyColorDecorations();
      });

      if (tab) {
        editor.setScrollTop(tab.scrollTop);
        editor.setPosition({
          lineNumber: tab.cursorPosition.line,
          column: tab.cursorPosition.column,
        });
      }

      scheduleApplyColorDecorations();

      editorBridge.applyContent = (content: string) => {
        const model = editor.getModel();
        if (!model) return;
        editor.executeEdits("format", [{ range: model.getFullModelRange(), text: content, forceMoveMarkers: true }]);
        editor.pushUndoStop();
      };

      editor.onDidDispose(() => {
        editorBridge.applyContent = null;
        contentListenerRef.current?.dispose();
        contentListenerRef.current = null;
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      });
      editor.focus();
    },
    [adjustEditorFontSize, scheduleApplyColorDecorations, updateTabCursor]
  );

  const handleChange: OnChange = useCallback(
    (value) => {
      if (activeTabId && value !== undefined) {
        updateTabContent(activeTabId, value);
        scheduleApplyColorDecorations();
      }
    },
    [activeTabId, scheduleApplyColorDecorations, updateTabContent]
  );

  useEffect(() => {
    editorRef.current?.updateOptions({ wordWrap: wordWrapEnabled ? "on" : "off" });
  }, [wordWrapEnabled]);

  useEffect(() => {
    editorRef.current?.updateOptions({ fontSize: editorFontSize });
  }, [editorFontSize]);

  useEffect(() => {
    let styleEl = document.getElementById(COLOR_STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = COLOR_STYLE_ELEMENT_ID;
      document.head.appendChild(styleEl);
    }

    const cssRules = colorRules
      .filter((rule) => rule.enabled)
      .map((rule) => `.${getRuleClassName(rule.id)} { color: ${rule.color} !important; }`)
      .join("\n");

    styleEl.textContent = cssRules;
    scheduleApplyColorDecorations();
  }, [colorRules, scheduleApplyColorDecorations]);

  useEffect(() => {
    scheduleApplyColorDecorations();
  }, [activeTabId, tab?.id, scheduleApplyColorDecorations]);

  useEffect(
    () => () => {
      contentListenerRef.current?.dispose();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    },
    []
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
          minimap: { enabled: false, scale: 1 },
          fontSize: editorFontSize,
          fontFamily: '"JetBrains Mono", monospace',
          fontLigatures: true,
          lineNumbers: "on",
          wordWrap: wordWrapEnabled ? "on" : "off",
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderWhitespace: "selection",
          tabSize: 2,
          insertSpaces: true,
          smoothScrolling: true,
          cursorBlinking: "blink",
          cursorSmoothCaretAnimation: "off",
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
