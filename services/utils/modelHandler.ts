import fs from "fs/promises";
import path from "path";
import { ModelInterface } from "../models/interface.js";
import logger from "./logger.js";
import { iModelConfig, ModelSettings } from "./types.js";

// 驗證配置是否符合介面定義
function validateModelConfig(config: iModelConfig): boolean {
  try {
    const settings = config.model_settings;
    const interfaceDefinition = ModelInterface.model_settings;

    // 檢查必要欄位和型別
    for (const [key, setting] of Object.entries(interfaceDefinition)) {
      const value = settings[key as keyof ModelSettings];

      // 檢查必要欄位
      if (setting.required && value === undefined) {
        logger.error(`Missing required field: ${key}`);
        return false;
      }

      // 如果有值，檢查型別
      if (value !== undefined) {
        if (setting.type === "object") {
          if (typeof value !== "object" || value === null) {
            logger.error(
              `Invalid type for ${key}: expected object, got ${typeof value}`
            );
            return false;
          }
          // 可以在這裡添加更深層的物件屬性驗證
        } else if (typeof value !== setting.type) {
          logger.error(
            `Invalid type for ${key}: expected ${
              setting.type
            }, got ${typeof value}`
          );
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    logger.error("Config validation error:", error);
    return false;
  }
}

// Read model configuration file
export async function loadModelConfig(
  customPath?: string
): Promise<iModelConfig | null> {
  try {
    const configPath =
      customPath || path.join(process.cwd(), "modelConfig.json");
    const configContent = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(configContent) as iModelConfig;

    // 驗證配置
    if (!validateModelConfig(config)) {
      logger.error("Invalid model configuration");
      return null;
    }

    return config;
  } catch (error) {
    logger.error("Error loading model configuration:", error);
    return null;
  }
}
