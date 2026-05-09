import { useEffect, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import type { DiagramNodeData } from './types';
import { useTranslation } from '../i18n';

interface Props {
  node: Node<DiagramNodeData> | null;
  edge: Edge | null;
}

export default function PropertiesPanel({ node, edge }: Props) {
  const { updateNodeData, setEdges } = useReactFlow();
  const t = useTranslation();

  // Node fields
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#1d4ed8');
  const [description, setDescription] = useState('');

  // Edge fields
  const [edgeLabel, setEdgeLabel] = useState('');

  useEffect(() => {
    if (!node) return;
    setLabel(node.data.label ?? '');
    setColor(node.data.color ?? '#1d4ed8');
    setDescription(node.data.description ?? '');
  }, [node?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!edge) return;
    setEdgeLabel(String(edge.label ?? ''));
  }, [edge?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const panelStyle: React.CSSProperties = {
    width: 200,
    flexShrink: 0,
    background: '#0f172a',
    borderLeft: '1px solid #1e293b',
    padding: 12,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  };

  const emptyStyle: React.CSSProperties = {
    ...panelStyle,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const rowStyle = { marginBottom: 12 };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, color: '#64748b', fontWeight: 600,
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#1e293b', border: '1px solid #334155',
    borderRadius: 4, padding: '5px 8px', color: '#e2e8f0', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  };
  const headerStyle: React.CSSProperties = {
    fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 12,
  };

  // Empty state
  if (!node && !edge) {
    return (
      <div style={emptyStyle}>
        <span style={{ color: '#475569', fontSize: 12, textAlign: 'center' }}>
          {t.properties.empty}
        </span>
      </div>
    );
  }

  // Edge mode
  if (edge && !node) {
    const applyEdgeLabel = () => {
      setEdges(es => es.map(e => e.id === edge.id ? { ...e, label: edgeLabel } : e));
    };

    return (
      <div style={panelStyle}>
        <span style={headerStyle}>{t.properties.connector}</span>

        <div style={rowStyle}>
          <label style={labelStyle}>{t.properties.label}</label>
          <input
            style={inputStyle}
            value={edgeLabel}
            onChange={e => setEdgeLabel(e.target.value)}
            onBlur={applyEdgeLabel}
            onKeyDown={e => {
              if (e.key === 'Enter') applyEdgeLabel();
            }}
            placeholder={t.properties.noLabel}
          />
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #1e293b' }}>
          <div style={{ fontSize: 10, color: '#475569' }}>
            <div>ID: {edge.id}</div>
            <div style={{ marginTop: 2 }}>{t.properties.type}: {edge.type ?? 'default'}</div>
            <div style={{ marginTop: 2 }}>{t.properties.from}: {edge.source}</div>
            <div style={{ marginTop: 2 }}>{t.properties.to}: {edge.target}</div>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: '#334155' }}>
            {t.properties.editInline}
          </div>
        </div>
      </div>
    );
  }

  // Node mode
  const applyNode = (patch: Partial<DiagramNodeData>) => {
    if (!node) return;
    updateNodeData(node.id, patch);
  };

  return (
    <div style={panelStyle}>
      <span style={headerStyle}>{t.properties.title}</span>

      <div style={rowStyle}>
        <label style={labelStyle}>{t.properties.label}</label>
        <input
          style={inputStyle}
          value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={() => applyNode({ label })}
          onKeyDown={e => { if (e.key === 'Enter') applyNode({ label }); }}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>{t.properties.color}</label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="color"
            value={color}
            onChange={e => { setColor(e.target.value); applyNode({ color: e.target.value }); }}
            style={{ width: 36, height: 32, borderRadius: 4, border: '1px solid #334155', background: 'none', cursor: 'pointer', padding: 2 }}
          />
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={color}
            onChange={e => setColor(e.target.value)}
            onBlur={() => { if (/^#[0-9a-fA-F]{6}$/.test(color)) applyNode({ color }); }}
          />
        </div>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>{t.properties.description}</label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }}
          value={description}
          onChange={e => setDescription(e.target.value)}
          onBlur={() => applyNode({ description })}
        />
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #1e293b' }}>
        <div style={{ fontSize: 10, color: '#475569' }}>
          <div>ID: {node!.id}</div>
          <div style={{ marginTop: 2 }}>{t.properties.type}: {node!.type}</div>
        </div>
      </div>
    </div>
  );
}
