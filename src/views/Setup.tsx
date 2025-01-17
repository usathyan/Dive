import React, { useState } from "react"
import { useAtom } from "jotai"
import { interfaceAtom, updateProviderAtom, ModelProvider, PROVIDER_LABELS } from "../atoms/interfaceState"
import { useTranslation } from "react-i18next"

const PROVIDERS: ModelProvider[] = ["openai", "openai_compatible", "ollama", "anthropic"]

const Setup = () => {
  const { t } = useTranslation()
  const [{ provider, fields }, setInterface] = useAtom(interfaceAtom)
  const [, updateProvider] = useAtom(updateProviderAtom)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as ModelProvider
    updateProvider(newProvider)
    setFormData({})
    setErrors({})
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
        alert("Config saved successfully")
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to save config:", error)
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
  }

  return (
    <div className="setup-page">
      <div className="setup-container">
        <h1>{t("setup.title")}</h1>
        <p className="subtitle">{t("setup.subtitle")}</p>

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
          <button type="submit" className="submit-btn">
            {t("setup.submit")}
          </button>
        </form>
      </div>
    </div>
  )
}

export default React.memo(Setup) 