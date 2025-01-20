export interface iQueryInput {
  text?: string;
  images?: string[];
  documents?: string[];
}

export interface iTool {
  name: string;
  tools: any[];
  description: string;
  enabled: boolean;
  icon: string;
}

export interface iStreamMessage {
  type: "text" | "tool_calls" | "tool_result" | "error" | "chat_info";
  content:
    | iTextContent
    | iErrorContent
    | iToolCallsContent
    | iToolResultContent
    | iChatInfoContent;
}

export type iTextContent = string;
export type iErrorContent = string;
export type iToolCallsContent = {
  name: string;
  arguments: any;
}[];
export type iToolResultContent = {
  name: string;
  result: any;
};
export type iChatInfoContent = {
  id: string;
  title: string;
};

export interface iServerConfig {
  enabled?: boolean;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface iConfig {
  mcpServers: {
    [key: string]: iServerConfig;
  };
}

export interface iModelConfig {
  model_settings: ModelSettings;
}

export interface ModelSettings {
  // 必要參數
  model: string; // 例如: "gpt-4", "claude-3-opus-20240229"
  modelProvider?: string; // 例如: "openai", "anthropic", "google-vertexai" 等
  apiKey?: string; // API金鑰
  configuration?: {
    baseURL: string;
  };
  // 常用可選參數
  temperature?: number; // 0-1 之間,控制輸出的隨機性
  topP?: number; // 0-1 之間
  maxTokens?: number; // 最大輸出token數
  // 支援動態存取
  [key: string]: string | number | undefined | { baseURL: string } | undefined;
}
