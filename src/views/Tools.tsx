import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import Toast from "../components/Toast"

interface SubTool {
  name: string
  description?: string
  enabled: boolean
}

interface Tool {
  name: string
  description?: string
  icon?: string
  tools?: SubTool[]
  enabled: boolean
}

const Tools = () => {
  const { t } = useTranslation()
  const [tools, setTools] = useState<Tool[]>([])
  const [error, setError] = useState<string>("")
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [mcpConfig, setMcpConfig] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    fetchTools()
    fetchMCPConfig()
  }, [])

  const fetchTools = async () => {
    try {
      const response = await fetch("/api/tools")
      const data = await response.json()

      if (data.success) {
        setTools(data.tools)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch tools")
    }
  }

  const fetchMCPConfig = async () => {
    try {
      const response = await fetch("/api/config/mcpserver")
      const data = await response.json()
      if (data.success) {
        setMcpConfig(data.config || {})
      }
    } catch (error) {
      console.error("Failed to fetch MCP config:", error)
    }
  }

  const handleConfigSubmit = async (newConfig: Record<string, any>) => {
    try {
      const filledConfig = await window.ipcRenderer.fillPathToConfig(JSON.stringify(newConfig))
      const response = await fetch("/api/config/mcpserver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: filledConfig,
      })
      const data = await response.json()
      if (data.success) {
        setMcpConfig(newConfig)
        setShowConfigModal(false)
        fetchTools()
        setToast({
          message: t("tools.saveSuccess"),
          type: "success"
        })
      }
    } catch (error) {
      console.error("Failed to update MCP config:", error)
      setToast({
        message: t("tools.saveFailed"),
        type: "error"
      })
    }
  }

  const toggleTool = async (toolIndex: number) => {
    try {
      setIsLoading(true)
      const tool = tools[toolIndex]
      const currentEnabled = tool.enabled

      const newConfig = JSON.parse(JSON.stringify(mcpConfig))
      newConfig.mcpServers[tool.name].enabled = !currentEnabled

      const response = await fetch("/api/config/mcpserver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newConfig),
      })

      const data = await response.json()
      if (data.success) {
        setMcpConfig(newConfig)
        await fetchTools()
      }
    } catch (error) {
      console.error("Failed to toggle tool:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleToolSection = (index: number) => {
    const toolElement = document.getElementById(`tool-${index}`)
    toolElement?.classList.toggle("expanded")
  }

  const handleOpenConfigFolder = async () => {
    window.ipcRenderer.openScriptsDir()
  }

  return (
    <div className="tools-page">
      <div className="tools-container">
        <div className="tools-header">
          <div>
            <h1>{t("tools.title")}</h1>
            <p className="subtitle">{t("tools.subtitle")}</p>
          </div>
          <div className="header-actions">
            <button 
              className="edit-btn"
              onClick={() => setShowConfigModal(true)}
            >
              {t("tools.editConfig")}
            </button>
            <button 
              className="folder-btn"
              onClick={handleOpenConfigFolder}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
              </svg>
              {t("tools.openConfigFolder")}
            </button>
          </div>
        </div>

        <div className="tools-list">
          {error ? (
            <div className="error-message">{error}</div>
          ) : (
            tools.map((tool, index) => (
              <div key={index} id={`tool-${index}`} onClick={() => toggleToolSection(index)} className="tool-section">
                <div className="tool-header">
                  <div className="tool-header-content">
                    {tool.icon ? (
                      <img src={tool.icon} alt="" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                      </svg>
                    )}
                    <span className="tool-name">{tool.name}</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={tool.enabled}
                      onChange={() => toggleTool(index)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="slider round"></span>
                  </label>
                  <span className="tool-toggle">▼</span>
                </div>
                <div className="tool-content">
                  {tool.description && (
                    <div className="tool-description">{tool.description}</div>
                  )}
                  {tool.tools && (
                    <div className="sub-tools">
                      {tool.tools.map((subTool, subIndex) => (
                        <div key={subIndex} className="sub-tool">
                          <div className="sub-tool-content">
                            <div className="sub-tool-name">{subTool.name}</div>
                            {subTool.description && (
                              <div className="sub-tool-description">
                                {subTool.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isLoading && (
        <div className="global-loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      {showConfigModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{t("tools.configTitle")}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowConfigModal(false)}
              >
                ×
              </button>
            </div>
            <ConfigForm
              config={mcpConfig}
              onSubmit={handleConfigSubmit}
              onCancel={() => setShowConfigModal(false)}
            />
          </div>
        </div>
      )}

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

interface ConfigFormProps {
  config: Record<string, any>
  onSubmit: (config: Record<string, any>) => void
  onCancel: () => void
}

const ConfigForm: React.FC<ConfigFormProps> = ({
  config,
  onSubmit,
  onCancel
}) => {
  const { t } = useTranslation()
  const [jsonString, setJsonString] = useState(JSON.stringify(config, null, 2))
  const [error, setError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const parsedConfig = JSON.parse(jsonString)
      setIsSubmitting(true)
      await onSubmit(parsedConfig)
      setToast({
        message: t("tools.saveSuccess"),
        type: "success"
      })
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON format")
      } else {
        setToast({
          message: t("tools.saveFailed"),
          type: "error"
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="config-form">
      {error && <div className="error-message">{error}</div>}
      <textarea
        value={jsonString}
        onChange={e => {
          setJsonString(e.target.value)
          setError("")
        }}
        className="config-textarea"
        rows={20}
      />
      <div className="form-actions">
        <button 
          type="button" 
          onClick={onCancel} 
          className="cancel-btn"
          disabled={isSubmitting}
        >
          {t("tools.cancel")}
        </button>
        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="loading-spinner"></div>
          ) : t("tools.save")}
        </button>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </form>
  )
}

export default React.memo(Tools) 