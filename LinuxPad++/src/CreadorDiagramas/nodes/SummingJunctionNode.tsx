import { useState, useRef } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { DiagramNodeData } from '../types';

const W = 65;
const H = 65;
const R = W / 2 - 2;
const CX = W / 2;
const CY = H / 2;

export default function SummingJunctionNode({ id, data: rawData, selected }: NodeProps) {
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

  const fill = data.color ?? '#4b5563';
  const stroke = selected ? '#60a5fa' : 'rgba(255,255,255,0.2)';
  const offset = Math.round(R * 0.7);

  return (
    <div
      onDoubleClick={startEdit}
      style={{ width: '100%', height: '100%', minWidth: 40, minHeight: 40, position: 'relative', cursor: 'default', userSelect: 'none' }}
    >
      <NodeResizer minWidth={40} minHeight={40} isVisible={selected} color="#60a5fa" />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <circle cx={CX} cy={CY} r={R} fill={fill} stroke={stroke} strokeWidth={2} />
        <line x1={CX - offset} y1={CY - offset} x2={CX + offset} y2={CY + offset} stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} />
        <line x1={CX + offset} y1={CY - offset} x2={CX - offset} y2={CY + offset} stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} />
      </svg>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, padding: '4px' }}>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontWeight: 600, fontSize: 10, textAlign: 'center', width: '100%' }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span style={{ color: 'transparent', fontSize: 10 }}>{data.label}</span>
        )}
      </div>

      <Handle type="target" position={Position.Top} style={{ left: '50%' }} />
      <Handle type="source" position={Position.Bottom} style={{ left: '50%' }} />
      <Handle type="source" position={Position.Left} id="left" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Right} id="right" style={{ top: '50%' }} />
    </div>
  );
}
