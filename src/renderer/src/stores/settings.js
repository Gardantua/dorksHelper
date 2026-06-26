import { writable } from 'svelte/store'

const DEFAULT_SETTINGS = { vaultPath: '', theme: 'dark' }

function createSettingsStore() {
  const { subscribe, set, update } = writable(DEFAULT_SETTINGS)

  return {
    subscribe,
    load: async () => {
      const data = await window.api.settings.load()
      set(data ?? DEFAULT_SETTINGS)
    },
    save: async (changes) => {
      update(s => {
        const next = { ...s, ...changes }
        window.api.settings.save(next)
        return next
      })
    }
  }
}

export const settings = createSettingsStore()
