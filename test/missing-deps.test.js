import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { loadDeps } from '../lib/deps.js'

// The helpers live inside the client factory; lift their pure source out of client.js.
const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const from = src.indexOf('const childrenOf')
const to = src.indexOf('function listProblem(')
assert.ok(from >= 0 && to > from, 'helper markers found in client.js')
const { missingDeps, toolConflicts, isolateService } = new Function(`${src.slice(from, to)}\nreturn { missingDeps, toolConflicts, isolateService }`)()
const deps = loadDeps()

const T = '@deepseek-ai/dsh-terminal'
const P = '@deepseek-ai/dsh-tool-bash-persistent'
const B = '@deepseek-ai/dsh-tool-bash'
const group = (config, isolate) => ({ id: 'g', name: 'cordis:group', group: true, config, ...(isolate ? { isolate } : {}) })
const iso = { terminals: true }
const run = plugins => missingDeps(plugins, deps).map(m => `${m.kind}:${m.service}@${m.path.join('.')}`)

test('a plugin without its provider is reported as missing', () => {
  assert.deepEqual(run([{ id: 'p', name: P }]), ['missing:terminals@0'])
})
test('a provider outside an isolating group leaks into the root realm', () => {
  assert.deepEqual(run([{ id: 't', name: T }, { id: 'p', name: P }]), ['leak:terminals@0'])
  // the provider in a plain group still lands in the root realm, so the user outside sees it; only the leak is the problem
  assert.deepEqual(run([group([{ id: 't', name: T }]), { id: 'p', name: P }]), ['leak:terminals@0.0'])
})
test('provider and user inside one isolating group are fine (the minimal preset layout)', () => {
  assert.deepEqual(run([group([{ id: 't', name: T }, { id: 'p', name: P }], iso)]), [])
})
test('a provider in one isolating group does not serve a user outside it', () => {
  assert.deepEqual(run([group([{ id: 't', name: T }], iso), { id: 'p', name: P }]), ['missing:terminals@1'])
  assert.deepEqual(run([{ id: 'p', name: P }, group([{ id: 't', name: T }], iso)]), ['missing:terminals@0'])
})
test('a user in an isolating group needs a provider in that same group', () => {
  assert.deepEqual(run([{ id: 't', name: T }, group([{ id: 'p', name: P }], iso)]), ['leak:terminals@0', 'missing:terminals@1.0'])
})
test('disabled providers do not count, conditional ones do', () => {
  assert.deepEqual(run([group([{ id: 't', name: T, disabled: true }, { id: 'p', name: P }], iso)]), ['missing:terminals@0.1'])
  assert.deepEqual(run([group([{ id: 't', name: T, disabled: { __jsExpr: 'true' } }, { id: 'p', name: P }], iso)]), [])
})
test('disabled users and plugins without needs are ignored', () => {
  assert.deepEqual(run([{ id: 'p', name: P, disabled: true }]), [])
  assert.deepEqual(run([{ id: 'f', name: '@deepseek-ai/dsh-tool-fs' }]), [])
})

test('isolateService groups the provider and its users, and adds the provider when absent', () => {
  const rows = [{ id: 'f', name: '@deepseek-ai/dsh-tool-fs' }, { id: 't', name: T }, { id: 'p', name: P }]
  const fixed = isolateService(rows, [], 'terminals', deps)
  assert.deepEqual(fixed.map(r => r.id), ['f', 'terminals'])
  assert.deepEqual(fixed[1].isolate, { terminals: true })
  assert.deepEqual(fixed[1].config.map(r => r.name), [T, P])
  assert.deepEqual(run(fixed), [])

  const added = isolateService([{ id: 'p', name: P }], [], 'terminals', deps, T)
  assert.deepEqual(added[0].config.map(r => r.name), [T, P])
  assert.deepEqual(run(added), [])
})

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
