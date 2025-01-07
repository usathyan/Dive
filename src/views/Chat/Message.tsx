import React, { useMemo } from 'react'
import Markdown from 'marked-react'

interface MessageProps {
  text: string
  isSent: boolean
  timestamp: number
  files?: (File | string)[]
  isError?: boolean
  isLoading?: boolean
  onCodeSelect?: (code: { code: string; language: string }) => void
}

const Message = ({ text, isSent, files, isError, isLoading, onCodeSelect }: MessageProps) => {
  // 自定義渲染器
  const renderer = {
    code(code: string, language: string) {
      return (
        <button 
          className="code-block-button"
          onClick={() => onCodeSelect?.({ code, language })}
        >
          <div className="code-preview">
            <div className="code-header">
              <span className="language">{language}</span>
              <span className="view-icon">→</span>
            </div>
            <pre>
              <code className={language}>
                {code.split('\n').slice(0, 3).join('\n')}
                {code.split('\n').length > 3 && '...'}
              </code>
            </pre>
          </div>
        </button>
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