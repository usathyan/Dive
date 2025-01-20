import { setupUtilsMocks } from "../__mocks__/utilsMocks.js";
setupUtilsMocks();

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { convertToOpenAITools, loadConfig, loadConfigAndServers } from "../../utils/toolHandler.js";

jest.mock("fs/promises");
jest.mock("path", () => ({
  ...jest.requireActual("path"),
  join: jest.fn(),
}));

describe("ToolHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (path.join as jest.Mock).mockImplementation((...args) => args.join("/"));
  });

  describe("convertToOpenAITools", () => {
    it("應該正確轉換為 OpenAI 工具格式", () => {
      const mockTools: Tool[] = [
        {
          name: "test_tool",
          description: "A test tool",
          inputSchema: {
            type: "object",
            properties: {
              text: { type: "string" },
            },
            required: ["text"],
          },
        },
      ];

      const result = convertToOpenAITools(mockTools);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("function");
      expect(result[0].function).toEqual({
        name: "test_tool",
        description: "A test tool",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string" },
          },
          required: ["text"],
          additionalProperties: false,
        },
      });
    });
  });

  describe("loadConfig", () => {
    it("應該正確載入配置檔案", async () => {
      const mockConfig = {
        mcpServers: {
          server1: {
            command: "test",
            args: [],
          },
        },
      };
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await loadConfig();

      expect(config).toEqual(mockConfig);
      expect(fs.readFile).toHaveBeenCalled();
      expect(path.join).toHaveBeenCalledWith(expect.any(String), "config.json");
    });

    it("當配置檔案不存在時應返回預設配置", async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error("File not found"));

      const config = await loadConfig();

      expect(config).toEqual({ mcpServers: {} });
    });

    it("應該使用提供的路徑", async () => {
      const customPath = "/custom/path/config.json";
      const mockConfig = { mcpServers: {} };
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      await loadConfig(customPath);

      expect(fs.readFile).toHaveBeenCalledWith(customPath, "utf-8");
    });
  });

  describe("loadConfigAndServers", () => {
    it("應該正確載入配置和伺服器列表", async () => {
      const mockConfig = {
        mcpServers: {
          server1: { command: "test1", args: [] },
          server2: { command: "test2", args: [] },
        },
      };
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const result = await loadConfigAndServers();

      expect(result.config).toEqual(mockConfig);
      expect(result.servers).toEqual(["server1", "server2"]);
    });

    it("當配置檔案不存在時應返回空配置和空伺服器列表", async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error("File not found"));

      const result = await loadConfigAndServers();

      expect(result.config).toEqual({ mcpServers: {} });
      expect(result.servers).toEqual([]);
    });
  });
});
