import React, { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Toast from "./Toast"
import { useAtom } from 'jotai'
import { sidebarVisibleAtom } from '../atoms/sidebarState'
import { historiesAtom, loadHistoriesAtom } from '../atoms/historyState'
import Header from "./Header"
import { useTranslation } from 'react-i18next'

interface Props {
  onNewChat?: () => void
}

const HistorySidebar = ({ onNewChat }: Props) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isVisible] = useAtom(sidebarVisibleAtom)
  const [histories] = useAtom(historiesAtom)
  const [, loadHistories] = useAtom(loadHistoriesAtom)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (isVisible) {
      loadHistories()
    }
  }, [isVisible, loadHistories])

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        setToast({
          message: t('chat.deleteSuccess'),
          type: 'success'
        })
        if (chatId === currentChatId) {
          navigate('/')
        }
        loadHistories()
      } else {
        setToast({
          message: t('chat.deleteFailed'),
          type: 'error'
        })
      }
    } catch (error) {
      setToast({
        message: t('chat.deleteFailed'),
        type: 'error'
      })
    }
  }

  const loadChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId)
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
      <div className="sidebar-footer">
        <button 
          className="tools-btn"
          onClick={() => navigate('/tools')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
          </svg>
          {t('sidebar.tools')}
        </button>
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