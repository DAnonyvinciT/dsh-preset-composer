import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPalette, entryListProblem, minimalPlugins, newPresetFrom, normalizePreset, readStore, remove, rename, revisionOf, upsert, validatePreset,
} from '../lib/model.js'

const base = () => ({
  id: 'demo',
  name: 'Demo',
  plugins: [
    { id: 'persona', name: '@deepseek-ai/dsh-persona', config: { prefix: 'hi' } },
    {
      id: 'shell', name: 'cordis:group', group: true, isolate: { terminals: true },
      config: [{ id: 'bash', name: 'dsh-tool-bash', disabled: { __jsExpr: "process.platform === 'win32'" } }],
    },
  ],
})

test('valid preset passes', () => assert.equal(validatePreset(base()), undefined))

test('rejects bad ids', () => {
  for (const id of ['', 'Demo', '-x', 'a b', 'x'.repeat(65), 1]) {
    assert.match(validatePreset({ ...base(), id }) ?? '', /id must be/)
  }
})

test('rejects structural problems', () => {
  assert.match(entryListProblem({}) ?? '', /top-level list/)
  assert.match(entryListProblem([1]) ?? '', /not a plugin row/)
  assert.match(entryListProblem([{ id: 'a' }]) ?? '', /names no plugin/)
  assert.match(entryListProblem([{ id: 'a', name: 'x' }, { id: 'a', name: 'y' }]) ?? '', /repeats the id/)
  assert.match(entryListProblem([{ name: 'x', disabled: 'yes' }]) ?? '', /invalid "disabled"/)
  assert.match(entryListProblem([{ name: 'g', group: true, config: 5 }]) ?? '', /must hold a list/)
  assert.match(entryListProblem([{ name: 'g', group: true, config: [{ id: 'z' }] }]) ?? '', /row 1 row 1 names no plugin/)
})

test('same id allowed in different groups', () => {
  const rows = [
    { id: 'a', name: 'x' },
    { name: 'g', group: true, config: [{ id: 'a', name: 'y' }] },
  ]
  assert.equal(entryListProblem(rows), undefined)
})

test('jsExpr survives normalize round trip', () => {
  const out = normalizePreset(base())
  assert.deepEqual(out.plugins[1].config[0].disabled, { __jsExpr: "process.platform === 'win32'" })
  assert.notEqual(out.plugins, base().plugins)
})

test('normalize drops empty display text', () => {
  const out = normalizePreset({ id: 'x', name: '  ', description: '', plugins: [] })
  assert.deepEqual(out, { id: 'x', plugins: [] })
})

test('revision is stable across key order and changes with content', () => {
  const a = revisionOf({ a: 1, b: { c: 2, d: 3 } })
  assert.equal(a, revisionOf({ b: { d: 3, c: 2 }, a: 1 }))
  assert.notEqual(a, revisionOf({ a: 1, b: { c: 2, d: 4 } }))
  assert.equal(revisionOf(undefined), revisionOf(null))
})

test('readStore separates good rows from bad', () => {
  const { presets, problems } = readStore({ presets: [base(), { id: 'BAD', plugins: [] }, base()] })
  assert.equal(presets.length, 1)
  assert.equal(problems.length, 2)
  assert.match(problems[1].message, /duplicate id/)
  assert.deepEqual(readStore(undefined), { presets: [], problems: [] })
})

test('upsert and remove', () => {
  let cfg = upsert({ presets: [] }, base())
  assert.equal(cfg.presets.length, 1)
  cfg = upsert(cfg, { ...base(), name: 'Changed' })
  assert.equal(cfg.presets.length, 1)
  assert.equal(cfg.presets[0].name, 'Changed')
  cfg = remove(cfg, 'demo')
  assert.deepEqual(cfg.presets, [])
  assert.deepEqual(remove(undefined, 'x'), { presets: [] })
})

test('duplicate copies deeply and drops order', () => {
  const src = { ...base(), order: 3 }
  const copy = newPresetFrom(src, 'copy', 'Copy')
  assert.equal(copy.id, 'copy')
  assert.equal(copy.name, 'Copy')
  assert.equal(copy.order, undefined)
  copy.plugins[0].config.prefix = 'changed'
  assert.equal(src.plugins[0].config.prefix, 'hi')
})

test('palette dedups by module and includes inventory-only modules', () => {
  const palette = buildPalette(
    [base(), { plugins: [{ id: 'p2', name: '@deepseek-ai/dsh-persona', config: { prefix: 'other' } }] }],
    [{ moduleName: 'extra-mod', meta: { title: 'Extra' } }, { moduleName: 'cordis:group' }],
  )
  assert.deepEqual(palette.map(p => p.name), ['@deepseek-ai/dsh-persona', 'dsh-tool-bash', 'extra-mod'])
  assert.equal(palette[0].sampleConfig.prefix, 'hi')
})

test('palette keeps description meta from the first inventory source that has one', () => {
  const desc = { en: 'Runs shell commands', zh: '执行 shell 命令' }
  const palette = buildPalette(
    [base()],
    [
      { moduleName: 'dsh-tool-bash' },
      { moduleName: 'dsh-tool-bash', meta: { title: 'Bash', description: desc } },
      { moduleName: 'dsh-tool-bash', meta: { title: 'Other' } },
      { moduleName: 'only-in-rows', meta: { description: 'x' } },
    ],
  )
  const bash = palette.find(p => p.name === 'dsh-tool-bash')
  assert.deepEqual(bash.meta.description, desc)
  assert.equal(bash.meta.title, 'Bash')
  assert.equal(palette.find(p => p.name === 'only-in-rows').meta.description, 'x')
})

test('minimalPlugins gives a valid persona, file tools and one platform shell', () => {
  for (const platform of ['linux', 'win32']) {
    const rows = minimalPlugins(platform)
    assert.equal(entryListProblem(rows), undefined)
    assert.equal(validatePreset({ id: 'fresh', plugins: rows }), undefined)
    assert.deepEqual(rows.map(r => r.id), ['persona', 'tool-fs', platform === 'win32' ? 'tool-pwsh' : 'tool-bash'])
    assert.ok(rows.every(r => r.disabled === undefined))
  }
  assert.notEqual(minimalPlugins()[0], minimalPlugins()[0])
})

test('rename replaces a stored preset under a new id and keeps its position', () => {
  const a = { id: 'a', plugins: [] }
  const b = { id: 'b', plugins: [] }
  const next = rename({ presets: [a, b] }, 'a', { id: 'c', plugins: [] })
  assert.deepEqual(next.presets.map(p => p.id), ['c', 'b'])
  assert.deepEqual(rename({ presets: [a] }, 'missing', b).presets.map(p => p.id), ['a', 'b'])
})
