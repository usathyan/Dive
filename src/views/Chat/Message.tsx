import React, { useMemo } from "react"
import Markdown from "marked-react"
import { eventBus } from "../../utils/eventBus"
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useColorScheme } from "../../hooks/useColorScheme";

interface MessageProps {
  text: string
  isSent: boolean
  timestamp: number
  files?: (File | string)[]
  isError?: boolean
  isLoading?: boolean
  onCodeSelect?: (code: { code: string; language: string; isStreaming: boolean }) => void
}

const Message = ({ text, isSent, files, isError, isLoading, onCodeSelect }: MessageProps) => {
  const colorScheme = useColorScheme()
  // 自定義渲染器
  const renderer = {
    code(code: string, language: string) {
      const lines = code.split('\n')
      const isLongCode = true

      if (isLongCode) {
        const cleanText = text.replace(/\s+(?=```)/gm, '')
        const isBlockComplete = cleanText.includes(code.trim() + "```")
        const handleClick = () => {
          onCodeSelect?.({ code, language, isStreaming: !isBlockComplete })
        }
        
        if (!isBlockComplete) {
          setTimeout(() => {
            eventBus.emit("code-streaming", {
              code,
              language,
            })
          }, 0)
        }

        return (
          <button 
            className="code-block-button"
            onClick={handleClick}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
            <span>點擊預覽</span>
          </button>
        )
      }

      return (
        <div className="code-block">
          <SyntaxHighlighter
            language={language.toLowerCase()}
            style={colorScheme === "dark" ? tomorrow : oneLight}
            customStyle={{
              margin: 0,
              padding: '12px',
              background: 'transparent'
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      )
    }
  }

  const formattedText = useMemo(() => {
    if (isSent) {
      const splitText = text.split("\n")
      return splitText.map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < splitText.length - 1 && <br />}
        </React.Fragment>
      ))
    }
    
    return <Markdown renderer={renderer}>{text}</Markdown>
  }, [text, isSent])

  return (
    <div className={`message ${isSent ? "sent" : "received"} ${isError ? "error" : ""}`}>
      {formattedText}
      {files && files.length > 0 && (
        <div className="message-images">
          {files.map((file, index) => (
            <img 
              key={index}
              src={typeof file === "string" ? `/api/uploads/${file}` : URL.createObjectURL(file)}
              alt={`Uploaded ${index + 1}`}
              className="message-image"
            />
          ))}
        </div>
      )}
      {isLoading && (
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
    </div>
  )
}

export default React.memo(Message) 