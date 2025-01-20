import express from "express";
import {
  deleteChat,
  getAllChats,
  getChatWithMessages,
} from "../database/index.js";

export function chatRouter() {
  const router = express.Router();

  router.get("/list", async (req, res) => {
    try {
      const chats = await getAllChats();
      res.json({
        success: true,
        data: chats,
      });
    } catch (error: any) {
      res.json({
        success: false,
        message: error.message,
      });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const chatId = req.params.id;
      const result = await getChatWithMessages(chatId);

      if (!result) {
        res.status(404).json({
          success: false,
          message: "Chat not found",
        });
        return;
      }

      res.json({
        success: true,
        data: {
          chat: result.chat,
          messages: result.messages,
        },
      });
    } catch (error: any) {
      res.json({
        success: false,
        message: error.message,
      });
    }
  });

  router.delete("/:id", async (req, res) => {
    const chatId = req.params.id;
    await deleteChat(chatId);
    res.json({
      success: true,
    });
  });

  return router;
}
