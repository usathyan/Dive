import { InterfaceProvider } from "../atoms/interfaceState"
import { ModelProvider } from "../../types/model"

export function transformModelProvider(provider: InterfaceProvider): ModelProvider {
  switch (provider) {
    case "openrouter":
    case "lmstudio":
    case "groq":
    case "grok":
    case "nvdia":
    case "perplexity":
    case "openai_compatible":
      return "openai"
    case "google-genai":
      return "google-genai"
    default:
      return provider
  }
}
