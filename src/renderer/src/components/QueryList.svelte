<script>
  import { queriesWithState, stats, sessionActions, findings } from '../stores/session'
  import { activeProfile } from '../stores/profile'
  import QueryItem from './QueryItem.svelte'
  import FindingsPanel from './FindingsPanel.svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  let activeTab = 'queries'

  const CATEGORY_ORDER = ['identity', 'social', 'career', 'documents', 'credentials', 'technical', 'media', 'news', 'archive']

  let collapsed = {}
  let filterPriority = 'all'
  let filterState = 'all'

  $: grouped = groupQueries($queriesWithState)
  $: displayGroups = buildDisplayGroups(grouped, filterPriority, filterState)

  function groupQueries(queries) {
    const groups = {}
    for (const q of queries) {
      if (!groups[q.category]) {
        groups[q.category] = { label: q.categoryLabel, queries: [] }
      }
      groups[q.category].queries.push(q)
    }
    return groups
  }

  function buildDisplayGroups(grouped, priority, state) {
    return CATEGORY_ORDER
      .filter(cat => grouped[cat])
      .map(cat => {
        let queries = grouped[cat].queries
        if (priority !== 'all') queries = queries.filter(q => q.priority === priority)
        if (state === 'active') queries = queries.filter(q => q.active)
        if (state === 'pending') queries = queries.filter(q => q.active && q.state === 'pending')
        if (state === 'found')   queries = queries.filter(q => q.state === 'found')
        return { cat, label: grouped[cat].label, queries }
      })
      .filter(g => g.queries.length > 0)
  }

  function toggle(cat) {
    collapsed[cat] = !collapsed[cat]
  }

  async function handleOpen(e) {
    const query = e.detail
    await window.api.browser.open(query.url)
    await sessionActions.openQuery(query.id)
  }

  async function handleMarkEmpty(e) {
    await sessionActions.markState(e.detail.id, 'empty')
  }

  function handleMarkFinding(e) {
    dispatch('markFinding', e.detail)
  }
</script>

