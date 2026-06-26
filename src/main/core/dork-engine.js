import { app } from 'electron'
import { join } from 'path'
import { readdirSync, readFileSync } from 'fs'

function getTemplatesDir() {
  return app.isPackaged
    ? join(process.resourcesPath, 'resources', 'templates')
    : join(app.getAppPath(), 'resources', 'templates')
}

function loadAllTemplates() {
  const dir = getTemplatesDir()
  const files = readdirSync(dir).filter(f => f.endsWith('.json'))
  return files.flatMap(f => JSON.parse(readFileSync(join(dir, f), 'utf-8')))
}

const FIELD_CHECKS = {
  name:     p => !!p.name,
  email:    p => p.emails?.length > 0,
  username: p => p.usernames?.length > 0,
  phone:    p => p.phones?.length > 0,
  domain:   p => !!p.domain,
  location: p => !!p.location,
  company:  p => !!p.company
}

function isActive(template, profile) {
  return template.requiredFields.every(f => FIELD_CHECKS[f]?.(profile) ?? false)
}

function resolveUsername(profile, platform) {
  const list = profile.usernames ?? []
  if (list.length === 0) return ''
  // Prefer exact platform match, then 'all', then first entry
  const match = list.find(u => (typeof u === 'object' ? u.platform : 'all') === platform)
  if (match) return typeof match === 'object' ? match.value : match
  const general = list.find(u => (typeof u === 'object' ? u.platform : 'all') === 'all')
  if (general) return typeof general === 'object' ? general.value : general
  const first = list[0]
  return typeof first === 'object' ? first.value : first
}

function substitute(str, profile, platform) {
  const username = resolveUsername(profile, platform ?? 'all')
  return str
    .replace(/\{\{name\}\}/g,     profile.name        ?? '')
    .replace(/\{\{email\}\}/g,    profile.emails?.[0] ?? '')
    .replace(/\{\{username\}\}/g, username)
    .replace(/\{\{phone\}\}/g,    profile.phones?.[0] ?? '')
    .replace(/\{\{domain\}\}/g,   profile.domain      ?? '')
    .replace(/\{\{location\}\}/g, profile.location    ?? '')
    .replace(/\{\{company\}\}/g,  profile.company     ?? '')
}

function buildUrl(template, profile) {
  if (template.urlTemplate) {
    return substitute(template.urlTemplate, profile, template.platform)
  }
  return template.baseUrl + encodeURIComponent(substitute(template.template, profile, template.platform))
}

export function generateQueries(profile) {
  const templates = loadAllTemplates()

  return templates.map(t => ({
    id:            t.id,
    platform:      t.platform,
    platformLabel: t.platformLabel,
    category:      t.category,
    categoryLabel: t.categoryLabel,
    priority:      t.priority,
    label:         t.label,
    description:   t.description,
    active:        isActive(t, profile),
    url:           isActive(t, profile) ? buildUrl(t, profile) : null,
    rawQuery:      t.urlTemplate ? null : substitute(t.template ?? '', profile, t.platform)
  }))
}
