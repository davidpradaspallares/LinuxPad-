export interface CursorPosition {
  line: number;
  column: number;
}

export interface Tab {
  id: string;
  title: string;
  path: string | null;
  content: string;
  isDirty: boolean;
  language: string;
  cursorPosition: CursorPosition;
  encoding: string;
  scrollTop: number;
}

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: number | null;
}

export interface FileInfo {
  path: string;
  size: number;
  modified: number | null;
  encoding: string;
}

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  action: () => void;
}

export type FindReplaceOptions = {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
};
