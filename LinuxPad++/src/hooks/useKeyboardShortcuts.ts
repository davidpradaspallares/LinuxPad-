import { useEffect } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useEditorStore } from "../stores/editorStore";

export function useKeyboardShortcuts() {
  const store = useEditorStore();

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "n") {
        e.preventDefault();
        store.newTab();
        return;
      }

      if (ctrl && e.key === "w") {
        e.preventDefault();
        if (store.activeTabId) store.closeTab(store.activeTabId);
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
          store.openFile(selected);
        }
        return;
      }

      if (ctrl && !e.shiftKey && e.key === "s") {
        e.preventDefault();
        const { activeTabId, tabs } = store;
        if (!activeTabId) return;
        const tab = tabs.find((t) => t.id === activeTabId);
        if (!tab) return;

        if (tab.path) {
          await store.saveTab(activeTabId);
        } else {
          const savePath = await save({
            defaultPath: "untitled.txt",
            filters: [{ name: "All Files", extensions: ["*"] }],
          });
          if (savePath) await store.saveTab(activeTabId, savePath);
        }
        return;
      }

      if (ctrl && e.shiftKey && e.key === "S") {
        e.preventDefault();
        const { activeTabId } = store;
        if (!activeTabId) return;
        const savePath = await save({
          filters: [{ name: "All Files", extensions: ["*"] }],
        });
        if (savePath) await store.saveTab(activeTabId, savePath);
        return;
      }

      if (ctrl && (e.key === "k" || e.key === "p")) {
        e.preventDefault();
        store.setCommandPaletteOpen(true);
        return;
      }

      if (ctrl && e.key === "f") {
        e.preventDefault();
        store.setFindReplaceOpen(true);
        return;
      }

      if (ctrl && e.key === "b") {
        e.preventDefault();
        store.toggleSidebar();
        return;
      }

      // Tab switching: Ctrl+1..9
      if (ctrl && e.key >= "1" && e.key <= "9") {
        const idx = parseInt(e.key) - 1;
        const target = store.tabs[idx];
        if (target) {
          e.preventDefault();
          store.setActiveTab(target.id);
        }
        return;
      }

      // Next/previous tab
      if (ctrl && e.key === "Tab") {
        e.preventDefault();
        const { tabs, activeTabId } = store;
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        const next = e.shiftKey
          ? (idx - 1 + tabs.length) % tabs.length
          : (idx + 1) % tabs.length;
        store.setActiveTab(tabs[next].id);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [store]);
}
