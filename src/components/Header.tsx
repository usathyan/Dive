import React from 'react'
import { useSetAtom } from 'jotai'
import { toggleSidebarAtom } from '../atoms/sidebarState'

const Header = () => {
  const toggleSidebar = useSetAtom(toggleSidebarAtom)

  return (
    <div className="app-header">
      <div className="header-content">
        <button 
          className="menu-btn"
          onClick={toggleSidebar}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>
        <h1>Dive AI</h1>
      </div>
    </div>
  )
}

export default React.memo(Header) 