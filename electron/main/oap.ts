import { ApiResponse, OAPModelDescriptionParam, MCPServerSearchParam, OAPUsage, OAPUser, OAPModelDescription } from "../../types/oap"
import { OAPMCPServer } from "../../types/oap"
import { serviceStatus } from "./service"
import { oapStore as store } from "./store"
import EventEmitter from "node:events"
import { OAP_ROOT_URL } from "../../shared/oap"

export const getToken = () => store.get("token") as string | undefined
export const setToken = (token: string) => store.set("token", token)

class OAPClient {
  public loggedIn: boolean
  private eventEmitter = new EventEmitter()

  constructor() {
    this.loggedIn = !!getToken()
  }

  registEvent(event: "login" | "logout", callback: () => void) {
    this.eventEmitter.on(event, callback)
  }

  login(token: string) {
    setToken(token)
    this.loggedIn = true
    this.eventEmitter.emit("login")
  }

  async logout() {
    const token = getToken()
    if (token) {
      await this.fetch("/api/v1/user/logout").catch(console.error)
    }

    setToken("")
    this.loggedIn = false
    this.eventEmitter.emit("logout")

    const url = `http://${serviceStatus.ip}:${serviceStatus.port}`
    fetch(`${url}/api/plugins/oap-platform/auth`, { method: "DELETE" })
      .then((res) => console.log("oap logout", res.status))
  }

  fetch<T>(url: string, options: RequestInit = {}) {
    const token = getToken()
    if (!token) {
      this.logout()
      throw new Error("not logged in")
    }

    return fetch(`${OAP_ROOT_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.text() as Promise<T>)
    .then(text => {
      try {
        return JSON.parse(text as string) as T
      } catch (_error) {
        return text as T
      }
    })
  }

  getMCPServers() {
    return this.fetch<ApiResponse<OAPMCPServer[]>>("/api/v1/user/mcp/configs")
  }

  searchMCPServer(params: MCPServerSearchParam) {
    const form = new FormData()
    Object.entries(params).forEach(([key, value]) => {
      form.append(key, `${value}`)
    })

    return this.fetch<ApiResponse<OAPMCPServer[]>>("/api/v1/user/mcp/search", {
      method: "POST",
      body: form,
    })
  }

  modelDescription(params?: OAPModelDescriptionParam) {
    if (params && params?.models.length > 0) {
      return this.fetch<ApiResponse<OAPModelDescription[]>>("/api/v1/llms/query", {
        method: "POST",
        body: JSON.stringify(params),
      })
    } else {
      return this.fetch<ApiResponse<OAPModelDescription[]>>("/api/v1/llms")
    }
  }

  applyMCPServer(ids: string[]) {
    return this.fetch<ApiResponse<OAPMCPServer>>("/api/v1/user/mcp/apply", {
      method: "POST",
      body: JSON.stringify(ids),
    })
  }

  getMe() {
    return this.fetch<ApiResponse<OAPUser>>("/api/v1/user/me")
  }

  getUsage() {
    return this.fetch<ApiResponse<OAPUsage>>("/api/v1/user/usage")
  }
}

export const oapClient = new OAPClient()