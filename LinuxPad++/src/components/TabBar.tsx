import React, { useState } from "react";
import { X, Plus, FileText, GitGraph } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../stores/editorStore";
import { useTranslation } from "../i18n";

export default function TabBar() {
  const t = useTranslation();
  const tabs = useEditorStore((s) => s.tabs);
  useEditorStore((s) => s.tabsMetaVersion);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const newTab = useEditorStore((s) => s.newTab);
  const renameTabPath = useEditorStore((s) => s.renameTabPath);
  const setTabTitle = useEditorStore((s) => s.setTabTitle);

  const [menu, setMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);

  const handleMiddleClick = (e: React.MouseEvent, id: string) => {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, tabId });
  };

  const handleRename = async () => {
    if (!menu) return;
    const tab = tabs.find((t) => t.id === menu.tabId);
    setMenu(null);
    if (!tab) return;

    const newName = prompt("New name:", tab.title);
    if (!newName || newName === tab.title) return;

    if (tab.path) {
      const newPath = tab.path.slice(0, tab.path.lastIndexOf("/") + 1) + newName;
      try {
        await invoke("rename_path", { oldPath: tab.path, newPath });
        renameTabPath(tab.path, newPath);
      } catch (err) {
        console.error("Failed to rename:", err);
      }
    } else {
      setTabTitle(tab.id, newName);
    }
  };

  return (
    <>
      <div className="flex items-stretch bg-surface-900 border-b border-surface-700 overflow-x-auto min-h-[38px] select-none shrink-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onMouseDown={(e) => handleMiddleClick(e, tab.id)}
              onClick={() => setActiveTab(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              className={[
                "group relative flex items-center gap-1.5 px-3 py-1.5 cursor-pointer",
                "border-r border-surface-700 text-sm max-w-[200px] shrink-0",
                "transition-colors duration-100",
                isActive
                  ? "bg-surface-800 text-slate-100 after:absolute after:bottom-0 after:inset-x-0 after:h-[2px] after:bg-blue-500"
                  : "bg-surface-900 text-slate-400 hover:bg-surface-800 hover:text-slate-200",
              ].join(" ")}
            >
              {tab.type === "diagram"
                ? <GitGraph size={13} className="shrink-0 opacity-60 text-violet-400" />
                : <FileText size={13} className="shrink-0 opacity-60" />
              }
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
                title={t.tabBar.closeTab}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        <button
          onClick={newTab}
          className="flex items-center justify-center px-3 text-slate-500 hover:text-slate-200 hover:bg-surface-800 transition-colors shrink-0"
          title={t.tabBar.newTab}
        >
          <Plus size={15} />
        </button>
      </div>

      {menu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 bg-surface-800 border border-surface-600 rounded shadow-lg py-1 text-sm min-w-[140px]"
            style={{ left: menu.x, top: menu.y }}
          >
            <button
              onClick={handleRename}
              className="w-full px-4 py-1.5 text-left hover:bg-surface-700 text-slate-200"
            >
              {t.tabBar.rename}
            </button>
            <div className="border-t border-surface-600 my-1" />
            <button
              onClick={() => { setMenu(null); closeTab(menu.tabId); }}
              className="w-full px-4 py-1.5 text-left hover:bg-red-900 text-red-300"
            >
              {t.tabBar.closeTab}
            </button>
          </div>
        </>
      )}
    </>
  );
}
