import { atom } from "jotai"

export type ModelProvider = 'openai' | 'openai_compatible' | 'ollama' | 'anthropic'

export const PROVIDER_LABELS: Record<ModelProvider, string> = {
  openai: 'OpenAI',
  openai_compatible: 'OpenAI Compatible',
  ollama: 'Ollama',
  anthropic: 'Anthropic'
}

export interface FieldDefinition {
  type: string
  description: string
  required: boolean
  default: any
  placeholder?: any
  label: string
}

export type InterfaceDefinition = Record<string, FieldDefinition>

const defaultInterface: Record<ModelProvider, InterfaceDefinition> = {
  openai: {
    apiKey: {
      type: 'string',
      label: 'API Key',
      description: 'OpenAI API Key',
      required: false,
      default: '',
      placeholder: 'YOUR_API_KEY'
    },
    model: {
      type: 'string',
      label: 'Model ID',
      description: 'Model name to use',
      required: false,
      default: '',
      placeholder: 'gpt-4o-mini'
    },
  },
  openai_compatible: {
    baseURL: {
      type: 'string',
      label: 'Base URL',
      description: 'Base URL for API calls',
      required: false,
      default: '',
      placeholder: ''
    },
    apiKey: {
      type: 'string',
      label: 'API Key',
      description: 'OpenAI API Key',
      required: false,
      default: '',
      placeholder: 'YOUR_API_KEY'
    },
    model: {
      type: 'string',
      label: 'Model ID',
      description: 'Model name to use',
      required: false,
      default: '',
      placeholder: ''
    },
  },
  ollama: {
    model: {
      type: 'string',
      label: 'Model ID',
      description: 'Model name to use',
      required: false,
      default: '',
      placeholder: 'llama2'
    },
    baseURL: {
      type: 'string',
      label: 'Base URL',
      description: 'Base URL for API calls',
      required: false,
      default: 'http://localhost:11434',
      placeholder: 'http://localhost:11434'
    }
  },
  anthropic: {
    apiKey: {
      type: 'string',
      label: 'API Key',
      description: 'Anthropic API Key',
      required: false,
      default: '',
      placeholder: 'YOUR_API_KEY'
    },
    baseURL: {
      type: 'string',
      label: 'Base URL',
      description: 'Base URL for API calls',
      required: false,
      default: '',
      placeholder: 'https://api.anthropic.com'
    }
  }
}

export const interfaceAtom = atom<{
  provider: ModelProvider
  fields: InterfaceDefinition
}>({
  provider: 'openai',
  fields: defaultInterface['openai']
})

export const updateProviderAtom = atom(
  null,
  (get, set, provider: ModelProvider) => {
    set(interfaceAtom, {
      provider,
      fields: defaultInterface[provider]
    })
  }
) 