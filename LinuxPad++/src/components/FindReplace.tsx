import React, { useState, useRef, useEffect } from "react";
import { X, ChevronDown, ChevronRight, CaseSensitive, WholeWord, Regex } from "lucide-react";
import { useEditorStore } from "../stores/editorStore";
import { useTranslation } from "../i18n";

interface FindReplaceProps {
  onClose: () => void;
}

export default function FindReplace({ onClose }: FindReplaceProps) {
  const t = useTranslation();
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const updateTabContent = useEditorStore((s) => s.updateTabContent);
  const tab = useEditorStore((s) => s.tabs.find((candidate) => candidate.id === s.activeTabId) ?? null);

  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [error, setError] = useState("");

  const queryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queryRef.current?.focus();
  }, []);

  const buildRegex = (): RegExp | null => {
    if (!query) return null;
    try {
      let pattern = useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (wholeWord) pattern = `\\b${pattern}\\b`;
      const flags = caseSensitive ? "g" : "gi";
      const rx = new RegExp(pattern, flags);
      setError("");
      return rx;
    } catch (e) {
      setError("invalid");
      return null;
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!query || !tab) {
        setMatchCount(0);
        return;
      }

      const rx = buildRegex();
      if (!rx) return;
      const matches = tab.content.match(rx);
      setMatchCount(matches?.length ?? 0);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [query, caseSensitive, wholeWord, useRegex, tab?.content, tab?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!query) {
      setError("");
      setMatchCount(0);
      return;
    }
  }, [query]);

  const handleReplaceAll = () => {
    if (!tab || !activeTabId || !query) return;
    const rx = buildRegex();
    if (!rx) return;
    const newContent = tab.content.replace(rx, replacement);
    updateTabContent(activeTabId, newContent);
  };

  const handleReplaceNext = () => {
    if (!tab || !activeTabId || !query) return;
    const rx = buildRegex();
    if (!rx) return;
    const singleMatchRegex = new RegExp(rx.source, caseSensitive ? "" : "i");
    const newContent = tab.content.replace(singleMatchRegex, replacement);
    updateTabContent(activeTabId, newContent);
  };

  const ToggleBtn = ({
    active,
    onClick,
    title,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={[
        "p-1 rounded text-xs transition-colors",
        active
          ? "bg-blue-600 text-white"
          : "text-slate-400 hover:text-slate-200 hover:bg-surface-600",
      ].join(" ")}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-surface-800 border-b border-surface-700 p-2 animate-slide-down shrink-0">
      <div className="flex items-start gap-2 max-w-2xl">
        {/* Expand replace toggle */}
        <button
          onClick={() => setShowReplace(!showReplace)}
          className="mt-1.5 text-slate-500 hover:text-slate-200 transition-colors"
          title={t.findReplace.toggleReplace}
        >
          {showReplace ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="flex-1 space-y-1.5">
          {/* Find row */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                ref={queryRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") onClose();
                  if (e.key === "Enter") {
                    if (showReplace) handleReplaceNext();
                  }
                }}
                placeholder={t.findReplace.findPlaceholder}
                className="w-full bg-surface-900 border border-surface-600 focus:border-blue-500 rounded px-2.5 py-1 text-sm text-slate-200 outline-none pr-16"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                <ToggleBtn active={caseSensitive} onClick={() => setCaseSensitive(!caseSensitive)} title={t.findReplace.caseSensitive}>
                  <CaseSensitive size={13} />
                </ToggleBtn>
                <ToggleBtn active={wholeWord} onClick={() => setWholeWord(!wholeWord)} title={t.findReplace.wholeWord}>
                  <WholeWord size={13} />
                </ToggleBtn>
                <ToggleBtn active={useRegex} onClick={() => setUseRegex(!useRegex)} title={t.findReplace.useRegex}>
                  <Regex size={13} />
                </ToggleBtn>
              </div>
            </div>

            <span className="text-xs text-slate-500 whitespace-nowrap min-w-[60px]">
              {error ? (
                <span className="text-red-400">{t.findReplace.invalidRegex}</span>
              ) : query ? (
                t.findReplace.matches(matchCount)
              ) : ""}
            </span>
          </div>

          {/* Replace row */}
          {showReplace && (
            <div className="flex items-center gap-1.5">
              <input
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder={t.findReplace.replacePlaceholder}
                className="flex-1 bg-surface-900 border border-surface-600 focus:border-blue-500 rounded px-2.5 py-1 text-sm text-slate-200 outline-none"
              />
              <button
                onClick={handleReplaceNext}
                disabled={!query || matchCount === 0}
                className="px-2.5 py-1 text-xs bg-surface-700 hover:bg-surface-600 disabled:opacity-40 rounded text-slate-200 transition-colors whitespace-nowrap"
              >
                {t.findReplace.replace}
              </button>
              <button
                onClick={handleReplaceAll}
                disabled={!query || matchCount === 0}
                className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded text-white transition-colors whitespace-nowrap"
              >
                {t.findReplace.replaceAll}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-1 p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-surface-700 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
