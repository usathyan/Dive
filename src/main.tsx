import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "./styles/index.scss"
import "pretendard/dist/web/static/pretendard.css"
import "./i18n"
import Root from "./Root.tsx"
import logger from "electron-log/renderer"

window.addEventListener("contextmenu", (e) => {
  e.preventDefault()
  const selection = window.getSelection()?.toString()

  if (selection) {
    window.ipcRenderer.showSelectionContextMenu()
  }
})

window.onerror = (message, filename, lineno, colno, error) => {
  logger.error("[FE] JavaScript Error:", {
    message,
    filename,
    lineno,
    colno,
    stack: error?.stack
  })
}

window.onunhandledrejection = (event) => {
  logger.error("[FE] Unhandled Rejection:", {
    reason: event.reason,
    stack: event.reason?.stack
  })
}

window.PLATFORM = await window.ipcRenderer.getPlatform() as any

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
