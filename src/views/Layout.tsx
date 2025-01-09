import React from "react"
import { Outlet } from "react-router-dom"
import HistorySidebar from "../components/HistorySidebar"
import Header from "../components/Header"

const Layout = () => {
  return (
    <div className="app-container">
      <Header />
      <HistorySidebar />
      <Outlet />
    </div>
  )
}

export default React.memo(Layout)
