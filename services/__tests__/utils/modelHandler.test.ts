import { setupUtilsMocks } from "../__mocks__/utilsMocks.js";
setupUtilsMocks();

import fs from "fs/promises";
import path from "path";
import { loadModelConfig } from "../../utils/modelHandler.js";

jest.mock("fs/promises");
jest.mock("path", () => ({
  join: jest.fn(),
}));

describe("ModelHandler", () => {
  const mockConfig = {
    model_settings: {
      model: "gpt-4o-mini",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (path.join as jest.Mock).mockImplementation((...args) => args.join("/"));
  });

  describe("loadModelConfig", () => {
    it("應該成功載入有效的模型配置", async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await loadModelConfig();

      expect(config).toEqual(mockConfig);
      expect(fs.readFile).toHaveBeenCalled();
    });

    it("當配置文件不存在時應該返回 null", async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error("File not found"));

      const config = await loadModelConfig();

      expect(config).toBeNull();
    });

    it("當配置格式無效時應該返回 null", async () => {
      const invalidConfig = {
        model_settings: {
          temperature: "invalid", // 應該是數字
        },
      };
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      const config = await loadModelConfig();

      expect(config).toBeNull();
    });

    it("應該使用提供的路徑", async () => {
      const customPath = "/custom/path/modelConfig.json";
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      await loadModelConfig(customPath);

      expect(fs.readFile).toHaveBeenCalledWith(customPath, "utf-8");
    });
  });
});
