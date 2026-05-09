import React from "react";

interface ToolbarBtnProps {
  onClick: () => void;
  title?: string;
  active?: boolean;
  error?: boolean;
  children: React.ReactNode;
}

export default function ToolbarBtn({ onClick, title, active, error, children }: ToolbarBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
        error
          ? "text-red-400 bg-red-500/20"
          : active
          ? "text-blue-300 bg-surface-700"
          : "text-slate-400 hover:text-slate-100 hover:bg-surface-700"
      }`}
    >
      {children}
    </button>
  );
}
