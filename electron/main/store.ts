import Store from "electron-store"

export const preferencesStore = new Store({
  name: "preferences",
  defaults: {
    autoLaunch: false,
    minimalToTray: false,
  }
})

export const hostCache = new Store({
  name: "host-cache",
  defaults: {
    lockHash: "",
  }
})