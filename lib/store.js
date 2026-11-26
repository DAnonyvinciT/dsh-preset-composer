/**
 * Custom preset store: registers every preset saved from the composer.
 *
 * The raw config is kept unresolved (the group key below) so `!!js`
 * conditions inside preset rows are evaluated by each preset's own plugins,
 * never by this store. Each preset is registered with the registry and
 * withdrawn when the store reloads or unloads.
 */
import { readStore } from './model.js'

const GROUP_KEY = Symbol.for('cordis.group')
const INIT = Symbol.for('cordis.init')

export const name = 'dsh-preset-composer/store'

export default class PresetComposerStore {
  static inject = ['agentPresets']
  /** Preserve child expressions until the preset's own plugins activate. */
  static [GROUP_KEY] = true

  constructor(ctx, config) {
    this.ctx = ctx
    this.config = config
  }

  async* [INIT]() {
    const { presets, problems } = readStore(this.config)
    for (const problem of problems) {
      this.ctx.logger.warn(`preset-composer: skipped preset "${problem.id}": ${problem.message}`)
    }
    for (const preset of presets) {
      try {
        yield await this.ctx.agentPresets.register(preset)
      } catch (error) {
        this.ctx.logger.warn(`preset-composer: could not register "${preset.id}": ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }
}
