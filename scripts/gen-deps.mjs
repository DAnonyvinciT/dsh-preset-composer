// Regenerates lib/deps.json: which services each plugin injects and which plugins provide them.
// Usage: node scripts/gen-deps.mjs [dsh-install-dir]
// Injects come from docs/config-catalog.md. Providers come from a source scan of the installed
// @deepseek-ai/* packages: `super(ctx, 'name')` in a class (followed through `extends` chains
// across packages) and `ctx.provide('name', ...)`. Services that the shipped presets use without
// loading a provider are recorded as `ambient` (the host supplies them), so they never warn.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const D = process.argv[2] ?? process.env.DSH_INSTALL_DIR
  ?? '/home/nimuy/.local/opt/node-v26.13.1-linux-x64/lib/node_modules/@deepseek-ai/dsh'
const NS = path.join(D, 'node_modules', '@deepseek-ai')
const yaml = createRequire(path.join(D, 'package.json'))('js-yaml')
void yaml

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out) }
    else if (/\.ts$/.test(e.name) && !/\.(test|d)\.ts$/.test(e.name)) out.push(p)
  }
  return out
}

const injects = {}
const catalog = fs.readFileSync(path.join(D, 'docs', 'config-catalog.md'), 'utf8')
for (const m of catalog.matchAll(/BEGIN GENERATED config-catalog:(\S+) -->([\s\S]*?)<!-- END GENERATED/g)) {
  const line = /^- `inject`: (.+)$/m.exec(m[2])
  const list = line ? [...line[1].matchAll(/`([^`]+)`/g)].map(x => x[1]) : []
  if (list.length) injects[m[1]] = list
}

const classes = new Map() // name -> { parent, own: service|undefined }
const provided = new Map() // package -> Set(service)
const classesOf = new Map() // package -> [class names]
for (const pkg of fs.readdirSync(NS)) {
  const src = path.join(NS, pkg, 'src')
  if (!fs.existsSync(src)) continue
  const full = '@deepseek-ai/' + pkg
  const set = new Set()
  provided.set(full, set)
  classesOf.set(full, [])
  for (const file of walk(src)) {
    const text = fs.readFileSync(file, 'utf8')
    for (const m of text.matchAll(/\bctx\.provide\(\s*'([A-Za-z0-9_.]+)'/g)) set.add(m[1])
    const headers = [...text.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g)]
    headers.forEach((h, i) => {
      const body = text.slice(h.index + h[0].length, headers[i + 1]?.index ?? text.length)
      const own = /\bsuper\(\s*\w+\s*,\s*'([A-Za-z0-9_.]+)'/.exec(body)?.[1]
      if (!classes.has(h[1])) classes.set(h[1], { parent: h[2], own })
      classesOf.get(full).push(h[1])
    })
  }
}
const serviceOf = (name, seen = new Set()) => {
  const c = classes.get(name)
  if (!c || seen.has(name)) return undefined
  seen.add(name)
  return c.own ?? (c.parent ? serviceOf(c.parent, seen) : undefined)
}
for (const [pkg, names] of classesOf) for (const n of names) {
  const s = serviceOf(n)
  if (s) provided.get(pkg).add(s)
}

const providers = {}
for (const [pkg, set] of provided) for (const s of set) (providers[s] ??= []).push(pkg)
for (const list of Object.values(providers)) list.sort()

// Ambient: a service some shipped preset row injects while neither the base bundles nor that
// preset load a provider for it. Those are supplied by the host itself.
const names = text => [...text.matchAll(/^\s*name:\s*'?(@deepseek-ai\/[A-Za-z0-9._/-]+)'?\s*$/gm)].map(m => m[1])
const read = f => fs.readFileSync(f, 'utf8')
const baseRows = ['dsh-base', 'dsh-web-app'].flatMap(p => names(read(path.join(NS, p, 'cordis.patch.yml'))))
const baseHave = new Set(baseRows.flatMap(n => [...(provided.get(n) ?? [])]))
const ambient = new Set()
const presetsDir = path.join(NS, 'dsh-web-app', 'presets')
for (const f of fs.readdirSync(presetsDir)) {
  const rows = names(read(path.join(presetsDir, f)))
  const have = new Set([...baseHave, ...rows.flatMap(n => [...(provided.get(n) ?? [])])])
  for (const n of rows) for (const s of injects[n] ?? []) if (!have.has(s)) ambient.add(s)
}
for (const s of baseHave) ambient.add(s)
// Tool names: docs/tool-catalog.md maps each tool package to the names the model sees. Two packages
// that register the same name cannot be loaded in one scope ("tool X is already registered").
const toolCatalog = read(path.join(D, 'docs', 'tool-catalog.md'))
const mapStart = toolCatalog.indexOf('## Tool Package Map')
const mapEnd = toolCatalog.indexOf('<a id=', mapStart)
const tools = {}
for (const line of toolCatalog.slice(mapStart, mapEnd).split('\n')) {
  const m = /^\| `(@deepseek-ai\/[^`]+)` \| ([^|]+) \|/.exec(line)
  if (m) tools[m[1]] = [...m[2].matchAll(/`([^`]+)`/g)].map(x => x[1])
}
const byName = {}
for (const [pkg, list] of Object.entries(tools)) for (const n of list) (byName[n] ??= []).push(pkg)
const conflicts = Object.fromEntries(Object.entries(byName).filter(([, pkgs]) => pkgs.length > 1).map(([n, pkgs]) => [n, pkgs.sort()]))
// A service is only checked when it has a known provider and is not ambient.
const out = {
  generatedFrom: JSON.parse(read(path.join(D, 'package.json'))).version,
  injects,
  providers: Object.fromEntries(Object.entries(providers).filter(([s]) => !ambient.has(s))),
  ambient: [...ambient].sort(),
  conflicts,
}
const target = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'deps.json')
fs.writeFileSync(target, JSON.stringify(out, null, 1) + '\n')
const checked = new Set(Object.values(injects).flat().filter(s => out.providers[s]))
console.log(`wrote ${target}: ${Object.keys(injects).length} modules inject, ${checked.size} checked services, ${out.ambient.length} ambient`)
console.log('checked services:', [...checked].sort().join(' '))
console.log('ambient:', out.ambient.join(' '))
console.log('tool-name conflicts:', JSON.stringify(conflicts))
