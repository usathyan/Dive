import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import en from "./locales/en/translation.json"
import zhTW from "./locales/zh-TW/translation.json"
import zhCN from "./locales/zh-CN/translation.json"
import es from "./locales/es/translation.json"
import ja from "./locales/ja/translation.json"
import ko from "./locales/ko/translation.json"

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      "zh-TW": {
        translation: zhTW
      },
      "zh-CN": {
        translation: zhCN
      },
      es: {
        translation: es
      },
      ja: {
        translation: ja
      },
      ko: {
        translation: ko
      }
    },
    fallbackLng: "en",
    supportedLngs: ["zh-TW", "zh-CN", "en", "es", "ja", "ko"],
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
