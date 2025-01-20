import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { chats, messages, type NewMessage } from "./schema.js";
import logger from "../utils/logger.js";

export let db: BetterSQLite3Database<typeof schema>;

export const setDatabase = (_db: BetterSQLite3Database<typeof schema>) => {
  db = _db
}

export const initDatabase = (dbPath?: string) => {
  try{
    const sqlite = new Database(dbPath || "data/database.sqlite");
    db = drizzle(sqlite, { schema: schema });

    // Create index after drizzle initialization
    sqlite.exec(`
      CREATE INDEX IF NOT EXISTS message_chat_id_idx
        ON messages(chat_id)
      `);
    logger.info("Database initialized");
    return db;
  } catch (error) {
    logger.error("Error initializing database:", error);
    throw error;
  }
};


export const getAllChats = async () => {
  const chats = await db.query.chats.findMany();
  return chats.reverse();
};

export const getChatWithMessages = async (chatId: string) => {
  const chat = await db.query.chats.findFirst({
    where: eq(chats.id, chatId),
  });

  if (!chat) return null;

  const history = await db.query.messages.findMany({
    where: eq(messages.chatId, chatId),
  });

  return { chat, messages: history };
};

// Add new chat
export const createChat = async (chatId: string, title: string) => {
  const [chat] = await db
    .insert(chats)
    .values({ id: chatId, title, createdAt: new Date().toISOString() })
    .returning();
  return chat;
};

// Add new message
export const createMessage = async (data: NewMessage) => {
  return await db.transaction(async (tx) => {
    // Ensure chat exists
    const chatExists = await tx.query.chats.findFirst({
      where: eq(chats.id, data.chatId),
    });

    if (!chatExists) {
      throw new Error(`Chat ${data.chatId} does not exist`);
    }

    const [message] = await tx.insert(messages).values(data).returning();

    return message;
  });
};

// Check if chat exists
export const checkChatExists = async (chatId: string) => {
  const chat = await db.query.chats.findFirst({
    where: eq(chats.id, chatId),
  });
  return !!chat;
};

export const deleteChat = async (chatId: string) => {
  await db.delete(chats).where(eq(chats.id, chatId));
  await db.delete(messages).where(eq(messages.chatId, chatId));
};
