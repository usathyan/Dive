import React from "react"
import { Outlet } from "react-router-dom"
import HistorySidebar from "../components/HistorySidebar"
import Header from "../components/Header"
import { useAtomValue } from 'jotai'
import { configAtom } from '../atoms/configState'

const Layout = () => {
  const config = useAtomValue(configAtom)

  return (
    <div className="app-container">
      {config?.model &&
        <>
          <Header />
          <HistorySidebar />
        </>
      }
      <Outlet />
    </div>
  )
}

export default React.memo(Layout)
