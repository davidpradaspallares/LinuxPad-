import { useEditorStore } from "../stores/editorStore";

export default function StatusBar() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const tab = tabs.find((t) => t.id === activeTabId);

  const { line, column } = tab?.cursorPosition ?? { line: 1, column: 1 };
  const language = tab?.language ?? "plaintext";
  const encoding = tab?.encoding ?? "UTF-8";
  const lines = tab ? tab.content.split("\n").length : 0;

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
