import express from "express";
import fs from "fs/promises";
import { MCPServerManager } from "../mcpServer/index.js";
import { ModelManager } from "../models/index.js";
import { ModelInterface } from "../models/interface.js";
import { PromptManager } from "../prompt/index.js";
import { loadConfig } from "../utils/toolHandler.js";

export function configRouter() {
  const router = express.Router();

  router.get("/mcpserver", async (req, res) => {
    try {
      const config = await loadConfig(MCPServerManager.getInstance().configPath);

      res.json({
        success: true,
        config: config,
      });
    } catch (error: any) {
      res.json({
        success: false,
        message: error.message,
      });
    }
  });

  router.post("/mcpserver", async (req, res) => {
    try {
      const configPath = MCPServerManager.getInstance().configPath;
      const newConfig = req.body;

      // Validate configuration format
      if (!newConfig || typeof newConfig !== "object") {
        throw new Error("Invalid configuration format");
      }

      // Save configuration
      await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), "utf-8");

      // Reinitialize MCP client
      await MCPServerManager.getInstance().reconnectServers();

      res.json({
        success: true,
      });
    } catch (error: any) {
      res.json({
        success: false,
        message: error.message,
      });
    }
  });

  router.get("/model", async (req, res) => {
    try {
      const modelConfig = await ModelManager.getInstance().getModelConfig();
      res.json({
        success: true,
        config: modelConfig,
      });
    } catch (error: any) {
      res.json({
        success: false,
        message: error.message,
      });
    }
  });

  router.get("/model/interface", async (req, res) => {
    res.json({
      success: true,
      interface: ModelInterface,
    });
  });

  router.post("/model", async (req, res) => {
    try {
      const modelConfigPath = ModelManager.getInstance().configPath;
      const newModelConfig = req.body;

      // Validate configuration format
      if (!newModelConfig || typeof newModelConfig !== "object") {
        throw new Error("Invalid configuration format");
      }

      // Save configuration
      await fs.writeFile(modelConfigPath, JSON.stringify(newModelConfig, null, 2), "utf-8");

      // Reinitialize MCP client
      await ModelManager.getInstance().reloadModel();

      res.json({
        success: true,
      });
    } catch (error: any) {
      res.json({
        success: false,
        message: error.message,
      });
    }
  });

  router.get("/customrules", async (req, res) => {
    try {
      const customRules = await PromptManager.getInstance().loadCustomRules();
      res.json({
        success: true,
        rules: customRules,
      });
    } catch (error: any) {
      res.json({
        success: false,
        message: error.message,
      });
    }
  });

  router.post("/customrules", async (req, res) => {
    try {
      const customRulesPath = PromptManager.getInstance().customRulesPath;
      const newCustomRules = await new Promise<string>((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => {
          data += chunk;
        });
        req.on("end", () => {
          resolve(data);
        });
        req.on("error", (err) => {
          reject(err);
        });
      });
      await fs.writeFile(customRulesPath, newCustomRules, "utf-8");

      await PromptManager.getInstance().updateSystemPrompt();
      res.json({
        success: true,
      });
    } catch (error: any) {
      res.json({
        success: false,
        message: error.message,
      });
    }
  });

  return router;
}
