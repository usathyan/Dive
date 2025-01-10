import React, { useState, useRef, useEffect } from "react"

interface Props {
  onSendMessage?: (message: string, files?: FileList) => void
  disabled?: boolean
}

const ChatInput: React.FC<Props> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState("")
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevDisabled = useRef(disabled)

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items)
      return

    const imageItems = Array.from(items).filter(item => item.type.startsWith("image/"))
    if (imageItems.length > 0) {
      e.preventDefault()
      const files = imageItems.map(item => item.getAsFile()).filter((file): file is File => file !== null)
      handleFiles(files)
    }
  }

  const handleFiles = (files: File[]) => {
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setPreviewImages(prev => [...prev, ...newPreviews])
    
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer()
      const existingFiles = Array.from(fileInputRef.current.files || [])
      
      ;[...existingFiles, ...files].forEach(file => {
        dataTransfer.items.add(file)
      })
      
      fileInputRef.current.files = dataTransfer.files
    }
  }

  const removeImage = (index: number) => {
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer()
      const files = Array.from(fileInputRef.current.files || [])
      files.splice(index, 1)
      files.forEach(file => dataTransfer.items.add(file))
      fileInputRef.current.files = dataTransfer.files
    }

    setPreviewImages(prev => {
      const newPreviews = [...prev]
      URL.revokeObjectURL(newPreviews[index])
      newPreviews.splice(index, 1)
      return newPreviews
    })
  }

  useEffect(() => {
    document.addEventListener("paste", handlePaste)
    return () => {
      document.removeEventListener("paste", handlePaste)
      previewImages.forEach(URL.revokeObjectURL)
    }
  }, [])

  useEffect(() => {
    if (prevDisabled.current && !disabled) {
      textareaRef.current?.focus()
    }
    prevDisabled.current = disabled
  }, [disabled])

  const adjustHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    textarea.style.height = "auto"
    if (e.target.value.includes("\n")) {
      textarea.style.height = `${textarea.scrollHeight}px`
    }
    setMessage(e.target.value)
  }

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !onSendMessage || disabled)
      return

    onSendMessage(message, fileInputRef.current?.files || undefined)
    setMessage("")
    resetTextareaHeight()
    if (fileInputRef.current)
      fileInputRef.current.value = ""
  }

  const onKeydown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey)
      return

    e.preventDefault()
    handleSubmit(e)
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  return (
    <footer className="chat-input">
      {previewImages.length > 0 && (
        <div className="image-previews">
          {previewImages.map((preview, index) => (
            <div key={index} className="preview-item">
              <img src={preview} alt={`Preview ${index + 1}`} />
              <button 
                className="remove-preview" 
                onClick={() => removeImage(index)}
                type="button"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={adjustHeight}
          onKeyDown={onKeydown}
          placeholder="傳送任何訊息..."
          rows={1}
          disabled={disabled}
        />
      </div>
      <div className="input-actions">
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button 
          className="upload-btn" 
          onClick={handleFileClick}
          disabled={disabled}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
          </svg>
        </button>
        <button className="send-btn" onClick={handleSubmit} disabled={disabled}>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </footer>
  )
}

export default React.memo(ChatInput)
