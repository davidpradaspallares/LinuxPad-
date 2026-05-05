import { useState, useRef } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { DiagramNodeData } from '../types';

const W = 75;
const H = 75;
const R = W / 2 - 2;
const CX = W / 2;
const CY = H / 2;

export default function SequentialDataNode({ id, data: rawData, selected }: NodeProps) {
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

  const fill = data.color ?? '#065f46';
  const stroke = selected ? '#60a5fa' : 'rgba(255,255,255,0.2)';
  const innerR = Math.round(R / 3);

  return (
    <div
      onDoubleClick={startEdit}
      style={{ width: '100%', height: '100%', minWidth: 50, minHeight: 50, position: 'relative', cursor: 'default', userSelect: 'none' }}
    >
      <NodeResizer minWidth={50} minHeight={50} isVisible={selected} color="#60a5fa" />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <circle cx={CX} cy={CY} r={R} fill={fill} stroke={stroke} strokeWidth={2} />
        <circle cx={CX} cy={CY} r={innerR} fill="rgba(0,0,0,0.35)" stroke={stroke} strokeWidth={1.5} />
        {/* Three spokes to evoke a tape reel */}
        <line x1={CX} y1={CY - innerR} x2={CX} y2={CY - R + 3} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
        <line
          x1={CX + innerR * Math.cos(Math.PI / 6)}
          y1={CY + innerR * Math.sin(Math.PI / 6)}
          x2={CX + (R - 3) * Math.cos(Math.PI / 6)}
          y2={CY + (R - 3) * Math.sin(Math.PI / 6)}
          stroke="rgba(255,255,255,0.35)" strokeWidth={1.5}
        />
        <line
          x1={CX - innerR * Math.cos(Math.PI / 6)}
          y1={CY + innerR * Math.sin(Math.PI / 6)}
          x2={CX - (R - 3) * Math.cos(Math.PI / 6)}
          y2={CY + (R - 3) * Math.sin(Math.PI / 6)}
          stroke="rgba(255,255,255,0.35)" strokeWidth={1.5}
        />
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
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 10, textAlign: 'center', wordBreak: 'break-word' }}>{data.label}</span>
        )}
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}
