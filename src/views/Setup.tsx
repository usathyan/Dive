import React, { useState, useEffect } from "react"
import { useAtom } from "jotai"
import { interfaceAtom, updateProviderAtom, ModelProvider, PROVIDER_LABELS } from "../atoms/interfaceState"
import { useTranslation } from "react-i18next"
import { useNavigate, useLocation } from "react-router-dom"
import { configAtom } from "../atoms/configState"
import Toast from "../components/Toast"

const PROVIDERS: ModelProvider[] = ["openai", "openai_compatible", "ollama", "anthropic"]

const Setup = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [{ provider, fields }, setInterface] = useAtom(interfaceAtom)
  const [, updateProvider] = useAtom(updateProviderAtom)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [config] = useAtom(configAtom)
  const isInitialSetup = location.pathname !== '/setup'
  const [isVerified, setIsVerified] = useState(false)
  const [initialConfig, setInitialConfig] = useState<Record<string, any> | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!isInitialSetup && config) {
      const configData = { ...config }
      setFormData(configData)
      setInitialConfig(configData)

      const shouldUseCompatible = config.modelProvider === 'openai' && config.baseURL
      const currentProvider = shouldUseCompatible 
        ? 'openai_compatible'
        : config.modelProvider === 'openai'
          ? 'openai'
          : config.modelProvider as ModelProvider
      
      updateProvider(currentProvider)
    }
  }, [config, isInitialSetup, updateProvider])

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as ModelProvider
    updateProvider(newProvider)

    if (initialConfig && newProvider === initialConfig.modelProvider) {
      setFormData(initialConfig)
    } else {
      setFormData({})
    }

    setErrors({})
    setIsVerified(false)
  }

  const verifyModel = async () => {
    const newErrors: Record<string, string> = {}
    Object.entries(fields).forEach(([key, field]) => {
      if (field.required && !formData[key]) {
        newErrors[key] = t("setup.required")
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setIsVerifying(true)
      const response = await fetch("/api/modelVerify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: {
            model_settings: {
              ...formData,
              modelProvider: provider.startsWith("openai") ? "openai" : provider,
            }
          }
        }),
      })

      const data = await response.json()
      if (data.success) {
        setIsVerified(true)
        setToast({
          message: t("setup.verifySuccess"),
          type: 'success'
        })
      } else {
        setIsVerified(false)
        setToast({
          message: t("setup.verifyFailed"),
          type: 'error'
        })
      }
    } catch (error) {
      console.error("Failed to verify model:", error)
      setIsVerified(false)
      setToast({
        message: t("setup.verifyError"),
        type: 'error'
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    Object.entries(fields).forEach(([key, field]) => {
      if (field.required && !formData[key]) {
        newErrors[key] = t("setup.required")
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/config/model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_settings: {
            ...formData,
            modelProvider: provider.startsWith("openai") ? "openai" : provider,
          }
        }),
      })

      const data = await response.json()
      if (data.success) {
        setToast({
          message: t("setup.saveSuccess"),
          type: 'success'
        })
        
        if (isInitialSetup) {
          setTimeout(() => window.location.reload(), 1500)
        }
      }
    } catch (error) {
      console.error("Failed to save config:", error)
      setToast({
        message: t("setup.saveFailed"),
        type: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
    setErrors(prev => ({
      ...prev,
      [key]: ""
    }))
    setIsVerified(false)
  }

  return (
    <div className="setup-page">
      <div className="setup-container">
        {!isInitialSetup && (
          <button 
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            {t('setup.back')}
          </button>
        ) || (
          <>
            <h1>{t("setup.title")}</h1>
            <p className="subtitle">{t("setup.subtitle")}</p>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t("setup.provider")}</label>
            <select 
              value={provider} 
              onChange={handleProviderChange}
              className="provider-select"
            >
              {PROVIDERS.map(p => (
                <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
              ))}
            </select>
          </div>

          {Object.entries(fields).map(([key, field]) => (
            <div key={key} className="form-group">
              <label>
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>
              <div className="field-description">{field.description}</div>
              <input
                type="text"
                value={formData[key] || ""}
                onChange={e => handleChange(key, e.target.value)}
                placeholder={field.placeholder?.toString()}
                className={errors[key] ? "error" : ""}
              />
              {errors[key] && <div className="error-message">{errors[key]}</div>}
            </div>
          ))}

          <div className="form-actions">
            <button 
              type="button" 
              className="verify-btn"
              onClick={verifyModel}
              disabled={isVerifying || isSubmitting}
            >
              {isVerifying ? (
                <div className="loading-spinner"></div>
              ) : t("setup.verify")}
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isVerifying || isSubmitting || !isVerified}
            >
              {isSubmitting ? (
                <div className="loading-spinner"></div>
              ) : t("setup.submit")}
            </button>
          </div>
        </form>
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

export default React.memo(Setup) 