import React, { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"

export interface ChatHistory {
  id: string
  title: string
  createdAt: string
}

interface Props {
  onNewChat?: () => void
}

const HistorySidebar = ({ onNewChat }: Props) => {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [histories, setHistories] = useState<ChatHistory[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

  const loadChatHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/list")
      const data = await response.json()

      if (data.success) {
        setHistories(data.data)
      }
    } catch (error) {
      console.warn("Failed to load chat history:", error)
    }
  }, [])

  const loadChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId)
    setIsVisible(false)
    navigate(`/chat/${chatId}`)
  }, [navigate])

  const handleNewChat = () => {
    setCurrentChatId(null)
    if (onNewChat) {
      onNewChat()
    } else {
      navigate('/')
    }
  }

  const showHistory = () => {
    setIsVisible(true)
  }

  const hideHistory = () => {
    setIsVisible(false)
  }

  useEffect(() => {
    if (isVisible) {
      loadChatHistory()
    }
  }, [isVisible, loadChatHistory])

  return (
    <>
      <div 
        className="history-trigger"
        onMouseEnter={showHistory}
      />
      <div 
        className={`history-sidebar ${isVisible ? "visible" : ""}`}
        onMouseLeave={hideHistory}
      >
        <div className="history-header">
          <button onClick={handleNewChat} className="new-chat-btn">
            + New Chat
          </button>
        </div>
        {histories.map(chat => (
          <div 
            key={chat.id}
            className={`history-item ${chat.id === currentChatId ? "active" : ""}`}
            onClick={() => loadChat(chat.id)}
          >
            <div className="history-title">{chat.title || "未命名對話"}</div>
            <div className="history-date">
              {new Date(chat.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default React.memo(HistorySidebar) 