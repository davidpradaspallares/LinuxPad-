import { useState, useRef } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { DiagramNodeData } from '../types';

const HEADER_H = 30;

export default function SwimlaneNode({ id, data: rawData, selected }: NodeProps) {
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

  const color = data.color ?? '#1e293b';
  const borderColor = selected ? '#60a5fa' : 'rgba(255,255,255,0.2)';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minWidth: 200,
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'default',
        userSelect: 'none',
        border: `2px solid ${borderColor}`,
        borderRadius: 6,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <NodeResizer minWidth={200} minHeight={120} isVisible={selected} color="#60a5fa" />
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />

      {/* Header band */}
      <div
        onDoubleClick={startEdit}
        style={{
          background: color,
          height: HEADER_H,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${borderColor}`,
          padding: '0 10px',
        }}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontWeight: 700, fontSize: 12, textAlign: 'center', width: '100%' }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.label}</span>
        )}
      </div>

      {/* Body — transparent so nodes placed on top are visible */}
      <div style={{ flex: 1, background: 'rgba(30,41,59,0.18)' }} />
    </div>
  );
}
