export type AiProvider = 'openai' | 'anthropic' | 'deepseek';
export type ContextItemType = 'folder' | 'file' | 'tab';

export interface AiConfig {
  provider: AiProvider;
  openaiApiKey: string;
  openaiModel: string;
  anthropicApiKey: string;
  anthropicModel: string;
  deepseekApiKey: string;
  deepseekModel: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface ContextItem {
  id: string;
  type: ContextItemType;
  label: string;
  path: string | null;
  tabId: string | null;
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  contextItems: ContextItem[];
}
