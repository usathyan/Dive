import { jest } from "@jest/globals";
import * as fs from "fs";
import { PromptManager } from "../../prompt/index.js";

jest.mock("fs", () => ({
  readFileSync: jest.fn(),
}));

describe("PromptManager", () => {
  let promptManager: PromptManager;

  beforeEach(() => {
    // 重置 PromptManager 的單例實例
    // @ts-ignore - 存取私有屬性進行測試
    PromptManager.instance = undefined;
    // 重置所有 mock
    jest.clearAllMocks();
    promptManager = PromptManager.getInstance();
  });

  describe("getInstance", () => {
    it("應該返回 PromptManager 的單例實例", () => {
      const instance1 = PromptManager.getInstance();
      const instance2 = PromptManager.getInstance();

      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
      expect(instance1).toBe(instance2);
    });
  });

  describe("setPrompt & getPrompt", () => {
    it("應該能夠設置和獲取提示", () => {
      const key = "test";
      const prompt = "This is a test prompt";

      promptManager.setPrompt(key, prompt);
      const retrievedPrompt = promptManager.getPrompt(key);

      expect(retrievedPrompt).toBe(prompt);
    });

    it("應該能夠更新現有的提示", () => {
      const key = "test";
      const originalPrompt = "Original prompt";
      const updatedPrompt = "Updated prompt";

      promptManager.setPrompt(key, originalPrompt);
      promptManager.setPrompt(key, updatedPrompt);
      const retrievedPrompt = promptManager.getPrompt(key);

      expect(retrievedPrompt).toBe(updatedPrompt);
    });

    it("當提示不存在時應該返回 undefined", () => {
      const nonExistentKey = "nonexistent";
      const retrievedPrompt = promptManager.getPrompt(nonExistentKey);

      expect(retrievedPrompt).toBeUndefined();
    });

    it("應該在初始化時包含系統提示", () => {
      const systemPrompt = promptManager.getPrompt("system");

      expect(systemPrompt).toBeDefined();
      expect(typeof systemPrompt).toBe("string");
    });
  });

  describe("邊界條件測試", () => {
    it("應該能處理空字串作為 key", () => {
      const key = "";
      const prompt = "Empty key prompt";

      promptManager.setPrompt(key, prompt);
      const retrievedPrompt = promptManager.getPrompt(key);

      expect(retrievedPrompt).toBe(prompt);
    });

    it("應該能處理空字串作為 prompt", () => {
      const key = "emptyPrompt";
      const prompt = "";

      promptManager.setPrompt(key, prompt);
      const retrievedPrompt = promptManager.getPrompt(key);

      expect(retrievedPrompt).toBe(prompt);
    });
  });

  describe("loadCustomRules", () => {
    it("應該能夠讀取自定義規則檔案", () => {
      const mockRules = "custom rule content";
      (fs.readFileSync as jest.Mock).mockReturnValue(mockRules);

      const rules = promptManager.loadCustomRules();
      expect(rules).toBe(mockRules);
    });

    it("當檔案不存在時應該返回空字串", () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("File not found");
      });

      const rules = promptManager.loadCustomRules();
      expect(rules).toBe("");
    });
  });

  describe("updateSystemPrompt", () => {
    it("應該使用新的自定義規則更新系統提示", () => {
      const mockRules = "new custom rules";
      (fs.readFileSync as jest.Mock).mockReturnValue(mockRules);

      const originalSystemPrompt = promptManager.getPrompt("system");
      promptManager.updateSystemPrompt();
      const updatedSystemPrompt = promptManager.getPrompt("system");

      expect(updatedSystemPrompt).not.toBe(originalSystemPrompt);
    });

    it("當無法讀取自定義規則時應該保持原有的系統提示", () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("File not found");
      });

      const originalSystemPrompt = promptManager.getPrompt("system");
      promptManager.updateSystemPrompt();
      const updatedSystemPrompt = promptManager.getPrompt("system");

      expect(updatedSystemPrompt).toBeDefined();
      expect(typeof updatedSystemPrompt).toBe("string");
    });
  });
});
