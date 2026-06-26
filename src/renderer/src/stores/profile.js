import { writable, derived } from 'svelte/store'

export const profiles      = writable([])
export const activeProfileId = writable(null)

export const activeProfile = derived(
  [profiles, activeProfileId],
  ([$profiles, $id]) => $profiles.find(p => p.id === $id) ?? null
)

export function makeProfile(fields = {}) {
  return {
    id:         crypto.randomUUID(),
    type:       'person',
    createdAt:  new Date().toISOString(),
    updatedAt:  new Date().toISOString(),
    name:       '',
    aliases:    [],
    emails:     [],
    phones:     [],
    usernames:  [],
    company:    '',
    location:   '',
    domain:     '',
    notes:      '',
    ...fields
  }
}

async function persist(updated) {
  profiles.set(updated)
  await window.api.profiles.save(updated)
}

export const profileActions = {
  load: async () => {
    const data = await window.api.profiles.load()
    profiles.set(data ?? [])
  },

  add: async (fields) => {
    const profile = makeProfile(fields)
    let updated
    profiles.update(list => { updated = [...list, profile]; return updated })
    await window.api.profiles.save(updated)
    activeProfileId.set(profile.id)
    return profile
  },

  update: async (id, changes) => {
    let updated
    profiles.update(list => {
      updated = list.map(p =>
        p.id === id ? { ...p, ...changes, updatedAt: new Date().toISOString() } : p
      )
      return updated
    })
    await window.api.profiles.save(updated)
  },

  delete: async (id) => {
    let updated
    profiles.update(list => { updated = list.filter(p => p.id !== id); return updated })
    await window.api.profiles.save(updated)
    activeProfileId.update(current => (current === id ? null : current))
  }
}
