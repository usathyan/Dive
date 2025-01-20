import { ToolDefinition } from "@langchain/core/language_models/base";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { iConfig } from "./types.js";

export function convertToOpenAITools(tools: Tool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: { ...tool.inputSchema, additionalProperties: false },
    },
  }));
}

// Read configuration file
export async function loadConfig(customPath?: string): Promise<iConfig> {
  try {
    const configPath = customPath || path.join(process.cwd(), "config.json");
    const configContent = await fs.readFile(configPath, "utf-8");
    return JSON.parse(configContent);
  } catch (error) {
    return { mcpServers: {} };
  }
}

// List all available servers
export async function loadConfigAndServers(customPath?: string): Promise<{ config: iConfig; servers: string[] }> {
  const config = await loadConfig(customPath);
  return { config, servers: Object.keys(config.mcpServers) };
}
