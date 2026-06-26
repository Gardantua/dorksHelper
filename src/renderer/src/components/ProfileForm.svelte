<script>
  import { createEventDispatcher } from 'svelte'
  import { profileActions } from '../stores/profile'

  export let profile = null  // null = yeni profil, object = düzenle

  const dispatch = createEventDispatcher()

  let form = profile
    ? { ...profile, emails: [...profile.emails], phones: [...profile.phones], usernames: [...profile.usernames], aliases: [...profile.aliases] }
    : { type: 'person', name: '', aliases: [], emails: [], phones: [], usernames: [], company: '', location: '', domain: '', notes: '' }

  const USERNAME_PLATFORMS = [
    { value: 'all',       label: 'Genel' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter',   label: 'X / Twitter' },
    { value: 'facebook',  label: 'Facebook' },
    { value: 'linkedin',  label: 'LinkedIn' },
    { value: 'tiktok',    label: 'TikTok' },
    { value: 'youtube',   label: 'YouTube' },
    { value: 'reddit',    label: 'Reddit' },
    { value: 'telegram',  label: 'Telegram' },
    { value: 'github',    label: 'GitHub' },
    { value: 'gitlab',    label: 'GitLab' }
  ]

  let emailInput    = ''
  let phoneInput    = ''
  let usernameInput = ''
  let usernamePlatform = 'all'
  let aliasInput    = ''
  let saving = false
  let error  = ''

  function addToList(listKey, inputRef) {
    const val = inputRef.trim()
    if (!val) return
    if (listKey === 'usernames') {
      const exists = form.usernames.some(u =>
        (typeof u === 'object' ? u.value : u) === val
      )
      if (!exists) {
        form.usernames = [...form.usernames, { value: val, platform: usernamePlatform }]
      }
      usernameInput = ''
      return
    }
    if (!form[listKey].includes(val)) {
      form[listKey] = [...form[listKey], val]
    }
    if (listKey === 'emails')  emailInput  = ''
    if (listKey === 'phones')  phoneInput  = ''
    if (listKey === 'aliases') aliasInput  = ''
  }

  function removeFromList(listKey, val) {
    if (listKey === 'usernames') {
      form.usernames = form.usernames.filter(u =>
        (typeof u === 'object' ? u.value : u) !== (typeof val === 'object' ? val.value : val)
      )
      return
    }
    form[listKey] = form[listKey].filter(v => v !== val)
  }

  function keydown(e, listKey, inputRef) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addToList(listKey, inputRef)
    }
  }

  function platformLabel(p) {
    return USERNAME_PLATFORMS.find(x => x.value === p)?.label ?? p
  }

  async function save() {
    if (!form.name.trim()) { error = 'İsim zorunlu'; return }
    error = ''
    saving = true
    try {
      if (profile) {
        await profileActions.update(profile.id, form)
      } else {
        await profileActions.add(form)
      }
      dispatch('close')
    } finally {
      saving = false
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="modal-overlay" on:click|self={() => dispatch('close')}>
  <div class="modal" role="dialog" aria-modal="true">
    <div class="modal-header">
      <h2>{profile ? 'Profili Düzenle' : 'Yeni Araştırma'}</h2>
      <button class="close-btn" on:click={() => dispatch('close')}>✕</button>
    </div>

    <div class="modal-body">
      <div class="row">
        <div class="field" style="flex:1">
          <label for="profile-type">Profil Tipi</label>
          <select id="profile-type" bind:value={form.type}>
            <option value="person">Şahıs</option>
            <option value="organization">Kurum</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label for="profile-name">İsim *</label>
        <input id="profile-name" bind:value={form.name} placeholder="Tam isim" />
      </div>

      <div class="field">
        <label for="alias-input">Takma isimler / Alias</label>
        <div class="chip-input">
          <input
            id="alias-input"
            bind:value={aliasInput}
            placeholder="Alias ekle ve Enter'a bas"
            on:keydown={(e) => keydown(e, 'aliases', aliasInput)}
          />
          <button class="btn-ghost add-btn" on:click={() => addToList('aliases', aliasInput)}>+</button>
        </div>
        <div class="chips">
          {#each form.aliases as a}
            <span class="chip">{a}<button on:click={() => removeFromList('aliases', a)}>✕</button></span>
          {/each}
        </div>
      </div>

      <div class="field">
        <label for="email-input">Email Adresleri</label>
        <div class="chip-input">
          <input
            id="email-input"
            bind:value={emailInput}
            placeholder="Email ekle ve Enter'a bas"
            on:keydown={(e) => keydown(e, 'emails', emailInput)}
          />
          <button class="btn-ghost add-btn" on:click={() => addToList('emails', emailInput)}>+</button>
        </div>
        <div class="chips">
          {#each form.emails as e}
            <span class="chip">{e}<button on:click={() => removeFromList('emails', e)}>✕</button></span>
          {/each}
        </div>
      </div>

      <div class="field">
        <label for="username-input">Kullanıcı Adları</label>
        <div class="chip-input">
          <input
            id="username-input"
            bind:value={usernameInput}
            placeholder="Kullanıcı adı"
            on:keydown={(e) => keydown(e, 'usernames', usernameInput)}
          />
          <select bind:value={usernamePlatform} class="platform-select">
            {#each USERNAME_PLATFORMS as p}
              <option value={p.value}>{p.label}</option>
            {/each}
          </select>
          <button class="btn-ghost add-btn" on:click={() => addToList('usernames', usernameInput)}>+</button>
        </div>
        <div class="chips">
          {#each form.usernames as u}
            {@const uval = typeof u === 'object' ? u.value : u}
            {@const uplat = typeof u === 'object' ? u.platform : 'all'}
            <span class="chip">
              {uval}
              {#if uplat !== 'all'}<span class="chip-platform"> · {platformLabel(uplat)}</span>{/if}
              <button on:click={() => removeFromList('usernames', u)}>✕</button>
            </span>
          {/each}
        </div>
      </div>

      <div class="field">
        <label for="phone-input">Telefon Numaraları</label>
        <div class="chip-input">
          <input
            id="phone-input"
            bind:value={phoneInput}
            placeholder="Telefon ekle ve Enter'a bas"
            on:keydown={(e) => keydown(e, 'phones', phoneInput)}
          />
          <button class="btn-ghost add-btn" on:click={() => addToList('phones', phoneInput)}>+</button>
        </div>
        <div class="chips">
          {#each form.phones as p}
            <span class="chip">{p}<button on:click={() => removeFromList('phones', p)}>✕</button></span>
          {/each}
        </div>
      </div>

      <div class="row">
        <div class="field" style="flex:1">
          <label for="company-input">{form.type === 'organization' ? 'Şirket Adı' : 'Şirket / Kurum'}</label>
          <input id="company-input" bind:value={form.company} placeholder="Çalıştığı yer" />
        </div>
        <div class="field" style="flex:1">
          <label for="location-input">Lokasyon</label>
          <input id="location-input" bind:value={form.location} placeholder="Şehir, ülke" />
        </div>
      </div>

      {#if form.type === 'organization'}
        <div class="field">
          <label for="domain-input">Domain</label>
          <input id="domain-input" bind:value={form.domain} placeholder="example.com" />
        </div>
      {/if}

      <div class="field">
        <label for="notes-input">Notlar</label>
        <textarea id="notes-input" bind:value={form.notes} rows="3" placeholder="Serbest not..." />
      </div>

      {#if error}
        <p class="error">{error}</p>
      {/if}
    </div>

    <div class="modal-footer">
      <button class="btn-ghost" on:click={() => dispatch('close')}>İptal</button>
      <button class="btn-primary" on:click={save} disabled={saving}>
        {saving ? 'Kaydediliyor...' : profile ? 'Güncelle' : 'Oluştur'}
      </button>
    </div>
  </div>
</div>

<style>
  .row { display: flex; gap: 12px; }

  .chip-input {
    display: flex;
    gap: 6px;
  }

  .add-btn {
    flex-shrink: 0;
    padding: 7px 10px;
    font-size: 16px;
    line-height: 1;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 3px 8px;
    font-size: 12px;
    color: var(--text);
  }

  .chip button {
    background: none;
    border: none;
    padding: 0;
    font-size: 11px;
    color: var(--text-muted);
    cursor: pointer;
    line-height: 1;
  }

  .chip button:hover { color: var(--danger); }

  .chip-platform {
    color: var(--accent-h);
    font-size: 11px;
  }

  .platform-select {
    flex-shrink: 0;
    width: auto;
    padding: 6px 8px;
    font-size: 12px;
  }

  .error {
    color: var(--danger);
    font-size: 12px;
  }
</style>
