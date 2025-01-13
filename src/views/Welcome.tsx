import React, { useState, useRef, KeyboardEvent, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Toast from "../components/Toast"
import { useSetAtom } from 'jotai'
import { updateStreamingCodeAtom } from '../atoms/codeStreaming'
import { useTranslation } from 'react-i18next'

const formatFileSize = (bytes: number) => {
  if (bytes === 0)
    return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const Welcome = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [message, setMessage] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'warning' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const updateStreamingCode = useSetAtom(updateStreamingCodeAtom)

  useEffect(() => {
    updateStreamingCode({ code: "", language: "" })
  }, [updateStreamingCode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() || uploadedFiles.length > 0) {
      navigate("/chat", { 
        state: { 
          initialMessage: message,
          files: uploadedFiles
        } 
      })
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter: 換行
        return
      }
      // Enter: 送出
      e.preventDefault()
      if (message.trim() || uploadedFiles.length > 0) {
        navigate("/chat", { 
          state: { 
            initialMessage: message,
            files: uploadedFiles
          } 
        })
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + uploadedFiles.length > 5) {
      setToast({
        message: '最多只能上傳 5 個檔案',
        type: 'warning'
      })
      return
    }
    setUploadedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSuggestionClick = (text: string) => {
    navigate("/chat", { 
      state: { 
        initialMessage: text,
      } 
    })
  }

  const isImageFile = (file: File) => {
    return file.type.startsWith('image/')
  }

  return (
    <div className="main-container">
      <div className="welcome-content">
        <h1>{t('welcome.title')}</h1>
        <p className="subtitle">{t('welcome.subtitle')}</p>
        
        <form className="welcome-input" onSubmit={handleSubmit}>
          <div className="input-container">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.placeholder')}
              rows={1}
            />
            <div className="input-actions">
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.docx,.odt,.html,.csv,.txt,.rtf,.epub"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <button 
                type="button" 
                className="upload-btn" 
                onClick={() => fileInputRef.current?.click()}
                title={t('chat.uploadFile')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                </svg>
              </button>
              <button type="submit" className="send-btn" disabled={!message.trim() && uploadedFiles.length === 0}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </form>

        {uploadedFiles.length > 0 && (
          <div className="uploaded-files-preview">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="file-item">
                {isImageFile(file) ? (
                  <div className="image-preview">
                    <img src={URL.createObjectURL(file)} alt={file.name} />
                    <button 
                      type="button" 
                      className="remove-btn"
                      onClick={() => removeFile(index)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="file-info">
                    <div className="file-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                      </svg>
                    </div>
                    <div className="file-details">
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">{formatFileSize(file.size)}</div>
                    </div>
                    <button 
                      type="button" 
                      className="remove-btn"
                      onClick={() => removeFile(index)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="suggestions">
          <div className="suggestion-item" onClick={() => handleSuggestionClick("哪些筆記型電腦，可以支援高效能的訓練，不想買顯卡？")}>
            <strong>哪些筆記型電腦，可以支援高效能的訓練，不想買顯卡？</strong>
            <p>詢問產品建議</p>
            <span className="arrow">→</span>
          </div>
          <div className="suggestion-item" onClick={() => handleSuggestionClick("500元以下的好用廚房非電器類的小工具有哪些？")}>
            <strong>500元以下的好用廚房非電器類的小工具有哪些?</strong>
            <p>尋找特定價格範圍的商品</p>
            <span className="arrow">→</span>
          </div>
          <div className="suggestion-item" onClick={() => handleSuggestionClick("推薦最近很夯的聖誕節限家家飾！")}>
            <strong>推薦最近很夯的聖誕節限家家飾！</strong>
            <p>探索熱門商品</p>
            <span className="arrow">→</span>
          </div>
        </div>
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

export default React.memo(Welcome)
