import React from "react"
import { Outlet } from "react-router-dom"
import HistorySidebar from "../components/HistorySidebar"

const Layout = () => {
  return (
    <div className="app-container">
      <HistorySidebar />
      <Outlet />
    </div>
  )
}

export default React.memo(Layout)
