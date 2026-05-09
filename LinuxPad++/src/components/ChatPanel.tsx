import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Plus, X, Folder, FileText, LayoutList, Trash2, Loader2, Send, Clipboard } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useEditorStore } from '../stores/editorStore';
import { useTranslation } from '../i18n';
import type { AiConfig, AiProvider, ContextItem } from '../types/chat';
import type { FileEntry } from '../types';

async function callAI(
  config: AiConfig,
  messages: { role: string; content: string }[],
  systemPrompt?: string
): Promise<string> {
  if (config.provider === 'openai') {
    const apiMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openaiApiKey}`,
      },
      body: JSON.stringify({ model: config.openaiModel, messages: apiMessages }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content as string;
  } else if (config.provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.anthropicModel,
        max_tokens: 4096,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: messages.filter((m) => m.role !== 'system'),
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    return data.content[0].text as string;
  } else {
    const apiMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.deepseekApiKey}`,
      },
      body: JSON.stringify({ model: config.deepseekModel, messages: apiMessages }),
    });
    if (!res.ok) throw new Error(`DeepSeek ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content as string;
  }
}

async function loadContextContent(items: ContextItem[], tabs: ReturnType<typeof useEditorStore.getState>['tabs']): Promise<string> {
  const parts: string[] = [];
  for (const item of items) {
    try {
      if (item.type === 'tab') {
        const tab = tabs.find((t) => t.id === item.tabId);
        if (!tab) continue;
        parts.push(`--- ${item.label} ---\n${tab.content.slice(0, 5000)}`);
      } else if (item.type === 'file' && item.path) {
        const content = await invoke<string>('read_file', { path: item.path });
        parts.push(`--- ${item.label} ---\n${content.slice(0, 5000)}`);
      } else if (item.type === 'folder' && item.path) {
        const entries = await invoke<FileEntry[]>('list_directory', { path: item.path });
        const files = entries.filter((e) => !e.is_dir).slice(0, 20);
        for (const file of files) {
          try {
            const content = await invoke<string>('read_file', { path: file.path });
            const name = file.path.split('/').pop() ?? file.path;
            parts.push(`--- ${name} ---\n${content.slice(0, 3000)}`);
          } catch { /* skip unreadable files */ }
        }
      }
    } catch { /* skip failed items */ }
  }
  return parts.join('\n\n');
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*\n]+\*|_[^_\n]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok[0] === '`') {
      parts.push(<code key={idx++} style={{ background: '#0a1020', padding: '1px 5px', borderRadius: 3, color: '#7dd3fc', fontFamily: 'monospace', fontSize: '0.9em' }}>{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith('**') || tok.startsWith('__')) {
      parts.push(<strong key={idx++} style={{ color: '#f1f5f9', fontWeight: 700 }}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('~~')) {
      parts.push(<del key={idx++}>{tok.slice(2, -2)}</del>);
    } else {
      parts.push(<em key={idx++}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(
        <pre key={`cb${i}`} style={{ background: '#0a1020', padding: '8px 12px', borderRadius: 6, overflowX: 'auto', margin: '6px 0', border: '1px solid #1e293b' }}>
          <code style={{ color: '#7dd3fc', fontFamily: 'monospace', fontSize: 11 }}>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    const h1 = line.match(/^# (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);

    if (h3) {
      blocks.push(<div key={i} style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '8px 0 3px' }}>{renderInline(h3[1])}</div>);
    } else if (h2) {
      blocks.push(<div key={i} style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', margin: '10px 0 4px', paddingBottom: 3, borderBottom: '1px solid #334155' }}>{renderInline(h2[1])}</div>);
    } else if (h1) {
      blocks.push(<div key={i} style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: '10px 0 4px', paddingBottom: 4, borderBottom: '1px solid #475569' }}>{renderInline(h1[1])}</div>);
    } else if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push(<div key={i} style={{ borderTop: '1px solid #334155', margin: '10px 0' }} />);
    } else if (/^(\s*)[-*+] (.*)/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^(\s*)[-*+] (.*)/.test(lines[i])) {
        const lm = lines[i].match(/^(\s*)[-*+] (.*)/)!;
        items.push(<li key={i} style={{ marginLeft: lm[1].length * 8, marginBottom: 2 }}>{renderInline(lm[2])}</li>);
        i++;
      }
      blocks.push(<ul key={`ul${i}`} style={{ paddingLeft: 16, margin: '3px 0', listStyleType: 'disc', color: '#cbd5e1' }}>{items}</ul>);
      continue;
    } else if (/^\d+\. (.*)/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\. (.*)/.test(lines[i])) {
        const lm = lines[i].match(/^\d+\. (.*)/)!;
        items.push(<li key={i} style={{ marginBottom: 2 }}>{renderInline(lm[1])}</li>);
        i++;
      }
      blocks.push(<ol key={`ol${i}`} style={{ paddingLeft: 20, margin: '3px 0', color: '#cbd5e1' }}>{items}</ol>);
      continue;
    } else if (line.trim() !== '') {
      blocks.push(<div key={i} style={{ margin: '2px 0', lineHeight: 1.6 }}>{renderInline(line)}</div>);
    }

    i++;
  }

  return <div style={{ fontSize: 12, color: '#cbd5e1' }}>{blocks}</div>;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function getActiveModel(config: AiConfig): string {
  if (config.provider === 'openai') return config.openaiModel;
  if (config.provider === 'anthropic') return config.anthropicModel;
  return config.deepseekModel;
}

