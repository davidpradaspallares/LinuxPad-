import { useState, useRef } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { DiagramNodeData } from '../types';

const W = 120;
const H = 80;
const EY = 12;

export default function DatabaseNode({ id, data: rawData, selected }: NodeProps) {
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

  const fill = data.color ?? '#6d28d9';
  const stroke = selected ? '#60a5fa' : 'rgba(255,255,255,0.2)';

  return (
    <div
      onDoubleClick={startEdit}
      style={{ width: '100%', height: '100%', minWidth: 60, minHeight: 50, position: 'relative', cursor: 'default', userSelect: 'none' }}
    >
      <NodeResizer minWidth={60} minHeight={50} isVisible={selected} color="#60a5fa" />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <line x1={2} y1={EY} x2={2} y2={H - EY} stroke={stroke} strokeWidth={2} />
        <line x1={W - 2} y1={EY} x2={W - 2} y2={H - EY} stroke={stroke} strokeWidth={2} />
        <rect x={2} y={EY} width={W - 4} height={H - 2 * EY} fill={fill} />
        <ellipse cx={W / 2} cy={H - EY} rx={W / 2 - 2} ry={EY} fill={fill} stroke={stroke} strokeWidth={2} />
        <ellipse cx={W / 2} cy={EY} rx={W / 2 - 2} ry={EY} fill={fill} stroke={stroke} strokeWidth={2} />
      </svg>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, padding: `${EY + 4}px 10px` }}>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontWeight: 600, fontSize: 12, textAlign: 'center', width: '100%' }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 12, textAlign: 'center', wordBreak: 'break-word' }}>{data.label}</span>
        )}
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}
