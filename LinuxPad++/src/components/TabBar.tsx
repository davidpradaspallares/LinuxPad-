import React from "react";
import { X, Plus, FileText } from "lucide-react";
import { useEditorStore } from "../stores/editorStore";

export default function TabBar() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const newTab = useEditorStore((s) => s.newTab);

  const handleMiddleClick = (e: React.MouseEvent, id: string) => {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(id);
    }
  };

  return (
    <div className="flex items-stretch bg-surface-900 border-b border-surface-700 overflow-x-auto min-h-[38px] select-none shrink-0">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onMouseDown={(e) => handleMiddleClick(e, tab.id)}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "group relative flex items-center gap-1.5 px-3 py-1.5 cursor-pointer",
              "border-r border-surface-700 text-sm max-w-[200px] shrink-0",
              "transition-colors duration-100",
              isActive
                ? "bg-surface-800 text-slate-100 after:absolute after:bottom-0 after:inset-x-0 after:h-[2px] after:bg-blue-500"
                : "bg-surface-900 text-slate-400 hover:bg-surface-800 hover:text-slate-200",
            ].join(" ")}
          >
            <FileText size={13} className="shrink-0 opacity-60" />
            <span className="truncate max-w-[120px]">{tab.title}</span>
            {tab.isDirty && (
              <span className="text-blue-400 text-xs leading-none shrink-0">●</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className={[
                "shrink-0 rounded p-0.5 transition-colors",
                "opacity-0 group-hover:opacity-100",
                isActive ? "opacity-60" : "",
                "hover:bg-surface-600 hover:text-slate-100",
              ].join(" ")}
              title="Close tab"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}

      <button
        onClick={newTab}
        className="flex items-center justify-center px-3 text-slate-500 hover:text-slate-200 hover:bg-surface-800 transition-colors shrink-0"
        title="New tab (Ctrl+N)"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
