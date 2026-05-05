import xmlFormatter from "xml-formatter";
import jsyaml from "js-yaml";
import { format as sqlFormat } from "sql-formatter";

function formatJson(content: string): string {
  return JSON.stringify(JSON.parse(content), null, 2);
}

function formatXml(content: string): string {
  return xmlFormatter(content, {
    indentation: "  ",
    lineSeparator: "\n",
    collapseContent: true,
  });
}

function formatYaml(content: string): string {
  const parsed = jsyaml.load(content);
  return jsyaml.dump(parsed, { indent: 2, lineWidth: -1 });
}

function formatSql(content: string): string {
  return sqlFormat(content, { language: "sql", tabWidth: 2, keywordCase: "upper" });
}

function formatMarkdown(content: string): string {
  return content
    // Ensure headings have a space after #
    .replace(/^(#{1,6})([^\s#])/gm, "$1 $2")
    // Collapse 3+ consecutive blank lines to 2
    .replace(/\n{3,}/g, "\n\n")
    // Trim trailing whitespace on each line
    .replace(/[ \t]+$/gm, "")
    .trim() + "\n";
}

const FORMATTERS: Record<string, (c: string) => string> = {
  json: formatJson,
  xml: formatXml,
  yaml: formatYaml,
  sql: formatSql,
  markdown: formatMarkdown,
};

export const FORMATTABLE_LANGUAGES = new Set(Object.keys(FORMATTERS));

export function sniffLanguage(content: string): string | null {
  const t = content.trim();
  if (!t) return null;

  // JSON: strict parse
  if ((t.startsWith("{") || t.startsWith("[")) ) {
    try { JSON.parse(t); return "json"; } catch { /* not json */ }
  }

  // XML
  if (t.startsWith("<") && t.includes(">")) return "xml";

  // SQL
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH)\b/i.test(t)) return "sql";

  // YAML
  if (t.startsWith("---") || /^[a-zA-Z_][a-zA-Z0-9_]*\s*:/m.test(t) || t.startsWith("- ")) return "yaml";

  return null;
}

export function formatContent(content: string, language: string): string {
  const fn = FORMATTERS[language];
  if (!fn) throw new Error(`No formatter for language: ${language}`);
  return fn(content);
}
