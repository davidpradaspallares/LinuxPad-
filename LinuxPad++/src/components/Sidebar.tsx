import React, { useState, useEffect, useCallback } from "react";
import {
  Folder,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  Home,
  RefreshCw,
  FolderPlus,
  FilePlus,
  Trash2,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../stores/editorStore";
import type { FileEntry } from "../types";

interface TreeNode extends FileEntry {
  children?: TreeNode[];
  isOpen?: boolean;
}

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  onToggle: (path: string) => void;
  onOpen: (path: string) => void;
  onDelete: (path: string) => void;
  onRename: (path: string) => void;
}

function TreeItem({ node, depth, onToggle, onOpen, onDelete, onRename }: TreeItemProps) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  const handleClick = () => {
    if (node.is_dir) {
      onToggle(node.path);
    } else {
      onOpen(node.path);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div>
      <div
        className="group relative flex items-center gap-1 px-2 py-[3px] cursor-pointer hover:bg-surface-700 rounded text-sm text-slate-300 hover:text-slate-100 transition-colors"
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={handleClick}
        onContextMenu={handleRightClick}
      >
        {node.is_dir ? (
          node.isOpen ? (
            <>
              <ChevronDown size={12} className="shrink-0 text-slate-500" />
              <FolderOpen size={14} className="shrink-0 text-yellow-400" />
            </>
          ) : (
            <>
              <ChevronRight size={12} className="shrink-0 text-slate-500" />
              <Folder size={14} className="shrink-0 text-yellow-400" />
            </>
          )
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <File size={14} className="shrink-0 text-slate-400" />
          </>
        )}
        <span className="truncate ml-1">{node.name}</span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.path);
          }}
          className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-900 hover:text-red-300 transition-all"
          title="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {menuPos && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setMenuPos(null)} />
          <div
            className="fixed z-50 bg-surface-800 border border-surface-600 rounded shadow-lg py-1 text-sm min-w-[140px]"
            style={{ left: menuPos.x, top: menuPos.y }}
          >
            <button
              onClick={() => { setMenuPos(null); onRename(node.path); }}
              className="w-full px-4 py-1.5 text-left hover:bg-surface-700 text-slate-200"
            >
              Rename
            </button>
            <div className="border-t border-surface-600 my-1" />
            <button
              onClick={() => { setMenuPos(null); onDelete(node.path); }}
              className="w-full px-4 py-1.5 text-left hover:bg-red-900 text-red-300"
            >
              Delete
            </button>
          </div>
        </>
      )}

      {node.is_dir && node.isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              onToggle={onToggle}
              onOpen={onOpen}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const sidebarPath = useEditorStore((s) => s.sidebarPath);
  const setSidebarPath = useEditorStore((s) => s.setSidebarPath);
  const openFile = useEditorStore((s) => s.openFile);
  const renameTabPath = useEditorStore((s) => s.renameTabPath);

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDirs, setOpenDirs] = useState<Record<string, TreeNode[]>>({});

  const loadDir = useCallback(async (path: string): Promise<TreeNode[]> => {
    const entries = await invoke<FileEntry[]>("list_directory", { path });
    return entries.map((e) => ({ ...e, isOpen: false, children: e.is_dir ? [] : undefined }));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const resolvedPath =
        sidebarPath === "~"
          ? await invoke<string>("get_home_dir")
          : sidebarPath;

      if (sidebarPath === "~") setSidebarPath(resolvedPath);
      const nodes = await loadDir(resolvedPath);
      setTree(nodes);
    } catch (err) {
      console.error("Failed to list directory:", err);
    } finally {
      setLoading(false);
    }
  }, [sidebarPath, loadDir, setSidebarPath]);

  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = useCallback(
    async (path: string) => {
      const updateNodes = (nodes: TreeNode[]): TreeNode[] =>
        nodes.map((n) => {
          if (n.path === path) {
            if (n.isOpen) return { ...n, isOpen: false };
            const children = openDirs[path] ?? [];
            return { ...n, isOpen: true, children };
          }
          if (n.children) return { ...n, children: updateNodes(n.children) };
          return n;
        });

      // Load children if not yet cached
      if (!openDirs[path]) {
        try {
          const children = await loadDir(path);
          setOpenDirs((prev) => ({ ...prev, [path]: children }));
          setTree((prev) =>
            prev.map((n) => {
              if (n.path === path) return { ...n, isOpen: true, children };
              if (n.children) {
                const patch = (ns: TreeNode[]): TreeNode[] =>
                  ns.map((nn) => {
                    if (nn.path === path) return { ...nn, isOpen: true, children };
                    if (nn.children) return { ...nn, children: patch(nn.children) };
                    return nn;
                  });
                return { ...n, children: patch(n.children!) };
              }
              return n;
            })
          );
        } catch (err) {
          console.error("Failed to expand directory:", err);
        }
      } else {
        setTree(updateNodes);
      }
    },
    [openDirs, loadDir]
  );

  const handleDelete = useCallback(async (path: string) => {
    const name = path.split("/").pop();
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await invoke("delete_path", { path });
      setOpenDirs({});
      refresh();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  }, [refresh]);

  const handleRename = useCallback(async (path: string) => {
    const oldName = path.split("/").pop()!;
    const newName = prompt("New name:", oldName);
    if (!newName || newName === oldName) return;
    const newPath = path.slice(0, path.lastIndexOf("/") + 1) + newName;
    try {
      await invoke("rename_path", { oldPath: path, newPath });
      renameTabPath(path, newPath);
      setOpenDirs({});
      refresh();
    } catch (err) {
      console.error("Failed to rename:", err);
    }
  }, [refresh, renameTabPath]);

  const handleNewFile = async () => {
    const name = prompt("File name:");
    if (!name) return;
    const path = `${sidebarPath}/${name}`;
    await invoke("create_file", { path });
    refresh();
  };

  const handleNewFolder = async () => {
    const name = prompt("Folder name:");
    if (!name) return;
    const path = `${sidebarPath}/${name}`;
    await invoke("create_directory", { path });
    refresh();
  };

  const goHome = async () => {
    const home = await invoke<string>("get_home_dir");
    setSidebarPath(home);
    setOpenDirs({});
    setTree([]);
    refresh();
  };

  return (
    <div className="flex flex-col h-full bg-surface-900 border-r border-surface-700 w-56 shrink-0 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-surface-700 shrink-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewFile}
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-surface-700 transition-colors"
            title="New file"
          >
            <FilePlus size={13} />
          </button>
          <button
            onClick={handleNewFolder}
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-surface-700 transition-colors"
            title="New folder"
          >
            <FolderPlus size={13} />
          </button>
          <button
            onClick={goHome}
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-surface-700 transition-colors"
            title="Go home"
          >
            <Home size={13} />
          </button>
          <button
            onClick={refresh}
            className={`p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-surface-700 transition-colors ${loading ? "animate-spin" : ""}`}
            title="Refresh"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Current path breadcrumb */}
      <div className="px-2 py-1 text-xs text-slate-500 border-b border-surface-700/50 truncate" title={sidebarPath}>
        {sidebarPath.replace(/^\/home\/[^/]+/, "~")}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading && tree.length === 0 ? (
          <div className="px-4 py-2 text-xs text-slate-600">Loading…</div>
        ) : tree.length === 0 ? (
          <div className="px-4 py-2 text-xs text-slate-600">Empty directory</div>
        ) : (
          tree.map((node) => (
            <TreeItem
              key={node.path}
              node={node}
              depth={0}
              onToggle={handleToggle}
              onOpen={openFile}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))
        )}
      </div>
    </div>
  );
}
