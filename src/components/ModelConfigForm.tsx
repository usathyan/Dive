import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { ModelProvider, PROVIDER_LABELS } from "../atoms/interfaceState"
import { ModelConfig } from "../atoms/configState"

const PROVIDERS: ModelProvider[] = ["openai", "openai_compatible", "ollama", "anthropic"]

interface ModelConfigFormProps {
  provider: ModelProvider
  fields: Record<string, any>
  initialData?: ModelConfig|null
  onProviderChange: (provider: ModelProvider) => void
  onSubmit: (data: ModelConfig) => void
  submitLabel?: string
  showVerify?: boolean
}

const ModelConfigForm: React.FC<ModelConfigFormProps> = ({
  provider,
  fields,
  initialData,
  onProviderChange,
  onSubmit,
  submitLabel = "setup.submit",
  showVerify = true
}) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<ModelConfig>(initialData || {})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as ModelProvider
    onProviderChange(newProvider)
    setIsVerified(false)
  }

  const verifyModel = async () => {
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
        alert(t("setup.verifySuccess"))
      } else {
        setIsVerified(false)
        alert(t("setup.verifyFailed"))
      }
    } catch (error) {
      console.error("Failed to verify model:", error)
      setIsVerified(false)
      alert(t("setup.verifyError"))
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
      await onSubmit(formData)
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
        {showVerify && (
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
        )}
        <button 
          type="submit" 
          className="submit-btn"
          disabled={isVerifying || isSubmitting || (showVerify && !isVerified)}
        >
          {isSubmitting ? (
            <div className="loading-spinner"></div>
          ) : t(submitLabel)}
        </button>
      </div>
    </form>
  )
}

export default React.memo(ModelConfigForm) 