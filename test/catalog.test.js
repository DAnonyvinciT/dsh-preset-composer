import assert from 'node:assert/strict'
import test from 'node:test'
import { kindOf, parseCatalog, parseInterface, withDefaults } from '../lib/catalog.js'

test('kindOf classifies primitive, enum and structured types', () => {
  assert.deepEqual(kindOf('boolean'), { kind: 'boolean' })
  assert.deepEqual(kindOf('boolean | undefined'), { kind: 'boolean' })
  assert.deepEqual(kindOf('number'), { kind: 'number' })
  assert.deepEqual(kindOf('string'), { kind: 'string' })
  assert.deepEqual(kindOf("'a' | 'b'"), { kind: 'enum', options: ['a', 'b'] })
  assert.deepEqual(kindOf('string[]'), { kind: 'json' })
  assert.deepEqual(kindOf('Record<string, number>'), { kind: 'json' })
})

test('parseInterface reads names, optionality, docs and defaults', () => {
  const fields = parseInterface(`
/** Plugin config. */
export interface Config {
  /**
   * Persona prose,
   * on two lines.
   */
  prefix: string
  /** Turn it on. @default true */
  complete?: boolean
  // plain comment is ignored
  mode?: 'fast' | 'slow'
  roots?: string[]
  nested?: {
    inner: number
  }
  limit: number; other?: string
}
`)
  assert.deepEqual(fields.map(f => f.name), ['prefix', 'complete', 'mode', 'roots', 'nested', 'limit', 'other'])
  assert.equal(fields[0].optional, false)
  assert.equal(fields[0].doc, 'Persona prose, on two lines.')
  assert.equal(fields[1].optional, true)
  assert.equal(fields[2].kind, 'enum')
  assert.deepEqual(fields[2].options, ['fast', 'slow'])
  assert.equal(fields[3].kind, 'json')
  assert.equal(fields[4].kind, 'json')
  assert.equal(fields[5].kind, 'number')
  assert.equal(fields[6].optional, true)
})

test('parseInterface returns undefined for a non-interface Config', () => {
  assert.equal(parseInterface('export type Config = z.infer<typeof Config>'), undefined)
})

test('parseCatalog maps module names to fields and skips type aliases', () => {
  const markdown = [
    '<!-- BEGIN GENERATED config-catalog:a/one -->',
    '```ts config-catalog',
    'export interface Config {',
    '  size: number',
    '}',
    '```',
    '<!-- END GENERATED config-catalog:a/one -->',
    '<!-- BEGIN GENERATED config-catalog:a/two -->',
    '```ts config-catalog',
    'export type Config = Other',
    '```',
    '<!-- END GENERATED config-catalog:a/two -->',
  ].join('\n')
  const catalog = parseCatalog(markdown)
  assert.deepEqual([...catalog.keys()], ['a/one'])
  assert.equal(catalog.get('a/one').fields[0].name, 'size')
})

test('withDefaults attaches schema defaults only where one is declared', () => {
  const catalog = new Map([['a/one', { fields: [{ name: 'size', optional: true, kind: 'number' }, { name: 'flag', optional: true, kind: 'boolean' }] }]])
  const out = withDefaults(catalog, { 'a/one': { size: 0, other: 1 } })
  assert.equal(out['a/one'][0].defaultValue, 0)
  assert.equal('defaultValue' in out['a/one'][1], false)
  assert.deepEqual(withDefaults(catalog, {})['a/one'][0], catalog.get('a/one').fields[0])
})
