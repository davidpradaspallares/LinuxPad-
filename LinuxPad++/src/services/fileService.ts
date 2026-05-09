import { open, save } from "@tauri-apps/plugin-dialog";
import { useEditorStore } from "../stores/editorStore";

const FILE_FILTERS = [
  { name: "Text / Code", extensions: ["txt", "md", "json", "ts", "tsx", "js", "jsx", "rs", "py", "go", "css", "html", "yaml", "toml"] },
  { name: "All Files", extensions: ["*"] },
];

export async function openFileWithDialog(): Promise<void> {
  const selected = await open({ multiple: false, filters: FILE_FILTERS });
  if (selected && typeof selected === "string") {
    useEditorStore.getState().openFile(selected);
  }
}

export async function saveActiveTab(): Promise<void> {
  const { activeTabId, tabs, saveTab } = useEditorStore.getState();
  if (!activeTabId) return;
  const tab = tabs.find((t) => t.id === activeTabId);
  if (!tab) return;
  if (tab.path) {
    await saveTab(activeTabId);
  } else {
    const path = await save({
      defaultPath: "untitled.txt",
      filters: [{ name: "All Files", extensions: ["*"] }],
    });
    if (path) await saveTab(activeTabId, path);
  }
}

export async function saveActiveTabAs(): Promise<void> {
  const { activeTabId, saveTab } = useEditorStore.getState();
  if (!activeTabId) return;
  const path = await save({ filters: [{ name: "All Files", extensions: ["*"] }] });
  if (path) await saveTab(activeTabId, path);
}
