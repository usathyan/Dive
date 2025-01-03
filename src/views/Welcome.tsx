import React, { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"

const Welcome = () => {
  const navigate = useNavigate()
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      navigate("/chat", { 
        state: { 
          initialMessage: message,
        } 
      })
    }
  }

  const handleSuggestionClick = (text: string) => {
    navigate("/chat", { 
      state: { 
        initialMessage: text,
      } 
    })
  }

  return (
    <div className="main-container">
      <div className="welcome-content">
        <h1>歡迎使用 Dive AI</h1>
        <p className="subtitle">您的桌面 AI 智慧合作夥伴，快速、專注，專為深度搜尋而設計。</p>
        
        <form className="welcome-input" onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="傳送任何問題..."
            rows={1}
          />
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            style={{ display: "none" }}
          />
          <button type="button" className="upload-btn" onClick={() => fileInputRef.current?.click()}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </button>
          <button type="submit" className="send-btn">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>

        <div className="suggestions">
          <div className="suggestion-item" onClick={() => handleSuggestionClick("哪些筆記型電腦，可以支援高效能的訓練，不想買不卡？")}>
            <strong>哪些筆記型電腦，可以支援高效能的訓練，不想買不卡？</strong>
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
    </div>
  )
}

export default React.memo(Welcome)
