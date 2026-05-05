import { useEffect } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useEditorStore } from "../stores/editorStore";

export function useKeyboardShortcuts() {
  const newTab = useEditorStore((s) => s.newTab);
  const newDiagramTab = useEditorStore((s) => s.newDiagramTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const openFile = useEditorStore((s) => s.openFile);
  const saveTab = useEditorStore((s) => s.saveTab);
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
        const selected = await open({
          multiple: false,
          filters: [
            { name: "Text Files", extensions: ["txt", "md", "json", "ts", "tsx", "js", "jsx", "rs", "py", "go"] },
            { name: "All Files", extensions: ["*"] },
          ],
        });
        if (selected && typeof selected === "string") {
          openFile(selected);
        }
        return;
      }

      if (ctrl && !e.shiftKey && e.key === "s") {
        e.preventDefault();
        if (!activeTabId) return;
        const tab = tabs.find((t) => t.id === activeTabId);
        if (!tab) return;

        if (tab.path) {
          await saveTab(activeTabId);
        } else {
          const savePath = await save({
            defaultPath: "untitled.txt",
            filters: [{ name: "All Files", extensions: ["*"] }],
          });
          if (savePath) await saveTab(activeTabId, savePath);
        }
        return;
      }

      if (ctrl && e.shiftKey && e.key === "S") {
        e.preventDefault();
        if (!activeTabId) return;
        const savePath = await save({
          filters: [{ name: "All Files", extensions: ["*"] }],
        });
        if (savePath) await saveTab(activeTabId, savePath);
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
  }, [closeTab, newDiagramTab, newTab, openFile, saveTab, setActiveTab, setCommandPaletteOpen, setFindReplaceOpen, toggleSidebar]);
}
