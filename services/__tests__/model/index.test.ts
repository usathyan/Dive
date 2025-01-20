import { initChatModel } from "langchain/chat_models/universal";
import { ModelManager } from "../../models/index.js";
import { loadModelConfig } from "../../utils/modelHandler.js";
import logger from "../../utils/logger.js";
// Mock 外部依賴
jest.mock("../../utils/modelHandler.js");
jest.mock("../../utils/logger.js");
// jest.mock("langchain/chat_models/universal");

describe("ModelManager", () => {
  let modelManager: ModelManager;
  const mockConfig = {
    model_settings: {
      model: "gpt-4o-mini",
      temperature: 0.7,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    modelManager = ModelManager.getInstance();
    (loadModelConfig as jest.Mock).mockResolvedValue(mockConfig);
    // (initChatModel as jest.Mock).mockResolvedValue({});
  });

  describe("getInstance", () => {
    it("應該返回相同的實例（單例模式）", () => {
      const instance1 = ModelManager.getInstance();
      const instance2 = ModelManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("應該使用新的配置路徑更新實例", () => {
      const customPath = "/custom/path/config.json";
      const instance = ModelManager.getInstance(customPath);
      expect(instance).toBeDefined();
    });
  });

  describe("getModelConfig", () => {
    it("應該成功獲取模型配置", async () => {
      const config = await modelManager.getModelConfig();
      expect(config).toEqual(mockConfig);
      expect(loadModelConfig).toHaveBeenCalled();
    });

    it("當配置載入失敗時應該返回 null", async () => {
      (loadModelConfig as jest.Mock).mockResolvedValue(null);
      const config = await modelManager.getModelConfig();
      expect(config).toBeNull();
    });
  });

  describe("initializeModel", () => {
    it("應該成功初始化模型", async () => {
      const model = await modelManager.initializeModel();
      expect(model).toBeDefined();
    });

    it("當配置不存在時應該返回 null", async () => {
      (loadModelConfig as jest.Mock).mockResolvedValue(null);
      const model = await modelManager.initializeModel();
      expect(model).toBeNull();
      expect(logger.error).toHaveBeenCalledWith("Model configuration not found");
    });
  });

  describe("getModel", () => {
    it("當模型已初始化時應該返回模型實例", async () => {
      await modelManager.initializeModel();
      const model = await modelManager.getModel();
      expect(model).toBeDefined();
    });
  });
});
