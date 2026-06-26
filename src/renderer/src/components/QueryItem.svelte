<script>
  import { createEventDispatcher } from 'svelte'

  export let query

  const dispatch = createEventDispatcher()

  const STATE_ICON = {
    pending: '○',
    opened:  '✓',
    found:   '★',
    empty:   '—'
  }

  const PRIORITY_LABEL = { high: 'yüksek', medium: 'orta', low: 'düşük' }

  function open() {
    if (!query.active || !query.url) return
    dispatch('open', query)
  }

  function markEmpty() {
    dispatch('markEmpty', query)
  }

  function markFinding() {
    dispatch('markFinding', query)
  }
</script>

<div class="query-item" class:inactive={!query.active} class:state-found={query.state === 'found'}>
  <span class="state-icon" title={query.state}>{STATE_ICON[query.state] ?? '○'}</span>

  <div class="query-info">
    <span class="query-label">{query.label}</span>
    {#if query.rawQuery}
      <code class="query-raw">{query.rawQuery}</code>
    {/if}
  </div>

  <span class="platform-badge">{query.platformLabel}</span>
  <span class="priority tag {query.priority}">{PRIORITY_LABEL[query.priority]}</span>

  <div class="actions">
    {#if !query.active}
      <span class="inactive-hint">Bilgi eksik</span>
    {:else if query.state === 'pending' || query.state === 'opened'}
      <button class="btn-open" on:click={open}>Aç</button>
      {#if query.state === 'opened'}
        <button class="btn-ghost btn-sm" on:click={markEmpty}>Boş</button>
        <button class="btn-found btn-sm" on:click={markFinding}>Bulgu</button>
      {/if}
    {:else if query.state === 'found'}
      <span class="done-label">Bulgu işaretlendi</span>
    {:else if query.state === 'empty'}
      <span class="empty-label">Boş</span>
    {/if}
  </div>
</div>

<style>
  .query-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: var(--radius);
    transition: background 0.1s;
  }

  .query-item:hover:not(.inactive) { background: var(--surface2); }
  .query-item.inactive { opacity: 0.4; }
  .query-item.state-found { background: rgba(34,197,94,0.06); }

  .state-icon {
    font-size: 13px;
    width: 16px;
    text-align: center;
    flex-shrink: 0;
    color: var(--text-dim);
  }

  .state-found .state-icon { color: var(--success); }

  .query-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .query-label {
    font-size: 13px;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .query-raw {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .platform-badge {
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .tag { flex-shrink: 0; }

  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .btn-open {
    background: var(--accent);
    color: #fff;
    padding: 4px 12px;
    font-size: 12px;
    border-radius: var(--radius);
  }
  .btn-open:hover { background: var(--accent-h); }

  .btn-found {
    background: rgba(34,197,94,0.15);
    color: var(--success);
    padding: 4px 10px;
    font-size: 12px;
    border-radius: var(--radius);
  }
  .btn-found:hover { background: rgba(34,197,94,0.25); }

  .btn-sm { padding: 4px 8px; font-size: 12px; }

  .done-label  { font-size: 12px; color: var(--success); }
  .empty-label { font-size: 12px; color: var(--text-muted); }
  .inactive-hint { font-size: 11px; color: var(--text-muted); font-style: italic; }
</style>
