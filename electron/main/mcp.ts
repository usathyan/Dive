import { app } from "electron"
import envPaths from "env-paths"
import { MCPClient } from "mcp-client-nodejs"

function initConfigDir() {
  const paths = envPaths(app.getName(), {suffix: ""})
  return paths.config
}

export let client: Promise<MCPClient> | null = null
async function initClient() {
  const configDir = initConfigDir()
  const _client = new MCPClient({
    openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY,
    configPathPrefix: configDir,
  })

  await _client.connectEnabledServers().catch(console.error)
  return _client
}

export function initMCPClient() {
  client = initClient()
}
