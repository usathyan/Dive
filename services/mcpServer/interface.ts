import { ToolDefinition } from "@langchain/core/language_models/base";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { iServerConfig, iTool } from "../utils/types.js";

export interface ServerConfig {
  enabled: boolean;
  command: string;
  cwd?: string;
  args?: string[];
}

export interface IMCPServerManager {
  // 初始化
  initialize(): Promise<void>;

  // 伺服器連接管理
  connectAllServers(): Promise<void>;
  connectSingleServer(serverName: string, config: iServerConfig): Promise<void>;
  reconnectServers(): Promise<void>;

  // 工具管理
  getAvailableTools(): ToolDefinition[];
  getToolToServerMap(): Map<string, Client>;
  getToolInfos(): iTool[];

  // 中斷連線並清理資源
  disconnectAllServers(): Promise<void>;
}
