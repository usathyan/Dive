import React from "react"
import { Outlet } from "react-router-dom"

const Layout = () => {
  return (
    <div className="app-container">
      <Outlet />
    </div>
  )
}

export default React.memo(Layout)
