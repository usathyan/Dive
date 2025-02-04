import React, { useEffect } from "react"
import { createPortal } from "react-dom"

export interface ToastProps {
  message: string
  type?: "info" | "success" | "warning" | "error"
  duration?: number
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = "info", 
  duration = 3000, 
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return createPortal(
    <div className={`toast-container ${type}`}>
      <div className="toast-content">
        {message}
      </div>
    </div>,
    document.body
  )
}

export default React.memo(Toast) 