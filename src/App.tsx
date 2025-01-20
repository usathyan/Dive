import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import { useAtom } from 'jotai'
import { loadConfigAtom } from './atoms/configState'
import { useEffect, useState } from "react"
import ConfigSidebar from "./components/ConfigSidebar"

function App() {
  const [, loadConfig] = useAtom(loadConfigAtom)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig().finally(() => {
      setLoading(false)
      window.postMessage({ payload: "removeLoading" }, "*")
    })
  }, [loadConfig])

  if (loading) {
    return <></>
  }

  return (
    <>
      <RouterProvider router={router} />
      <ConfigSidebar />
    </>
  )
}

export default App
