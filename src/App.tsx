import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import "./App.scss"
import { useAtom } from 'jotai'
import { loadConfigAtom } from './atoms/configState'
import { useEffect, useState } from "react"

function App() {
  const [, loadConfig] = useAtom(loadConfigAtom)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadConfig().finally(() => setLoading(true))
  }, [loadConfig])

  if (!loading) {
    return <></>
  }

  return <RouterProvider router={router} />
}

export default App
