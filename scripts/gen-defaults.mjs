// Regenerates lib/defaults.json from `dsh web --dump-config-schema` output.
// Usage: dsh web --dump-config-schema > schema.json && node scripts/gen-defaults.mjs schema.json
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const schema = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const defs = schema.$defs
const refs = new Map()
for (const part of defs.entry.allOf ?? []) {
  const name = part.if?.properties?.name?.const
  const ref = part.then?.properties?.config?.anyOf?.[0]?.$ref
  if (name && ref) refs.set(name, ref.split('/').pop())
}
const objectOf = def => (def?.anyOf ?? []).find(branch => branch.properties) ?? (def?.properties ? def : undefined)
const out = {}
for (const [module, ref] of refs) {
  const object = objectOf(defs[ref])
  if (!object) continue
  for (const [field, property] of Object.entries(object.properties)) {
    if (!('default' in property)) continue
    ;(out[module] ??= {})[field] = property.default
  }
}
const target = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'defaults.json')
writeFileSync(target, JSON.stringify({ generatedFrom: schema.title ?? 'dsh config schema', modules: out }, null, 1) + '\n')
console.log(`wrote ${target}: ${Object.keys(out).length} modules, ${Object.values(out).reduce((n, m) => n + Object.keys(m).length, 0)} defaults`)
