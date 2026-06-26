<script>
  import { onMount } from 'svelte'
  import Sidebar       from './components/Sidebar.svelte'
  import ProfileForm   from './components/ProfileForm.svelte'
  import QueryList     from './components/QueryList.svelte'
  import FindingModal  from './components/FindingModal.svelte'
  import SettingsModal from './components/SettingsModal.svelte'
  import { profileActions, activeProfile } from './stores/profile'
  import { settings } from './stores/settings'

  let showProfileForm  = false
  let showSettings     = false
  let editingProfile   = null
  let activeFindingQuery = null

  onMount(async () => {
    await Promise.all([
      profileActions.load(),
      settings.load()
    ])
  })

  function openNewProfile() {
    editingProfile  = null
    showProfileForm = true
  }

  function openEditProfile() {
    editingProfile  = $activeProfile
    showProfileForm = true
  }

  function closeProfileForm() {
    showProfileForm = false
    editingProfile  = null
  }

  function openFindingModal(e) {
    activeFindingQuery = e.detail
  }

  function closeFindingModal() {
    activeFindingQuery = null
  }
</script>

<div class="app">
  <Sidebar
    on:newProfile={openNewProfile}
    on:settings={() => showSettings = true}
  />

  <main class="main-content">
    {#if $activeProfile}
      <QueryList
        on:editProfile={openEditProfile}
        on:markFinding={openFindingModal}
      />
    {:else}
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>Araştırma başlatmak için sol panelden bir profil seçin veya yeni profil oluşturun.</p>
        <button class="btn-primary" on:click={openNewProfile}>+ Yeni Araştırma</button>
      </div>
    {/if}
  </main>
</div>

{#if showProfileForm}
  <ProfileForm
    profile={editingProfile}
    on:close={closeProfileForm}
  />
{/if}

{#if activeFindingQuery}
  <FindingModal
    query={activeFindingQuery}
    on:close={closeFindingModal}
  />
{/if}

{#if showSettings}
  <SettingsModal on:close={() => showSettings = false} />
{/if}

<style>
  .app {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .main-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 16px;
    color: var(--text-muted);
    text-align: center;
    padding: 40px;
  }

  .empty-icon { font-size: 48px; }

  .empty-state p {
    max-width: 320px;
    line-height: 1.6;
    font-size: 14px;
    color: var(--text-dim);
  }
</style>
