import { useState, useRef } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { DiagramNodeData } from '../types';

const W = 150;
const H = 70;

export default function AnnotationNode({ id, data: rawData, selected }: NodeProps) {
  const data = rawData as DiagramNodeData;
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(data.label);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    setEditing(false);
    if (draft.trim()) updateNodeData(id, { label: draft.trim() });
    else setDraft(data.label);
  };

  const fill = data.color ?? '#334155';
  const stroke = selected ? '#60a5fa' : 'rgba(255,255,255,0.35)';

  return (
    <div
      onDoubleClick={startEdit}
      style={{ width: '100%', height: '100%', minWidth: 80, minHeight: 44, position: 'relative', cursor: 'default', userSelect: 'none' }}
    >
      <NodeResizer minWidth={80} minHeight={44} isVisible={selected} color="#60a5fa" />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {/* Semi-transparent background */}
        <rect x={2} y={2} width={W - 16} height={H - 4} fill={fill} fillOpacity={0.5} rx={3} />
        {/* Right-side bracket: vertical + top/bottom serifs */}
        <line x1={W - 2} y1={2} x2={W - 2} y2={H - 2} stroke={stroke} strokeWidth={2.5} />
        <line x1={W - 14} y1={2} x2={W - 2} y2={2} stroke={stroke} strokeWidth={2.5} />
        <line x1={W - 14} y1={H - 2} x2={W - 2} y2={H - 2} stroke={stroke} strokeWidth={2.5} />
      </svg>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, padding: '6px 20px 6px 10px' }}>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontWeight: 500, fontSize: 12, textAlign: 'left', width: '100%' }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 12, textAlign: 'left', wordBreak: 'break-word', width: '100%' }}>{data.label}</span>
        )}
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}
