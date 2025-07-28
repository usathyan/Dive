import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { modelVerifyListAtom, removeOapConfigAtom, writeOapConfigAtom } from "./atoms/configState"
import { useEffect } from "react"
import { handleGlobalHotkey } from "./atoms/hotkeyState"
import { handleWindowResizeAtom } from "./atoms/sidebarState"
import { systemThemeAtom } from "./atoms/themeState"
import Updater from "./updater"
import { NewVerifyStatus, OldVerifyStatus } from "./atoms/configState"
import { loadOapToolsAtom, oapUsageAtom, oapUserAtom, updateOAPUsageAtom } from "./atoms/oapState"
import { queryGroup } from "./helper/model"
import { modelGroupsAtom, modelSettingsAtom } from "./atoms/modelState"
import { loadMcpConfigAtom, loadToolsAtom } from "./atoms/toolState"
import { useTranslation } from "react-i18next"

function App() {
  const setSystemTheme = useSetAtom(systemThemeAtom)
  const handleWindowResize = useSetAtom(handleWindowResizeAtom)
  const setAllVerifiedList = useSetAtom(modelVerifyListAtom)
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
      window.ipcRenderer.setModelSettings(modelSetting)
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
    const token = await window.ipcRenderer.oapGetToken()
    if (token) {
      const user = await window.ipcRenderer.oapGetMe()
      setOAPUser(user)
      await updateOAPUsage()
      console.log("oap user", user)
    }
  }

  // handle oap event
  useEffect(() => {
    const unregistLogin = window.ipcRenderer.oapRegistEvent("login", () => {
      console.info("oap login")
      updateOAPUser()
        .catch(console.error)
        .then(removeOapConfig)
        .catch(console.error)
        .then(writeOapConfig)
        .catch(console.error)
    })

    const unregistLogout = window.ipcRenderer.oapRegistEvent("logout", () => {
      console.info("oap logout")
      removeOapConfig()
      setOAPUser(null)
      setOAPUsage(null)
    })

    updateOAPUser().then(() => {
      setOAPUser(user => {
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

  // convert old model verify status to new model verify status
  //TODO: remove this after all verified list is converted in future version
  useEffect(() => {
    const result: Record<string, Record<string, NewVerifyStatus | string>> = {}
    const allVerifiedListString = localStorage.getItem("modelVerify")
    const allVerifiedList = JSON.parse(allVerifiedListString || "{}") as Record<string, Record<string, NewVerifyStatus | string>>
    for (const [apiKey, models] of Object.entries({ ...allVerifiedList })) {
      result[apiKey] = {} as Record<string, NewVerifyStatus | string>

      for (const [modelName, status] of Object.entries(models)) {
        if (status === "ignore") {
          result[apiKey][modelName] = "ignore"
          continue
        }

        if ((status as NewVerifyStatus).connecting?.final_state || (status as NewVerifyStatus).supportTools?.final_state) {
          result[apiKey][modelName] = status as NewVerifyStatus
          continue
        }

        const oldStatus = status as unknown as OldVerifyStatus
        result[apiKey][modelName] = {
          success: oldStatus.success,
          connecting: {
            success: oldStatus.connectingSuccess,
            final_state: oldStatus.connectingSuccess ? "CONNECTED" : "ERROR",
            error_msg: oldStatus.connectingSuccess ? null : (oldStatus.connectingResult ?? "Connection failed")
          },
          supportTools: {
            success: oldStatus.supportTools,
            final_state: oldStatus.supportTools ? "TOOL_RESPONDED" : "ERROR",
            error_msg: oldStatus.supportTools ? null : (oldStatus.supportToolsResult ?? "Tool verification failed")
          },
          supportToolsInPrompt: {
            success: false,
            final_state: "ERROR",
            error_msg: "Tool verification failed"
          }
        }
      }
    }
    setAllVerifiedList(result)
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
