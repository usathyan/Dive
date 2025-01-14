import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import "./i18n"

if (window.ipcRenderer) {
  const originalFetch = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input !== "string" || (typeof input === "string" && !input.startsWith("/api"))) {
      return originalFetch(input, init)
    }

    return originalFetch(`http://localhost:${await window.ipcRenderer.port()}${input}`, init)
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
