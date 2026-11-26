/**
 * Pure preset model: validation, revisions and store edits.
 * No Host imports, so the Host plugins and the unit tests share one definition.
 */
import { createHash } from 'node:crypto'

export const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/
export const MAX_BODY_BYTES = 256 * 1024
export const MAX_NAME = 80
export const MAX_DESCRIPTION = 500

/** @param {unknown} value */
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

/** @param {unknown} value */
export const isJsExpr = (value) => isRecord(value) && typeof value.__jsExpr === 'string'

/**
 * Validate a Cordis entry list, including nested groups (same rules as the registry).
 * @param {unknown} rows
 * @param {string} [at]
 * @returns {string | undefined} first problem, or undefined
 */
export function entryListProblem(rows, at = '') {
  if (!Array.isArray(rows)) {
    return at === '' ? 'the composition must be a top-level list of plugin rows' : `group ${at} must hold a list of plugin rows`
  }
  const seen = new Set()
  for (const [index, row] of rows.entries()) {
    const label = at === '' ? `row ${index + 1}` : `${at} row ${index + 1}`
    if (!isRecord(row)) return `${label} is not a plugin row (expected a map with a "name")`
    if (typeof row.name !== 'string' || row.name === '') return `${label} names no plugin (a "name" string is required)`
    if (row.id !== undefined) {
      if (typeof row.id !== 'string' || row.id === '') return `${label} has an invalid id`
      if (seen.has(row.id)) return `${label} repeats the id "${row.id}"`
      seen.add(row.id)
    }
    if (row.disabled !== undefined && typeof row.disabled !== 'boolean' && !isJsExpr(row.disabled)) {
      return `${label} has an invalid "disabled" (a boolean or a !!js expression)`
    }
    if (row.isolate !== undefined && !isRecord(row.isolate)) return `${label} has an invalid "isolate" (a map of service names)`
    if (row.group === true) {
      const nested = entryListProblem(row.config, label)
      if (nested !== undefined) return nested
    }
  }
  return undefined
}

/**
 * Validate one preset definition.
 * @param {unknown} preset
 * @returns {string | undefined} first problem, or undefined
 */
export function validatePreset(preset) {
  if (!isRecord(preset)) return 'preset must be an object'
  if (typeof preset.id !== 'string' || !ID_PATTERN.test(preset.id)) {
    return 'id must be 1-64 characters: lowercase letters, digits and hyphens, starting with a letter or digit'
  }
  if (preset.name !== undefined && (typeof preset.name !== 'string' || preset.name.length > MAX_NAME)) {
    return `name must be a string of at most ${MAX_NAME} characters`
  }
  if (preset.description !== undefined && (typeof preset.description !== 'string' || preset.description.length > MAX_DESCRIPTION)) {
    return `description must be a string of at most ${MAX_DESCRIPTION} characters`
  }
  if (preset.order !== undefined && (typeof preset.order !== 'number' || !Number.isFinite(preset.order))) {
    return 'order must be a finite number'
  }
  const problem = entryListProblem(preset.plugins)
  if (problem !== undefined) return problem
  if (Buffer.byteLength(JSON.stringify(preset)) > MAX_BODY_BYTES) return 'preset is too large'
  return undefined
}

/**
 * Keep only the declared preset fields, dropping undefined and empty display text.
 * @param {Record<string, any>} preset
 */
export function normalizePreset(preset) {
  const out = { id: preset.id }
  if (typeof preset.name === 'string' && preset.name.trim() !== '') out.name = preset.name.trim()
  if (typeof preset.description === 'string' && preset.description.trim() !== '') out.description = preset.description.trim()
  if (typeof preset.order === 'number') out.order = preset.order
  out.plugins = structuredClone(preset.plugins)
  return out
}

/** Key-sorted JSON, so equal values always hash equally. */
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().filter(k => value[k] !== undefined)
      .map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

/** Revision token of a raw preset config (or of "no config"). */
export function revisionOf(config) {
  return createHash('sha256').update(canonical(config ?? null)).digest('hex').slice(0, 16)
}

/**
 * Validate the store config `{ presets: [...] }`, separating good from bad rows.
 * @param {unknown} config
 * @returns {{ presets: any[], problems: { id: string, message: string }[] }}
 */
