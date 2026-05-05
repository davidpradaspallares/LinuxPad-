import { useState, useRef } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { DiagramNodeData } from '../types';

export default function SubprocessNode({ id, data: rawData, selected }: NodeProps) {
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

  return (
    <div
      onDoubleClick={startEdit}
      style={{
        background: data.color ?? '#0f766e',
        borderRadius: 4,
        border: selected ? '2px solid #60a5fa' : '2px solid rgba(255,255,255,0.2)',
        minWidth: 140,
        minHeight: 50,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 28px',
        cursor: 'default',
        userSelect: 'none',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <NodeResizer minWidth={100} minHeight={40} isVisible={selected} color="#60a5fa" />
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />

      <div style={{ position: 'absolute', left: 10, top: 4, bottom: 4, width: 2, background: 'rgba(255,255,255,0.45)', borderRadius: 1 }} />
      <div style={{ position: 'absolute', right: 10, top: 4, bottom: 4, width: 2, background: 'rgba(255,255,255,0.45)', borderRadius: 1 }} />

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontWeight: 600, fontSize: 13, textAlign: 'center', width: '100%' }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 13, textAlign: 'center', wordBreak: 'break-word' }}>{data.label}</span>
      )}
    </div>
  );
}