<div class="workspace">
  <div class="profile-header">
    <div class="profile-title">
      <span class="profile-icon">{$activeProfile?.type === 'organization' ? '🏢' : '👤'}</span>
      <h1>{$activeProfile?.name || 'Profil'}</h1>
      <button class="btn-ghost edit-btn" on:click={() => dispatch('editProfile')}>Düzenle</button>
    </div>

    <div class="stats-row">
      <span class="stat"><span class="stat-n">{$stats.active}</span> aktif sorgu</span>
      <span class="stat-sep">/</span>
      <span class="stat"><span class="stat-n">{$stats.total}</span> toplam</span>
      <span class="stat-sep">·</span>
      <span class="stat found"><span class="stat-n">{$stats.found}</span> bulgu</span>
      <span class="stat-sep">·</span>
      <span class="stat"><span class="stat-n">{$stats.opened}</span> açıldı</span>
    </div>

    <div class="profile-fields">
      {#if $activeProfile?.emails?.length}
        <span class="field-chip">✉ {$activeProfile.emails[0]}{$activeProfile.emails.length > 1 ? ` +${$activeProfile.emails.length - 1}` : ''}</span>
      {/if}
      {#if $activeProfile?.usernames?.length}
        {@const first = $activeProfile.usernames[0]}
        <span class="field-chip">@ {typeof first === 'object' ? first.value : first}{$activeProfile.usernames.length > 1 ? ` +${$activeProfile.usernames.length - 1}` : ''}</span>
      {/if}
      {#if $activeProfile?.company}
        <span class="field-chip">🏢 {$activeProfile.company}</span>
      {/if}
      {#if $activeProfile?.location}
        <span class="field-chip">📍 {$activeProfile.location}</span>
      {/if}
    </div>
  </div>

  <div class="tabs">
    <button class="tab" class:active={activeTab === 'queries'} on:click={() => activeTab = 'queries'}>
      Sorgular <span class="tab-count">{$stats.active}/{$stats.total}</span>
    </button>
    <button class="tab" class:active={activeTab === 'findings'} on:click={() => activeTab = 'findings'}>
      Bulgular <span class="tab-count">{$findings.length}</span>
    </button>
  </div>

  {#if activeTab === 'queries'}
    <div class="filters">
      <div class="filter-group">
        <span class="filter-label">Öncelik:</span>
        <button class="filter-btn" class:active={filterPriority === 'all'}    on:click={() => filterPriority = 'all'}>Tümü</button>
        <button class="filter-btn" class:active={filterPriority === 'high'}   on:click={() => filterPriority = 'high'}>Yüksek</button>
        <button class="filter-btn" class:active={filterPriority === 'medium'} on:click={() => filterPriority = 'medium'}>Orta</button>
        <button class="filter-btn" class:active={filterPriority === 'low'}    on:click={() => filterPriority = 'low'}>Düşük</button>
      </div>
      <div class="filter-group">
        <span class="filter-label">Durum:</span>
        <button class="filter-btn" class:active={filterState === 'all'}     on:click={() => filterState = 'all'}>Tümü</button>
        <button class="filter-btn" class:active={filterState === 'active'}  on:click={() => filterState = 'active'}>Aktif</button>
        <button class="filter-btn" class:active={filterState === 'pending'} on:click={() => filterState = 'pending'}>Bekleyen</button>
        <button class="filter-btn" class:active={filterState === 'found'}   on:click={() => filterState = 'found'}>Bulgu</button>
      </div>
    </div>

    <div class="query-groups">
      {#each displayGroups as group (group.cat)}
        <div class="category-group">
          <button class="category-header" on:click={() => toggle(group.cat)}>
            <span class="collapse-icon">{collapsed[group.cat] ? '▶' : '▼'}</span>
            <span class="category-label">{group.label}</span>
            <span class="category-count">{group.queries.filter(q => q.active).length} / {group.queries.length}</span>
          </button>

          {#if !collapsed[group.cat]}
            <div class="category-queries">
              {#each group.queries as query (query.id)}
                <QueryItem
                  {query}
                  on:open={handleOpen}
                  on:markEmpty={handleMarkEmpty}
                  on:markFinding={handleMarkFinding}
                />
              {/each}
            </div>
          {/if}
        </div>
      {/each}

      {#if displayGroups.length === 0}
        <div class="empty-state">
          <p>Bu filtreyle gösterilecek sorgu yok.</p>
        </div>
      {/if}
    </div>
  {:else}
    <FindingsPanel findings={$findings} />
  {/if}
</div>

<style>
  .workspace {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .profile-header {
    padding: 16px 20px 12px;
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  .profile-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .profile-icon { font-size: 20px; }

  h1 {
    font-size: 18px;
    font-weight: 600;
    flex: 1;
  }

  .edit-btn { font-size: 12px; padding: 4px 10px; }

  .stats-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-dim);
  }

  .stat-n { font-weight: 600; color: var(--text); }
  .stat.found .stat-n { color: var(--success); }
  .stat-sep { color: var(--text-muted); }

  .profile-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 2px;
  }

  .field-chip {
    font-size: 12px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 2px 8px;
    color: var(--text-dim);
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    padding: 0 16px;
  }

  .tab {
    background: transparent;
    color: var(--text-muted);
    padding: 10px 14px;
    font-size: 13px;
    border-radius: 0;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tab:hover { color: var(--text); }
  .tab.active { color: var(--text); border-bottom-color: var(--accent); }

  .tab-count {
    font-size: 11px;
    background: var(--surface2);
    padding: 1px 6px;
    border-radius: 10px;
    color: var(--text-muted);
  }

  .tab.active .tab-count { background: rgba(99,102,241,0.2); color: var(--accent-h); }

  .filters {
    display: flex;
    gap: 16px;
    padding: 10px 20px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .filter-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-right: 4px;
  }

  .filter-btn {
    background: transparent;
    color: var(--text-dim);
    padding: 4px 10px;
    font-size: 12px;
    border-radius: 4px;
  }

  .filter-btn:hover { background: var(--surface2); }
  .filter-btn.active {
    background: rgba(99,102,241,0.2);
    color: var(--accent-h);
  }

  .query-groups {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .category-group {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    flex-shrink: 0;
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 14px;
    background: var(--surface);
    color: var(--text);
    text-align: left;
    font-size: 13px;
    font-weight: 600;
    border-radius: 0;
  }

  .category-header:hover { background: var(--surface2); }

  .collapse-icon { font-size: 10px; color: var(--text-muted); }
  .category-label { flex: 1; }
  .category-count { font-size: 12px; color: var(--text-muted); font-weight: 400; }

  .category-queries {
    display: flex;
    flex-direction: column;
    padding: 4px 0;
    border-top: 1px solid var(--border);
    background: var(--bg);
  }
</style>
