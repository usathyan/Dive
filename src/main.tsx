import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "./styles/index.scss"
import "pretendard/dist/web/static/pretendard.css"
import "./i18n"
import Root from "./Root.tsx"

window.addEventListener("contextmenu", (e) => {
  e.preventDefault()
  const selection = window.getSelection()?.toString()

  if (selection) {
    window.ipcRenderer.showSelectionContextMenu()
  }
})

window.PLATFORM = await window.ipcRenderer.getPlatform() as any

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
