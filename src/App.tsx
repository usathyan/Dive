import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import { useSetAtom } from "jotai"
import { modelVerifyListAtom } from "./atoms/configState"
import { useEffect } from "react"
import { handleGlobalHotkey } from "./atoms/hotkeyState"
import { handleWindowResizeAtom } from "./atoms/sidebarState"
import { systemThemeAtom } from "./atoms/themeState"
import Updater from "./updater"
import { NewVerifyStatus, OldVerifyStatus } from "./atoms/configState"
import { useTranslation } from "react-i18next"

function App() {
  const setSystemTheme = useSetAtom(systemThemeAtom)
  const handleWindowResize = useSetAtom(handleWindowResizeAtom)
  const setAllVerifiedList = useSetAtom(modelVerifyListAtom)
  const { i18n } = useTranslation()

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
