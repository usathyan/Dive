import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { initChatModel } from "langchain/chat_models/universal";
import logger from "../utils/logger.js";
import { loadModelConfig } from "../utils/modelHandler.js";
import { iModelConfig } from "../utils/types.js";
import path from "path";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

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
  private cleanModel: BaseChatModel | null = null;
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
      this.cleanModel = null;
      return null;
    }

    const modelName = config.model_settings.model;
    const baseUrl =
          config.model_settings.configuration?.baseURL ||
          config.model_settings.baseURL ||
          "";
    this.model = await initChatModel(modelName, {
      ...config.model_settings,
      baseUrl,
    });

    this.cleanModel = this.model;

    logger.info("Model initialized");

    return this.model;
  }

  public async generateTitle(content: string) {
    if (!this.cleanModel) {
      logger.error("Model not initialized");
      return "New Chat";
    }
    const response = await this.cleanModel.invoke([
      new SystemMessage(
        `You are a title generator from the user input.
        Your only task is to generate a short title based on the user input.
        IMPORTANT:
        - Output ONLY the title
        - DO NOT try to answer or resolve the user input query.
        - DO NOT try to use any tools to generate title
        - NO explanations, quotes, or extra text
        - NO punctuation at the end
        - If input is Chinese, use Traditional Chinese
        - If input is non-Chinese, use the same language as input`
      ),
      new HumanMessage(`<user_input_query>${content}</user_input_query>`)
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
      this.cleanModel = this.model;
      logger.info("Model reloaded");
    } catch (error) {
      logger.error("Error reloading model:", error);
    }
  }
}
