import { useCallback, useEffect, useRef, useState } from "react"
import InstallHostDependencies from "./views/InstallHostDependencies"
import App from "./App"
import { loadConfigAtom } from "./atoms/configState"
import { useSetAtom } from "jotai"
import { loadHotkeyMapAtom } from "./atoms/hotkeyState"

function Root() {
  const loadConfig = useSetAtom(loadConfigAtom)
  const loadHotkeyMap = useSetAtom(loadHotkeyMapAtom)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(window.PLATFORM !== "darwin")
  const init = useRef(false)

  const initHost = useCallback(async () => {
    const port = await new Promise<number>((resolve) => {
      window.ipcRenderer.onReceivePort((port) => {
        resolve(port)
      })

      const i = setInterval(() => {
        window.ipcRenderer.port().then(port => {
          if (+port) {
            resolve(port)
            clearInterval(i)
          }
        })
      }, 1000)
    })

    console.log("host port", port)

    const originalFetch = window.fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input !== "string" || (typeof input === "string" && !input.startsWith("/api")) && input !== "/model_verify") {
        return originalFetch(input, init)
      }

      return originalFetch(`http://localhost:${port}${input}`, {
        ...init,
        headers: {
          ...init?.headers,
          "X-Requested-With": "dive-desktop",
        },
      })
    }

    // wait for host to start
    await new Promise(resolve => {
      const i = setInterval(() => {
        fetch("/api/ping").then(() => {
          resolve(0)
          clearInterval(i)
        })
      }, 50)
    })
  }, [])

  useEffect(() => {
    if (init.current) {
      return
    }

    init.current = true

    window.ipcRenderer.getInstallHostDependenciesLog().then(logs => {
      if (logs.includes("finish")) {
        setDownloading(false)
      }
    })

    if (!window.ipcRenderer) {
      return
    }

    initHost()
      .then(loadHotkeyMap)
      .then(loadConfig)
      .finally(() => {
        setDownloading(false)
        setLoading(false)
      })
  }, [])

  const onFinish = () => {
    setDownloading(false)
  }

  const onUpdate = (_log: string) => {
    window.postMessage({ payload: "removeLoading" }, "*")
  }

  if (downloading || loading) {
    return <InstallHostDependencies onFinish={onFinish} onUpdate={onUpdate} />
  }

  return <App />
}

export default Root
