import { app } from "electron"
import envPaths from "env-paths"
import path from "node:path"
import { MCPClient, WebServer, setDatabase } from "mcp-client-nodejs"
import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import * as schema from "../schema"

export let client: Promise<MCPClient> | null = null
async function initClient(): Promise<MCPClient> {
  const paths = envPaths(app.getName(), {suffix: ""})
  const configDir = paths.config

  const db = initDb(configDir)
  setDatabase(db as any)

  const _client = new MCPClient({
    modelConfigPath: path.join(configDir, "model.json"),
    mcpServerConfigPath: configDir,
  })

  return _client
}

function initDb(configDir: string) {
  const dbPath = path.join(configDir, "data.db")
  const sqlite = new Database(dbPath)
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: "./drizzle" })
  return db
}

export let port = Promise.resolve(0)
async function initService(): Promise<number> {
  const _client = await client!
  await _client.connectEnabledServers().catch(console.error)
  const server = new WebServer(_client)
  await server.start(0)
  return server.port!
}

export async function initMCPClient() {
  client = initClient()
  port = initService()
}
