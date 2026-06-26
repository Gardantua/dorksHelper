<script>
  import { profiles, activeProfileId, profileActions } from '../stores/profile'
  import { stats } from '../stores/session'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  function selectProfile(id) {
    activeProfileId.set(id)
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
  }
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <span class="logo">dorksHelper</span>
    <button class="btn-primary new-btn" on:click={() => dispatch('newProfile')}>
      + Yeni
    </button>
  </div>

  <div class="profile-list">
    {#if $profiles.length === 0}
      <p class="no-profiles">Henüz araştırma yok</p>
    {:else}
      {#each $profiles as profile (profile.id)}
        <button
          class="profile-item"
          class:active={$activeProfileId === profile.id}
          on:click={() => selectProfile(profile.id)}
        >
          <div class="profile-type-icon">
            {profile.type === 'organization' ? '🏢' : '👤'}
          </div>
          <div class="profile-info">
            <span class="profile-name">{profile.name || 'İsimsiz'}</span>
            <span class="profile-meta">
              {formatDate(profile.createdAt)}
              {#if $activeProfileId === profile.id && $stats.found > 0}
                &bull; {$stats.found} bulgu
              {/if}
            </span>
          </div>
        </button>
      {/each}
    {/if}
  </div>

  <div class="sidebar-footer">
    <button class="btn-ghost settings-btn" on:click={() => dispatch('settings')}>
      ⚙ Ayarlar
    </button>
  </div>
</aside>

<style>
  .sidebar {
    width: 220px;
    min-width: 220px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 14px 12px;
    border-bottom: 1px solid var(--border);
  }

  .logo {
    font-size: 15px;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: -0.3px;
  }

  .new-btn {
    font-size: 12px;
    padding: 5px 10px;
  }

  .profile-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .no-profiles {
    font-size: 12px;
    color: var(--text-muted);
    text-align: center;
    padding: 20px 0;
  }

  .profile-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text);
    text-align: left;
    width: 100%;
    transition: background 0.12s;
  }

  .profile-item:hover { background: var(--surface2); }
  .profile-item.active { background: rgba(99,102,241,0.15); }

  .profile-type-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .profile-name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .profile-meta {
    font-size: 11px;
    color: var(--text-muted);
  }

  .sidebar-footer {
    padding: 8px;
    border-top: 1px solid var(--border);
  }

  .settings-btn {
    width: 100%;
    text-align: left;
    font-size: 13px;
  }
</style>
