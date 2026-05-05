import { useState, useRef } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { DiagramNodeData } from '../types';

const W = 110;
const H = 60;
const EX = 18; // ellipse x-radius for the ends

export default function DirectAccessStorageNode({ id, data: rawData, selected }: NodeProps) {
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

  const fill = data.color ?? '#7f1d1d';
  const stroke = selected ? '#60a5fa' : 'rgba(255,255,255,0.2)';
  const cy = H / 2;
  const ey = H / 2 - 2;

  return (
    <div
      onDoubleClick={startEdit}
      style={{ width: '100%', height: '100%', minWidth: 70, minHeight: 44, position: 'relative', cursor: 'default', userSelect: 'none' }}
    >
      <NodeResizer minWidth={70} minHeight={44} isVisible={selected} color="#60a5fa" />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {/* Body rectangle */}
        <rect x={EX} y={2} width={W - 2 * EX} height={H - 4} fill={fill} />
        {/* Top and bottom edges */}
        <line x1={EX} y1={2} x2={W - EX} y2={2} stroke={stroke} strokeWidth={2} />
        <line x1={EX} y1={H - 2} x2={W - EX} y2={H - 2} stroke={stroke} strokeWidth={2} />
        {/* Right cap ellipse */}
        <ellipse cx={W - EX} cy={cy} rx={EX} ry={ey} fill={fill} stroke={stroke} strokeWidth={2} />
        {/* Left cap ellipse (visible arc only — back side) */}
        <ellipse cx={EX} cy={cy} rx={EX} ry={ey} fill={fill} stroke={stroke} strokeWidth={1.5} strokeDasharray="4 2" />
        {/* Front left cap — solid half */}
        <path d={`M ${EX},2 A ${EX},${ey} 0 0,0 ${EX},${H - 2}`} fill="none" stroke={stroke} strokeWidth={2} />
      </svg>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, padding: `4px ${EX + 4}px` }}>
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
