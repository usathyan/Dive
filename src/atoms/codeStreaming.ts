import { atom } from 'jotai'

interface StreamingCode {
  code: string
  language: string
}

interface CodeState {
  isStreaming: boolean
  streamingCode: StreamingCode | null
}

const initialState: CodeState = {
  isStreaming: false,
  streamingCode: null,
}

export const codeStreamingAtom = atom<CodeState>(initialState)

export const updateStreamingCodeAtom = atom(
  null,
  (get, set, code: StreamingCode) => {
    set(codeStreamingAtom, {
      ...get(codeStreamingAtom),
      isStreaming: true,
      streamingCode: code
    })
  }
)

export const endStreamingAtom = atom(
  null,
  (get, set) => {
    set(codeStreamingAtom, {
      ...get(codeStreamingAtom),
      isStreaming: false
    })
  }
)
