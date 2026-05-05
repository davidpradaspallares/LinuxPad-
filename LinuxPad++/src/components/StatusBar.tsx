import { useEffect, useState } from "react";
import { useEditorStore } from "../stores/editorStore";

export default function StatusBar() {
  const tab = useEditorStore((s) => s.tabs.find((candidate) => candidate.id === s.activeTabId) ?? null);
  const cursorPosition = useEditorStore((s) => s.activeCursorPosition);

  const [lines, setLines] = useState(tab ? tab.content.split("\n").length : 0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLines(tab ? tab.content.split("\n").length : 0);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [tab?.content, tab?.id]);

  const { line, column } = cursorPosition;
  const language = tab?.language ?? "plaintext";
  const encoding = tab?.encoding ?? "UTF-8";

  return (
    <div className="flex items-center justify-between px-3 h-[24px] bg-blue-600 text-blue-100 text-xs select-none shrink-0">
      <div className="flex items-center gap-4">
        <span className="font-medium">LinuxPad++</span>
        {tab?.isDirty && <span className="opacity-75">● Modified</span>}
      </div>

      <div className="flex items-center gap-4">
        <span>
          Ln {line}, Col {column}
        </span>
        <span>{lines} lines</span>
        <span className="capitalize">{language}</span>
        <span>{encoding}</span>
      </div>
    </div>
  );
}
