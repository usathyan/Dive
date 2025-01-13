import React, { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Toast from "./Toast"
import { useAtom } from 'jotai'
import { sidebarVisibleAtom } from '../atoms/sidebarState'
import Header from "./Header"
import { useTranslation } from 'react-i18next'

export interface ChatHistory {
  id: string
  title: string
  createdAt: string
}

interface Props {
  onNewChat?: () => void
}

const HistorySidebar = ({ onNewChat }: Props) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useAtom(sidebarVisibleAtom)
  const [histories, setHistories] = useState<ChatHistory[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

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

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation() // 防止觸發 loadChat
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        setToast({
          message: '對話已刪除',
          type: 'success'
        })
        // 如果刪除的是當前對話，導航到首頁
        if (chatId === currentChatId) {
          navigate('/')
        }
        // 重新載入歷史記錄
        loadChatHistory()
      } else {
        setToast({
          message: '刪除失敗',
          type: 'error'
        })
      }
    } catch (error) {
      setToast({
        message: '刪除失敗',
        type: 'error'
      })
    }
  }

  const loadChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId)
    setIsVisible(false)
    navigate(`/chat/${chatId}`)
  }, [navigate, setIsVisible])

  const handleNewChat = () => {
    setCurrentChatId(null)
    if (onNewChat) {
      onNewChat()
    } else {
      navigate('/')
    }
  }

  useEffect(() => {
    if (isVisible) {
      loadChatHistory()
    }
  }, [isVisible, loadChatHistory])

  return (
    <div className={`history-sidebar ${isVisible ? "visible" : ""}`}>
      <Header />
      <div className="history-header">
        <button onClick={handleNewChat} className="new-chat-btn">
          + {t('chat.newChat')}
        </button>
      </div>
      <div className="history-list">
        {histories.map(chat => (
          <div 
            key={chat.id}
            className={`history-item ${chat.id === currentChatId ? "active" : ""}`}
            onClick={() => loadChat(chat.id)}
          >
            <div className="history-content">
              <div className="history-title">{chat.title || t('chat.untitledChat')}</div>
              <div className="history-date">
                {new Date(chat.createdAt).toLocaleString()}
              </div>
            </div>
            <button 
              className="delete-btn"
              onClick={(e) => deleteChat(e, chat.id)}
              title={t('chat.deleteChat')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default React.memo(HistorySidebar) 