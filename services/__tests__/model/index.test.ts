import { ModelManager } from "../../models/index.js";
import logger from "../../utils/logger.js";
import { loadModelConfig } from "../../utils/modelHandler.js";
// Mock external dependencies
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
    it("should return the same instance (singleton pattern)", () => {
      const instance1 = ModelManager.getInstance();
      const instance2 = ModelManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should update instance with new config path", () => {
      const customPath = "/custom/path/config.json";
      const instance = ModelManager.getInstance(customPath);
      expect(instance).toBeDefined();
    });
  });

  describe("getModelConfig", () => {
    it("should successfully get model configuration", async () => {
      const config = await modelManager.getModelConfig();
      expect(config).toEqual(mockConfig);
      expect(loadModelConfig).toHaveBeenCalled();
    });

    it("should return null when config loading fails", async () => {
      (loadModelConfig as jest.Mock).mockResolvedValue(null);
      const config = await modelManager.getModelConfig();
      expect(config).toBeNull();
    });
  });

  describe("initializeModel", () => {
    it("should successfully initialize model", async () => {
      const model = await modelManager.initializeModel();
      expect(model).toBeDefined();
    });

    it("should return null when configuration doesn't exist", async () => {
      (loadModelConfig as jest.Mock).mockResolvedValue(null);
      const model = await modelManager.initializeModel();
      expect(model).toBeNull();
      expect(logger.error).toHaveBeenCalledWith("Model configuration not found");
    });
  });

  describe("getModel", () => {
    it("should return model instance when already initialized", async () => {
      await modelManager.initializeModel();
      const model = await modelManager.getModel();
      expect(model).toBeDefined();
    });
  });
});
