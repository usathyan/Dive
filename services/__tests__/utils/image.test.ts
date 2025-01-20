import { setupUtilsMocks } from "../__mocks__/utilsMocks.js";
setupUtilsMocks();

import fs from "fs/promises";
import sharp from "sharp";
import { imageToBase64, imageToBase64Original } from "../../utils/image.js";

jest.mock("fs/promises");

describe("Image Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 模擬檔案讀取，返回測試用的 buffer
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from("test file content"));
  });

  describe("imageToBase64Original", () => {
    it("正確轉換圖片為base64", async () => {
      const result = await imageToBase64Original("test.jpg");

      expect(result).toMatch(/^data:image\/jpeg;base64,/);
      expect(fs.readFile).toHaveBeenCalledWith("test.jpg");
    });

    it("正確處理讀取錯誤", async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error("Read error"));

      await expect(imageToBase64Original("test.jpg")).rejects.toThrow("Read error");
    });
  });

  describe("imageToBase64", () => {
    it("應該正確壓縮並轉換圖片", async () => {
      const mockBuffer = Buffer.from("test file content");
      const mockSharp = {
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(mockBuffer),
      };

      (sharp as unknown as jest.Mock).mockReturnValue(mockSharp);

      const result = await imageToBase64("test.jpg");

      expect(result).toMatch(/^data:image\/jpeg;base64,/);
      expect(mockSharp.resize).toHaveBeenCalled();
      expect(mockSharp.jpeg).toHaveBeenCalled();
    });
  });
});
