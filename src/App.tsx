import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import { useAtom } from 'jotai'
import { loadConfigAtom } from './atoms/configState'
import { useEffect, useState } from "react"
import { updateProviderAtom } from "./atoms/interfaceState"

function App() {
  const [, loadConfig] = useAtom(loadConfigAtom)
  const [, updateProvider] = useAtom(updateProviderAtom)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
      .then((config) => {
        if (config?.model_settings?.modelProvider) {
          const provider = config.model_settings.modelProvider === "openai" 
            ? (config.model_settings.baseURL ? "openai_compatible" : "openai")
            : config.model_settings.modelProvider
          updateProvider(provider)
        }
      })
      .finally(() => {
        setLoading(false)
        window.postMessage({ payload: "removeLoading" }, "*")
      })
  }, [loadConfig, updateProvider])

  if (loading) {
    return <></>
  }

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
