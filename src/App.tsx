import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { removeOapConfigAtom, writeOapConfigAtom } from "./atoms/configState"
import { useEffect } from "react"
import { handleGlobalHotkey } from "./atoms/hotkeyState"
import { handleWindowResizeAtom } from "./atoms/sidebarState"
import { systemThemeAtom } from "./atoms/themeState"
import Updater from "./updater"
import { loadOapToolsAtom, oapUsageAtom, oapUserAtom, updateOAPUsageAtom } from "./atoms/oapState"
import { queryGroup } from "./helper/model"
import { modelGroupsAtom, modelSettingsAtom } from "./atoms/modelState"
import { loadMcpConfigAtom, loadToolsAtom } from "./atoms/toolState"
import { useTranslation } from "react-i18next"
import { setModelSettings } from "./ipc/config"
import { oapGetMe, oapGetToken, oapLogout, oapRegistEvent } from "./ipc"
import { refreshConfig } from "./ipc/host"

function App() {
  const setSystemTheme = useSetAtom(systemThemeAtom)
  const handleWindowResize = useSetAtom(handleWindowResizeAtom)
  const setOAPUser = useSetAtom(oapUserAtom)
  const setOAPUsage = useSetAtom(oapUsageAtom)
  const updateOAPUsage = useSetAtom(updateOAPUsageAtom)
  const writeOapConfig = useSetAtom(writeOapConfigAtom)
  const removeOapConfig = useSetAtom(removeOapConfigAtom)
  const [modelSetting] = useAtom(modelSettingsAtom)
  const modelGroups = useAtomValue(modelGroupsAtom)
  const loadTools = useSetAtom(loadToolsAtom)
  const { i18n } = useTranslation()
  const loadMcpConfig = useSetAtom(loadMcpConfigAtom)
  const loadOapTools = useSetAtom(loadOapToolsAtom)

  useEffect(() => {
    console.log("set model setting", modelSetting)
    if (modelSetting) {
      setModelSettings(modelSetting)
    }
  }, [modelSetting])

  useEffect(() => {
    loadTools()
    loadMcpConfig()
  }, [])

  // init app
  useEffect(() => {
    window.postMessage({ payload: "removeLoading" }, "*")
    window.addEventListener("resize", handleWindowResize)
    window.addEventListener("keydown", handleGlobalHotkey)
    return () => {
      window.removeEventListener("resize", handleWindowResize)
      window.removeEventListener("keydown", handleGlobalHotkey)
    }
  }, [])

  const updateOAPUser = async () => {
    const token = await oapGetToken()
    if (token) {
      const user = await oapGetMe()
      setOAPUser(user.data)
      await updateOAPUsage()
      console.log("oap user", user.data)
    }
  }

  // handle oap event
  useEffect(() => {
    const unregistLogin = oapRegistEvent("login", () => {
      console.info("oap login")
      updateOAPUser()
        .catch(console.error)
        .then(removeOapConfig)
        .catch(console.error)
        .then(writeOapConfig)
        .catch(console.error)
    })

    const unregistLogout = oapRegistEvent("logout", () => {
      console.info("oap logout")
      removeOapConfig()
      setOAPUser(null)
      setOAPUsage(null)
    })

    const unlistenRefresh = oapRegistEvent("refresh", () => {
      console.info("oap refresh")
      refreshConfig()
        .then(loadTools)
        .catch(console.error)

      updateOAPUser()
        .catch(console.error)
        .then(removeOapConfig)
        .then(writeOapConfig)
        .catch(console.error)
    })

    updateOAPUser().then(() => {
      setOAPUser(user => {
        if (!user) {
          console.warn("no user found, logout")
          oapLogout()
          return null
        }

        if (user && queryGroup({ modelProvider: "oap" }, modelGroups).length === 0) {
          writeOapConfig().catch(console.error)
        }

        return user
      })
    })
    .then(loadOapTools)
    .catch(console.error)

    return () => {
      unregistLogin()
      unregistLogout()
      unlistenRefresh()
    }
  }, [])

  // set system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light")
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  useEffect(() => {
    const unlistenRefresh = window.ipcRenderer.listenRefresh(() => {
      window.ipcRenderer.refreshConfig()
        .then(loadTools)
        .catch(console.error)

      updateOAPUser()
        .catch(console.error)
        .then(removeOapConfig)
        .then(writeOapConfig)
        .catch(console.error)
    })

    return () => {
      unlistenRefresh()
    }
  }, [])

  useEffect(() => {
    const langCode = i18n.language || "en"
    document.documentElement.lang = langCode
  }, [i18n.language])

  return (
    <>
      <RouterProvider router={router} />
      <Updater />
    </>
  )
}

export default App
