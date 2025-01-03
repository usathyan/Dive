import React, { useMemo } from 'react'
import Markdown from 'marked-react'

interface MessageProps {
  text: string
  isSent: boolean
  timestamp: number
  files?: (File | string)[]
  isError?: boolean
  isLoading?: boolean
}

const Message = ({ text, isSent, files, isError, isLoading }: MessageProps) => {
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
    
    return <Markdown>{text}</Markdown>
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