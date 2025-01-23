import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAtom } from "jotai"
import { configSidebarVisibleAtom } from "../atoms/sidebarState"
import ModelConfigForm from "./ModelConfigForm"
import { defaultInterface, interfaceAtom, ModelProvider, updateProviderAtom } from "../atoms/interfaceState"
import { configAtom } from "../atoms/configState"
import CustomInstructions from "./CustomInstructions"
import Toast from "./Toast"

const ConfigSidebar = () => {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useAtom(configSidebarVisibleAtom)
  const [{ provider, fields }] = useAtom(interfaceAtom)
  const [localProvider, setLocalProvider] = useState<ModelProvider>(provider)
  const [, updateProvider] = useAtom(updateProviderAtom)
  const [config] = useAtom(configAtom)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  
  useEffect(() => {
    if (!isVisible) {
      setLocalProvider(provider)
    }
  }, [isVisible, provider, fields])

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      const response = await fetch("/api/config/model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_settings: {
            ...formData,
            modelProvider: localProvider.startsWith("openai") ? "openai" : localProvider,
            configuration: formData,
          }
        }),
      })

      const data = await response.json()
      if (data.success) {
        updateProvider(localProvider)
        setToast({
          message: t("setup.saveSuccess"),
          type: "success"
        })
        setIsVisible(false)
      }
    } catch (error) {
      console.error("Failed to save config:", error)
      setToast({
        message: t("setup.saveFailed"),
        type: "error"
      })
    }
  }

  return (
    <>
      {isVisible && (
        <div className="modal-overlay" onClick={() => setIsVisible(false)} />
      )}
      <div className={`config-sidebar ${isVisible ? "visible" : ""}`}>
        <div className="config-header">
          <h2>{t("modelConfig.title")}</h2>
          <button 
            className="close-btn"
            onClick={() => setIsVisible(false)}
            title={t("common.close")}
          >
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
            </svg>
          </button>
        </div>
        {isVisible && (
          <div className="config-content">
            <ModelConfigForm
              provider={localProvider}
              fields={defaultInterface[localProvider]}
              initialData={config}
              onProviderChange={setLocalProvider}
              onSubmit={handleSubmit}
            />
            <div className="divider" />
            <CustomInstructions />
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
    </>
  )
}

export default React.memo(ConfigSidebar) 