export function readStore(config) {
  const rows = isRecord(config) && Array.isArray(config.presets) ? config.presets : []
  const presets = []
  const problems = []
  const ids = new Set()
  for (const [index, row] of rows.entries()) {
    const id = isRecord(row) && typeof row.id === 'string' ? row.id : `#${index + 1}`
    const message = validatePreset(row) ?? (ids.has(id) ? `duplicate id "${id}"` : undefined)
    if (message !== undefined) { problems.push({ id, message }); continue }
    ids.add(id)
    presets.push(row)
  }
  return { presets, problems }
}

/** Insert or replace a preset in a store config; returns the next config. */
export function upsert(config, preset) {
  const rows = isRecord(config) && Array.isArray(config.presets) ? [...config.presets] : []
  const index = rows.findIndex(row => isRecord(row) && row.id === preset.id)
  if (index < 0) rows.push(preset)
  else rows[index] = preset
  return { ...(isRecord(config) ? config : {}), presets: rows }
}

/** Replace the preset stored under `fromId` with `preset` (possibly a new id), keeping its position. */
export function rename(config, fromId, preset) {
  const rows = isRecord(config) && Array.isArray(config.presets) ? [...config.presets] : []
  const index = rows.findIndex(row => isRecord(row) && row.id === fromId)
  if (index < 0) rows.push(preset)
  else rows[index] = preset
  return { ...(isRecord(config) ? config : {}), presets: rows }
}

/** Remove a preset from a store config; returns the next config. */
export function remove(config, id) {
  const rows = isRecord(config) && Array.isArray(config.presets) ? config.presets : []
  return { ...(isRecord(config) ? config : {}), presets: rows.filter(row => !(isRecord(row) && row.id === id)) }
}

/** Deep-clone a preset under a new id (Duplicate). */
export function newPresetFrom(source, id, name) {
  const copy = normalizePreset({ ...source, id })
  if (name !== undefined) copy.name = name
  delete copy.order
  return copy
}

function walk(rows, visit) {
  for (const row of rows ?? []) {
    if (!isRecord(row)) continue
    visit(row)
    if (row.group === true && Array.isArray(row.config)) walk(row.config, visit)
  }
}

/**
 * Build the add-row palette from every known composition: one entry per module,
 * keeping the first config seen as a sample.
 * @param {Array<{ plugins: any[] }>} presets
 * @param {Array<{ moduleName: string, meta?: any }>} [inventory]
 */
export function buildPalette(presets, inventory = []) {
  const byName = new Map()
  const metaOf = new Map()
  for (const entry of inventory) {
    if (entry.meta !== undefined && !metaOf.has(entry.moduleName)) metaOf.set(entry.moduleName, entry.meta)
  }
  for (const preset of presets) {
    walk(preset.plugins, (row) => {
      if (row.name === 'cordis:group' || byName.has(row.name)) return
      byName.set(row.name, {
        name: row.name,
        id: typeof row.id === 'string' ? row.id : undefined,
        sampleConfig: isRecord(row.config) ? structuredClone(row.config) : undefined,
        meta: metaOf.get(row.name),
      })
    })
  }
  for (const entry of inventory) {
    if (!byName.has(entry.moduleName) && entry.moduleName !== 'cordis:group') {
      byName.set(entry.moduleName, { name: entry.moduleName, meta: metaOf.get(entry.moduleName) })
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Rows a new custom preset starts with: a persona, file tools and one shell tool.
 * Mirrors the shipped `standard` preset's core rows. The shell row is picked by
 * platform here, so the draft needs no `!!js` condition.
 */
export function minimalPlugins(platform = process.platform) {
  const shell = platform === 'win32'
    ? { id: 'tool-pwsh', name: '@deepseek-ai/dsh-tool-pwsh' }
    : { id: 'tool-bash', name: '@deepseek-ai/dsh-tool-bash' }
  return [
    { id: 'persona', name: '@deepseek-ai/dsh-persona', config: { prefix: 'You are a coding agent powered by the {{model}} model.' } },
    { id: 'tool-fs', name: '@deepseek-ai/dsh-tool-fs' },
    shell,
  ]
}
