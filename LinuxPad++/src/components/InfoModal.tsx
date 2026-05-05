import { useEffect } from "react";
import { X, Keyboard, Terminal, Info } from "lucide-react";

interface InfoModalProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { action: "Nuevo archivo",           keys: "Ctrl+N" },
  { action: "Abrir archivo",           keys: "Ctrl+O" },
  { action: "Guardar",                 keys: "Ctrl+S" },
  { action: "Guardar como",            keys: "Ctrl+Shift+S" },
  { action: "Cerrar pestaña",          keys: "Ctrl+W" },
  { action: "Buscar y reemplazar",     keys: "Ctrl+F" },
  { action: "Paleta de comandos",      keys: "Ctrl+K" },
  { action: "Mostrar/ocultar sidebar", keys: "Ctrl+B" },
  { action: "Cambiar a pestaña 1–9",  keys: "Ctrl+1…9" },
  { action: "Pestaña siguiente",       keys: "Ctrl+Tab" },
  { action: "Pestaña anterior",        keys: "Ctrl+Shift+Tab" },
];

const COMMANDS = [
  "Nuevo archivo — abre una pestaña en blanco",
  "Abrir archivo — selector de archivos del sistema",
  "Guardar / Guardar como — escribe en disco",
  "Cerrar pestaña — cierra la pestaña activa",
  "Buscar y reemplazar — panel integrado en el editor",
  "Paleta de comandos — acceso rápido a todas las acciones",
  "Mostrar/ocultar sidebar — explorador de archivos",
  "Ajuste de línea — activa/desactiva el word wrap",
  "Reglas de color — resaltado personalizado por trigger",
];

export default function InfoModal({ onClose }: InfoModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-black/60 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-800 rounded-xl shadow-2xl border border-surface-600 overflow-hidden animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-700">
          <Info size={16} className="text-blue-400 shrink-0" />
          <span className="flex-1 text-sm font-semibold text-slate-200">
            LinuxPad<span className="text-slate-400">++</span>
            <span className="ml-2 text-xs font-normal text-slate-500">
              Editor de texto para Linux
            </span>
          </span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors"
            title="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {/* Keyboard shortcuts */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Keyboard size={13} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Atajos de teclado
              </span>
            </div>
            <table className="w-full text-xs">
              <tbody>
                {SHORTCUTS.map(({ action, keys }) => (
                  <tr key={keys} className="border-b border-surface-700/50 last:border-0">
                    <td className="py-1.5 pr-4 text-slate-300">{action}</td>
                    <td className="py-1.5 text-right">
                      <kbd className="px-1.5 py-0.5 bg-surface-700 rounded text-slate-400">
                        {keys}
                      </kbd>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Commands */}
          <div className="px-4 pt-2 pb-4 border-t border-surface-700">
            <div className="flex items-center gap-1.5 mb-2 mt-1">
              <Terminal size={13} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Comandos disponibles
              </span>
            </div>
            <ul className="space-y-1">
              {COMMANDS.map((cmd) => (
                <li key={cmd} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="mt-1 w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                  {cmd}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
