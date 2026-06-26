<script>
  import { createEventDispatcher } from 'svelte'
  import { sessionActions } from '../stores/session'
  import { activeProfile } from '../stores/profile'

  export let query

  const dispatch = createEventDispatcher()

  const TYPES = [
    { value: 'account',  label: 'Hesap / Profil',   icon: '👤', hint: 'Sosyal medya hesabı, web profili' },
    { value: 'contact',  label: 'İletişim',          icon: '📧', hint: 'Email, telefon, adres' },
    { value: 'post',     label: 'Gönderi',           icon: '📝', hint: 'Önemli tweet, post, yorum' },
    { value: 'news',     label: 'Haber',             icon: '📰', hint: 'Gazete, haber sitesi' },
    { value: 'document', label: 'Belge',             icon: '📄', hint: 'CV, resmi belge, PDF' },
    { value: 'leak',     label: 'Sızıntı',           icon: '🔓', hint: 'Credential, veri sızıntısı' },
    { value: 'relation', label: 'İlişki',            icon: '🔗', hint: 'Başka kişi/kurumla bağlantı' },
    { value: 'other',    label: 'Diğer',             icon: '📌', hint: '' }
  ]

  let findingType = 'account'
  let title       = ''
  let url         = ''
  let notes       = ''
  let confidence  = 'high'
  let addToProfile = false
  let saving = false

  let newEmails    = ''
  let newUsernames = ''
  let newPhones    = ''
  let newCompany   = $activeProfile?.company ?? ''
  let newLocation  = $activeProfile?.location ?? ''

  async function save() {
    saving = true
    try {
      const finding = {
        queryId:    query.id,
        queryLabel: query.label,
        platform:   query.platformLabel,
        type:       findingType,
        title,
        url,
        notes,
        confidence
      }

      let newProfileData = null
      if (addToProfile) {
        newProfileData = {}
        if (newEmails.trim()) {
          const additional = newEmails.split(',').map(e => e.trim()).filter(Boolean)
          const current    = $activeProfile?.emails ?? []
          const merged     = [...new Set([...current, ...additional])]
          if (merged.length !== current.length) newProfileData.emails = merged
        }
        if (newUsernames.trim()) {
          const additional = newUsernames.split(',').map(u => u.trim()).filter(Boolean)
            .map(v => ({ value: v, platform: 'all' }))
          const current = $activeProfile?.usernames ?? []
          const existingValues = current.map(u => typeof u === 'object' ? u.value : u)
          const toAdd = additional.filter(u => !existingValues.includes(u.value))
          if (toAdd.length > 0) newProfileData.usernames = [...current, ...toAdd]
        }
        if (newPhones.trim()) {
          const additional = newPhones.split(',').map(p => p.trim()).filter(Boolean)
          const current    = $activeProfile?.phones ?? []
          const merged     = [...new Set([...current, ...additional])]
          if (merged.length !== current.length) newProfileData.phones = merged
        }
        if (newCompany !== ($activeProfile?.company ?? ''))   newProfileData.company  = newCompany
        if (newLocation !== ($activeProfile?.location ?? '')) newProfileData.location = newLocation
      }

      await sessionActions.addFinding(finding, newProfileData)
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
      <h2>Bulgu Ekle</h2>
      <button class="close-btn" on:click={() => dispatch('close')}>✕</button>
    </div>

    <div class="modal-body">
      <div class="query-ref">
        <span class="query-ref-label">Sorgu:</span>
        <span class="query-ref-text">{query.label} — {query.platformLabel}</span>
      </div>

      <div class="field">
        <span class="field-group-label">Bulgu Tipi</span>
        <div class="type-grid">
          {#each TYPES as t}
            <button
              class="type-btn"
              class:selected={findingType === t.value}
              on:click={() => findingType = t.value}
              title={t.hint}
            >
              <span class="type-icon">{t.icon}</span>
              <span class="type-label">{t.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <div class="field">
        <label for="finding-title">Başlık / İsim</label>
        <input id="finding-title" bind:value={title} placeholder="Hesap adı, makale başlığı, kişi ismi..." />
      </div>

      <div class="field">
        <label for="finding-url">Kaynak URL</label>
        <input id="finding-url" bind:value={url} placeholder="https://..." />
      </div>

      <div class="field">
        <label for="finding-notes">Not</label>
        <textarea id="finding-notes" bind:value={notes} rows="2" placeholder="Kısa açıklama..." />
      </div>

      <div class="field">
        <span class="field-group-label">Güven Skoru</span>
        <div class="confidence-group">
          <label class="radio-label">
            <input type="radio" bind:group={confidence} value="high" />
            <span class="tag high">Yüksek</span>
          </label>
          <label class="radio-label">
            <input type="radio" bind:group={confidence} value="medium" />
            <span class="tag medium">Orta</span>
          </label>
          <label class="radio-label">
            <input type="radio" bind:group={confidence} value="low" />
            <span class="tag low">Düşük</span>
          </label>
        </div>
      </div>

      <div class="divider"></div>

      <label class="toggle-label">
        <input type="checkbox" bind:checked={addToProfile} />
        <span>Bu bulguda yeni bilgi edindim — profile ekle</span>
      </label>

      {#if addToProfile}
        <div class="new-data">
          <div class="field">
            <label for="new-emails">Yeni Email(ler) <span class="hint">(virgülle ayır)</span></label>
            <input id="new-emails" bind:value={newEmails} placeholder="email1@x.com, email2@y.com" />
          </div>
          <div class="field">
            <label for="new-usernames">Yeni Kullanıcı Adı(ları) <span class="hint">(virgülle ayır)</span></label>
            <input id="new-usernames" bind:value={newUsernames} placeholder="user1, user2" />
          </div>
          <div class="field">
            <label for="new-phones">Yeni Telefon(lar) <span class="hint">(virgülle ayır)</span></label>
            <input id="new-phones" bind:value={newPhones} placeholder="+90..." />
          </div>
          <div class="row">
            <div class="field" style="flex:1">
              <label for="new-company">Şirket / Kurum</label>
              <input id="new-company" bind:value={newCompany} />
            </div>
            <div class="field" style="flex:1">
              <label for="new-location">Lokasyon</label>
              <input id="new-location" bind:value={newLocation} />
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="modal-footer">
      <button class="btn-ghost" on:click={() => dispatch('close')}>İptal</button>
      <button class="btn-primary" on:click={save} disabled={saving}>
        {saving ? 'Kaydediliyor...' : 'Bulguyu Kaydet'}
      </button>
    </div>
  </div>
</div>

<style>
  .query-ref {
    display: flex;
    gap: 8px;
    align-items: center;
    background: var(--surface2);
    border-radius: var(--radius);
    padding: 8px 12px;
    font-size: 13px;
  }

  .query-ref-label { color: var(--text-muted); }
  .query-ref-text  { color: var(--text); }

  .field-group-label {
    display: block;
    font-size: 12px;
    color: var(--text-dim);
    margin-bottom: 6px;
  }

  .type-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .type-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 4px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text-dim);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.12s;
  }

  .type-btn:hover { border-color: var(--accent); color: var(--text); }
  .type-btn.selected {
    background: rgba(99,102,241,0.15);
    border-color: var(--accent);
    color: var(--text);
  }

  .type-icon { font-size: 18px; }
  .type-label { text-align: center; line-height: 1.2; }

  .confidence-group {
    display: flex;
    gap: 10px;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    margin-bottom: 0;
  }

  .radio-label input { width: auto; }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text);
    margin-bottom: 0;
  }

  .toggle-label input { width: auto; }

  .new-data {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    background: var(--surface2);
    border-radius: var(--radius);
  }

  .row { display: flex; gap: 12px; }

  .hint {
    color: var(--text-muted);
    font-style: italic;
    font-size: 11px;
  }
</style>
