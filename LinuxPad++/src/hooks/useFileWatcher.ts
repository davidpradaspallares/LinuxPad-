import { useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../stores/editorStore";

export function useFileWatcher() {
  const tabs = useEditorStore((s) => s.tabs);
  const reloadTabFromDisk = useEditorStore((s) => s.reloadTabFromDisk);
  const unlistenRef = useRef<UnlistenFn | null>(null);
  const watchedPaths = useRef<Set<string>>(new Set());

  // Register/unregister watchers whenever the open file set changes
  useEffect(() => {
    const currentPaths = new Set(
      tabs.map((t) => t.path).filter((p): p is string => p !== null)
    );

    const toAdd = [...currentPaths].filter((p) => !watchedPaths.current.has(p));
    const toRemove = [...watchedPaths.current].filter((p) => !currentPaths.has(p));

    toAdd.forEach((path) => {
      invoke("watch_file", { path }).catch(console.error);
      watchedPaths.current.add(path);
    });

    toRemove.forEach((path) => {
      invoke("unwatch_file", { path }).catch(console.error);
      watchedPaths.current.delete(path);
    });
  }, [tabs]);

  // Listen for file-changed events from Rust
  useEffect(() => {
    let cancelled = false;

    listen<string>("file-changed", (event) => {
      if (cancelled) return;
      reloadTabFromDisk(event.payload);
    }).then((unlisten) => {
      if (cancelled) {
        unlisten();
      } else {
        unlistenRef.current = unlisten;
      }
    });

    return () => {
      cancelled = true;
      unlistenRef.current?.();
      unlistenRef.current = null;
    };
  }, [reloadTabFromDisk]);
}
