<script>
  import { createEventDispatcher } from 'svelte'
  import { settings } from '../stores/settings'

  const dispatch = createEventDispatcher()

  let vaultPath = $settings.vaultPath ?? ''
  let saving = false

  async function selectFolder() {
    const path = await window.api.dialog.selectFolder()
    if (path) vaultPath = path
  }

  async function save() {
    saving = true
    await settings.save({ vaultPath })
    saving = false
    dispatch('close')
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="modal-overlay" on:click|self={() => dispatch('close')}>
  <div class="modal" role="dialog" aria-modal="true">
    <div class="modal-header">
      <h2>Ayarlar</h2>
      <button class="close-btn" on:click={() => dispatch('close')}>✕</button>
    </div>

    <div class="modal-body">
      <div class="field">
        <label for="vault-path-input">Obsidian Vault Klasörü</label>
        <div class="path-input">
          <input id="vault-path-input" bind:value={vaultPath} placeholder="Vault klasör yolunu seçin..." readonly />
          <button class="btn-ghost browse-btn" on:click={selectFolder}>Gözat</button>
        </div>
        <span class="field-hint">
          Bulgular ve profil notları bu klasörün altındaki OSINT/ dizinine yazılır.
        </span>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-ghost" on:click={() => dispatch('close')}>İptal</button>
      <button class="btn-primary" on:click={save} disabled={saving}>
        {saving ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  </div>
</div>

<style>
  .path-input {
    display: flex;
    gap: 8px;
  }

  .browse-btn { flex-shrink: 0; padding: 7px 14px; }

  .field-hint {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 4px;
    display: block;
  }
</style>
