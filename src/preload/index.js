const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  profiles: {
    load:   ()         => ipcRenderer.invoke('profiles:load'),
    save:   (profiles) => ipcRenderer.invoke('profiles:save', profiles)
  },
  session: {
    load: (profileId) => ipcRenderer.invoke('session:load', profileId),
    save: (session)   => ipcRenderer.invoke('session:save', session)
  },
  settings: {
    load: ()         => ipcRenderer.invoke('settings:load'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings)
  },
  queries: {
    generate: (profile) => ipcRenderer.invoke('queries:generate', profile)
  },
  browser: {
    open: (url) => ipcRenderer.invoke('browser:open', url)
  },
  dialog: {
    selectFolder: () => ipcRenderer.invoke('dialog:select-folder')
  },
  obsidian: {
    writeProfile: (vaultPath, profile)          => ipcRenderer.invoke('obsidian:write-profile', vaultPath, profile),
    writeFinding: (vaultPath, finding, profile) => ipcRenderer.invoke('obsidian:write-finding', vaultPath, finding, profile)
  }
})
