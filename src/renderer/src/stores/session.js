import { writable, derived } from 'svelte/store'
import { activeProfile, profileActions } from './profile'

export const queries      = writable([])
export const queryStates  = writable({})  // { [queryId]: 'pending'|'opened'|'found'|'empty' }
export const findings     = writable([])

export const queriesWithState = derived(
  [queries, queryStates],
  ([$queries, $states]) =>
    $queries.map(q => ({ ...q, state: $states[q.id] ?? 'pending' }))
)

export const stats = derived(
  queriesWithState,
  $q => ({
    total:   $q.length,
    active:  $q.filter(q => q.active).length,
    opened:  $q.filter(q => q.state === 'opened').length,
    found:   $q.filter(q => q.state === 'found').length,
    empty:   $q.filter(q => q.state === 'empty').length
  })
)

let currentProfileId = null

activeProfile.subscribe(async (profile) => {
  if (!profile) {
    queries.set([])
    queryStates.set({})
    findings.set([])
    currentProfileId = null
    return
  }

  if (profile.id === currentProfileId) return
  currentProfileId = profile.id

  await loadSessionForProfile(profile)
})

async function loadSessionForProfile(profile) {
  const [generated, saved] = await Promise.all([
    window.api.queries.generate(profile),
    window.api.session.load(profile.id)
  ])

  queries.set(generated)
  queryStates.set(saved?.queryStates ?? {})
  findings.set(saved?.findings ?? [])
}

async function persist(profileId) {
  let states, found
  queryStates.subscribe(v => (states = v))()
  findings.subscribe(v => (found = v))()
  await window.api.session.save({
    profileId,
    queryStates: states,
    findings:    found,
    updatedAt:   new Date().toISOString()
  })
}

export const sessionActions = {
  openQuery: async (queryId) => {
    queryStates.update(s => ({ ...s, [queryId]: 'opened' }))
    await persist(currentProfileId)
  },

  markState: async (queryId, state) => {
    queryStates.update(s => ({ ...s, [queryId]: state }))
    await persist(currentProfileId)
  },

  addFinding: async (finding, newProfileData = null) => {
    const entry = {
      id:         crypto.randomUUID(),
      profileId:  currentProfileId,
      createdAt:  new Date().toISOString(),
      ...finding
    }
    findings.update(list => [...list, entry])
    queryStates.update(s => ({ ...s, [finding.queryId]: 'found' }))

    if (newProfileData && Object.keys(newProfileData).length > 0) {
      await profileActions.update(currentProfileId, newProfileData)
    }

    await persist(currentProfileId)

    if (newProfileData && Object.keys(newProfileData).length > 0) {
      const profile = await window.api.profiles.load()
        .then(list => list.find(p => p.id === currentProfileId))
      if (profile) {
        const generated = await window.api.queries.generate(profile)
        queries.set(generated)
      }
    }
  },

  refreshQueries: async (profile) => {
    const generated = await window.api.queries.generate(profile)
    queries.set(generated)
  }
}
