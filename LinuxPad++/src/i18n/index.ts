import { useEditorStore } from "../stores/editorStore";
import { translations } from "./translations";

export { translations };
export type { Language, Translations } from "./translations";

export function useTranslation() {
  const language = useEditorStore((s) => s.language);
  return translations[language];
}
