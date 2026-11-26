import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { loadDeps } from '../lib/deps.js'

// missingDeps lives inside the client factory, so lift its source out of client.js.
const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const from = src.indexOf('function missingDeps(')
const to = src.indexOf('function uniqueId(')
assert.ok(from >= 0 && to > from, 'missingDeps markers found in client.js')
const childrenOf = row => (row && row.group === true && Array.isArray(row.config) ? row.config : null)
const { missingDeps, toolConflicts } = new Function('childrenOf', `${src.slice(from, to)}\nreturn { missingDeps, toolConflicts }`)(childrenOf)
const deps = loadDeps()

const T = '@deepseek-ai/dsh-terminal'
const P = '@deepseek-ai/dsh-tool-bash-persistent'
const group = (config, isolate) => ({ id: 'g', name: 'cordis:group', group: true, config, ...(isolate ? { isolate } : {}) })
const run = plugins => missingDeps(plugins, deps).map(m => `${m.service}@${m.path.join('.')}`)

test('a plugin without its provider is reported', () => {
  assert.deepEqual(run([{ id: 'p', name: P }]), ['terminals@0'])
})
test('a provider anywhere in scope satisfies it', () => {
  assert.deepEqual(run([{ id: 't', name: T }, { id: 'p', name: P }]), [])
  assert.deepEqual(run([group([{ id: 't', name: T }]), { id: 'p', name: P }]), [])
})
test('disabled providers do not count, conditional ones do', () => {
  assert.deepEqual(run([{ id: 't', name: T, disabled: true }, { id: 'p', name: P }]), ['terminals@1'])
  assert.deepEqual(run([{ id: 't', name: T, disabled: { __jsExpr: 'true' } }, { id: 'p', name: P }]), [])
})
test('disabled consumers and plugins without needs are ignored', () => {
  assert.deepEqual(run([{ id: 'p', name: P, disabled: true }]), [])
  assert.deepEqual(run([{ id: 'f', name: '@deepseek-ai/dsh-tool-fs' }]), [])
})
test('an isolating group only sees providers inside it', () => {
  const iso = { terminals: true }
  assert.deepEqual(run([group([{ id: 't', name: T }, { id: 'p', name: P }], iso)]), [])
  assert.deepEqual(run([group([{ id: 't', name: T }], iso), { id: 'p', name: P }]), ['terminals@1'])
  assert.deepEqual(run([{ id: 't', name: T }, group([{ id: 'p', name: P }], iso)]), ['terminals@1.0'])
})

const B = '@deepseek-ai/dsh-tool-bash'
const conflicts = plugins => toolConflicts(plugins, deps).map(c => `${c.tool}:${c.rows.map(r => r.path.join('.')).join('+')}`)

test('two plugins registering the same tool name are reported', () => {
  assert.deepEqual(conflicts([{ id: 'b', name: B }, { id: 'p', name: P }]), ['bash:0+1'])
  assert.deepEqual(conflicts([{ id: 'b', name: B }]), [])
  assert.deepEqual(conflicts([{ id: 'p', name: P }, { id: 'f', name: '@deepseek-ai/dsh-tool-fs' }]), [])
})
test('disabled rows do not clash', () => {
  assert.deepEqual(conflicts([{ id: 'b', name: B, disabled: true }, { id: 'p', name: P }]), [])
})
test('a plain group shares the scope, an isolating tools group does not', () => {
  assert.deepEqual(conflicts([{ id: 'b', name: B }, group([{ id: 'p', name: P }])]), ['bash:0+1.0'])
  assert.deepEqual(conflicts([{ id: 'b', name: B }, group([{ id: 'p', name: P }], { tools: true })]), [])
})
