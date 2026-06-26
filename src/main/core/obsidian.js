import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync, appendFileSync, readdirSync } from 'fs'
import matter from 'gray-matter'

function slugify(name) {
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_ÇçĞğİıÖöŞşÜü-]/g, '')
}

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true })
}

function nextFindingIndex(bulguDir) {
  if (!existsSync(bulguDir)) return 1
  const files = readdirSync(bulguDir).filter(f => /^Bulgu-\d+\.md$/.test(f))
  if (files.length === 0) return 1
  const nums = files.map(f => parseInt(f.match(/\d+/)[0]))
  return Math.max(...nums) + 1
}

function formatDate(isoStr) {
  return new Date(isoStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function frontmatter(data) {
  return matter.stringify('', data).trim()
}

export function writeProfileNote(vaultPath, profile) {
  const rootDir  = join(vaultPath, 'OSINT')
  const typeDir  = profile.type === 'organization' ? join(rootDir, 'Kurumlar') : join(rootDir, 'Sahislar')
  ensureDir(typeDir)

  const fileName = slugify(profile.name) + '.md'
  const filePath = join(typeDir, fileName)

  const fm = frontmatter({
    tags:      ['dorks'],
    profil_id: profile.id,
    tip:       profile.type === 'organization' ? 'kurum' : 'sahis',
    isim:      profile.name,
    email:     profile.emails ?? [],
    telefon:   profile.phones ?? [],
    usernames: (profile.usernames ?? []).map(u => typeof u === 'object' ? `${u.value} (${u.platform})` : u),
    sirket:    profile.company  ?? '',
    lokasyon:  profile.location ?? '',
    guncelleme: new Date().toISOString()
  })

  const usernameLines = (profile.usernames ?? []).map(u => {
    const val  = typeof u === 'object' ? u.value : u
    const plat = typeof u === 'object' ? u.platform : 'genel'
    return `- ${val} *(${plat})*`
  }).join('\n') || '—'

  const body = `
## ${profile.name}

| Alan | Değer |
|---|---|
| Tip | ${profile.type === 'organization' ? 'Kurum' : 'Şahıs'} |
| Email | ${profile.emails?.join(', ') || '—'} |
| Telefon | ${profile.phones?.join(', ') || '—'} |
| Şirket | ${profile.company || '—'} |
| Lokasyon | ${profile.location || '—'} |

### Kullanıcı Adları
${usernameLines}

${profile.notes ? `### Notlar\n${profile.notes}` : ''}
`.trim()

  writeFileSync(filePath, fm + '\n\n' + body + '\n', 'utf-8')
  return fileName
}

export function writeFindingNote(vaultPath, finding, profile) {
  const rootDir  = join(vaultPath, 'OSINT')
  const bulguDir = join(rootDir, 'Bulgular')
  ensureDir(bulguDir)

  const idx      = nextFindingIndex(bulguDir)
  const padded   = String(idx).padStart(3, '0')
  const fileName = `Bulgu-${padded}.md`
  const filePath = join(bulguDir, fileName)

  const profileSlug = slugify(profile?.name ?? 'bilinmeyen')
  const profileLink = profile ? `[[${profileSlug}]]` : '—'

  const CONFIDENCE_TR = { high: 'Yüksek', medium: 'Orta', low: 'Düşük' }
  const TYPE_TR = {
    account:  'Hesap / Profil',
    contact:  'İletişim',
    post:     'Gönderi',
    news:     'Haber',
    document: 'Belge',
    leak:     'Sızıntı',
    relation: 'İlişki',
    other:    'Diğer'
  }

  const fm = frontmatter({
    tags:       ['dorks'],
    bulgu_id:   `Bulgu-${padded}`,
    profil:     profile?.name ?? '',
    tip:        finding.type ?? 'other',
    platform:   finding.platform ?? '',
    guven:      finding.confidence ?? 'medium',
    tarih:      finding.createdAt ?? new Date().toISOString(),
    kaynak_url: finding.url ?? ''
  })

  const body = `
## ${finding.title || TYPE_TR[finding.type] || 'Bulgu'} — ${finding.platform || '—'}

**Profil:** ${profileLink}
**Tip:** ${TYPE_TR[finding.type] ?? finding.type}
**Platform:** ${finding.platform || '—'}
**Kaynak:** ${finding.url ? `[link](${finding.url})` : '—'}
**Güven:** ${CONFIDENCE_TR[finding.confidence] ?? finding.confidence}
**Tarih:** ${formatDate(finding.createdAt ?? new Date().toISOString())}
**Sorgu:** ${finding.queryLabel || '—'}

### Not
${finding.notes || '—'}
`.trim()

  writeFileSync(filePath, fm + '\n\n' + body + '\n', 'utf-8')

  // Append to _master.md
  const masterPath = join(bulguDir, '_master.md')
  if (!existsSync(masterPath)) {
    writeFileSync(masterPath, '---\ntags: [dorks]\n---\n\n# Tüm Bulgular\n\n', 'utf-8')
  }
  const masterLine = `- [[${fileName.replace('.md', '')}]] — ${finding.title || TYPE_TR[finding.type] || '—'} · ${finding.platform || '—'} · ${formatDate(finding.createdAt ?? new Date().toISOString())} · ${profileLink}\n`
  appendFileSync(masterPath, masterLine, 'utf-8')

  return fileName
}
