import { ToolDefinition } from "@langchain/core/language_models/base";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { handleConnectToServer } from "../connectServer.js";
import { IMCPServerManager } from "./interface.js";
import logger from "../utils/logger.js";
import { convertToOpenAITools, loadConfigAndServers } from "../utils/toolHandler.js";
import { iServerConfig, iTool } from "../utils/types.js";

export class MCPServerManager implements IMCPServerManager {
  private static instance: MCPServerManager;
  private servers: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();
  private toolToServerMap: Map<string, Client> = new Map();
  private availableTools: ToolDefinition[] = [];
  private toolInfos: iTool[] = [];
  public configPath: string;

  private constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), "config.json");
  }

  public static getInstance(configPath?: string): MCPServerManager {
    if (!MCPServerManager.instance) {
      MCPServerManager.instance = new MCPServerManager(configPath);
    } else if (configPath && configPath !== MCPServerManager.instance.configPath) {
      // 如果提供了新的配置路徑且與當前不同，更新配置並重新初始化
      MCPServerManager.instance.configPath = configPath;
      MCPServerManager.instance.initialize().catch((error) => {
        logger.error("Failed to reinitialize MCPServerManager:", error);
      });
    }
    return MCPServerManager.instance;
  }

  async initialize(): Promise<void> {
    // 清空所有狀態
    this.servers.clear();
    this.transports.clear();
    this.toolToServerMap.clear();
    this.availableTools = [];
    this.toolInfos = [];

    // 載入並連接所有伺服器
    await this.connectAllServers();
  }

  async connectAllServers(): Promise<void> {
    const { config, servers } = await loadConfigAndServers(this.configPath);
    logger.info(`Connect to ${servers.length} enabled servers...`);

    for (const serverName of servers) {
      try {
        await this.connectSingleServer(serverName, config.mcpServers[serverName]);
      } catch (error) {
        logger.error(`Failed to connect to ${serverName}:`, error);
      }
    }

    logger.info("Connect all MCP servers completed");

    logger.info("All available tools:");
    for (const [serverName, client] of this.servers) {
      const response = await client.listTools();
      logger.info(`${serverName}:`);
      const capabilities = await client.getServerCapabilities();
      const tools_ = [] as { name: string; description: string | undefined }[];

      response.tools.forEach((tool) => {
        logger.info(`  - ${tool.name}`);
        tools_.push({ name: tool.name, description: tool.description });
      });

      this.toolInfos.push({
        name: serverName,
        description: (capabilities?.description as string) || "",
        tools: tools_,
        enabled: true,
        icon: (capabilities?.icon as string) || "",
      });
    }
  }

  async connectSingleServer(serverName: string, config: iServerConfig): Promise<void> {
    try {
      const { client, transport } = await handleConnectToServer(serverName, config);
      this.servers.set(serverName, client);
      this.transports.set(serverName, transport);

      // 載入伺服器工具
      const response = await client.listTools();
      if (config.enabled) {
        const langChainTools = convertToOpenAITools(response.tools);
        this.availableTools.push(...langChainTools);

        // 記錄工具與伺服器的對應關係
        response.tools.forEach((tool) => {
          this.toolToServerMap.set(tool.name, client);
        });
      }

      logger.info(`Connected to ${serverName} and loaded ${response.tools.length} tools`);
    } catch (error) {
      logger.error(`Failed to connect to ${serverName}:`, error);
      throw error;
    }
  }

  getAvailableTools(): ToolDefinition[] {
    return this.availableTools;
  }

  getToolInfos(): iTool[] {
    return this.toolInfos;
  }

  getToolToServerMap(): Map<string, Client> {
    return this.toolToServerMap;
  }

  async disconnectAllServers(): Promise<void> {
    logger.info("Disconnect all MCP servers...");
    for (const serverName of this.servers.keys()) {
      const transport = this.transports.get(serverName);
      if (transport) {
        await transport.close();
      }
    }
    this.servers.clear();
    this.transports.clear();
    this.toolToServerMap.clear();
    this.availableTools = [];
    this.toolInfos = [];
    logger.info("Disconnect all MCP servers completed");
  }

  async reconnectServers(): Promise<void> {
    logger.info("Reconnect all MCP servers...");
    await this.disconnectAllServers();
    await this.connectAllServers();
    logger.info("Reconnect all MCP servers completed");
  }
}
