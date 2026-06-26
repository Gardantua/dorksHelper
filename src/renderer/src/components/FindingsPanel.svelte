<script>
  export let findings = []

  const TYPES = [
    { value: 'account',  label: 'Hesap / Profil',   icon: '👤' },
    { value: 'contact',  label: 'İletişim Bilgisi',  icon: '📧' },
    { value: 'post',     label: 'Gönderi / İçerik',  icon: '📝' },
    { value: 'news',     label: 'Haber',             icon: '📰' },
    { value: 'document', label: 'Belge',             icon: '📄' },
    { value: 'leak',     label: 'Sızıntı / Veri',    icon: '🔓' },
    { value: 'relation', label: 'İlişki / Bağlantı', icon: '🔗' },
    { value: 'other',    label: 'Diğer',             icon: '📌' }
  ]

  const CONFIDENCE_LABEL = { high: 'Yüksek', medium: 'Orta', low: 'Düşük' }

  $: grouped = groupFindings(findings)

  function groupFindings(list) {
    const map = {}
    for (const t of TYPES) map[t.value] = []
    for (const f of list) {
      const key = f.type ?? 'other'
      if (!map[key]) map[key] = []
      map[key].push(f)
    }
    return TYPES.map(t => ({ ...t, items: map[t.value] ?? [] })).filter(g => g.items.length > 0)
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
  }
</script>

<div class="findings-panel">
  {#if findings.length === 0}
    <div class="empty-state">
      <p>Henüz bulgu yok. Sorgu sekmesinden aramalar yapıp [Bulgu] butonuna basarak bulgu ekleyebilirsin.</p>
    </div>
  {:else}
    {#each grouped as group}
      <div class="group">
        <div class="group-header">
          <span class="group-icon">{group.icon}</span>
          <span class="group-label">{group.label}</span>
          <span class="group-count">{group.items.length}</span>
        </div>

        {#each group.items as finding}
          <div class="finding-card">
            <div class="finding-main">
              <span class="finding-title">
                {finding.title || finding.notes?.slice(0, 60) || finding.url?.slice(0, 60) || '—'}
              </span>
              {#if finding.platform}
                <span class="finding-platform">{finding.platform}</span>
              {/if}
            </div>

            {#if finding.url}
              <a class="finding-url" href={finding.url} on:click|preventDefault={() => window.api.browser.open(finding.url)}>
                {finding.url.length > 70 ? finding.url.slice(0, 70) + '…' : finding.url}
              </a>
            {/if}

            {#if finding.notes && finding.notes !== finding.title}
              <p class="finding-notes">{finding.notes}</p>
            {/if}

            <div class="finding-meta">
              <span class="tag {finding.confidence}">{CONFIDENCE_LABEL[finding.confidence] ?? finding.confidence}</span>
              <span class="finding-date">{formatDate(finding.createdAt)}</span>
              {#if finding.queryLabel}
                <span class="finding-source">← {finding.queryLabel}</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/each}
  {/if}
</div>

<style>
  .findings-panel {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    border-bottom: 1px solid var(--border);
    padding-bottom: 8px;
  }

  .group-icon { font-size: 16px; }
  .group-label { flex: 1; }
  .group-count {
    font-size: 12px;
    background: var(--surface2);
    padding: 1px 7px;
    border-radius: 10px;
    color: var(--text-muted);
    font-weight: 400;
  }

  .finding-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .finding-main {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .finding-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    flex: 1;
  }

  .finding-platform {
    font-size: 11px;
    color: var(--text-muted);
    background: var(--surface2);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .finding-url {
    font-size: 11px;
    color: var(--accent-h);
    text-decoration: none;
    font-family: monospace;
    word-break: break-all;
  }
  .finding-url:hover { text-decoration: underline; }

  .finding-notes {
    font-size: 12px;
    color: var(--text-dim);
    line-height: 1.5;
  }

  .finding-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
  }

  .finding-date {
    font-size: 11px;
    color: var(--text-muted);
  }

  .finding-source {
    font-size: 11px;
    color: var(--text-muted);
    font-style: italic;
  }
</style>
