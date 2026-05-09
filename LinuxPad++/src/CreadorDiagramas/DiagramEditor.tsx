import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
  Panel,
  ConnectionMode,
} from '@xyflow/react';
import type {
  Connection,
  Edge,
  Node,
  OnConnect,
  NodeTypes,
  EdgeTypes,
  OnConnectStartParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import StartEndNode from './nodes/StartEndNode';
import ProcessNode from './nodes/ProcessNode';
import DecisionNode from './nodes/DecisionNode';
import IONode from './nodes/IONode';
import SubprocessNode from './nodes/SubprocessNode';
import PreparationNode from './nodes/PreparationNode';
import DatabaseNode from './nodes/DatabaseNode';
import DocumentNode from './nodes/DocumentNode';
import MultiDocumentNode from './nodes/MultiDocumentNode';
import InternalStorageNode from './nodes/InternalStorageNode';
import ManualInputNode from './nodes/ManualInputNode';
import SequentialDataNode from './nodes/SequentialDataNode';
import PageConnectorNode from './nodes/PageConnectorNode';
import OffPageConnectorNode from './nodes/OffPageConnectorNode';
import AnnotationNode from './nodes/AnnotationNode';
import SwimlaneNode from './nodes/SwimlaneNode';
import SummingJunctionNode from './nodes/SummingJunctionNode';
import ManualOperationNode from './nodes/ManualOperationNode';
import DelayNode from './nodes/DelayNode';
import DisplayNode from './nodes/DisplayNode';
import ReferenceNode from './nodes/ReferenceNode';
import DirectAccessStorageNode from './nodes/DirectAccessStorageNode';
import LabeledEdge from './LabeledEdge';
import DiagramToolbar from './DiagramToolbar';
import PropertiesPanel from './PropertiesPanel';
import { exportToPng, exportToSvgFile, exportToMermaid, exportToCode } from './exporters';
import { useEditorStore } from '../stores/editorStore';
import { useTranslation } from '../i18n';
import type { DiagramNodeType, DiagramNodeData, ExportCodeLang } from './types';
import { NODE_DEFAULTS } from './types';

const NODE_TYPES: NodeTypes = {
  startend: StartEndNode,
  process: ProcessNode,
  decision: DecisionNode,
  io: IONode,
  subprocess: SubprocessNode,
  preparation: PreparationNode,
  database: DatabaseNode,
  document: DocumentNode,
  multidocument: MultiDocumentNode,
  internal_storage: InternalStorageNode,
  manual_input: ManualInputNode,
  sequential_data: SequentialDataNode,
  page_connector: PageConnectorNode,
  offpage_connector: OffPageConnectorNode,
  annotation: AnnotationNode,
  swimlane: SwimlaneNode,
  summing_junction: SummingJunctionNode,
  manual_operation: ManualOperationNode,
  delay: DelayNode,
  display: DisplayNode,
  reference: ReferenceNode,
  direct_access_storage: DirectAccessStorageNode,
};

const EDGE_TYPES: EdgeTypes = {
  default: LabeledEdge,
  straight: LabeledEdge,
  smoothstep: LabeledEdge,
};

const PICKER_GROUPS: { catKey: 'catBasics' | 'catData' | 'catConnectors' | 'catOperations'; types: DiagramNodeType[] }[] = [
  {
    catKey: 'catBasics',
    types: ['startend', 'process', 'decision', 'io', 'subprocess', 'preparation'],
  },
  {
    catKey: 'catData',
    types: ['database', 'document', 'multidocument', 'internal_storage', 'manual_input', 'sequential_data'],
  },
  {
    catKey: 'catConnectors',
    types: ['page_connector', 'offpage_connector', 'annotation', 'swimlane', 'summing_junction'],
  },
  {
    catKey: 'catOperations',
    types: ['manual_operation', 'delay', 'display', 'reference', 'direct_access_storage'],
  },
];

let nodeIdCounter = 1;
const newNodeId = () => `node_${Date.now()}_${nodeIdCounter++}`;

type DiagramNode = Node<DiagramNodeData>;

type AlignDir =
  | 'left' | 'right' | 'top' | 'bottom'
  | 'centerH' | 'centerV'
  | 'distributeH' | 'distributeV'
  | 'equalWidth' | 'equalHeight';

function nodeW(n: DiagramNode): number {
  return (n.measured?.width ?? n.width) ?? 150;
}
function nodeH(n: DiagramNode): number {
  return (n.measured?.height ?? n.height) ?? 50;
}

function applyAlignment(nodes: DiagramNode[], dir: AlignDir): DiagramNode[] {
  const sel = nodes.filter(n => n.selected);
  if (sel.length < 2) return nodes;

  let updated: DiagramNode[];

  switch (dir) {
    case 'left': {
      const minX = Math.min(...sel.map(n => n.position.x));
      updated = sel.map(n => ({ ...n, position: { ...n.position, x: minX } }));
      break;
    }
    case 'right': {
      const maxR = Math.max(...sel.map(n => n.position.x + nodeW(n)));
      updated = sel.map(n => ({ ...n, position: { ...n.position, x: maxR - nodeW(n) } }));
      break;
    }
    case 'top': {
      const minY = Math.min(...sel.map(n => n.position.y));
      updated = sel.map(n => ({ ...n, position: { ...n.position, y: minY } }));
      break;
    }
    case 'bottom': {
      const maxB = Math.max(...sel.map(n => n.position.y + nodeH(n)));
      updated = sel.map(n => ({ ...n, position: { ...n.position, y: maxB - nodeH(n) } }));
      break;
    }
    case 'centerH': {
      const minX = Math.min(...sel.map(n => n.position.x));
      const maxR = Math.max(...sel.map(n => n.position.x + nodeW(n)));
      const cx = (minX + maxR) / 2;
      updated = sel.map(n => ({ ...n, position: { ...n.position, x: cx - nodeW(n) / 2 } }));
      break;
    }
    case 'centerV': {
      const minY = Math.min(...sel.map(n => n.position.y));
      const maxB = Math.max(...sel.map(n => n.position.y + nodeH(n)));
      const cy = (minY + maxB) / 2;
      updated = sel.map(n => ({ ...n, position: { ...n.position, y: cy - nodeH(n) / 2 } }));
      break;
    }
    case 'distributeH': {
      if (sel.length < 3) return nodes;
      const sorted = [...sel].sort((a, b) => a.position.x - b.position.x);
      const minX = sorted[0].position.x;
      const maxR = sorted[sorted.length - 1].position.x + nodeW(sorted[sorted.length - 1]);
      const totalW = sorted.reduce((s, n) => s + nodeW(n), 0);
      const gap = (maxR - minX - totalW) / (sorted.length - 1);
      let cursor = minX;
      updated = sorted.map(n => {
        const node = { ...n, position: { ...n.position, x: cursor } };
        cursor += nodeW(n) + gap;
        return node;
      });
      break;
    }
    case 'distributeV': {
      if (sel.length < 3) return nodes;
      const sorted = [...sel].sort((a, b) => a.position.y - b.position.y);
      const minY = sorted[0].position.y;
      const maxB = sorted[sorted.length - 1].position.y + nodeH(sorted[sorted.length - 1]);
      const totalH = sorted.reduce((s, n) => s + nodeH(n), 0);
      const gap = (maxB - minY - totalH) / (sorted.length - 1);
      let cursor = minY;
      updated = sorted.map(n => {
        const node = { ...n, position: { ...n.position, y: cursor } };
        cursor += nodeH(n) + gap;
        return node;
      });
      break;
    }
    case 'equalWidth': {
      const maxW = Math.max(...sel.map(nodeW));
      updated = sel.map(n => ({ ...n, width: maxW, style: { ...n.style, width: maxW } }));
      break;
    }
    case 'equalHeight': {
      const maxH = Math.max(...sel.map(nodeH));
      updated = sel.map(n => ({ ...n, height: maxH, style: { ...n.style, height: maxH } }));
      break;
    }
    default:
      return nodes;
  }

  const map = new Map(updated.map(n => [n.id, n]));
  return nodes.map(n => map.get(n.id) ?? n);
}

function parseDiagram(content: string) {
  try {
    const parsed = JSON.parse(content);
    return {
      nodes: (parsed.nodes ?? []) as DiagramNode[],
      edges: (parsed.edges ?? []) as Edge[],
      viewport: parsed.viewport as { x: number; y: number; zoom: number } | undefined,
    };
  } catch {
    return { nodes: [] as DiagramNode[], edges: [] as Edge[], viewport: undefined };
  }
}

interface InnerProps {
  tabId: string;
  initialContent: string;
}

function DiagramInner({ tabId, initialContent }: InnerProps) {
  const t = useTranslation();
  const { fitView, screenToFlowPosition, getViewport } = useReactFlow();
  const updateTabContent = useEditorStore(s => s.updateTabContent);
  const diagramSettings = useEditorStore(s => s.diagramSettings);
  const flowRef = useRef<HTMLDivElement>(null);

  const initial = useMemo(() => parseDiagram(initialContent), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [nodes, setNodes, onNodesChange] = useNodesState<DiagramNode>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [edgeType, setEdgeType] = useState<'default' | 'straight' | 'smoothstep'>('default');

  // Undo/Redo history
  const past = useRef<{ nodes: DiagramNode[]; edges: Edge[] }[]>([]);
  const future = useRef<{ nodes: DiagramNode[]; edges: Edge[] }[]>([]);
  const historyTimer = useRef<number | null>(null);
  const isUndoRedo = useRef(false);

  // Quick-connect picker
  const [picker, setPicker] = useState<{
    x: number; y: number;
    sourceNodeId: string;
    sourceHandleId: string | null;
  } | null>(null);
  const connectStartRef = useRef<{ nodeId: string; handleId: string | null } | null>(null);

  // Inline edge label editor
  const [editingEdge, setEditingEdge] = useState<{
    id: string; label: string; x: number; y: number;
  } | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Alignment dropdown
  const [alignOpen, setAlignOpen] = useState(false);

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false);
  const [exportCodeLang, setExportCodeLang] = useState<ExportCodeLang>('python');
  const [codeOutput, setCodeOutput] = useState('');
  const [codeModalOpen, setCodeModalOpen] = useState(false);

  const pushHistory = useCallback((ns: DiagramNode[], es: Edge[]) => {
    if (isUndoRedo.current) return;
    if (historyTimer.current) clearTimeout(historyTimer.current);
    historyTimer.current = window.setTimeout(() => {
      past.current = [...past.current.slice(-49), { nodes: structuredClone(ns), edges: structuredClone(es) }];
      future.current = [];
    }, 400);
  }, []);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    isUndoRedo.current = true;
    const snapshot = past.current.pop()!;
    future.current = [{ nodes: structuredClone(nodes), edges: structuredClone(edges) }, ...future.current.slice(0, 49)];
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    setTimeout(() => { isUndoRedo.current = false; }, 50);
  }, [nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    isUndoRedo.current = true;
    const snapshot = future.current.shift()!;
    past.current = [...past.current.slice(-49), { nodes: structuredClone(nodes), edges: structuredClone(edges) }];
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    setTimeout(() => { isUndoRedo.current = false; }, 50);
  }, [nodes, edges, setNodes, setEdges]);

  // Serialize to tab content (debounced)
  const serializeTimer = useRef<number | null>(null);
  useEffect(() => {
    if (serializeTimer.current) clearTimeout(serializeTimer.current);
    serializeTimer.current = window.setTimeout(() => {
      const viewport = getViewport();
      const content = JSON.stringify({ nodes, edges, viewport });
      updateTabContent(tabId, content);
      pushHistory(nodes, edges);
    }, 500);
    return () => { if (serializeTimer.current) clearTimeout(serializeTimer.current); };
  }, [nodes, edges]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus edge edit input when it appears
  useEffect(() => {
    if (editingEdge) {
      setTimeout(() => editInputRef.current?.focus(), 30);
    }
  }, [editingEdge?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyAlign = useCallback((dir: AlignDir) => {
    setNodes(ns => applyAlignment(ns, dir));
    setAlignOpen(false);
  }, [setNodes]);

  const commitEdgeLabel = useCallback(() => {
    if (!editingEdge) return;
    setEdges(es => es.map(e => e.id === editingEdge.id ? { ...e, label: editingEdge.label } : e));
    setEditingEdge(null);
  }, [editingEdge, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Escape: close dialogs, cancel edge edit
      if (e.key === 'Escape') {
        if (editingEdge) { setEditingEdge(null); return; }
        setPicker(null);
        setAlignOpen(false);
        setExportOpen(false);
        return;
      }

      // When editing edge label, don't intercept other keys
      if (editingEdge) return;

      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }

      // Alignment shortcuts (Ctrl+Shift+...)
      if (ctrl && e.shiftKey) {
        const key = e.key.toUpperCase();
        if (key === 'L') { e.preventDefault(); applyAlign('left'); }
        else if (key === 'R') { e.preventDefault(); applyAlign('right'); }
        else if (key === 'T') { e.preventDefault(); applyAlign('top'); }
        else if (key === 'B') { e.preventDefault(); applyAlign('bottom'); }
        else if (key === 'H') { e.preventDefault(); applyAlign('centerH'); }
        else if (key === 'V') { e.preventDefault(); applyAlign('centerV'); }
        else if (key === 'D') { e.preventDefault(); applyAlign('distributeH'); }
        else if (key === 'G') { e.preventDefault(); applyAlign('distributeV'); }
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        setNodes(ns => ns.filter(n => !n.selected));
        setEdges(es => es.filter(ex => !ex.selected));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, setNodes, setEdges, applyAlign, editingEdge, commitEdgeLabel]);

  const onConnect: OnConnect = useCallback((params: Connection) => {
    setEdges(es => addEdge({ ...params, type: edgeType, animated: false }, es));
  }, [setEdges, edgeType]);

  const addNode = useCallback((type: DiagramNodeType, position?: { x: number; y: number }) => {
    const pos = position ?? screenToFlowPosition({
      x: (flowRef.current?.clientWidth ?? 400) / 2,
      y: (flowRef.current?.clientHeight ?? 400) / 2,
    });
    const extraStyle = type === 'swimlane' ? { zIndex: -1 } : undefined;
    const extraSize = type === 'swimlane' ? { width: 260, height: 160 } : undefined;
    const newNode: DiagramNode = {
      id: newNodeId(),
      type,
      position: pos,
      data: { label: NODE_DEFAULTS[type].label, color: NODE_DEFAULTS[type].color },
      ...(extraStyle ? { style: extraStyle } : {}),
      ...(extraSize ?? {}),
    };
    setNodes(ns => [...ns, newNode]);
  }, [screenToFlowPosition, setNodes]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow-nodetype') as DiagramNodeType;
    if (!type) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos = screenToFlowPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    addNode(type, pos);
  }, [addNode, screenToFlowPosition]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Pane double-click: add process node
  const onPaneDoubleClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos = screenToFlowPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    addNode('process', pos);
  }, [addNode, screenToFlowPosition]);

  // Edge double-click: start inline label editing
  const onEdgeDoubleClick = useCallback((e: React.MouseEvent, edge: Edge) => {
    e.stopPropagation();
    setEditingEdge({ id: edge.id, label: String(edge.label ?? ''), x: e.clientX, y: e.clientY });
  }, []);

  const onConnectStart = useCallback((_: unknown, params: OnConnectStartParams) => {
    setPicker(null);
    connectStartRef.current = { nodeId: params.nodeId ?? '', handleId: params.handleId ?? null };
  }, []);

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent, connectionState: { isValid: boolean }) => {
    if (connectionState.isValid || !connectStartRef.current) return;
    const clientX = (event as TouchEvent).changedTouches?.[0]?.clientX ?? (event as MouseEvent).clientX;
    const clientY = (event as TouchEvent).changedTouches?.[0]?.clientY ?? (event as MouseEvent).clientY;
    setPicker({
      x: clientX,
      y: clientY,
      sourceNodeId: connectStartRef.current.nodeId,
      sourceHandleId: connectStartRef.current.handleId,
    });
    connectStartRef.current = null;
  }, []);

  const addNodeFromPicker = useCallback((type: DiagramNodeType) => {
    if (!picker) return;
    const rect = flowRef.current?.getBoundingClientRect();
    const pos = screenToFlowPosition({
      x: picker.x - (rect?.left ?? 0) + 80,
      y: picker.y - (rect?.top ?? 0) - 25,
    });
    const newId = newNodeId();
    const extraStyle = type === 'swimlane' ? { zIndex: -1 } : undefined;
    const extraSize = type === 'swimlane' ? { width: 260, height: 160 } : undefined;
    setNodes(ns => [...ns, {
      id: newId,
      type,
      position: pos,
      data: { label: NODE_DEFAULTS[type].label, color: NODE_DEFAULTS[type].color },
      ...(extraStyle ? { style: extraStyle } : {}),
      ...(extraSize ?? {}),
    } as DiagramNode]);
    if (picker.sourceNodeId) {
      setEdges(es => addEdge({
        id: `edge_${Date.now()}`,
        source: picker.sourceNodeId,
        sourceHandle: picker.sourceHandleId ?? undefined,
        target: newId,
        type: edgeType,
        animated: false,
      }, es));
    }
    setPicker(null);
  }, [picker, screenToFlowPosition, setNodes, setEdges, edgeType]);

  const doExport = async (format: 'png' | 'svg' | 'mermaid' | 'code') => {
    setExportOpen(false);
    if (format === 'png' && flowRef.current) await exportToPng(flowRef.current);
    if (format === 'svg' && flowRef.current) await exportToSvgFile(flowRef.current);
    if (format === 'mermaid') {
      const text = exportToMermaid(nodes as DiagramNode[], edges);
      navigator.clipboard?.writeText(text);
      setCodeOutput(text);
      setCodeModalOpen(true);
    }
    if (format === 'code') {
      const text = exportToCode(nodes as DiagramNode[], edges, exportCodeLang);
      setCodeOutput(text);
      setCodeModalOpen(true);
    }
  };

  // Selection derivation: node takes priority over edge
  const selectedNodes = nodes.filter(n => n.selected);
  const selectedNode = (selectedNodes[0] as DiagramNode | undefined) ?? null;
  const selectedEdge = selectedNodes.length === 0 ? (edges.find(e => e.selected) ?? null) : null;
  const multiSelected = selectedNodes.length >= 2;

  const btnStyle: React.CSSProperties = {
    background: '#1e293b', border: '1px solid #334155', borderRadius: 4,
    color: '#94a3b8', fontSize: 12, padding: '3px 10px', cursor: 'pointer',
  };
  const activeBtnStyle: React.CSSProperties = { ...btnStyle, color: '#e2e8f0', background: '#334155' };
  const disabledBtnStyle: React.CSSProperties = { ...btnStyle, opacity: 0.4, cursor: 'not-allowed' };
  const iconBtnStyle: React.CSSProperties = {
    ...btnStyle, padding: '3px 7px', fontSize: 13, lineHeight: 1,
  };
  const iconBtnActive: React.CSSProperties = { ...iconBtnStyle, color: '#e2e8f0', background: '#334155' };

  const alignActions: { label: string; title: string; dir: AlignDir; min: number }[] = [
    { label: '⇤', title: t.diagram.alignLeft, dir: 'left', min: 2 },
    { label: '⇥', title: t.diagram.alignRight, dir: 'right', min: 2 },
    { label: '↑', title: t.diagram.alignTop, dir: 'top', min: 2 },
    { label: '↓', title: t.diagram.alignBottom, dir: 'bottom', min: 2 },
    { label: '↔', title: t.diagram.centerH, dir: 'centerH', min: 2 },
    { label: '↕', title: t.diagram.centerV, dir: 'centerV', min: 2 },
    { label: '⇔H', title: t.diagram.distributeH, dir: 'distributeH', min: 3 },
    { label: '⇕V', title: t.diagram.distributeV, dir: 'distributeV', min: 3 },
    { label: '=W', title: t.diagram.equalWidth, dir: 'equalWidth', min: 2 },
    { label: '=H', title: t.diagram.equalHeight, dir: 'equalHeight', min: 2 },
  ];

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, background: '#0f172a' }}>
      {diagramSettings.showToolbar && <DiagramToolbar onAddNode={addNode} />}

      <div style={{ flex: 1, position: 'relative', minWidth: 0 }} ref={flowRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onConnectStart={onConnectStart as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onConnectEnd={onConnectEnd as any}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDoubleClick={onPaneDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          defaultViewport={initial.viewport ?? { x: 0, y: 0, zoom: 1 }}
          fitView={!initial.nodes.length}
          deleteKeyCode={null}
          connectionMode={ConnectionMode.Loose}
          connectionRadius={diagramSettings.handleHitArea}
          selectionOnDrag={true}
          panOnDrag={[1, 2]}
          style={{ background: '#0f172a' }}
        >
          {diagramSettings.showBackground && <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={20} size={1} />}
          {diagramSettings.showControls && <Controls style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6 }} />}
          {diagramSettings.showMiniMap && (
            <MiniMap
              style={{ background: '#0f172a', border: '1px solid #1e293b' }}
              nodeColor={n => (n.data as DiagramNodeData).color ?? '#1e293b'}
            />
          )}

          {diagramSettings.showTopPanel && (
            <Panel position="top-center">
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '4px 8px', flexWrap: 'wrap' }}>
                <button style={btnStyle} onClick={undo} title={t.diagram.undoTitle}>{t.diagram.undo}</button>
                <button style={btnStyle} onClick={redo} title={t.diagram.redoTitle}>{t.diagram.redo}</button>
                <div style={{ width: 1, height: 20, background: '#1e293b' }} />

                <span style={{ fontSize: 11, color: '#64748b' }}>{t.diagram.arrow}</span>
                {(['default', 'straight', 'smoothstep'] as const).map(et => (
                  <button key={et} style={edgeType === et ? activeBtnStyle : btnStyle} onClick={() => setEdgeType(et)}>
                    {et === 'default' ? t.diagram.curved : et === 'straight' ? t.diagram.straight : t.diagram.orthogonal}
                  </button>
                ))}
                <div style={{ width: 1, height: 20, background: '#1e293b' }} />

                {/* Alignment dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    style={multiSelected ? activeBtnStyle : btnStyle}
                    onClick={() => setAlignOpen(o => !o)}
                    title={t.diagram.organizeTitle}
                  >
                    {t.diagram.organize}
                  </button>
                  {alignOpen && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setAlignOpen(false)} />
                      <div style={{
                        position: 'absolute', top: '110%', left: 0, zIndex: 50,
                        background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
                        padding: '6px 4px', minWidth: 180, display: 'flex', flexDirection: 'column', gap: 2,
                      }}>
                        <span style={{ fontSize: 10, color: '#475569', paddingLeft: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.diagram.alignSection}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: '2px 2px 4px' }}>
                          {alignActions.slice(0, 6).map(({ label, title, dir, min }) => (
                            <button
                              key={dir}
                              title={title}
                              style={selectedNodes.length >= min ? iconBtnActive : { ...iconBtnStyle, opacity: 0.4, cursor: 'not-allowed' }}
                              disabled={selectedNodes.length < min}
                              onClick={() => applyAlign(dir)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <span style={{ fontSize: 10, color: '#475569', paddingLeft: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.diagram.distributeSection}</span>
                        <div style={{ display: 'flex', gap: 2, padding: '2px 2px 4px' }}>
                          {alignActions.slice(6, 8).map(({ label, title, dir, min }) => (
                            <button
                              key={dir}
                              title={title}
                              style={selectedNodes.length >= min ? iconBtnActive : { ...iconBtnStyle, opacity: 0.4, cursor: 'not-allowed' }}
                              disabled={selectedNodes.length < min}
                              onClick={() => applyAlign(dir)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <span style={{ fontSize: 10, color: '#475569', paddingLeft: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.diagram.sizeSection}</span>
                        <div style={{ display: 'flex', gap: 2, padding: '2px 2px' }}>
                          {alignActions.slice(8).map(({ label, title, dir, min }) => (
                            <button
                              key={dir}
                              title={title}
                              style={selectedNodes.length >= min ? iconBtnStyle : disabledBtnStyle}
                              disabled={selectedNodes.length < min}
                              onClick={() => applyAlign(dir)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <div style={{ borderTop: '1px solid #334155', marginTop: 2, paddingTop: 4, paddingLeft: 6 }}>
                          <span style={{ fontSize: 9, color: '#334155' }}>Ctrl+Shift+L/R/T/B/H/V/D/G</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ width: 1, height: 20, background: '#1e293b' }} />

                {/* Export dropdown */}
                <div style={{ position: 'relative' }}>
                  <button style={activeBtnStyle} onClick={() => setExportOpen(o => !o)}>{t.diagram.export}</button>
                  {exportOpen && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setExportOpen(false)} />
                      <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 50, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: 4, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button style={btnStyle} onClick={() => doExport('png')}>📷 PNG</button>
                        <button style={btnStyle} onClick={() => doExport('svg')}>🖼 SVG</button>
                        <button style={btnStyle} onClick={() => doExport('mermaid')}>🧜 Mermaid</button>
                        <div style={{ padding: '4px 0 2px' }}>
                          <span style={{ fontSize: 10, color: '#64748b', paddingLeft: 4 }}>{t.diagram.codeLabel}</span>
                          <select
                            value={exportCodeLang}
                            onChange={e => setExportCodeLang(e.target.value as ExportCodeLang)}
                            style={{ display: 'block', width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#94a3b8', fontSize: 11, padding: '2px 4px', marginTop: 2 }}
                          >
                            <option value="python">Python</option>
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="pseudocode">{t.diagram.codePseudo}</option>
                          </select>
                          <button style={{ ...btnStyle, width: '100%', marginTop: 4 }} onClick={() => doExport('code')}>{t.diagram.generate}</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <button style={btnStyle} onClick={() => fitView({ duration: 300 })} title={t.diagram.fitViewTitle}>{t.diagram.fitView}</button>
              </div>
            </Panel>
          )}
        </ReactFlow>

        {/* Code output modal */}
        {codeModalOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }} onClick={() => setCodeModalOpen(false)} />
            <div style={{ position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, maxHeight: '80vh', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, zIndex: 101, display: 'flex', flexDirection: 'column', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{t.diagram.generatedCode}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btnStyle} onClick={() => navigator.clipboard?.writeText(codeOutput)}>{t.diagram.copy}</button>
                  <button style={btnStyle} onClick={() => setCodeModalOpen(false)}>✕</button>
                </div>
              </div>
              <pre style={{ flex: 1, overflowY: 'auto', background: '#1e293b', borderRadius: 6, padding: 12, color: '#e2e8f0', fontSize: 12, fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {codeOutput}
              </pre>
            </div>
          </>
        )}

        {/* Inline edge label editor */}
        {editingEdge && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 299 }}
              onClick={commitEdgeLabel}
            />
            <div style={{
              position: 'fixed',
              left: editingEdge.x - 80,
              top: editingEdge.y - 16,
              zIndex: 300,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <input
                ref={editInputRef}
                value={editingEdge.label}
                onChange={e => setEditingEdge(prev => prev ? { ...prev, label: e.target.value } : null)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); commitEdgeLabel(); }
                  if (e.key === 'Escape') { e.preventDefault(); setEditingEdge(null); }
                  e.stopPropagation();
                }}
                onBlur={commitEdgeLabel}
                placeholder={t.diagram.edgeLabelPlaceholder}
                style={{
                  background: '#1e293b',
                  border: '1px solid #60a5fa',
                  borderRadius: 4,
                  padding: '4px 8px',
                  color: '#e2e8f0',
                  fontSize: 12,
                  width: 180,
                  outline: 'none',
                  fontFamily: '"JetBrains Mono", monospace',
                  boxShadow: '0 0 0 2px #60a5fa33',
                }}
              />
              <span style={{ fontSize: 10, color: '#475569', paddingLeft: 2 }}>{t.diagram.edgeLabelHint}</span>
            </div>
          </>
        )}

        {/* Quick-connect picker */}
        {picker && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setPicker(null)} />
            <div style={{
              position: 'fixed',
              left: picker.x + 8,
              top: picker.y - 10,
              zIndex: 200,
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              maxHeight: 420,
              overflowY: 'auto',
            }}>
              <span style={{ color: '#64748b', fontSize: 10, userSelect: 'none' }}>{t.diagram.addNode}</span>

              {PICKER_GROUPS.map(group => (
                <div key={group.catKey}>
                  <div style={{ fontSize: 9, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{t.diagram[group.catKey]}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {group.types.map(type => (
                      <button
                        key={type}
                        onClick={() => addNodeFromPicker(type)}
                        style={{
                          background: NODE_DEFAULTS[type].color,
                          border: 'none',
                          borderRadius: 4,
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '4px 12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {t.diagram.nodeTypes[type]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {diagramSettings.showPropertiesPanel && (
        <PropertiesPanel node={selectedNode} edge={selectedEdge} />
      )}
    </div>
  );
}

interface Props {
  tabId: string;
  content: string;
}

export default function DiagramEditor({ tabId, content }: Props) {
  return (
    <ReactFlowProvider>
      <DiagramInner tabId={tabId} initialContent={content} />
    </ReactFlowProvider>
  );
}
