import { useEffect } from "react";
import { X, Keyboard, Terminal, Info } from "lucide-react";
import { useTranslation } from "../i18n";

interface InfoModalProps {
  onClose: () => void;
}

export default function InfoModal({ onClose }: InfoModalProps) {
  const t = useTranslation();

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
              {t.infoModal.subtitle}
            </span>
          </span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors"
            title={t.infoModal.close}
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
                {t.infoModal.shortcuts}
              </span>
            </div>
            <table className="w-full text-xs">
              <tbody>
                {t.infoModal.shortcutList.map(({ action, keys }) => (
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
                {t.infoModal.commands}
              </span>
            </div>
            <ul className="space-y-1">
              {t.infoModal.commandList.map((cmd) => (
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
