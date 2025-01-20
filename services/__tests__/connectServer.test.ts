import { setupMcpSdkMocks } from "./__mocks__/mcpSdkMocks.js";
import { setupUtilsMocks } from "./__mocks__/utilsMocks.js";
setupMcpSdkMocks();
setupUtilsMocks();

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { handleConnectToServer } from "../connectServer.js";

jest.mock("../utils/modelHandler", () => ({
  __esModule: true,
  loadModelConfig: jest.fn(),
}));

describe("ConnectServer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use process.execPath when command is node", async () => {
    const serverName = "test_server";
    const serverConfig = {
      command: "node",
      args: [],
      env: {},
    };

    await handleConnectToServer(serverName, serverConfig);

    // 驗證 StdioClientTransport 的調用
    expect(StdioClientTransport).toHaveBeenCalledWith({
      command: process.execPath,
      args: [],
      env: {},
    });
  });

  it("should list tools after successful connection", async () => {
    const serverName = "test_server";
    const serverConfig = {
      command: "custom_command",
      args: [],
      env: {},
    };

    const result = await handleConnectToServer(serverName, serverConfig);

    // 驗證 Client 的初始化參數
    expect(Client).toHaveBeenCalledWith({ name: "mcp-client", version: "1.0.0" }, { capabilities: {} });

    // 驗證 listTools 的調用和結果
    expect(result.client.listTools).toHaveBeenCalled();
  });
});
