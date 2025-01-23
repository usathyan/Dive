import { setupMcpSdkMocks } from "./__mocks__/mcpSdkMocks.js";
import { setupUtilsMocks } from "./__mocks__/utilsMocks.js";
setupMcpSdkMocks();
setupUtilsMocks();

jest.mock("../utils/modelHandler", () => ({
  __esModule: true,
  loadModelConfig: jest.fn(),
}));

import { MCPClient } from "../client.js";
import { ModelManager } from "../models/index.js";
import { loadModelConfig } from "../utils/modelHandler.js";

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

  describe("Initialization", () => {
    it("should correctly initialize client", async () => {
      await client.init();
      expect(loadModelConfig).toHaveBeenCalled();
      expect(ModelManager.getInstance().getModel()).not.toBeNull();
    });

    it("model initialization failure should not throw error", async () => {
      (loadModelConfig as jest.Mock).mockResolvedValue(null);
      await expect(client.init()).resolves.toBeUndefined();
      expect(ModelManager.getInstance().getModel()).toBeNull();
    });
  });
});
