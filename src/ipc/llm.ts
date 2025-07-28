import { invoke } from "@tauri-apps/api/core"
import { ModelProvider } from "../../types/model"
import { ModelResults } from "../vite-env"
import { isTauri } from "./env"

export function fetchElectronModels(provider: ModelProvider, apiKey: string, baseURL: string = "", extra: string[] = []) {
  switch(provider) {
  case "openai":
    return window.ipcRenderer.openaiModelList(apiKey)
  case "ollama":
    return window.ipcRenderer.ollamaModelList(baseURL)
  case "anthropic":
    return window.ipcRenderer.anthropicModelList(apiKey, baseURL)
  case "google-genai":
    return window.ipcRenderer.googleGenaiModelList(apiKey)
  case "bedrock":
    return window.ipcRenderer.bedrockModelList(...(extra as [string, string, string, string]))
  case "mistralai":
    return window.ipcRenderer.mistralaiModelList(apiKey)
  // openai compatible
  default:
    return window.ipcRenderer.openaiCompatibleModelList(apiKey, baseURL)
  }
}

export async function fetchTauriModels(provider: ModelProvider, apiKey: string, baseUrl: string = ""): Promise<ModelResults> {
  const wrapper = (res: string[]): ModelResults => ({
    results: res,
    error: undefined,
  })

  switch(provider) {
  case "openai":
    return wrapper(await invoke("llm_openai_model_list", { apiKey }))
  case "ollama":
    return wrapper(await invoke("llm_ollama_model_list", { baseUrl }))
  case "anthropic":
    return wrapper(await invoke("llm_anthropic_model_list", { apiKey, baseUrl }))
  case "google-genai":
    return wrapper(await invoke("llm_google_genai_model_list", { apiKey }))
  case "bedrock":
    return {
      results: [],
      error: "Bedrock is not supported in Tauri",
    }
  case "mistralai":
    return wrapper(await invoke("llm_mistralai_model_list", { apiKey }))
  // openai compatible
  default:
    return wrapper(await invoke("llm_openai_compatible_model_list", { apiKey, baseUrl }))
  }
}

export async function fetchModels(provider: ModelProvider, apiKey: string, baseURL: string = "", extra?: string[]) {
  const res = isTauri
    ? await fetchTauriModels(provider, apiKey, baseURL)
    : await fetchElectronModels(provider, apiKey, baseURL, extra)
  console.log(res)
  return res
}