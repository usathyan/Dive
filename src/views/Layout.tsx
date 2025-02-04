import React from "react"
import { Outlet } from "react-router-dom"
import HistorySidebar from "../components/HistorySidebar"
import Header from "../components/Header"
import { useAtom } from "jotai"
import { configAtom } from "../atoms/configState"
import ConfigSidebar from "../components/ConfigSidebar"

const Layout = () => {
  const [config] = useAtom(configAtom)

  return (
    <div className="app-container">
      {config?.model &&
        <>
          <Header />
          <HistorySidebar />
          <ConfigSidebar />
        </>
      }
      <Outlet />
    </div>
  )
}

export default React.memo(Layout)
