/**
 * Preset composer API. Owner-only Fetch routes under /api/preset-composer/.
 * The Connection carrier applies the trust fence and authentication before a
 * route runs; only owner peers reach an exact Fetch route.
 *
 * Persistence goes through `configEditor`, never by editing the profile patch:
 * - custom presets live in the `preset-composer-store` entry's config;
 * - shipped presets are overridden by replacing their row's whole config.
 */
import { loadCatalog, loadDefaults, withDefaults } from './catalog.js'
import { loadDeps } from './deps.js'
import {
  buildPalette, MAX_BODY_BYTES, minimalPlugins, normalizePreset, readStore, remove, revisionOf, upsert, validatePreset,
} from './model.js'

export const name = 'dsh-preset-composer'
export const inject = ['connection', 'agentPresets']

const BASE = '/api/preset-composer'
const PRESET_MODULE = '@deepseek-ai/dsh-agent-preset'
const STORE_MODULE = 'dsh-preset-composer/store'

class HttpError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
})

async function readBody(request) {
  const text = await request.text()
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) throw new HttpError(413, 'invalid', 'request body is too large')
  try { return JSON.parse(text) } catch { throw new HttpError(400, 'invalid', 'request body is not valid JSON') }
}

/** Map a configEditor failure to a response error. */
function editFailure(error) {
  const message = error instanceof Error ? error.message : String(error)
  if (/overridden by a home patch/.test(message)) return new HttpError(423, 'readonly', message)
  if (/no longer available|changed during reload/.test(message)) return new HttpError(409, 'stale', message)
  return new HttpError(400, 'invalid', message)
}

