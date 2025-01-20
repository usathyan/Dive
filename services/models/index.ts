import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { initChatModel } from "langchain/chat_models/universal";
import logger from "../utils/logger.js";
import { loadModelConfig } from "../utils/modelHandler.js";
import { iModelConfig } from "../utils/types.js";
import path from "path";
import { SystemMessage } from "@langchain/core/messages";

const LANGCHAIN_SUPPORTED_PROVIDERS = [
  "openai",
  "anthropic",
  "azure_openai",
  "cohere",
  "google-vertexai",
  "google-genai",
  "ollama",
  "together",
  "fireworks",
  "mistralai",
  "groq",
  "bedrock",
] as const;

const MCP_SUPPORTED_PROVIDERS = [
  "OpenRouter", // openai          - @langchain/openai          // x
  "Anthropic", // anthropic       - @langchain/anthropic       // v
  "Google Gemini", // google-genai    - @langchain/google-genai    // v
  "DeepSeek", // openai          - @langchain/openai          // x
  "GCP Vertex", // google-vertexai - @langchain/google-vertexai // v
  "AWS Bedrock", // bedrock         - @langchain/community       // x
  "OpenAI", // openai          - @langchain/openai          // v
  "OpenAI Compatible", // openai          - @langchain/openai          // x
  "LM Studio", // custom          - custom chat model          // x
  "Ollama", // ollama          - @langchain/ollama          // v
] as const;

export class ModelManager {
  private static instance: ModelManager;
  private model: BaseChatModel | null = null;
  public configPath: string = "";

  private constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), "modelConfig.json");
  }

  static getInstance(configPath?: string): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager(configPath);
    } else if (configPath) {
      ModelManager.instance.configPath = configPath;
    }
    return ModelManager.instance;
  }

  async getModelConfig(): Promise<iModelConfig | null> {
    return await loadModelConfig(this.configPath);
  }

  async initializeModel(): Promise<BaseChatModel | null> {
    logger.info("Initializing model...");
    const config = await this.getModelConfig();

    if (!config) {
      logger.error("Model configuration not found");
      this.model = null;
      return null;
    }

    const modelName = config.model_settings.model;
    this.model = await initChatModel(modelName, {
      ...config.model_settings,
    });

    logger.info("Model initialized");

    return this.model;
  }

  public async generateTitle(content: string) {
    if (!this.model) {
      logger.error("Model not initialized");
      return "New Chat";
    }
    const response = await this.model.invoke([
      new SystemMessage(
        `Write a very concise title that captures the main topic from <user_input_query>.
        Return only the title without quotes or extra text.
        If input is in Chinese, respond in Traditional Chinese. Otherwise respond in English.
        <user_input_query>${content}</user_input_query>`
      ),
    ]);

    return (response?.content as string) || "New Chat";
  }

  getModel(): BaseChatModel | null {
    if (!this.model || Object.keys(this.model).length === 0) {
      logger.error("Model not initialized");
      return null;
    }
    return this.model;
  }

  async reloadModel() {
    logger.info("Reloading model...");
    try {
      this.model = await this.initializeModel();
      logger.info("Model reloaded");
    } catch (error) {
      logger.error("Error reloading model:", error);
    }
  }
}
