/// <reference types="vite/client" />

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer & {
    port: () => Promise<number>
    getResources: (p: string) => Promise<string>
  }
}
