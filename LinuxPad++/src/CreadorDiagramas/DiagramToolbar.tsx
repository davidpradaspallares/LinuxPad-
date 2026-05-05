import type { DiagramNodeType } from './types';
import { NODE_DEFAULTS } from './types';

interface Props {
  onAddNode: (type: DiagramNodeType) => void;
}

type NodeEntry = { type: DiagramNodeType; label: string; shape: React.ReactNode };
type Category = { label: string; items: NodeEntry[] };

const c = (t: DiagramNodeType) => NODE_DEFAULTS[t].color;

const CATEGORIES: Category[] = [
  {
    label: 'Básicos',
    items: [
      {
        type: 'startend',
        label: 'Inicio/Fin',
        shape: (
          <div style={{ width: 68, height: 20, borderRadius: 999, background: c('startend'), border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>START</span>
          </div>
        ),
      },
      {
        type: 'process',
        label: 'Proceso',
        shape: (
          <div style={{ width: 68, height: 24, borderRadius: 4, background: c('process'), border: '2px solid rgba(255,255,255,0.2)' }} />
        ),
      },
      {
        type: 'decision',
        label: 'Decisión',
        shape: (
          <svg width={68} height={36} style={{ display: 'block' }}>
            <polygon points="34,2 66,18 34,34 2,18" fill={c('decision')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
          </svg>
        ),
      },
      {
        type: 'io',
        label: 'E / S',
        shape: (
          <svg width={68} height={26} style={{ display: 'block' }}>
            <polygon points="10,1 68,1 58,25 0,25" fill={c('io')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
          </svg>
        ),
      },
      {
        type: 'subprocess',
        label: 'Subproceso',
        shape: (
          <div style={{ width: 68, height: 24, borderRadius: 4, background: c('subprocess'), border: '2px solid rgba(255,255,255,0.2)', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 7, top: 2, bottom: 2, width: 2, background: 'rgba(255,255,255,0.4)' }} />
            <div style={{ position: 'absolute', right: 7, top: 2, bottom: 2, width: 2, background: 'rgba(255,255,255,0.4)' }} />
          </div>
        ),
      },
      {
        type: 'preparation',
        label: 'Preparación',
        shape: (
          <svg width={68} height={26} style={{ display: 'block' }}>
            <polygon points="14,1 54,1 67,13 54,25 14,25 1,13" fill={c('preparation')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Datos',
    items: [
      {
        type: 'database',
        label: 'Base de Datos',
        shape: (
          <svg width={52} height={38} style={{ display: 'block' }}>
            <line x1={2} y1={9} x2={2} y2={29} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            <line x1={50} y1={9} x2={50} y2={29} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            <rect x={2} y={9} width={48} height={20} fill={c('database')} />
            <ellipse cx={26} cy={29} rx={24} ry={9} fill={c('database')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            <ellipse cx={26} cy={9} rx={24} ry={9} fill={c('database')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
          </svg>
        ),
      },
      {
        type: 'document',
        label: 'Documento',
        shape: (
          <svg width={68} height={32} style={{ display: 'block' }}>
            <path d="M 2,2 L 66,2 L 66,20 Q 34,34 2,20 Z" fill={c('document')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
          </svg>
        ),
      },
      {
        type: 'multidocument',
        label: 'Multidoc.',
        shape: (
          <svg width={68} height={36} style={{ display: 'block' }}>
            <path d="M 12,2 L 66,2 L 66,22 Q 38,30 12,22 Z" fill={c('multidocument')} fillOpacity={0.4} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
            <path d="M 6,8 L 62,8 L 62,26 Q 34,36 6,26 Z" fill={c('multidocument')} fillOpacity={0.65} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
            <path d="M 2,14 L 56,14 L 56,30 Q 28,40 2,30 Z" fill={c('multidocument')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
          </svg>
        ),
      },
      {
        type: 'internal_storage',
        label: 'Alm. Interno',
        shape: (
          <svg width={68} height={28} style={{ display: 'block' }}>
            <rect x={2} y={2} width={64} height={24} fill={c('internal_storage')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} rx={2} />
            <line x1={2} y1={11} x2={66} y2={11} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
            <line x1={11} y1={2} x2={11} y2={26} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
          </svg>
        ),
      },
      {
        type: 'manual_input',
        label: 'E. Manual',
        shape: (
          <svg width={68} height={26} style={{ display: 'block' }}>
            <polygon points="1,1 67,8 67,25 1,25" fill={c('manual_input')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
          </svg>
        ),
      },
      {
        type: 'sequential_data',
        label: 'D. Secuencial',
        shape: (
          <svg width={30} height={30} style={{ display: 'block' }}>
            <circle cx={15} cy={15} r={13} fill={c('sequential_data')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            <circle cx={15} cy={15} r={4} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Conectores',
    items: [
      {
        type: 'page_connector',
        label: 'Conn. Página',
        shape: (
          <svg width={30} height={30} style={{ display: 'block' }}>
            <circle cx={15} cy={15} r={13} fill={c('page_connector')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
          </svg>
        ),
      },
      {
        type: 'offpage_connector',
        label: 'Fuera Página',
        shape: (
          <svg width={38} height={34} style={{ display: 'block' }}>
            <polygon points="2,2 36,2 36,22 19,32 2,22" fill={c('offpage_connector')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
          </svg>
        ),
      },
      {
        type: 'annotation',
        label: 'Anotación',
        shape: (
          <svg width={68} height={28} style={{ display: 'block' }}>
            <rect x={2} y={2} width={56} height={24} fill={c('annotation')} fillOpacity={0.5} rx={3} />
            <line x1={66} y1={2} x2={66} y2={26} stroke="rgba(255,255,255,0.4)" strokeWidth={2.5} />
            <line x1={56} y1={2} x2={66} y2={2} stroke="rgba(255,255,255,0.4)" strokeWidth={2.5} />
            <line x1={56} y1={26} x2={66} y2={26} stroke="rgba(255,255,255,0.4)" strokeWidth={2.5} />
          </svg>
        ),
      },
      {
        type: 'swimlane',
        label: 'Swimlane',
        shape: (
          <div style={{ width: 68, height: 34, border: '2px solid rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: c('swimlane'), height: 11, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.15)' }} />
            <div style={{ flex: 1, background: 'rgba(30,41,59,0.2)' }} />
          </div>
        ),
      },
      {
        type: 'summing_junction',
        label: 'Unión',
        shape: (
          <svg width={30} height={30} style={{ display: 'block' }}>
            <circle cx={15} cy={15} r={13} fill={c('summing_junction')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            <line x1={6} y1={6} x2={24} y2={24} stroke="rgba(255,255,255,0.7)" strokeWidth={2} />
            <line x1={24} y1={6} x2={6} y2={24} stroke="rgba(255,255,255,0.7)" strokeWidth={2} />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      {
        type: 'manual_operation',
        label: 'Op. Manual',
        shape: (
          <svg width={68} height={26} style={{ display: 'block' }}>
            <polygon points="1,1 67,1 54,25 14,25" fill={c('manual_operation')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
          </svg>
        ),
      },
      {
        type: 'delay',
        label: 'Retraso',
        shape: (
          <svg width={68} height={26} style={{ display: 'block' }}>
            <path d="M 2,2 L 55,2 A 11,11 0 0,1 55,24 L 2,24 Z" fill={c('delay')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
          </svg>
        ),
      },
      {
        type: 'display',
        label: 'Display',
        shape: (
          <svg width={68} height={26} style={{ display: 'block' }}>
            <path d="M 14,2 L 52,2 L 66,13 L 52,24 L 14,24 A 12,11 0 0,1 14,2 Z" fill={c('display')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
          </svg>
        ),
      },
      {
        type: 'reference',
        label: 'Referencia',
        shape: (
          <svg width={34} height={28} style={{ display: 'block' }}>
            <polygon points="2,2 32,14 2,26" fill={c('reference')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
          </svg>
        ),
      },
      {
        type: 'direct_access_storage',
        label: 'Acc. Directo',
        shape: (
          <svg width={68} height={28} style={{ display: 'block' }}>
            <rect x={14} y={2} width={40} height={24} fill={c('direct_access_storage')} />
            <line x1={14} y1={2} x2={54} y2={2} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            <line x1={14} y1={26} x2={54} y2={26} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            <ellipse cx={54} cy={14} rx={13} ry={12} fill={c('direct_access_storage')} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            <ellipse cx={14} cy={14} rx={13} ry={12} fill={c('direct_access_storage')} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="3 2" />
            <path d="M 14,2 A 13,12 0 0,0 14,26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
          </svg>
        ),
      },
    ],
  },
];

export default function DiagramToolbar({ onAddNode }: Props) {
  const handleDragStart = (e: React.DragEvent, type: DiagramNodeType) => {
    e.dataTransfer.setData('application/reactflow-nodetype', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{
      width: 104,
      flexShrink: 0,
      background: '#0f172a',
      borderRight: '1px solid #1e293b',
      padding: '8px 4px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      overflowY: 'auto',
    }}>
      {CATEGORIES.map(({ label, items }) => (
        <div key={label}>
          <span style={{
            fontSize: 9,
            color: '#475569',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            paddingLeft: 4,
            display: 'block',
            marginTop: 6,
            marginBottom: 2,
          }}>
            {label}
          </span>

          {items.map(({ type, label: nodeLabel, shape }) => (
            <button
              key={type}
              title={`Arrastrar o clic: ${NODE_DEFAULTS[type].label}`}
              draggable
              onDragStart={e => handleDragStart(e, type)}
              onClick={() => onAddNode(type)}
              style={{
                background: 'transparent',
                border: '1px solid #1e293b',
                borderRadius: 6,
                padding: '5px 4px',
                cursor: 'grab',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                width: '100%',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1e293b')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {shape}
              <span style={{ color: '#94a3b8', fontSize: 9, textAlign: 'center', lineHeight: 1.2 }}>{nodeLabel}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