export function apply(ctx) {
  const editor = () => {
    const service = ctx.get('configEditor')
    if (service === undefined) throw new HttpError(503, 'unavailable', 'this Host has no configuration editor')
    return service
  }

  /** Editable rows: shipped/bundle preset rows plus the custom store. */
  function sources() {
    const service = ctx.get('configEditor')
    if (service === undefined) return { editable: false, shipped: new Map(), store: undefined }
    const shipped = new Map()
    let store
    for (const item of service.configuration()) {
      const entryName = item.entry.options.name
      if (entryName === STORE_MODULE) store = item
      else if (entryName === PRESET_MODULE) {
        const id = item.entry.options.config?.id
        if (typeof id === 'string') shipped.set(id, item)
      }
    }
    return { editable: true, shipped, store }
  }

  async function snapshot() {
    const { editable, shipped, store } = sources()
    const roster = await ctx.agentPresets.list()
    const defaultId = ctx.agentPresets.defaultId
    const customRows = readStore(store?.entry.options.config)
    const customById = new Map(customRows.presets.map(row => [row.id, row]))
    const presets = []
    const compositions = []
    for (const row of roster) {
      const custom = customById.get(row.id)
      const bundle = shipped.get(row.id)
      let source = 'readonly'
      let raw
      let overridden = false
      if (custom !== undefined) { source = 'custom'; raw = custom }
      else if (bundle !== undefined) {
        source = 'shipped'
        raw = bundle.entry.options.config
        overridden = Object.keys(bundle.override).length > 0
      }
      const item = {
        id: row.id,
        name: row.name,
        description: row.description,
        order: row.order,
        isDefault: row.id === defaultId,
        broken: row.broken,
        source,
        overridden,
      }
      if (raw !== undefined) {
        item.plugins = structuredClone(raw.plugins ?? [])
        item.revision = revisionOf(raw)
        compositions.push({ plugins: item.plugins })
      } else {
        try { item.yaml = (await ctx.agentPresets.readDocument(row.id)).content } catch { /* shown as unreadable */ }
      }
      presets.push(item)
    }
    let inventory = []
    try {
      const snapshot = await ctx.get('pluginInventory')?.list()
      // Entries carry meta for mounted plugins; preset rows carry it for plugins no session has mounted.
      const rows = (snapshot?.agentPresets ?? []).flatMap(group => group.rows ?? [])
      inventory = [...(snapshot?.entries ?? []), ...rows]
    } catch { /* palette still works from presets */ }
    return {
      editable,
      defaultId,
      storeProblems: customRows.problems,
      presets,
      palette: buildPalette(compositions, inventory),
      template: minimalPlugins(),
      deps: loadDeps(),
    }
  }

  const guard = handler => async (request) => {
    try { return json(200, await handler(request)) }
    catch (error) {
      if (error instanceof HttpError) return json(error.status, { error: { code: error.code, message: error.message } })
      ctx.logger?.warn?.(`preset-composer: ${error instanceof Error ? error.message : String(error)}`)
      return json(500, { error: { code: 'internal', message: 'unexpected error' } })
    }
  }

  const routes = {
    state: { methods: ['GET'], handler: () => snapshot() },

    // Parameter lists of official plugins, parsed once from the installation's config catalog.
    catalog: { methods: ['GET'], handler: () => ({ modules: withDefaults(loadCatalog(), loadDefaults()) }) },

    async save(request) {
      const body = await readBody(request)
      const problem = validatePreset(body?.preset)
      if (problem !== undefined) throw new HttpError(400, 'invalid', problem)
      const preset = normalizePreset(body.preset)
      const service = editor()
      const { shipped, store } = sources()
      const known = new Set((await ctx.agentPresets.list()).map(row => row.id))
      const bundle = shipped.get(preset.id)
      if (bundle !== undefined) {
        if (revisionOf(bundle.entry.options.config) !== body.baseRevision) throw new HttpError(409, 'stale', 'the preset changed since it was loaded')
        try { await service.edit(bundle.entry, () => preset) } catch (error) { throw editFailure(error) }
      } else {
        if (store === undefined) throw new HttpError(503, 'unavailable', 'the custom preset store is not loaded')
        const existing = readStore(store.entry.options.config).presets.find(row => row.id === preset.id)
        if (existing === undefined) {
          if (known.has(preset.id)) throw new HttpError(409, 'duplicate-id', `a preset named "${preset.id}" already exists`)
        } else if (revisionOf(existing) !== body.baseRevision) {
          throw new HttpError(409, 'stale', 'the preset changed since it was loaded')
        }
        try { await service.edit(store.entry, current => upsert(current, preset)) } catch (error) { throw editFailure(error) }
      }
      return snapshot()
    },

    async delete(request) {
      const body = await readBody(request)
      if (typeof body?.id !== 'string') throw new HttpError(400, 'invalid', 'id is required')
      const service = editor()
      if (body.id === ctx.agentPresets.defaultId) throw new HttpError(409, 'is-default', 'the default preset cannot be deleted')
      const { store } = sources()
      const existing = store === undefined ? undefined : readStore(store.entry.options.config).presets.find(row => row.id === body.id)
      if (existing === undefined) throw new HttpError(404, 'not-found', `no custom preset "${body.id}"`)
      if (revisionOf(existing) !== body.baseRevision) throw new HttpError(409, 'stale', 'the preset changed since it was loaded')
      try { await service.edit(store.entry, current => remove(current, body.id)) } catch (error) { throw editFailure(error) }
      return snapshot()
    },

    async reset(request) {
      const body = await readBody(request)
      if (typeof body?.id !== 'string') throw new HttpError(400, 'invalid', 'id is required')
      const service = editor()
      const bundle = sources().shipped.get(body.id)
      if (bundle === undefined) throw new HttpError(404, 'not-found', `no shipped preset "${body.id}"`)
      try { await service.edit(bundle.entry, (_current, inherited) => inherited) } catch (error) { throw editFailure(error) }
      return snapshot()
    },
  }

  for (const [route, spec] of Object.entries(routes)) {
    const methods = typeof spec === 'function' ? ['POST'] : spec.methods
    const handler = typeof spec === 'function' ? spec : spec.handler
    ctx.effect(() => ctx.connection.fetch.register({
      path: `${BASE}/${route}`,
      methods,
      requestBody: 'buffered',
      fetch: guard(handler),
    }), `preset-composer: ${route} route`)
  }
}
