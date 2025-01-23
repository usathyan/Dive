import { atom } from 'jotai'

export type ModelConfig = Record<string, any>

export const configAtom = atom<ModelConfig | null>(null)

export const loadConfigAtom = atom(
  null,
  async (get, set) => {
    try {
      const response = await fetch("/api/config/model")
      const data = await response.json()
      const config = data.config
      set(configAtom, config ? config.model_settings : null)
      return config
    } catch (error) {
      console.warn("Failed to load config:", error)
      return null
    }
  }
) 