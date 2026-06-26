import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

function getDataDir() {
  return join(app.getPath('userData'), 'data')
}

function getSessionsDir() {
  return join(getDataDir(), 'sessions')
}

function ensureDirs() {
  const dataDir = getDataDir()
  const sessionsDir = getSessionsDir()
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
  if (!existsSync(sessionsDir)) mkdirSync(sessionsDir, { recursive: true })
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return fallback
  }
}

function writeJson(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export function loadProfiles() {
  ensureDirs()
  return readJson(join(getDataDir(), 'profiles.json'), [])
}

export function saveProfiles(profiles) {
  ensureDirs()
  writeJson(join(getDataDir(), 'profiles.json'), profiles)
}

export function loadSession(profileId) {
  ensureDirs()
  return readJson(join(getSessionsDir(), `${profileId}.json`), null)
}

export function saveSession(session) {
  ensureDirs()
  writeJson(join(getSessionsDir(), `${session.profileId}.json`), session)
}

export function loadSettings() {
  ensureDirs()
  return readJson(join(getDataDir(), 'settings.json'), {
    vaultPath: '',
    theme: 'dark'
  })
}

export function saveSettings(settings) {
  ensureDirs()
  writeJson(join(getDataDir(), 'settings.json'), settings)
}
