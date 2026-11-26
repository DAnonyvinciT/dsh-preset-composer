/**
 * Plugin parameter catalog. Reads the generated `docs/config-catalog.md` of the
 * DSH installation, which lists every official plugin's `Config` interface with
 * its field comments, and turns one interface into a flat field list.
 * Plugins missing from the catalog (third-party, or a non-interface Config) have
 * no entry; the client falls back to a raw JSON editor for them.
 */
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'

const LITERAL = String.raw`(?:'[^']*'|"[^"]*")`
const ENUM = new RegExp(`^${LITERAL}(?:\\s*\\|\\s*${LITERAL})*$`)

/** Strip `| undefined` / `| null` so `boolean | undefined` reads as boolean. */
const bare = type => type.split('|').map(part => part.trim()).filter(part => part !== 'undefined' && part !== 'null').join(' | ')

/** Classify a TypeScript type text into an editor kind. */
export function kindOf(type) {
  const text = bare(type)
  if (text === 'boolean') return { kind: 'boolean' }
  if (text === 'number') return { kind: 'number' }
  if (text === 'string') return { kind: 'string' }
  if (ENUM.test(text)) return { kind: 'enum', options: text.split('|').map(part => part.trim().slice(1, -1)) }
  return { kind: 'json' }
}

/** Remove comment markers from a JSDoc body; pull out the `@default` tag. */
function cleanDoc(raw) {
  const lines = raw.split('\n').map(line => line.replace(/^\s*\*? ?/, '').trimEnd())
  const prose = []
  let fallback
  for (const line of lines) {
    const tag = /^@default\s+(.*)$/.exec(line.trim())
    if (tag) fallback = tag[1].trim()
    else if (!line.trim().startsWith('@')) prose.push(line)
  }
  const doc = prose.join('\n').trim().replace(/\n(?!\n)/g, ' ').replace(/ {2,}/g, ' ')
  return { doc: doc === '' ? undefined : doc, default: fallback }
}

/** Index just past the `}` matching the `{` at `open`, skipping strings and comments. */
function matchBrace(source, open) {
  let depth = 0
  for (let i = open; i < source.length; i++) {
    const c = source[i]
    if (c === "'" || c === '"' || c === '`') { i++; while (i < source.length && source[i] !== c) { if (source[i] === '\\') i++; i++ } continue }
    if (source.startsWith('/*', i)) { const end = source.indexOf('*/', i + 2); if (end < 0) return -1; i = end + 1; continue }
    if (source.startsWith('//', i)) { while (i < source.length && source[i] !== '\n') i++; continue }
    if (c === '{') depth++
    else if (c === '}' && --depth === 0) return i
  }
  return -1
}

