export type DiagramNodeType =
  | 'startend' | 'process' | 'decision' | 'io'
  | 'subprocess' | 'preparation'
  | 'database' | 'document' | 'multidocument' | 'internal_storage' | 'manual_input' | 'sequential_data'
  | 'page_connector' | 'offpage_connector' | 'annotation' | 'swimlane' | 'summing_junction'
  | 'manual_operation' | 'delay' | 'display' | 'reference' | 'direct_access_storage';

export interface DiagramNodeData extends Record<string, unknown> {
  label: string;
  color?: string;
  description?: string;
}

export interface DiagramState {
  nodes: import('@xyflow/react').Node<DiagramNodeData>[];
  edges: import('@xyflow/react').Edge[];
  viewport?: { x: number; y: number; zoom: number };
}

export type ExportCodeLang = 'python' | 'javascript' | 'typescript' | 'pseudocode';

export const NODE_DEFAULTS: Record<DiagramNodeType, { label: string; color: string }> = {
  startend:              { label: 'Inicio',                    color: '#15803d' },
  process:               { label: 'Proceso',                   color: '#1d4ed8' },
  decision:              { label: 'Decisión',                  color: '#b45309' },
  io:                    { label: 'Entrada/Salida',            color: '#7e22ce' },
  subprocess:            { label: 'Subproceso',                color: '#0f766e' },
  preparation:           { label: 'Preparación',               color: '#0369a1' },
  database:              { label: 'Base de Datos',             color: '#6d28d9' },
  document:              { label: 'Documento',                 color: '#be185d' },
  multidocument:         { label: 'Multidocumento',            color: '#9d174d' },
  internal_storage:      { label: 'Alm. Interno',             color: '#475569' },
  manual_input:          { label: 'Entrada Manual',            color: '#92400e' },
  sequential_data:       { label: 'Datos Secuenciales',        color: '#065f46' },
  page_connector:        { label: 'Conector Página',           color: '#1d4ed8' },
  offpage_connector:     { label: 'Fuera de Página',           color: '#1e40af' },
  annotation:            { label: 'Anotación',                 color: '#334155' },
  swimlane:              { label: 'Swimlane',                  color: '#1e293b' },
  summing_junction:      { label: 'Unión',                     color: '#4b5563' },
  manual_operation:      { label: 'Op. Manual',               color: '#7c3aed' },
  delay:                 { label: 'Retraso',                   color: '#b45309' },
  display:               { label: 'Display',                   color: '#0e7490' },
  reference:             { label: 'Referencia',                color: '#64748b' },
  direct_access_storage: { label: 'Alm. Acceso Directo',      color: '#7f1d1d' },
};
