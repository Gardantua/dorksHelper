import { ipcMain, shell, dialog } from 'electron'
import { loadProfiles, saveProfiles, loadSession, saveSession, loadSettings, saveSettings } from './core/storage'
import { generateQueries } from './core/dork-engine'
import { writeProfileNote, writeFindingNote } from './core/obsidian'

export function registerIpcHandlers() {
  ipcMain.handle('profiles:load', () => loadProfiles())
  ipcMain.handle('profiles:save', (_e, profiles) => saveProfiles(profiles))

  ipcMain.handle('session:load', (_e, profileId) => loadSession(profileId))
  ipcMain.handle('session:save', (_e, session) => saveSession(session))

  ipcMain.handle('settings:load', () => loadSettings())
  ipcMain.handle('settings:save', (_e, settings) => saveSettings(settings))

  ipcMain.handle('queries:generate', (_e, profile) => generateQueries(profile))

  ipcMain.handle('browser:open', (_e, url) => shell.openExternal(url))

  ipcMain.handle('dialog:select-folder', async (_e) => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('obsidian:write-profile', (_e, vaultPath, profile) => {
    return writeProfileNote(vaultPath, profile)
  })

  ipcMain.handle('obsidian:write-finding', (_e, vaultPath, finding, profile) => {
    return writeFindingNote(vaultPath, finding, profile)
  })
}
