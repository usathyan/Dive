import { useCallback, useEffect, useRef, useState, Suspense, lazy } from "react"
import { loadConfigAtom } from "./atoms/configState"
import { useSetAtom } from "jotai"
import { loadHotkeyMapAtom } from "./atoms/hotkeyState"
import { modelSettingsAtom } from "./atoms/modelState"
import { fromRawConfigToModelGroupSetting } from "./helper/model"
import { initFetch } from "./ipc"
import { getModelSettings, setModelSettings } from "./ipc/config"

// Lazy load heavy components
const InstallHostDependencies = lazy(() => import("./views/InstallHostDependencies"))
const App = lazy(() => import("./App"))

function Root() {
  const loadConfig = useSetAtom(loadConfigAtom)
  const loadHotkeyMap = useSetAtom(loadHotkeyMapAtom)
  const setModelSetting = useSetAtom(modelSettingsAtom)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(window.PLATFORM !== "darwin")
  const init = useRef(false)

  const initHost = useCallback(async () => {
    await initFetch()

    // wait for host to start with exponential backoff
    await new Promise(resolve => {
      let attempts = 0
      const maxAttempts = 30 // Reduced for faster startup
      const checkHost = () => {
        fetch("/api/ping")
          .then(() => resolve(0))
          .catch(() => {
            attempts++
            if (attempts >= maxAttempts) {
              console.warn("MCP host failed to start after max attempts, continuing...")
              resolve(0)
              return
            }
            // Adaptive backoff: faster initially, slower after failures
            let delay
            if (attempts < 5) {
              delay = 50 + Math.random() * 50 // 50-100ms initially
            } else if (attempts < 15) {
              delay = 200 + Math.random() * 100 // 200-300ms after 5 attempts
            } else {
              delay = Math.min(500 + Math.random() * 200, 1000) // 500-700ms max after 15 attempts
            }
            setTimeout(checkHost, delay)
          })
      }
      checkHost()
    })
  }, [])

  useEffect(() => {
    if (init.current) {
      return
    }

    init.current = true

    initHost()
      .then(loadHotkeyMap)
      .then(loadConfig)
      .then(async (res) => {
        const existsSetting = await getModelSettings()
        if (existsSetting) {
          setModelSetting(existsSetting)
          return
        }

        if (res) {
          const settings = fromRawConfigToModelGroupSetting(res)
          setModelSetting(settings)
          return setModelSettings(settings)
        }
      })
      .finally(() => {
        setDownloading(false)
        setLoading(false)
      })
  }, [])

  const onFinish = () => {
    setDownloading(false)
  }

  const onUpdate = (log: string) => {
    if (log) {
      window.postMessage({ payload: "removeLoading" }, "*")
    }
  }

  if (downloading || loading) {
    return (
      <Suspense fallback={
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '16px'
        }}>
          Loading...
        </div>
      }>
        <InstallHostDependencies onFinish={onFinish} onUpdate={onUpdate} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px'
      }}>
        Starting Dive...
      </div>
    }>
      <App />
    </Suspense>
  )
}

export default Root
