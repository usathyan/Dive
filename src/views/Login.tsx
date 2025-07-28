import React, { useEffect } from "react"
import { useTranslation } from "react-i18next"
import "@/styles/pages/_Login.scss"
import { useAtomValue } from "jotai"
import { useNavigate } from "react-router-dom"
import { isLoggedInOAPAtom } from "../atoms/oapState"

const Login = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isLoggedInOAP = useAtomValue(isLoggedInOAPAtom)

  useEffect(() => {
    if (isLoggedInOAP) {
      setIsInitialized(true)
    }
  }, [isLoggedInOAP])

  const setIsInitialized = (value: boolean) => {
    localStorage.setItem("isInitialized", value ? "true" : "false")
  }

  return (
    <div className="login-page-container">
      <div className="header">
        <h1 className="main-title">Start Your Dive AI</h1>
        <p className="subtitle">
          {t("login.subtitle")}
        </p>
      </div>

      <div className="options-container">
        <div className="option-card">
          <h2 className="option-title">{t("login.title1")}</h2>
          <p className="option-description">
            {t("login.description1")}
          </p>
          <div className="button-container">
            <button className="option-btn setting-btn" onClick={() => {
              navigate("/setup")
              setIsInitialized(true)
            }}>{t("login.button1")}</button>
          </div>
        </div>

        <div className="option-gap"></div>

        <div className="option-card">
          <h2 className="option-title">{t("login.title2")}</h2>
          <p className="option-description">
            {t("login.description2")}
          </p>
          <div className="button-container">
            <button className="option-btn login-btn" onClick={() => window.ipcRenderer.oapLogin(true)}>{t("login.button2")}</button>
            <button className="option-btn login-btn" onClick={() => window.ipcRenderer.oapLogin(false)}>{t("login.button3")}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(Login)
