import { useState, useRef } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { DiagramNodeData } from '../types';

const W = 150;
const H = 80;

export default function MultiDocumentNode({ id, data: rawData, selected }: NodeProps) {
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

  const fill = data.color ?? '#9d174d';
  const stroke = selected ? '#60a5fa' : 'rgba(255,255,255,0.2)';

  // Back doc (shifted right+down, partial rectangle)
  const d3 = `M 18,2 L ${W - 2},2 L ${W - 2},${H - 20} Q ${(W + 18) / 2},${H - 8} 18,${H - 20} Z`;
  // Middle doc
  const d2 = `M 9,9 L ${W - 9},9 L ${W - 9},${H - 12} Q ${W / 2},${H - 1} 9,${H - 12} Z`;
  // Front doc (shifted left+up)
  const d1 = `M 2,16 L ${W - 16},16 L ${W - 16},${H - 4} Q ${(W - 14) / 2},${H + 7} 2,${H - 4} Z`;

  return (
    <div
      onDoubleClick={startEdit}
      style={{ width: '100%', height: '100%', minWidth: 80, minHeight: 50, position: 'relative', cursor: 'default', userSelect: 'none' }}
    >
      <NodeResizer minWidth={80} minHeight={50} isVisible={selected} color="#60a5fa" />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <path d={d3} fill={fill} fillOpacity={0.35} stroke={stroke} strokeWidth={1.5} />
        <path d={d2} fill={fill} fillOpacity={0.6} stroke={stroke} strokeWidth={1.5} />
        <path d={d1} fill={fill} stroke={stroke} strokeWidth={2} />
      </svg>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, padding: '16px 20px 14px 4px' }}>
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
