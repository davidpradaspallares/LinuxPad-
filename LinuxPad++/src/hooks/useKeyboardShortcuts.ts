import { useEffect } from "react";
import { useEditorStore } from "../stores/editorStore";
import { openFileWithDialog, saveActiveTab, saveActiveTabAs } from "../services/fileService";

export function useKeyboardShortcuts() {
  const newTab = useEditorStore((s) => s.newTab);
  const newDiagramTab = useEditorStore((s) => s.newDiagramTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const setCommandPaletteOpen = useEditorStore((s) => s.setCommandPaletteOpen);
  const setFindReplaceOpen = useEditorStore((s) => s.setFindReplaceOpen);
  const toggleSidebar = useEditorStore((s) => s.toggleSidebar);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const { activeTabId, tabs } = useEditorStore.getState();

      if (ctrl && e.key === "n") {
        e.preventDefault();
        newTab();
        return;
      }

      if (ctrl && e.key === "d") {
        e.preventDefault();
        newDiagramTab();
        return;
      }

      if (ctrl && e.key === "w") {
        e.preventDefault();
        if (activeTabId) closeTab(activeTabId);
        return;
      }

      if (ctrl && e.key === "o") {
        e.preventDefault();
        await openFileWithDialog();
        return;
      }

      if (ctrl && !e.shiftKey && e.key === "s") {
        e.preventDefault();
        await saveActiveTab();
        return;
      }

      if (ctrl && e.shiftKey && e.key === "S") {
        e.preventDefault();
        await saveActiveTabAs();
        return;
      }

      if (ctrl && (e.key === "k" || e.key === "p")) {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      if (ctrl && e.key === "f") {
        e.preventDefault();
        setFindReplaceOpen(true);
        return;
      }

      if (ctrl && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Tab switching: Ctrl+1..9
      if (ctrl && e.key >= "1" && e.key <= "9") {
        const idx = parseInt(e.key) - 1;
        const target = tabs[idx];
        if (target) {
          e.preventDefault();
          setActiveTab(target.id);
        }
        return;
      }

      // Next/previous tab
      if (ctrl && e.key === "Tab") {
        e.preventDefault();
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        const next = e.shiftKey
          ? (idx - 1 + tabs.length) % tabs.length
          : (idx + 1) % tabs.length;
        setActiveTab(tabs[next].id);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeTab, newDiagramTab, newTab, setActiveTab, setCommandPaletteOpen, setFindReplaceOpen, toggleSidebar]);
}
