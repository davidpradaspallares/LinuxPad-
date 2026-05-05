import { toPng, toSvg } from 'html-to-image';
import type { Node, Edge } from '@xyflow/react';
import type { DiagramNodeData, ExportCodeLang } from './types';

export async function exportToPng(element: HTMLElement): Promise<void> {
  const dataUrl = await toPng(element, { cacheBust: true, backgroundColor: '#0f172a' });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'diagrama.png';
  a.click();
}

export async function exportToSvgFile(element: HTMLElement): Promise<void> {
  const dataUrl = await toSvg(element, { cacheBust: true, backgroundColor: '#0f172a' });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'diagrama.svg';
  a.click();
}

export function exportToMermaid(nodes: Node<DiagramNodeData>[], edges: Edge[]): string {
  const typeToMermaid = (node: Node<DiagramNodeData>): string => {
    const id = node.id.replace(/-/g, '_');
    const label = node.data.label.replace(/"/g, "'");
    switch (node.type) {
      case 'startend': return `  ${id}([\"${label}\"])`;
      case 'process': return `  ${id}[\"${label}\"]`;
      case 'decision': return `  ${id}{\"${label}\"}`;
      case 'io': return `  ${id}[/\"${label}\"/]`;
      default: return `  ${id}[\"${label}\"]`;
    }
  };

  const nodeLines = nodes.map(typeToMermaid).join('\n');
  const edgeLines = edges.map(e => {
    const src = e.source.replace(/-/g, '_');
    const tgt = e.target.replace(/-/g, '_');
    const lbl = e.label ? ` |${String(e.label)}|` : '';
    return `  ${src} -->${lbl} ${tgt}`;
  }).join('\n');

  return `flowchart TD\n${nodeLines}\n${edgeLines}`;
}

function buildGraph(nodes: Node<DiagramNodeData>[], edges: Edge[]) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adj = new Map<string, { target: string; label?: string }[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.source)?.push({ target: e.target, label: e.label ? String(e.label) : undefined });
  }
  return { nodeMap, adj };
}

function linearize(nodes: Node<DiagramNodeData>[], edges: Edge[]): Node<DiagramNodeData>[] {
  const { adj } = buildGraph(nodes, edges);
  const inDegree = new Map<string, number>();
  for (const n of nodes) inDegree.set(n.id, 0);
  for (const e of edges) inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);

  const queue = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0);
  const result: Node<DiagramNodeData>[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node.id)) continue;
    visited.add(node.id);
    result.push(node);
    for (const { target } of (adj.get(node.id) ?? [])) {
      if (!visited.has(target)) {
        const n = nodes.find(x => x.id === target);
        if (n) queue.push(n);
      }
    }
  }

  // Append any unvisited nodes (cycles)
  for (const n of nodes) {
    if (!visited.has(n.id)) result.push(n);
  }

  return result;
}

export function exportToCode(nodes: Node<DiagramNodeData>[], edges: Edge[], lang: ExportCodeLang): string {
  const ordered = linearize(nodes, edges);
  const { adj } = buildGraph(nodes, edges);

  const indent = (n: number) => '    '.repeat(n);

  const lines: string[] = [];

  const header: Record<ExportCodeLang, string[]> = {
    python: ['def flujo():', `${indent(1)}"""Flujo generado desde LinuxPad++ DiagramEditor"""`, ''],
    javascript: ['async function flujo() {', `${indent(1)}// Flujo generado desde LinuxPad++ DiagramEditor`, ''],
    typescript: ['async function flujo(): Promise<void> {', `${indent(1)}// Flujo generado desde LinuxPad++ DiagramEditor`, ''],
    pseudocode: ['INICIO', ''],
  };
  const footer: Record<ExportCodeLang, string[]> = {
    python: [''],
    javascript: ['}'],
    typescript: ['}'],
    pseudocode: ['', 'FIN'],
  };

  lines.push(...header[lang]);

  for (const node of ordered) {
    const lbl = node.data.label;
    const nexts = adj.get(node.id) ?? [];
    const d = 1;

    switch (node.type) {
      case 'startend': {
        const isStart = !edges.some(e => e.target === node.id);
        if (lang === 'pseudocode') {
          lines.push(`${indent(d)}# ${isStart ? 'INICIO' : 'FIN'}: ${lbl}`);
        } else {
          lines.push(`${indent(d)}# ${isStart ? 'Inicio' : 'Fin'}: ${lbl}`);
        }
        break;
      }
      case 'process': {
        if (lang === 'python') {
          lines.push(`${indent(d)}# Proceso: ${lbl}`);
          lines.push(`${indent(d)}resultado = ${lbl.toLowerCase().replace(/\s+/g, '_')}()`);
        } else if (lang === 'javascript' || lang === 'typescript') {
          lines.push(`${indent(d)}// Proceso: ${lbl}`);
          lines.push(`${indent(d)}const resultado = await ${lbl.toLowerCase().replace(/\s+/g, '_')}();`);
        } else {
          lines.push(`${indent(d)}PROCESO: ${lbl}`);
          lines.push(`${indent(d + 1)}resultado = ejecutar(${lbl})`);
        }
        break;
      }
      case 'decision': {
        const yes = nexts.find(n => n.label?.toLowerCase().includes('sí') || n.label?.toLowerCase().includes('si') || n.label?.toLowerCase().includes('yes'));
        const no = nexts.find(n => n.label?.toLowerCase().includes('no'));
        const cond = lbl.toLowerCase().replace(/\s+/g, '_');

        if (lang === 'python') {
          lines.push(`${indent(d)}# Decisión: ${lbl}`);
          lines.push(`${indent(d)}if ${cond}():`);
          lines.push(`${indent(d + 1)}pass  # ${yes?.label ?? 'Sí'}`);
          lines.push(`${indent(d)}else:`);
          lines.push(`${indent(d + 1)}pass  # ${no?.label ?? 'No'}`);
        } else if (lang === 'javascript' || lang === 'typescript') {
          lines.push(`${indent(d)}// Decisión: ${lbl}`);
          lines.push(`${indent(d)}if (await ${cond}()) {`);
          lines.push(`${indent(d + 1)}// ${yes?.label ?? 'Sí'}`);
          lines.push(`${indent(d)}} else {`);
          lines.push(`${indent(d + 1)}// ${no?.label ?? 'No'}`);
          lines.push(`${indent(d)}}`);
        } else {
          lines.push(`${indent(d)}SI ${lbl} ENTONCES`);
          lines.push(`${indent(d + 1)}${yes?.label ?? 'Sí'}: (acción)`);
          lines.push(`${indent(d)}SINO`);
          lines.push(`${indent(d + 1)}${no?.label ?? 'No'}: (acción)`);
          lines.push(`${indent(d)}FIN SI`);
        }
        break;
      }
      case 'io': {
        if (lang === 'python') {
          lines.push(`${indent(d)}# E/S: ${lbl}`);
          lines.push(`${indent(d)}${lbl.toLowerCase().replace(/\s+/g, '_')} = input("${lbl}: ")`);
        } else if (lang === 'javascript' || lang === 'typescript') {
          lines.push(`${indent(d)}// E/S: ${lbl}`);
          lines.push(`${indent(d)}const ${lbl.toLowerCase().replace(/\s+/g, '_')} = await leerEntrada("${lbl}");`);
        } else {
          lines.push(`${indent(d)}LEER/ESCRIBIR: ${lbl}`);
        }
        break;
      }
    }
    lines.push('');
  }

  lines.push(...footer[lang]);
  return lines.join('\n');
}
