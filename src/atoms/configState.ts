import { atom } from 'jotai'

export type ModelConfig = Record<string, any>

export const configAtom = atom<ModelConfig | null>(null)

export const loadConfigAtom = atom(
  null,
  async (get, set) => {
    try {
      const response = await fetch("/api/config/model")
      const data = await response.json()
      set(configAtom, data.config ? data.config.model_settings : null)
    } catch (error) {
      console.warn("Failed to load config:", error)
    }
  }
) 