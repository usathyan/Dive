import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const chats = sqliteTable("chats", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: text("created_at").notNull(),
})

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  role: text("role").notNull(),
  chatId: text("chat_id").notNull(),
  messageId: text("message_id").notNull(),
  createdAt: text("created_at").notNull(),
  files: text("files", { mode: "json" }).notNull(),
})
