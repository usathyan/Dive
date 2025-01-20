import { setupMcpSdkMocks } from "./__mocks__/mcpSdkMocks.js";
import { setupUtilsMocks } from "./__mocks__/utilsMocks.js";
setupMcpSdkMocks();
setupUtilsMocks();

jest.mock("../utils/modelHandler", () => ({
  __esModule: true,
  loadModelConfig: jest.fn(),
}));

import { MCPClient } from "../client.js";
import { loadModelConfig } from "../utils/modelHandler.js";
import { ModelManager } from "../models/index.js";

describe("Client", () => {
  let client: MCPClient;
  const mockConfig = {
    model_settings: {
      temperature: 0.7,
      max_tokens: 1000,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (loadModelConfig as jest.Mock).mockResolvedValue(mockConfig);
    client = new MCPClient();
  });

  describe("初始化", () => {
    it("應該正確初始化客戶端", async () => {
      await client.init();
      expect(loadModelConfig).toHaveBeenCalled();
      expect(ModelManager.getInstance().getModel()).not.toBeNull();
    });

    it("模型初始化失敗不應該拋出錯誤", async () => {
      (loadModelConfig as jest.Mock).mockResolvedValue(null);
      await expect(client.init()).resolves.toBeUndefined();
      expect(ModelManager.getInstance().getModel()).toBeNull();
    });
  });
});