const MEMBER = /^(?:readonly\s+)?(?:(['"])(.+?)\1|([A-Za-z_$][\w$]*))(\?)?\s*:\s*([\s\S]+?);?$/

function parseMembers(body) {
  const fields = []
  const n = body.length
  let i = 0
  let doc
  while (i < n) {
    while (i < n && /\s/.test(body[i])) i++
    if (i >= n) break
    if (body.startsWith('/**', i)) {
      const end = body.indexOf('*/', i + 3)
      if (end < 0) break
      doc = cleanDoc(body.slice(i + 3, end))
      i = end + 2
      continue
    }
    if (body.startsWith('/*', i)) { const end = body.indexOf('*/', i + 2); if (end < 0) break; i = end + 2; continue }
    if (body.startsWith('//', i)) { while (i < n && body[i] !== '\n') i++; continue }
    const start = i
    let depth = 0
    for (; i < n; i++) {
      const c = body[i]
      if (c === "'" || c === '"' || c === '`') { i++; while (i < n && body[i] !== c) { if (body[i] === '\\') i++; i++ } continue }
      if (body.startsWith('/*', i)) { const end = body.indexOf('*/', i + 2); i = end < 0 ? n : end + 1; continue }
      if (body.startsWith('//', i)) { while (i < n && body[i] !== '\n') i++; i--; continue }
      if ('{[(<'.includes(c)) depth++
      else if ('}])>'.includes(c) && !(c === '>' && body[i - 1] === '=')) depth = Math.max(0, depth - 1)
      else if (depth === 0 && c === ';') { i++; break }
      else if (depth === 0 && c === '\n') {
        let j = i + 1
        while (j < n && /\s/.test(body[j])) j++
        const before = body.slice(start, i).trimEnd().slice(-1)
        if (body[j] === '|' || body[j] === '&' || ':|&,='.includes(before)) continue
        i++
        break
      }
    }
    const text = body.slice(start, i).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').trim()
    const match = MEMBER.exec(text)
    if (match !== null) {
      const type = match[5].trim().replace(/\s+/g, ' ')
      fields.push({
        name: match[2] ?? match[3],
        optional: match[4] === '?',
        type,
        ...kindOf(type),
        ...(doc?.doc === undefined ? {} : { doc: doc.doc }),
        ...(doc?.default === undefined ? {} : { default: doc.default }),
      })
    }
    doc = undefined
  }
  return fields
}

/** Parse the `Config` interface in one catalog code block; undefined when it is not an interface. */
export function parseInterface(source) {
  const head = /export interface Config\b[^{]*\{/.exec(source)
  if (head === null) return undefined
  const open = head.index + head[0].length - 1
  const close = matchBrace(source, open)
  if (close < 0) return undefined
  return parseMembers(source.slice(open + 1, close))
}

/** Parse the whole catalog into module name -> { fields }. */
export function parseCatalog(markdown) {
  const catalog = new Map()
  const sections = /<!-- BEGIN GENERATED config-catalog:(.+?) -->([\s\S]*?)<!-- END GENERATED config-catalog:\1 -->/g
  for (const section of markdown.matchAll(sections)) {
    const code = /```ts config-catalog\n([\s\S]*?)\n```/.exec(section[2])
    if (code === null) continue
    const fields = parseInterface(code[1])
    if (fields !== undefined) catalog.set(section[1].trim(), { fields })
  }
  return catalog
}

/** Candidate `docs/config-catalog.md` locations, most specific first. */
export function catalogCandidates(env = process.env, argv1 = process.argv[1], execPath = process.execPath) {
  const list = []
  if (env.DSH_INSTALL_DIR) list.push(join(env.DSH_INSTALL_DIR, 'docs', 'config-catalog.md'))
  if (argv1) {
    try {
      let dir = dirname(realpathSync(argv1))
      for (let depth = 0; depth < 5; depth++, dir = dirname(dir)) list.push(join(dir, 'docs', 'config-catalog.md'))
    } catch { /* argv1 is not a real path */ }
  }
  if (execPath) list.push(join(dirname(dirname(execPath)), 'lib', 'node_modules', '@deepseek-ai', 'dsh', 'docs', 'config-catalog.md'))
  return list
}

/** Defaults generated from `dsh web --dump-config-schema` (see scripts/gen-defaults.mjs). */
export function loadDefaults(file = new URL('./defaults.json', import.meta.url)) {
  try { return JSON.parse(readFileSync(file, 'utf8')).modules ?? {} } catch { return {} }
}

/** Fields of every module with a `defaultValue` attached where the schema declares one. */
export function withDefaults(catalog, defaults) {
  const out = {}
  for (const [module, entry] of catalog) {
    const known = defaults[module] ?? {}
    out[module] = entry.fields.map(field => (field.name in known ? { ...field, defaultValue: known[field.name] } : field))
  }
  return out
}

let cached

/** Load and cache the catalog; an empty map when no catalog file is found. */
export function loadCatalog(candidates = catalogCandidates()) {
  if (cached !== undefined) return cached
  for (const file of candidates) {
    if (!existsSync(file)) continue
    try {
      cached = parseCatalog(readFileSync(file, 'utf8'))
      return cached
    } catch { /* try the next candidate */ }
  }
  cached = new Map()
  return cached
}
