import { ipcRenderer, contextBridge } from "electron"

import type { OAPModelDescriptionParam, MCPServerSearchParam } from "../../types/oap"
import type { ModelGroupSetting } from "../../types/model"

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // listener
  onReceivePort: (callback: (port: number) => void) => {
    const listener = (_event: Electron.IpcMainInvokeEvent, value: number) => callback(value)
    ipcRenderer.on("app-port", listener as any)
    return () => ipcRenderer.off("app-port", listener as any)
  },
  onReceiveInstallHostDependenciesLog: (callback: (data: string) => void) => {
    const listener = (_event: Electron.IpcMainInvokeEvent, value: string) => callback(value)
    ipcRenderer.on("install-host-dependencies-log", listener as any)
    return () => ipcRenderer.off("install-host-dependencies-log", listener as any)
  },

  // util
  fillPathToConfig: (config: string) => ipcRenderer.invoke("util:fillPathToConfig", config),
  download: (url: string) => ipcRenderer.invoke("util:download", { url }),
  copyImage: (url: string) => ipcRenderer.invoke("util:copyimage", url),
  getModelSettings: () => ipcRenderer.invoke("util:getModelSettings"),
  setModelSettings: (settings: ModelGroupSetting) => ipcRenderer.invoke("util:setModelSettings", settings),
  refreshConfig: () => ipcRenderer.invoke("util:refreshConfig"),
  getInstallHostDependenciesLog: () => ipcRenderer.invoke("util:getInstallHostDependenciesLog"),

  // system
  openScriptsDir: () => ipcRenderer.invoke("system:openScriptsDir"),
  getAutoLaunch: () => ipcRenderer.invoke("system:getAutoLaunch"),
  setAutoLaunch: (enable: boolean) => ipcRenderer.invoke("system:setAutoLaunch", enable),
  getMinimalToTray: () => ipcRenderer.invoke("system:getMinimalToTray"),
  setMinimalToTray: (enable: boolean) => ipcRenderer.invoke("system:setMinimalToTray", enable),

  // llm
  openaiModelList: (apiKey: string) => ipcRenderer.invoke("llm:openaiModelList", apiKey),
  openaiCompatibleModelList: (apiKey: string, baseURL: string) => ipcRenderer.invoke("llm:openaiCompatibleModelList", apiKey, baseURL),
  anthropicModelList: (apiKey: string, baseURL: string) => ipcRenderer.invoke("llm:anthropicModelList", apiKey, baseURL),
  ollamaModelList: (baseURL: string) => ipcRenderer.invoke("llm:ollamaModelList", baseURL),
  googleGenaiModelList: (apiKey: string) => ipcRenderer.invoke("llm:googleGenaiModelList", apiKey),
  mistralaiModelList: (apiKey: string) => ipcRenderer.invoke("llm:mistralaiModelList", apiKey),
  bedrockModelList: (accessKeyId: string, secretAccessKey: string, sessionToken: string, region: string) => ipcRenderer.invoke("llm:bedrockModelList", accessKeyId, secretAccessKey, sessionToken, region),

  // context menu
  showSelectionContextMenu: () => ipcRenderer.invoke("show-selection-context-menu"),
  showInputContextMenu: () => ipcRenderer.invoke("show-input-context-menu"),

  // env
  getHotkeyMap: () => ipcRenderer.invoke("env:getHotkeyMap"),
  getPlatform: () => ipcRenderer.invoke("env:getPlatform"),
  port: () => ipcRenderer.invoke("env:port"),
  getResourcesPath: (p: string) => ipcRenderer.invoke("env:getResourcesPath", p),
  isDev: () => ipcRenderer.invoke("env:isDev"),

  // oap
  oapLogin: (regist: boolean) => ipcRenderer.invoke("oap:login", regist),
  oapLogout: () => ipcRenderer.invoke("oap:logout"),
  oapGetToken: () => ipcRenderer.invoke("oap:getToken"),
  oapSearchMCPServer: (params: MCPServerSearchParam) => ipcRenderer.invoke("oap:searchMCPServer", params),
  oapModelDescription: (params?: OAPModelDescriptionParam) => ipcRenderer.invoke("oap:modelDescription", params),
  oapApplyMCPServer: (ids: string[]) => ipcRenderer.invoke("oap:applyMCPServer", ids),
  oapGetMCPServers: () => ipcRenderer.invoke("oap:getMCPServers"),
  oapGetMe: () => ipcRenderer.invoke("oap:getMe"),
  oapGetUsage: () => ipcRenderer.invoke("oap:getUsage"),
  oapRegistEvent: (event: "login" | "logout", callback: () => void) => {
    ipcRenderer.on(`oap:${event}`, callback)
    return () => ipcRenderer.off(`oap:${event}`, callback)
  },

  // deep link
  listenRefresh: (cb: () => void) => {
    ipcRenderer.on("refresh", cb)
    return () => ipcRenderer.off("refresh", cb)
  },
})

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ["complete", "interactive"]) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = "loaders-css__square-spin"
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement("style")
  const oDiv = document.createElement("div")

  oStyle.id = "app-loading-style"
  oStyle.innerHTML = styleContent
  oDiv.className = "app-loading-wrap"
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

// eslint-disable-next-line react-hooks/rules-of-hooks
const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === "removeLoading" && removeLoading()
}

setTimeout(removeLoading, 120000)
