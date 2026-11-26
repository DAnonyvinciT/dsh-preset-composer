import test from 'node:test'
import assert from 'node:assert/strict'
import { loadDeps } from '../lib/deps.js'

test('loadDeps keeps only services that need a provider row', () => {
  const deps = loadDeps()
  assert.deepEqual(deps.requires['@deepseek-ai/dsh-tool-bash-persistent'], ['terminals'])
  assert.ok(deps.providers.terminals.includes('@deepseek-ai/dsh-terminal'))
  // supplied by the host or base bundles, so never a preset's job
  assert.equal(deps.requires['@deepseek-ai/dsh-tool-fs'], undefined)
  assert.equal(deps.providers.fs, undefined)
})

test('loadDeps returns empty maps when the file is missing', () => {
  assert.deepEqual(loadDeps(new URL('./nope.json', import.meta.url)), { requires: {}, providers: {}, conflicts: {}, isolated: [] })
})

test('loadDeps lists tool names registered by more than one plugin', () => {
  const { conflicts } = loadDeps()
  assert.deepEqual(conflicts.bash, ['@deepseek-ai/dsh-tool-bash', '@deepseek-ai/dsh-tool-bash-persistent'])
  assert.deepEqual(conflicts.pwsh, ['@deepseek-ai/dsh-tool-pwsh', '@deepseek-ai/dsh-tool-pwsh-persistent'])
})

test('loadDeps lists the checked services a shipped preset isolates', () => {
  assert.deepEqual(loadDeps().isolated, ['terminals'])
})
