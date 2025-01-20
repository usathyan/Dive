import fs from "fs/promises";
import sharp from "sharp";
import logger from "./logger.js";

// 讀取和轉換圖片
export async function imageToBase64Original(
  imagePath: string
): Promise<string> {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    return `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
  } catch (error) {
    logger.error("Error reading image:", error);
    throw error;
  }
}

export async function imageToBase64(path: string): Promise<string> {
  try {
    // 使用 sharp 壓縮圖片
    const compressedImageBuffer = await sharp(path)
      .resize(800, 800, {
        // 設定最大寬高
        fit: "inside", // 保持圖片比例
        withoutEnlargement: true, // 避免放大小圖
      })
      .jpeg({
        // 轉換為 JPEG 格式
        quality: 80, // 設定壓縮品質 (0-100)
        progressive: true, // 使用漸進式 JPEG
      })
      .toBuffer();

    // 轉換為 base64
    return `data:image/jpeg;base64,${compressedImageBuffer.toString("base64")}`;
  } catch (error) {
    logger.error("Error compressing image:", error);
    // 如果壓縮失敗,使用原始方法作為備案
    return imageToBase64Original(path);
  }
}