function setActiveModel(config: AiConfig, model: string): Partial<AiConfig> {
  if (config.provider === 'openai') return { openaiModel: model };
  if (config.provider === 'anthropic') return { anthropicModel: model };
  return { deepseekModel: model };
}

export default function ChatPanel() {
  const t = useTranslation();
  const tabs = useEditorStore((s) => s.tabs);
  const chatConversations = useEditorStore((s) => s.chatConversations);
  const activeChatId = useEditorStore((s) => s.activeChatId);
  const aiConfig = useEditorStore((s) => s.aiConfig);
  const chatPanelWidth = useEditorStore((s) => s.chatPanelWidth);
  const pendingChatInput = useEditorStore((s) => s.pendingChatInput);
  const setChatPanelOpen = useEditorStore((s) => s.setChatPanelOpen);
  const setChatPanelWidth = useEditorStore((s) => s.setChatPanelWidth);
  const newChatConversation = useEditorStore((s) => s.newChatConversation);
  const setActiveChatId = useEditorStore((s) => s.setActiveChatId);
  const deleteChatConversation = useEditorStore((s) => s.deleteChatConversation);
  const addChatMessage = useEditorStore((s) => s.addChatMessage);
  const addContextItem = useEditorStore((s) => s.addContextItem);
  const removeContextItem = useEditorStore((s) => s.removeContextItem);
  const updateChatConversationTitle = useEditorStore((s) => s.updateChatConversationTitle);
  const setAiConfig = useEditorStore((s) => s.setAiConfig);
  const setPendingChatInput = useEditorStore((s) => s.setPendingChatInput);

  const activeConversation = chatConversations.find((c) => c.id === activeChatId) ?? null;

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConvList, setShowConvList] = useState(false);
  const [showTabPicker, setShowTabPicker] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [contextModalText, setContextModalText] = useState('');
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [contextCopied, setContextCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const convListRef = useRef<HTMLDivElement>(null);
  const tabPickerRef = useRef<HTMLDivElement>(null);

  // Resize drag state
  const resizeDragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages.length, isLoading]);

  useEffect(() => {
    if (!pendingChatInput) return;
    const quote = pendingChatInput.split('\n').map((l) => `> ${l}`).join('\n');
    setInputText((prev) => (prev ? `${prev}\n\n${quote}\n\n` : `${quote}\n\n`));
    setPendingChatInput(null);
    textareaRef.current?.focus();
  }, [pendingChatInput, setPendingChatInput]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (convListRef.current && !convListRef.current.contains(e.target as Node)) {
        setShowConvList(false);
      }
      if (tabPickerRef.current && !tabPickerRef.current.contains(e.target as Node)) {
        setShowTabPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Resize mouse events
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizeDragRef.current) return;
      const { startX, startWidth } = resizeDragRef.current;
      setChatPanelWidth(startWidth + (startX - e.clientX));
    };
    const onMouseUp = () => {
      resizeDragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [setChatPanelWidth]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeDragRef.current = { startX: e.clientX, startWidth: chatPanelWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [chatPanelWidth]);

  const getOrCreateConvId = useCallback((): string => {
    if (activeChatId) return activeChatId;
    newChatConversation();
    return useEditorStore.getState().activeChatId!;
  }, [activeChatId, newChatConversation]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;

    const activeKey =
      aiConfig.provider === 'openai' ? aiConfig.openaiApiKey
      : aiConfig.provider === 'anthropic' ? aiConfig.anthropicApiKey
      : aiConfig.deepseekApiKey;

    if (!activeKey) {
      setError(t.chat.errorNoKey);
      return;
    }

    const convId = getOrCreateConvId();
    const isFirst = (useEditorStore.getState().chatConversations.find((c) => c.id === convId)?.messages.length ?? 0) === 0;

    addChatMessage(convId, { role: 'user', content: text });
    if (isFirst) updateChatConversationTitle(convId, text.slice(0, 40));
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const currentTabs = useEditorStore.getState().tabs;
      const conv = useEditorStore.getState().chatConversations.find((c) => c.id === convId);
      const systemPrompt = conv ? await loadContextContent(conv.contextItems, currentTabs) : '';

      const apiMessages = (conv?.messages ?? []).map((m) => ({ role: m.role, content: m.content }));
      const reply = await callAI(aiConfig, apiMessages, systemPrompt || undefined);
      addChatMessage(convId, { role: 'assistant', content: reply });
    } catch {
      setError(t.chat.errorRequest);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, aiConfig, getOrCreateConvId, addChatMessage, updateChatConversationTitle, t]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddFolder = async () => {
    const convId = getOrCreateConvId();
    const selected = await open({ directory: true, multiple: false });
    if (selected && typeof selected === 'string') {
      const label = selected.split('/').pop() ?? selected;
      addContextItem(convId, { type: 'folder', label, path: selected, tabId: null });
    }
  };

  const handleAddFile = async () => {
    const convId = getOrCreateConvId();
    const selected = await open({ multiple: false });
    if (selected && typeof selected === 'string') {
      const label = selected.split('/').pop() ?? selected;
      addContextItem(convId, { type: 'file', label, path: selected, tabId: null });
    }
  };

  const handleAddTab = (tab: typeof tabs[0]) => {
    const convId = getOrCreateConvId();
    addContextItem(convId, { type: 'tab', label: tab.title, path: tab.path, tabId: tab.id });
    setShowTabPicker(false);
  };

  const handleGenerateContext = useCallback(async () => {
    if (!activeConversation || activeConversation.contextItems.length === 0) return;
    setIsGeneratingContext(true);
    try {
      const currentTabs = useEditorStore.getState().tabs;
      const rawContent = await loadContextContent(activeConversation.contextItems, currentTabs);
      const n = activeConversation.contextItems.length;
      const header =
        `# Contexto del proyecto (${n} elemento${n !== 1 ? 's' : ''})\n` +
        `# Generado por LinuxPad++\n` +
        `# ──────────────────────────────────────\n\n`;
      const footer =
        `\n\n# ──────────────────────────────────────\n` +
        `# Fin del contexto. Escribe tu pregunta a continuación.`;
      setContextModalText(header + rawContent + footer);
      setShowContextModal(true);
    } finally {
      setIsGeneratingContext(false);
    }
  }, [activeConversation]);

  const btnStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
  };

  const PROVIDER_LABELS: Record<AiProvider, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    deepseek: 'DeepSeek',
  };

  const PROVIDER_MODELS: Record<AiProvider, string[]> = {
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o3-mini'],
    anthropic: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-3-5-sonnet-20241022'],
    deepseek: ['deepseek-v4-pro', 'deepseek-v4-flash', 'deepseek-chat', 'deepseek-reasoner', 'deepseek-v2.5'],
  };

  return (
    <div style={{ position: 'relative', width: chatPanelWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', background: '#0f172a', borderLeft: '1px solid #1e293b' }}>

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
          cursor: 'col-resize', zIndex: 10,
          background: 'transparent',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#3b82f640'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
      />

      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2, padding: '6px 8px', background: '#0a1020', borderBottom: '1px solid #1e293b' }}>
        <div style={{ position: 'relative' }} ref={convListRef}>
          <button
            style={{ ...btnStyle, color: showConvList ? '#94a3b8' : '#64748b' }}
            onClick={() => setShowConvList((v) => !v)}
            title={t.chat.conversations}
          >
            <MessageSquare size={14} />
          </button>

          {showConvList && (
            <div style={{
              position: 'absolute', left: 0, top: '100%', zIndex: 50,
              background: '#0a1020', border: '1px solid #1e293b', borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)', minWidth: 220, maxHeight: 240, overflowY: 'auto',
            }}>
              {chatConversations.length === 0 ? (
                <div style={{ padding: '8px 12px', fontSize: 11, color: '#475569' }}>{t.chat.emptyConversation}</div>
              ) : (
                chatConversations.map((conv) => (
                  <div
                    key={conv.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '6px 10px', cursor: 'pointer',
                      background: conv.id === activeChatId ? '#1e293b' : 'transparent',
                      borderBottom: '1px solid #1e293b',
                    }}
                    onMouseEnter={(e) => { if (conv.id !== activeChatId) (e.currentTarget as HTMLDivElement).style.background = '#111827'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = conv.id === activeChatId ? '#1e293b' : 'transparent'; }}
                    onClick={() => { setActiveChatId(conv.id); setShowConvList(false); }}
                  >
                    <span style={{ flex: 1, fontSize: 12, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.title}
                    </span>
                    <button
                      style={{ ...btnStyle, padding: 2, color: '#475569' }}
                      title={t.chat.deleteConversation}
                      onClick={(e) => { e.stopPropagation(); deleteChatConversation(conv.id); }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <span style={{ flex: 1, fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 2 }}>
          {activeConversation?.title ?? t.chat.conversations}
        </span>

        <button
          style={btnStyle}
          title={t.chat.newConversation}
          onClick={newChatConversation}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
        >
          <Plus size={14} />
        </button>
        <button
          style={btnStyle}
          onClick={() => setChatPanelOpen(false)}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Model selector bar */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: '#0a1020', borderBottom: '1px solid #1e293b' }}>
        <select
          value={aiConfig.provider}
          onChange={(e) => setAiConfig({ provider: e.target.value as AiProvider })}
          style={{
            background: '#0f172a', border: '1px solid #1e293b', borderRadius: 4,
            color: '#94a3b8', fontSize: 10, padding: '2px 4px', cursor: 'pointer',
            outline: 'none', flexShrink: 0,
          }}
        >
          {(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((p) => (
            <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
          ))}
        </select>
        <select
          value={getActiveModel(aiConfig)}
          onChange={(e) => setAiConfig(setActiveModel(aiConfig, e.target.value))}
          style={{
            flex: 1, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 4,
            color: '#94a3b8', fontSize: 10, padding: '2px 4px', outline: 'none',
            cursor: 'pointer', minWidth: 0,
          }}
        >
          {PROVIDER_MODELS[aiConfig.provider].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Context bar */}
      <div style={{ flexShrink: 0, padding: '4px 8px', borderBottom: '1px solid rgba(30,41,59,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {t.chat.contextSection}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
            <button
              style={btnStyle}
              title={t.chat.addFolderContext}
              onClick={handleAddFolder}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
            >
              <Folder size={13} />
            </button>
            <button
              style={btnStyle}
              title={t.chat.addFileContext}
              onClick={handleAddFile}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
            >
              <FileText size={13} />
            </button>
            <div style={{ position: 'relative' }} ref={tabPickerRef}>
              <button
                style={{ ...btnStyle, color: showTabPicker ? '#94a3b8' : '#64748b' }}
                title={t.chat.addTabContext}
                onClick={() => setShowTabPicker((v) => !v)}
              >
                <LayoutList size={13} />
              </button>
              {showTabPicker && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', zIndex: 50,
                  background: '#0a1020', border: '1px solid #1e293b', borderRadius: 6,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)', minWidth: 200, maxHeight: 200, overflowY: 'auto',
                }}>
                  {tabs.length === 0 ? (
                    <div style={{ padding: '8px 12px', fontSize: 11, color: '#475569' }}>{t.chat.noOpenTabs}</div>
                  ) : (
                    tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleAddTab(tab)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '6px 12px', background: 'transparent', border: 'none',
                          cursor: 'pointer', fontSize: 12, color: '#cbd5e1',
                          borderBottom: '1px solid #1e293b',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1e293b'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        {tab.title}{tab.isDirty ? ' ●' : ''}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {activeConversation && activeConversation.contextItems.length > 0 && (
              <button
                style={{ ...btnStyle, color: isGeneratingContext ? '#475569' : '#3b82f6' }}
                title={t.chat.generateContextTitle}
                onClick={handleGenerateContext}
                disabled={isGeneratingContext}
                onMouseEnter={(e) => { if (!isGeneratingContext) (e.currentTarget as HTMLButtonElement).style.color = '#60a5fa'; }}
                onMouseLeave={(e) => { if (!isGeneratingContext) (e.currentTarget as HTMLButtonElement).style.color = '#3b82f6'; }}
              >
                {isGeneratingContext
                  ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Clipboard size={13} />}
              </button>
            )}
          </div>
        </div>

        {activeConversation && activeConversation.contextItems.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {activeConversation.contextItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  background: '#1e293b', borderRadius: 999,
                  padding: '2px 8px 2px 6px', fontSize: 10, color: '#94a3b8',
                  maxWidth: 120,
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.label}>
                  {item.label}
                </span>
                <button
                  style={{ ...btnStyle, padding: 0, color: '#475569' }}
                  title={t.chat.removeContext}
                  onClick={() => activeConversation && removeContextItem(activeConversation.id, item.id)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: 10, color: '#334155' }}>{t.chat.noContext}</span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!activeConversation || activeConversation.messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: '#334155', textAlign: 'center' }}>{t.chat.emptyConversation}</span>
          </div>
        ) : (
          activeConversation.messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <span style={{ fontSize: 9, color: '#475569', marginBottom: 2, paddingInline: 4 }}>
                {msg.role === 'user' ? t.chat.youLabel : t.chat.aiLabel} · {formatTime(msg.createdAt)}
              </span>
              <div style={{
                maxWidth: '90%', padding: '6px 10px', borderRadius: 12,
                borderTopRightRadius: msg.role === 'user' ? 3 : 12,
                borderTopLeftRadius: msg.role === 'assistant' ? 3 : 12,
                background: msg.role === 'user' ? 'rgba(37,99,235,0.35)' : '#1e293b',
                color: '#e2e8f0', fontSize: 12, lineHeight: 1.5,
                wordBreak: 'break-word',
              }}>
                {msg.role === 'assistant'
                  ? <MarkdownRenderer content={msg.content} />
                  : <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Loader2 size={13} style={{ color: '#475569', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 11, color: '#475569' }}>{t.chat.loading}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Context modal */}
      {showContextModal && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: 'rgba(10,16,32,0.92)',
            display: 'flex', flexDirection: 'column', padding: 12,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowContextModal(false); }}
        >
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden',
          }}>
            <div style={{
              flexShrink: 0, display: 'flex', alignItems: 'center',
              padding: '6px 10px', background: '#0a1020', borderBottom: '1px solid #1e293b',
            }}>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
                {t.chat.generatedContextModal}
              </span>
              <button
                style={{ ...btnStyle, color: '#64748b' }}
                title={t.chat.closeModal}
                onClick={() => setShowContextModal(false)}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
              >
                <X size={14} />
              </button>
            </div>
            <textarea
              readOnly
              value={contextModalText}
              style={{
                flex: 1, resize: 'none', background: '#0a1020', border: 'none', outline: 'none',
                padding: '8px 10px', color: '#cbd5e1', fontSize: 11,
                fontFamily: 'monospace', lineHeight: 1.6, overflowY: 'auto',
              }}
            />
            <div style={{
              flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: 6,
              padding: '6px 10px', background: '#0a1020', borderTop: '1px solid #1e293b',
            }}>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(contextModalText);
                  setContextCopied(true);
                  setTimeout(() => setContextCopied(false), 2000);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
                  background: contextCopied ? '#166534' : '#2563eb',
                  color: '#fff', fontSize: 11, fontWeight: 600, transition: 'background 0.15s',
                }}
              >
                <Clipboard size={11} />
                {contextCopied ? t.chat.copiedContext : t.chat.copyContext}
              </button>
              <button
                onClick={() => setShowContextModal(false)}
                style={{
                  padding: '4px 10px', borderRadius: 5, border: '1px solid #1e293b',
                  cursor: 'pointer', background: 'transparent', color: '#64748b', fontSize: 11,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
              >
                {t.chat.closeModal}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ flexShrink: 0, padding: 8, borderTop: '1px solid #1e293b' }}>
        <textarea
          ref={textareaRef}
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.chat.inputPlaceholder}
          style={{
            width: '100%', resize: 'none', background: '#0a1020',
            border: '1px solid #1e293b', borderRadius: 6,
            padding: '6px 8px', color: '#e2e8f0', fontSize: 12,
            outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
          onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#3b82f6'; }}
          onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#1e293b'; }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, gap: 6 }}>
          {error && <span style={{ flex: 1, fontSize: 10, color: '#f87171', alignSelf: 'center' }}>{error}</span>}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
              background: !inputText.trim() || isLoading ? '#1e293b' : '#2563eb',
              color: !inputText.trim() || isLoading ? '#475569' : '#fff',
              fontSize: 11, fontWeight: 600, transition: 'background 0.1s',
            }}
          >
            <Send size={11} />
            {t.chat.send}
          </button>
        </div>
      </div>
    </div>
  );
}
