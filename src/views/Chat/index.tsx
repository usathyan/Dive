import React, { useRef, useState, useCallback, useEffect } from "react"
import ChatMessages, { Message } from "./ChatMessages"
import ChatInput from "./ChatInput"
import { useLocation, useNavigate } from "react-router-dom"

interface ChatHistory {
  id: string
  title: string
  createdAt: string
}

const ChatWindow = () => {
  const location = useLocation()
  const [messages, setMessages] = useState<Message[]>([])
  const [isSidebarVisible, setSidebarVisible] = useState(false)
  const [isAiStreaming, setAiStreaming] = useState(false)
  const currentId = useRef(0)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [isHistoryVisible, setHistoryVisible] = useState(false)
  const [histories, setHistories] = useState<ChatHistory[]>([])
  const currentChatId = useRef<string | null>(null)
  const navigate = useNavigate()
  const isInitialMessageHandled = useRef(false)

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [])

  const onSendMsg = useCallback(async (msg: string, files?: FileList) => {
    if (isAiStreaming)
      return

    const formData = new FormData()
    if (msg)
      formData.append("message", msg)

    if (currentChatId.current)
      formData.append("chatId", currentChatId.current)
    
    if (files) {
      Array.from(files).forEach(file => {
        formData.append("images", file)
      })
    }

    const userMessage: Message = {
      id: `${currentId.current++}`,
      text: msg,
      isSent: true,
      timestamp: Date.now(),
      files: files ? Array.from(files) : undefined
    }

    const aiMessage: Message = {
      id: `${currentId.current++}`,
      text: "",
      isSent: false,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage, aiMessage])
    setAiStreaming(true)
    scrollToBottom()

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: formData
      })

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let currentText = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done)
          break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.trim() === "" || !line.startsWith("data: "))
            continue

          const dataStr = line.slice(5)
          if (dataStr.trim() === "[DONE]")
            break

          try {
            const dataObj = JSON.parse(dataStr)
            if (dataObj.error) {
              setMessages(prev => {
                const newMessages = [...prev]
                newMessages[newMessages.length - 1] = {
                  id: `${currentId.current++}`,
                  text: `Error: ${dataObj.error}`,
                  isSent: false,
                  timestamp: Date.now(),
                  isError: true
                }
                return newMessages
              })
              break
            }

            const data = JSON.parse(dataObj.message)
            switch (data.type) {
              case "text":
                currentText += data.content
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1].text = currentText
                  return newMessages
                })
                scrollToBottom()
                break

              case "chat_info":
                document.title = `${data.content.title} - Dive AI`
                currentChatId.current = data.content.id
                navigate(`/chat/${data.content.id}`, { replace: true })
                break

              case "error":
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = {
                    id: `${currentId.current++}`,
                    text: `Error: ${data.content}`,
                    isSent: false,
                    timestamp: Date.now(),
                    isError: true
                  }
                  return newMessages
                })
                break
            }
          } catch (error) {
            console.warn("Failed to parse SSE data:", dataStr)
          }
        }
      }
    } catch (error: any) {
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          id: `${currentId.current++}`,
          text: `Error: ${error.message}`,
          isSent: false,
          timestamp: Date.now(),
          isError: true
        }
        return newMessages
      })
    } finally {
      setAiStreaming(false)
      scrollToBottom()
    }
  }, [isAiStreaming, scrollToBottom])

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

  const loadChat = useCallback(async (chatId: string) => {
    try {
      setHistoryVisible(false)
      setAiStreaming(true)
      
      const response = await fetch(`/api/chat/${chatId}`)
      const data = await response.json()

      if (data.success) {
        currentChatId.current = chatId
        document.title = `${data.data.chat.title} - Dive AI`
        navigate(`/chat/${chatId}`, { replace: true })

        // 轉換訊息格式
        const convertedMessages = data.data.messages.map((msg: any) => ({
          id: msg.id || String(currentId.current++),
          text: msg.content,
          isSent: msg.role === "user",
          timestamp: new Date(msg.createdAt).getTime(),
          files: msg.files
        }))

        setMessages(convertedMessages)
        scrollToBottom()
      }
    } catch (error) {
      console.warn("Failed to load chat:", error)
    } finally {
      setAiStreaming(false)
    }
  }, [scrollToBottom, navigate])

  const startNewChat = useCallback(() => {
    setMessages([])
    currentChatId.current = null
    document.title = "Dive AI"
    navigate('/')
  }, [navigate])

  const handleInitialMessage = useCallback((message: string) => {
    onSendMsg(message)
    navigate(location.pathname, { replace: true, state: {} })
  }, [onSendMsg, navigate, location.pathname])

  useEffect(() => {
    const state = location.state as { initialMessage?: string } | null
    
    if (state?.initialMessage && !isInitialMessageHandled.current) {
      isInitialMessageHandled.current = true
      handleInitialMessage(state.initialMessage)
    }
  }, [handleInitialMessage])

  useEffect(() => {
    if (isHistoryVisible) {
      loadChatHistory()
    }
  }, [isHistoryVisible, loadChatHistory])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const showHistory = () => {
    setHistoryVisible(true)
  }

  const hideHistory = () => {
    setHistoryVisible(false)
  }

  return (
    <div className="chat-page">
      <div 
        className="history-trigger"
        onMouseEnter={showHistory}
      />
      <div 
        className={`history-sidebar ${isHistoryVisible ? "visible" : ""}`}
        onMouseLeave={hideHistory}
      >
        <div className="history-header">
          <button onClick={startNewChat} className="new-chat-btn">
            + New Chat
          </button>
        </div>
        {histories.map(chat => (
          <div 
            key={chat.id}
            className={`history-item ${chat.id === currentChatId.current ? "active" : ""}`}
            onClick={() => loadChat(chat.id)}
          >
            <div className="history-title">{chat.title || "未命名對話"}</div>
            <div className="history-date">
              {new Date(chat.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <div className="chat-container">
        <div className="chat-window">
          <ChatMessages
            messages={messages}
            isLoading={isAiStreaming}
          />
          <ChatInput
            onSendMessage={onSendMsg}
            disabled={isAiStreaming}
          />
        </div>
      </div>
      <div className={`sidebar ${isSidebarVisible ? "visible" : ""}`}>
        <div className="sidebar-content">
          {/* 側邊欄內容 */}
        </div>
      </div>
    </div>
  )
}

export default React.memo(ChatWindow)
