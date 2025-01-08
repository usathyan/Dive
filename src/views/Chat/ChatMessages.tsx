import React, { useEffect, useRef } from "react"
import Message from "./Message"

export interface Message {
  id: string
  text: string
  isSent: boolean
  timestamp: number
  files?: File[]
  isError?: boolean
}

interface Props {
  messages: Message[]
  isLoading?: boolean
}

const ChatMessages = ({ messages, isLoading }: Props) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="chat-messages">
      {messages.map((message, index) => (
        <Message
          key={message.id}
          text={message.text}
          isSent={message.isSent}
          timestamp={message.timestamp}
          files={message.files}
          isError={message.isError}
          isLoading={!message.isSent && index === messages.length - 1 && isLoading}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}

export default React.memo(ChatMessages)
