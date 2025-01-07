import React, { useRef, useState, useCallback, useEffect } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import ChatMessages, { Message } from "./ChatMessages"
import ChatInput from "./ChatInput"
import { eventBus } from "../../utils/eventBus"
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter"
import { tomorrow, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useColorScheme } from "../../hooks/useColorScheme"

const ChatWindow = () => {
  const { chatId } = useParams()
  const location = useLocation()
  const [messages, setMessages] = useState<Message[]>([])
  const [isAiStreaming, setAiStreaming] = useState(false)
  const currentId = useRef(0)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const currentChatId = useRef<string | null>(null)
  const navigate = useNavigate()
  const isInitialMessageHandled = useRef(false)
  const [selectedCode, setSelectedCode] = useState<{ code: string; language: string; isStreaming: boolean } | null>(null)
  const [streamingCode, setStreamingCode] = useState<{ code: string; language: string } | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const colorScheme = useColorScheme()

  const loadChat = useCallback(async (id: string) => {
    try {
      setAiStreaming(true)
      const response = await fetch(`/api/chat/${id}`)
      const data = await response.json()

      if (data.success) {
        currentChatId.current = id
        document.title = `${data.data.chat.title} - Dive AI`

        // 轉換訊息格式
        const convertedMessages = data.data.messages.map((msg: any) => ({
          id: msg.id || String(currentId.current++),
          text: msg.content,
          isSent: msg.role === "user",
          timestamp: new Date(msg.createdAt).getTime(),
          files: msg.files
        }))

        setMessages(convertedMessages)
      }
    } catch (error) {
      console.warn("Failed to load chat:", error)
    } finally {
      setAiStreaming(false)
    }
  }, [])

  // 處理 URL 中的 chatId
  useEffect(() => {
    if (chatId && chatId !== currentChatId.current) {
      loadChat(chatId)
    }
  }, [chatId, loadChat])

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
    eventBus.emit('code-streaming-start', undefined)

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
          if (dataStr.trim() === "[DONE]") {
            eventBus.emit('code-streaming-end', undefined)
            break
          }

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
    scrollToBottom()
  }, [messages, scrollToBottom])
  
  useEffect(() => {
    const handleCodeStreaming = (data: { code: string; language: string }) => { 
      setStreamingCode(data)
    }
    
    const handleCodeStreamingStart = () => {
      setIsStreaming(true)
    }

    const handleCodeStreamingEnd = () => {
      setIsStreaming(false)
    }

    eventBus.on('code-streaming', handleCodeStreaming)
    eventBus.on('code-streaming-start', handleCodeStreamingStart)
    eventBus.on('code-streaming-end', handleCodeStreamingEnd)
    return () => {
      eventBus.remove('code-streaming', handleCodeStreaming)
      eventBus.remove('code-streaming-start', handleCodeStreamingStart)
      eventBus.remove('code-streaming-end', handleCodeStreamingEnd)
    }
  }, [])

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-window">
          <ChatMessages
            messages={messages}
            isLoading={isAiStreaming}
            onCodeSelect={setSelectedCode}
          />
          <ChatInput
            onSendMessage={onSendMsg}
            disabled={isAiStreaming}
          />
        </div>
      </div>
      {selectedCode && (
        <div className="code-modal">
          <div className="code-modal-content">
            <div className="code-modal-header">
              <span className="language">{selectedCode.language}</span>
              <button 
                className="close-btn"
                onClick={() => setSelectedCode(null)}
              >
                ×
              </button>
            </div>
            <div className="code-modal-body">
              <SyntaxHighlighter
                language={selectedCode.language.toLowerCase()}
                style={colorScheme === "dark" ? tomorrow : oneLight}
                showLineNumbers={true}
                customStyle={{
                  margin: 0,
                  height: '100%',
                  background: 'transparent'
                }}
                codeTagProps={{
                  style: {
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }
                }}
              >
                {selectedCode.isStreaming && isStreaming ? streamingCode?.code || "" : selectedCode.code}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(ChatWindow)
