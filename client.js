/* dsh-preset-composer client: a "Preset composer" Settings section. Side-effect free factory. */
window.__ModuleLoader__.load({
  id: 'dsh-preset-composer',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useRef, useCallback, useMemo } = React

    const NS = 'presetComposer'
    const API = 'api/preset-composer/'
    const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/

    const en = {
      nav: 'Preset composer',
      title: 'Preset composer',
      intro: 'Compose which plugins each agent preset loads. Changes apply to new sessions; sessions already started keep their current composition.',
      presets: 'Presets', newPreset: 'New preset', duplicate: 'Duplicate', newPresetTip: 'New preset: starts with a persona, file tools and a shell tool', duplicateTip: 'Duplicate the selected preset as a new custom preset', loading: 'Loading…', retry: 'Retry', edit: 'Edit', editTip: 'Edit this preset: plugins, settings and the plugin library', editReadonly: 'This preset is read-only', back: 'Back', disabledRow: 'Disabled', noDesc: 'No description published', configValues: 'Settings', defaultSettings: 'Uses the plugin defaults', isolateLabel: 'Isolate', disabledWhen: 'Disabled when', openParams: 'Edit all parameters of this plugin', applyParams: 'Apply', close: 'Close', unset: 'Not set', usesDefault: 'Default not published', unsetWith: '{value} (default)', defaultTip: 'Applies when the parameter is not set', defaultIs: 'Default: {value}', requiredTag: 'required', clearValue: 'Clear', otherSettings: 'Other settings', otherSettingsNote: 'Keys this plugin does not list in its catalog entry. Kept as written.', rawNote: 'No parameter list is available for this plugin, so its config is edited as JSON.', rawNoteShape: 'This config is not a plain key-value map, so it is edited as JSON.', missingRequired: 'Not set yet: {names}. The Host validates the config when a session starts.', paramsLoading: 'Loading parameters…', depsTitle: 'Some plugins need a service that no plugin in this preset provides:', depsMissing: '{plugin} needs the "{service}" service.', depsAdd: 'Add {name}', depsNeeds: 'Needs: {services}', depsNeedsTip: 'This plugin waits for these services. Add a plugin that provides them, or it will not start.', 'palGroup.tools': 'Tools', 'palGroup.prompt': 'Prompt and context', 'palGroup.model': 'Models', 'palGroup.subagent': 'Subagents', 'palGroup.session': 'Sessions and storage', 'palGroup.safety': 'Permissions and sandbox', 'palGroup.shell': 'Shell and runtime', 'palGroup.runtime': 'Host services', 'palGroup.client': 'Interface', 'palGroup.other': 'Other', 'palGroup.experimental': 'Experimental', catalogFailed: 'Could not load the parameter list ({message}). If the Host was not restarted after this plugin was updated, restart it.',
      default: 'Default', broken: 'Broken', custom: 'Custom', shipped: 'Shipped', readonly: 'Read-only', overridden: 'Overridden',
      readonlyNote: 'This preset is not stored in an editable profile row. You can read its composition and duplicate it as a template only when its rows are available.',
      noEditor: 'This Host has no configuration editor, so presets cannot be edited here.',
      composition: 'Composition', empty: 'No plugins yet. Add one from the palette.',
      enabled: 'Enabled', disabledState: 'Disabled', conditional: 'Conditional (!!js)', expression: 'Expression',
      group: 'Group', addGroup: 'Add group', moveUp: 'Move up', moveDown: 'Move down', remove: 'Remove', dragHint: 'Drag to reorder',
      inspector: 'Inspector', selectRow: 'Select a row to edit it.',
      presetFields: 'Preset', id: 'Id', name: 'Name', description: 'Description', order: 'Order',
      rowId: 'Row id', module: 'Module', config: 'Config (JSON)', isolate: 'Isolate (JSON map of service names)', badJson: 'Not valid JSON',
      palette: 'Palette', searchPalette: 'Search modules…', add: 'Add', noMatch: 'No matching module.',
      save: 'Save', saving: 'Saving…', discard: 'Discard', reset: 'Reset to shipped', delete: 'Delete', confirmDelete: 'Confirm delete',
      cancel: 'Cancel', create: 'Create', copyFrom: 'Start from', blank: 'Blank preset',
      resetWarn: 'Reset removes your override. The preset then follows the shipped definition again.',
      dirtyGuard: 'Discard unsaved changes?', saved: 'Saved. New sessions will use this composition.',
      storeProblems: 'Some saved presets were skipped: ',
      'err.stale': 'The preset changed elsewhere. Reload it, then reapply your edit.',
      'err.invalid': 'Invalid preset: {message}', 'err.duplicate-id': 'A preset with this id already exists.',
      'err.is-default': 'The default preset cannot be deleted. Choose another default first.',
      'err.readonly': 'This preset is controlled by a layer that cannot be edited here: {message}',
      'err.unavailable': 'Unavailable: {message}', 'err.not-found': 'Not found: {message}', 'err.internal': 'Unexpected error.',
      'err.network': 'Could not reach the Host.', idRule: 'Use lowercase letters, digits and hyphens.',
    }
    const zh = {
      nav: '预设编排',
      title: '预设编排',
      intro: '编排每个 Agent 预设加载哪些插件。修改对新会话生效，已开始的会话保持原有组合。',
      presets: '预设', newPreset: '新建预设', duplicate: '复制', newPresetTip: '新建预设：默认带人设、文件工具和一个 shell 工具', duplicateTip: '把当前选中的预设复制为新的自定义预设', loading: '加载中…', retry: '重试', edit: '编辑', editTip: '编辑该预设：插件、预设信息和插件库', editReadonly: '该预设只读，无法编辑', back: '返回', disabledRow: '已禁用', noDesc: '该插件未提供介绍', configValues: '配置值', defaultSettings: '使用插件默认值', isolateLabel: '隔离服务', disabledWhen: '禁用条件', openParams: '编辑该插件的全部参数', applyParams: '应用', close: '关闭', unset: '未设置', usesDefault: '未提供默认值', unsetWith: '{value}（默认值）', defaultTip: '参数未设置时采用该值', defaultIs: '默认值：{value}', requiredTag: '必填', clearValue: '清除', otherSettings: '其他配置', otherSettingsNote: '插件目录里没有列出的键，按原样保留。', rawNote: '该插件没有可用的参数列表，配置按 JSON 编辑。', rawNoteShape: '该配置不是普通的键值映射，按 JSON 编辑。', missingRequired: '尚未设置：{names}。会话启动时 Host 会校验配置。', paramsLoading: '参数加载中…', depsTitle: '有插件依赖的服务，当前预设里没有插件提供：', depsMissing: '{plugin} 需要「{service}」服务。', depsAdd: '添加 {name}', depsNeeds: '依赖：{services}', depsNeedsTip: '该插件会等待这些服务。请同时添加提供该服务的插件，否则它不会启动。', 'palGroup.tools': '工具', 'palGroup.prompt': '提示词与上下文', 'palGroup.model': '模型', 'palGroup.subagent': '子智能体', 'palGroup.session': '会话与存储', 'palGroup.safety': '权限与沙箱', 'palGroup.shell': '终端与运行时', 'palGroup.runtime': '宿主服务', 'palGroup.client': '界面', 'palGroup.other': '其他', 'palGroup.experimental': '实验性', catalogFailed: '无法加载参数列表（{message}）。如果更新插件后没有重启 Host，请重启。',
      default: '默认', broken: '异常', custom: '自定义', shipped: '内置', readonly: '只读', overridden: '已覆盖',
      readonlyNote: '该预设未保存在可编辑的配置行中，只能查看。',
      noEditor: '当前 Host 没有配置编辑器，无法在此编辑预设。',
      composition: '组合', empty: '暂无插件，请从右侧插件库添加。',
      enabled: '启用', disabledState: '禁用', conditional: '条件 (!!js)', expression: '表达式',
      group: '分组', addGroup: '添加分组', moveUp: '上移', moveDown: '下移', remove: '移除', dragHint: '拖动排序',
      inspector: '属性', selectRow: '选择一行进行编辑。',
      presetFields: '预设', id: '标识', name: '名称', description: '描述', order: '排序',
      rowId: '行标识', module: '模块', config: '配置 (JSON)', isolate: '隔离（服务名 JSON 映射）', badJson: 'JSON 无效',
      palette: '插件库', searchPalette: '搜索模块…', add: '添加', noMatch: '没有匹配的模块。',
      save: '保存', saving: '保存中…', discard: '放弃修改', reset: '恢复内置', delete: '删除', confirmDelete: '确认删除',
      cancel: '取消', create: '创建', copyFrom: '基于', blank: '空白预设',
      resetWarn: '恢复会移除你的覆盖，预设将重新跟随内置定义。',
      dirtyGuard: '放弃未保存的修改？', saved: '已保存，新会话将使用此组合。',
      storeProblems: '部分已保存的预设被跳过：',
      'err.stale': '该预设已在别处变更，请重新加载后再修改。',
      'err.invalid': '预设无效：{message}', 'err.duplicate-id': '已存在相同标识的预设。',
      'err.is-default': '默认预设不能删除，请先选择其他默认预设。',
      'err.readonly': '该预设由无法在此编辑的配置层控制：{message}',
      'err.unavailable': '不可用：{message}', 'err.not-found': '未找到：{message}', 'err.internal': '发生意外错误。',
      'err.network': '无法连接 Host。', idRule: '请使用小写字母、数字和连字符。',
    }

    // ---- row-tree helpers (immutable; a path is a list of indexes through group children) ----
    const clone = (value) => JSON.parse(JSON.stringify(value))
    const childrenOf = (row) => (row && row.group === true && Array.isArray(row.config) ? row.config : null)

    function rowAt(rows, path) {
      let list = rows
      let row
      for (const index of path) {
        row = list?.[index]
        if (!row) return undefined
        list = childrenOf(row)
      }
      return row
    }
    function listAt(rows, parentPath) {
      return parentPath.length === 0 ? rows : childrenOf(rowAt(rows, parentPath))
    }
    /** Replace the list found at parentPath with fn(list). */
    function editList(rows, parentPath, fn) {
      if (parentPath.length === 0) return fn(rows)
      const [head, ...rest] = parentPath
      return rows.map((row, i) => (i === head
        ? { ...row, config: editList(row.config, rest, fn) }
        : row))
    }
    const updateRow = (rows, path, patch) => editList(rows, path.slice(0, -1), list =>
      list.map((row, i) => (i === path[path.length - 1] ? (typeof patch === 'function' ? patch(row) : { ...row, ...patch }) : row)))
    const removeRow = (rows, path) => editList(rows, path.slice(0, -1), list => list.filter((_, i) => i !== path[path.length - 1]))
    const addRow = (rows, parentPath, row) => editList(rows, parentPath, list => [...list, row])
    function moveRow(rows, path, delta) {
      return editList(rows, path.slice(0, -1), (list) => {
        const from = path[path.length - 1]
        const to = from + delta
        if (to < 0 || to >= list.length) return list
        const next = list.slice()
        const [item] = next.splice(from, 1)
        next.splice(to, 0, item)
        return next
      })
    }
    function reorderRow(rows, parentPath, from, to) {
      return editList(rows, parentPath, (list) => {
        if (from === to) return list
        const next = list.slice()
        const [item] = next.splice(from, 1)
        next.splice(to, 0, item)
        return next
      })
    }
    const samePath = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i])
    /**
     * Rows that inject a service no row in their scope provides. `deps.requires[module]` lists the
     * services a module needs a provider row for; `deps.providers[service]` lists those providers.
     * A provider counts when it is enabled and sits in the same list, an outer list, or a group that
     * does not isolate that service. Rows with a `!!js` condition count as enabled.
     */
    function missingDeps(plugins, deps) {
      const out = []
      if (!deps || !deps.requires) return out
      const provides = (list, service, owners) => (list || []).some(row => {
        if (row.disabled === true) return false
        if (owners.includes(row.name)) return true
        return row.group === true && !(row.isolate && row.isolate[service]) && provides(childrenOf(row), service, owners)
      })
      const walk = (list, scopes, base) => (list || []).forEach((row, index) => {
        const path = [...base, index]
        if (row.disabled === true) return
        const kids = childrenOf(row)
        if (kids) { walk(kids, [{ list: kids, isolate: row.isolate }, ...scopes], path); return }
        for (const service of deps.requires[row.name] || []) {
          const owners = deps.providers[service] || []
          let found = false
          // Look outward from the row's own list; an isolating group cuts off everything outside it.
          for (const scope of scopes) {
            if (provides(scope.list, service, owners)) { found = true; break }
            if (scope.isolate && scope.isolate[service]) break
          }
          if (!found) out.push({ path, name: row.name, service, providers: owners })
        }
      })
      walk(plugins, [{ list: plugins }], [])
      return out
    }

    function uniqueId(list, base) {
      const taken = new Set(list.map(row => row.id).filter(Boolean))
      const root = String(base).replace(/^@[^/]+\//, '').replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'row'
      if (!taken.has(root)) return root
      for (let n = 2; ; n++) if (!taken.has(`${root}-${n}`)) return `${root}-${n}`
    }
    function listProblem(rows, at = '') {
      if (!Array.isArray(rows)) return 'invalid list'
      const seen = new Set()
      for (const [index, row] of rows.entries()) {
        const label = `${at}row ${index + 1}`
        if (typeof row !== 'object' || row === null || typeof row.name !== 'string' || row.name === '') return `${label} has no module name`
        if (row.id !== undefined) {
          if (seen.has(row.id)) return `${label} repeats id "${row.id}"`
          seen.add(row.id)
        }
        if (row.group === true) {
          const nested = listProblem(row.config, `${label} › `)
          if (nested) return nested
        }
      }
      return undefined
    }
    function presetProblem(draft) {
      if (!ID_PATTERN.test(draft.id || '')) return 'id'
      return listProblem(draft.plugins)
    }
    /** LocalizedText is a string or {en, <lang>: text}; try the exact id, a prefix match (zh-cn), then English. */
    const pickText = (text, lang) => {
      if (!text) return undefined
      if (typeof text === 'string') return text
      if (text[lang]) return text[lang]
      const key = Object.keys(text).find(k => k.toLowerCase().startsWith(lang))
      return (key && text[key]) || text.en
    }
    const metaTitle = (meta, lang) => pickText(meta?.title, lang)
    const metaDesc = (meta, lang) => pickText(meta?.description, lang)
    const disabledMode = (row) => (row.disabled && typeof row.disabled === 'object' ? 'js' : row.disabled === true ? 'off' : 'on')

    const CSS = `
.dpc{position:relative;display:flex;flex-direction:column;gap:12px;color:var(--dsw-alias-label-primary);font-size:13px;min-width:0;container-type:inline-size}
.dpc *{box-sizing:border-box}
.dpc-intro{color:var(--dsw-alias-label-tertiary);margin:0}
.dpc-cols{display:grid;grid-template-columns:128px minmax(0,1fr);gap:12px;align-items:start}
.dpc-detail{display:flex;flex-direction:column;gap:12px;min-width:0}
.dpc-edit{display:grid;grid-template-columns:1fr;gap:12px;align-items:start}
@container (min-width:760px){.dpc-edit{grid-template-columns:minmax(0,1fr) 280px}}
.dpc-tools{display:flex;flex-direction:column;gap:12px;min-width:0}
.dpc-view{border:1px solid var(--dsw-alias-border-l3);border-radius:8px;padding:6px 8px;background:var(--dsw-alias-bg-layer-2);display:flex;flex-direction:column;gap:3px}
.dpc-view.off{opacity:.6}
.dpc-viewhead{display:flex;gap:6px;align-items:center;min-width:0}
.dpc-kv{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:2px 10px;margin:0;font-size:12px}
.dpc-kv dt{color:var(--dsw-alias-label-tertiary);font-family:ui-monospace,Menlo,Consolas,monospace}
.dpc-kv dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font-family:ui-monospace,Menlo,Consolas,monospace;max-height:140px;overflow:auto}
.dpc-det summary{cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:12px}
.dpc-overlay{position:absolute;inset:0;z-index:20;background:rgba(0,0,0,.45);display:flex;justify-content:center;align-items:flex-start;padding:12px;border-radius:10px}
.dpc-dialog{position:sticky;top:12px;width:min(560px,100%);max-height:min(78vh,640px);display:flex;flex-direction:column;gap:8px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:12px;outline:none;box-shadow:0 8px 28px rgba(0,0,0,.35)}
.dpc-dialoghead{display:flex;gap:8px;align-items:flex-start}
.dpc-dialogbody{overflow:auto;display:flex;flex-direction:column;gap:10px;min-height:0;padding-right:2px}
.dpc-param{display:flex;flex-direction:column;gap:4px;border-bottom:1px solid var(--dsw-alias-border-l3);padding-bottom:8px}
.dpc-paramhead{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.dpc-pname{font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:600}
.dpc-short{min-height:52px}
.dpc-dialogfoot{padding-top:2px}
.dpc-pagehead{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
@container (max-width:420px){.dpc-cols{grid-template-columns:1fr}}
.dpc-iconbtn{width:26px;height:26px;padding:0;display:inline-flex;align-items:center;justify-content:center;font-size:15px;line-height:1}
.dpc-listhead{display:flex;align-items:center;gap:4px}
.dpc-item .dpc-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dpc-panel{border:1px solid var(--dsw-alias-border-l3);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:10px;display:flex;flex-direction:column;gap:8px;min-width:0}
.dpc-h{font-weight:600;color:var(--dsw-alias-label-secondary);margin:0}
.dpc-btn{border:1px solid var(--dsw-alias-border-l3);background:transparent;color:var(--dsw-alias-label-primary);border-radius:8px;padding:4px 10px;cursor:pointer;font:inherit}
.dpc-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dpc-btn:disabled{opacity:.45;cursor:default}
.dpc-btn.primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border-color:transparent}
.dpc-btn.primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
.dpc-btn.danger{color:var(--dsw-alias-state-error-primary)}
.dpc-btn:focus-visible,.dpc-item:focus-visible,.dpc-row:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dpc-item{display:flex;flex-direction:column;gap:2px;text-align:left;border:1px solid transparent;border-radius:8px;background:transparent;color:inherit;padding:6px 8px;cursor:pointer;font:inherit}
.dpc-item:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dpc-item.sel{border-color:var(--dsw-alias-border-selected);background:var(--dsw-alias-interactive-bg-hover)}
.dpc-sub{color:var(--dsw-alias-label-tertiary);font-size:12px}
.dpc-desc{color:var(--dsw-alias-label-secondary);font-size:12px;margin:0;line-height:1.4;overflow-wrap:anywhere}
.dpc-tags{display:flex;gap:4px;flex-wrap:wrap}
.dpc-tag{font-size:11px;padding:0 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l3);color:var(--dsw-alias-label-secondary)}
.dpc-tag.bad{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}
.dpc-tag.ok{color:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary)}
.dpc-bar{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.dpc-grow{flex:1}
.dpc-row{display:flex;flex-direction:column;gap:6px;border:1px solid var(--dsw-alias-border-l3);border-radius:8px;padding:6px 8px;background:var(--dsw-alias-bg-layer-2)}
.dpc-row.sel{border-color:var(--dsw-alias-border-selected)}
.dpc-row.drop{box-shadow:0 -2px 0 var(--dsw-alias-brand-primary)}
.dpc-row.off .dpc-mod{opacity:.55}
.dpc-rowhead{display:flex;gap:6px;align-items:center}
.dpc-grip{cursor:grab;color:var(--dsw-alias-label-tertiary);user-select:none}
.dpc-mod{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
.dpc-kids{display:flex;flex-direction:column;gap:6px;margin-left:16px;padding-left:8px;border-left:2px solid var(--dsw-alias-border-l3)}
.dpc-field{display:flex;flex-direction:column;gap:3px}
.dpc-field label{color:var(--dsw-alias-label-tertiary);font-size:12px}
.dpc-in,.dpc-ta,.dpc-sel{width:100%;border:1px solid var(--dsw-alias-border-l3);border-radius:6px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);padding:4px 6px;font:inherit}
.dpc-ta{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;min-height:110px;resize:vertical}
.dpc-in.bad,.dpc-ta.bad{border-color:var(--dsw-alias-state-error-primary)}
.dpc-err{color:var(--dsw-alias-state-error-primary);font-size:12px}
.dpc-note{color:var(--dsw-alias-state-success-primary);font-size:12px}
.dpc-deps{display:flex;flex-direction:column;gap:4px;padding:6px 8px;border:1px solid var(--dsw-alias-state-warn-label);border-radius:8px}
.dpc-warn{color:var(--dsw-alias-state-warn-label);font-size:12px;white-space:pre-wrap}
.dpc-pal{max-height:360px;overflow:auto;display:flex;flex-direction:column;gap:2px}
.dpc-palgroup{border-bottom:1px solid var(--dsw-alias-border-l3);padding:2px 0}
.dpc-palgroup>summary{display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:600;color:var(--dsw-alias-label-secondary);padding:4px 2px}
.dpc-pal-item{display:flex;gap:6px;align-items:center;padding:3px 4px;border-radius:6px}
.dpc-pal-item:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dpc-yaml{white-space:pre-wrap;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;margin:0;max-height:420px;overflow:auto}
`
    const apiUrl = (path) => new URL(API + path, document.baseURI).toString()

    /** Call a Host route; resolves {ok, data} or {ok:false, code, message}. */
    async function call(path, body, signal) {
      try {
        const response = await fetch(apiUrl(path), {
          method: body === undefined ? 'GET' : 'POST',
          credentials: 'same-origin',
          signal,
          headers: body === undefined ? undefined : { 'content-type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        })
        let data
        try { data = await response.json() } catch { data = undefined }
        if (!response.ok) {
          const error = data && data.error
          return { ok: false, code: (error && error.code) || (response.status === 401 || response.status === 403 ? 'unavailable' : 'internal'), message: (error && error.message) || String(response.status) }
        }
        return { ok: true, data }
      } catch (error) {
        if (error && error.name === 'AbortError') return { ok: false, code: 'aborted', message: '' }
        return { ok: false, code: 'network', message: String(error && error.message || error) }
      }
    }
    const errorText = (t, failure) => {
      const key = `err.${failure.code}`
      const text = t(key, { message: failure.message })
      return text === key ? failure.message || key : text
    }
    function Field({ label, children, error }) {
      return h('div', { className: 'dpc-field' }, h('label', null, label), children, error ? h('span', { className: 'dpc-err' }, error) : null)
    }

    /** Text area that holds raw text locally and reports parsed JSON only when valid. */
    function JsonBox({ value, onValid, onBad, t, empty }) {
      const text0 = value === undefined ? '' : JSON.stringify(value, null, 2)
      const [text, setText] = useState(text0)
      const [bad, setBad] = useState(false)
      const last = useRef(text0)
      useEffect(() => { if (onBad) onBad(bad) }, [bad])
      useEffect(() => {
        if (text0 !== last.current) { last.current = text0; setText(text0); setBad(false) }
      }, [text0])
      return h(React.Fragment, null,
        h('textarea', {
          className: 'dpc-ta' + (bad ? ' bad' : ''), spellCheck: false, value: text,
          'aria-invalid': bad,
          onChange: (event) => {
            const next = event.target.value
            setText(next)
            if (next.trim() === '') { setBad(false); last.current = ''; onValid(empty); return }
            try { const parsed = JSON.parse(next); setBad(false); last.current = JSON.stringify(parsed, null, 2); onValid(parsed) } catch { setBad(true) }
          },
        }),
        bad ? h('span', { className: 'dpc-err' }, t('badJson')) : null)
    }

    function RowCard({ row, path, selected, onSelect, onMove, onRemove, onToggle, onReorder, t, lang, titles, descs, dragRef, children }) {
      const [over, setOver] = useState(false)
      const mode = disabledMode(row)
      const index = path[path.length - 1]
      const title = titles.get(row.name)
      const desc = row.group ? undefined : descs.get(row.name)
      return h('div', {
        className: 'dpc-row' + (samePath(selected, path) ? ' sel' : '') + (mode !== 'on' ? ' off' : '') + (over ? ' drop' : ''),
        draggable: true,
        onDragStart: (event) => { event.stopPropagation(); dragRef.current = path; event.dataTransfer.effectAllowed = 'move' },
        onDragOver: (event) => {
          const from = dragRef.current
          if (from && from.length === path.length && samePath(from.slice(0, -1), path.slice(0, -1))) { event.preventDefault(); event.stopPropagation(); setOver(true) }
        },
        onDragLeave: () => setOver(false),
        onDrop: (event) => {
          setOver(false)
          const from = dragRef.current
          dragRef.current = null
          if (from && from.length === path.length && samePath(from.slice(0, -1), path.slice(0, -1))) {
            event.preventDefault(); event.stopPropagation(); onReorder(path.slice(0, -1), from[from.length - 1], index)
          }
        },
      },
      h('div', { className: 'dpc-rowhead' },
        h('span', { className: 'dpc-grip', title: t('dragHint'), 'aria-hidden': true }, '⠿'),
        h('input', { type: 'checkbox', checked: mode === 'on', disabled: mode === 'js', 'aria-label': t('enabled'), onChange: (event) => onToggle(path, event.target.checked) }),
        h('span', { className: 'dpc-mod', role: 'button', tabIndex: 0, title: row.name, onClick: () => onSelect(path), onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(path) } } },
          row.group ? `▸ ${t('group')}${row.id ? ` · ${row.id}` : ''}` : (title || row.name), !row.group && title ? h('span', { className: 'dpc-sub' }, ` ${row.name}`) : null),
        mode === 'js' ? h('span', { className: 'dpc-tag' }, t('conditional')) : null,
        row.group ? null : h('button', { className: 'dpc-btn', type: 'button', title: t('openParams'), 'aria-label': t('openParams'), onClick: () => onSelect(path) }, '⚙'),
        h('button', { className: 'dpc-btn', type: 'button', title: t('moveUp'), 'aria-label': t('moveUp'), onClick: () => onMove(path, -1) }, '↑'),
        h('button', { className: 'dpc-btn', type: 'button', title: t('moveDown'), 'aria-label': t('moveDown'), onClick: () => onMove(path, 1) }, '↓'),
        h('button', { className: 'dpc-btn danger', type: 'button', title: t('remove'), 'aria-label': t('remove'), onClick: () => onRemove(path) }, '✕')),
      desc ? h('p', { className: 'dpc-desc' }, desc) : null,
      children)
    }

    function Tree({ rows, parent, ...rest }) {
      return rows.map((row, i) => {
        const path = [...parent, i]
        const kids = childrenOf(row)
        return h(RowCard, { key: `${row.id || row.name}:${i}`, row, path, ...rest },
          kids ? h('div', { className: 'dpc-kids' }, kids.length === 0 ? h('span', { className: 'dpc-sub' }, rest.t('empty')) : h(Tree, { rows: kids, parent: path, ...rest })) : null)
      })
    }

    /** Render one config value as plain text. A !!js value arrives as {__jsExpr}. */
    const showValue = (value) => {
      if (value && typeof value === 'object' && typeof value.__jsExpr === 'string') return `!!js ${value.__jsExpr}`
      if (typeof value === 'string') return value
      // Nested !!js values (inside arrays or maps) read as `!!js <expression>` too.
      return JSON.stringify(value, (_key, item) => (item && typeof item === 'object' && typeof item.__jsExpr === 'string' ? `!!js ${item.__jsExpr}` : item), 2)
    }

    function KeyValues({ value }) {
      const isMap = value && typeof value === 'object' && !Array.isArray(value) && typeof value.__jsExpr !== 'string'
      if (!isMap) return h('pre', { className: 'dpc-yaml' }, showValue(value))
      return h('dl', { className: 'dpc-kv' }, Object.entries(value).map(([key, item]) => h(React.Fragment, { key }, h('dt', null, key), h('dd', null, showValue(item)))))
    }

    /** Read-only list of rows: plugin name, description and configured values; nothing editable. */
    function ViewRows({ rows, titles, descs, t }) {
      return rows.map((row, i) => {
        const kids = childrenOf(row)
        const mode = disabledMode(row)
        const title = row.group ? `▸ ${t('group')}${row.id ? ` · ${row.id}` : ''}` : (titles.get(row.name) || row.name)
        const desc = row.group ? undefined : descs.get(row.name)
        return h('div', { key: `${row.id || row.name}:${i}`, className: 'dpc-view' + (mode === 'off' ? ' off' : '') },
          h('div', { className: 'dpc-viewhead' },
            h('span', { className: 'dpc-mod', title: row.name }, title, !row.group && titles.get(row.name) ? h('span', { className: 'dpc-sub' }, ` ${row.name}`) : null),
            mode === 'off' ? h('span', { className: 'dpc-tag' }, t('disabledRow')) : null,
            mode === 'js' ? h('span', { className: 'dpc-tag' }, t('conditional')) : null),
          row.group ? null : h('p', { className: 'dpc-desc' }, desc || t('noDesc')),
          mode === 'js' ? h('p', { className: 'dpc-desc' }, `${t('disabledWhen')}: ${showValue(row.disabled)}`) : null,
          row.group
            ? (row.isolate ? h('details', { className: 'dpc-det', open: true }, h('summary', null, t('isolateLabel')), h(KeyValues, { value: row.isolate })) : null)
            : (row.config === undefined
              ? h('span', { className: 'dpc-sub' }, t('defaultSettings'))
              : h('details', { className: 'dpc-det', open: true }, h('summary', null, t('configValues')), h(KeyValues, { value: row.config }))),
          kids ? h('div', { className: 'dpc-kids' }, kids.length === 0 ? h('span', { className: 'dpc-sub' }, t('empty')) : h(ViewRows, { rows: kids, titles, descs, t })) : null)
      })
    }

    function Inspector({ draft, setDraft, selected, t, isNew, readOnly, descs }) {
      const row = selected ? rowAt(draft.plugins, selected) : undefined
      const setRow = (patch) => setDraft({ ...draft, plugins: updateRow(draft.plugins, selected, patch) })
      const dis = readOnly
      return h('div', { className: 'dpc-panel' },
        h('p', { className: 'dpc-h' }, t('presetFields')),
        h(Field, { label: t('id'), error: ID_PATTERN.test(draft.id || '') ? undefined : t('idRule') },
          h('input', { className: 'dpc-in', value: draft.id || '', disabled: dis || !isNew, onChange: (e) => setDraft({ ...draft, id: e.target.value }) })),
        h(Field, { label: t('name') }, h('input', { className: 'dpc-in', value: draft.name || '', disabled: dis, onChange: (e) => setDraft({ ...draft, name: e.target.value }) })),
        h(Field, { label: t('description') }, h('input', { className: 'dpc-in', value: draft.description || '', disabled: dis, onChange: (e) => setDraft({ ...draft, description: e.target.value }) })),
        h(Field, { label: t('order') }, h('input', { className: 'dpc-in', type: 'number', value: draft.order ?? '', disabled: dis,
          onChange: (e) => { const v = e.target.value; const next = { ...draft }; if (v === '') delete next.order; else next.order = Number(v); setDraft(next) } })),
        h('p', { className: 'dpc-h' }, t('inspector')),
        !row ? h('span', { className: 'dpc-sub' }, t('selectRow')) : h(React.Fragment, null,
          !row.group && descs.get(row.name) ? h('p', { className: 'dpc-desc' }, descs.get(row.name)) : null,
          h(Field, { label: t('rowId') }, h('input', { className: 'dpc-in', value: row.id || '', disabled: dis,
            onChange: (e) => { const v = e.target.value.trim(); const next = { ...row }; if (v === '') delete next.id; else next.id = v; setRow(next) } })),
          h(Field, { label: t('module') }, h('input', { className: 'dpc-in', value: row.name || '', disabled: dis || row.group === true,
            onChange: (e) => setRow({ name: e.target.value }) })),
          disabledMode(row) === 'js' ? h(Field, { label: t('expression') },
            h('input', { className: 'dpc-in', value: row.disabled.__jsExpr, disabled: dis, onChange: (e) => setRow({ disabled: { __jsExpr: e.target.value } }) }),
            h('button', { className: 'dpc-btn', type: 'button', disabled: dis, onClick: () => { const next = { ...row }; delete next.disabled; setRow(next) } }, t('enabled'))) : null,
          row.group ? h(Field, { label: t('isolate') }, h(JsonBox, { key: selected.join('.'), value: row.isolate, t, empty: undefined,
            onValid: (v) => { const next = { ...row }; if (v && typeof v === 'object' && !Array.isArray(v)) next.isolate = v; else delete next.isolate; setRow(next) } }))
            : h(Field, { label: t('config') }, h(JsonBox, { key: selected.join('.'), value: row.config, t, empty: undefined,
              onValid: (v) => { const next = { ...row }; if (v === undefined) delete next.config; else next.config = v; setRow(next) } }))))
    }

    /** Palette groups, in display order. First matching rule wins; `other` catches the rest. */
    const PALETTE_GROUPS = [
      ['experimental', /^experimental-/],
      ['client', /^client-/],
      ['subagent', /^(subagent|agent-team|tool-subagent)/],
      ['tools', /^(tool-|web-fetch|web-search|mcp-|lsp-|office-kit|skill-office|ssh$)/],
      ['prompt', /^(persona$|system-prompt|agent-instructions|time-context|tmux-context|working-directory|repeat-tool-reminder|workspace-changes|skill$|skill-filesystem|file-reference|goal$)/],
      ['model', /^(llm-|agent-default-model|deepseek-account|deepseek-chat-import|web-deepseek-api)/],
      ['session', /^(session-|spill-|message-feedback|attachment-|storage-)/],
      ['safety', /^(sandbox-|permission-|user-approval|credentials-|hooks-)/],
      ['shell', /^(bash-local|pwsh-local|terminal-|shell-env|fs-local|ptc-|workflow-ptc)/],
      ['runtime', /^(agent-|api-|host-|cordis-|plugin-|typert-|web-app|headless|sdk-app|schedule|jobs-local|webhook-)/],
    ]
    const PALETTE_ORDER = [...PALETTE_GROUPS.map(g => g[0]).filter(id => id !== 'experimental'), 'other', 'experimental']
    const paletteGroupOf = (moduleName) => {
      const m = /^@deepseek-ai\/(?:dsh-|cordis-plugin-)(.+)$/.exec(moduleName)
      if (!m) return 'other'
      const short = moduleName.includes('/cordis-plugin-') ? `cordis-${m[1]}` : m[1]
      const hit = PALETTE_GROUPS.find(([, pattern]) => pattern.test(short))
      return hit ? hit[0] : 'other'
    }

    function Palette({ palette, titles, descs, onAdd, onAddGroup, t, disabled, deps }) {
      const [q, setQ] = useState('')
      const [openGroups, setOpenGroups] = useState(() => new Set())
      const needle = q.trim().toLowerCase()
      const items = palette.filter(p => !needle || p.name.toLowerCase().includes(needle) || (titles.get(p.name) || '').toLowerCase().includes(needle) || (descs.get(p.name) || '').toLowerCase().includes(needle))
      const grouped = useMemo(() => {
        const map = new Map()
        for (const p of items) { const id = paletteGroupOf(p.name); if (!map.has(id)) map.set(id, []); map.get(id).push(p) }
        return PALETTE_ORDER.filter(id => map.has(id)).map(id => [id, map.get(id)])
      }, [items])
      const toggle = (id, open) => setOpenGroups(prev => { const next = new Set(prev); if (open) next.add(id); else next.delete(id); return next })
      const item = (p) => h('div', { key: p.name, className: 'dpc-pal-item' },
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { className: 'dpc-mod', title: p.name }, titles.get(p.name) || p.name),
          descs.get(p.name) ? h('p', { className: 'dpc-desc' }, descs.get(p.name)) : null,
          deps && deps.requires && deps.requires[p.name] ? h('span', { className: 'dpc-tag', title: t('depsNeedsTip') }, t('depsNeeds', { services: deps.requires[p.name].join(', ') })) : null),
        h('button', { className: 'dpc-btn', type: 'button', disabled, onClick: () => onAdd(p) }, t('add')))
      return h('div', { className: 'dpc-panel' },
        h('p', { className: 'dpc-h' }, t('palette')),
        h('input', { className: 'dpc-in', placeholder: t('searchPalette'), 'aria-label': t('searchPalette'), value: q, onChange: (e) => setQ(e.target.value) }),
        h('button', { className: 'dpc-btn', type: 'button', disabled, onClick: onAddGroup }, `+ ${t('addGroup')}`),
        h('div', { className: 'dpc-pal' }, items.length === 0 ? h('span', { className: 'dpc-sub' }, t('noMatch')) : grouped.map(([id, list]) =>
          h('details', { key: id, className: 'dpc-palgroup', open: needle !== '' || openGroups.has(id), onToggle: (e) => { if (needle === '') toggle(id, e.currentTarget.open) } },
            h('summary', null, h('span', { className: 'dpc-grow' }, t(`palGroup.${id}`)), h('span', { className: 'dpc-tag' }, String(list.length))),
            list.map(item)))))
    }
    const isMapValue = (v) => !!v && typeof v === 'object' && !Array.isArray(v) && typeof v.__jsExpr !== 'string'
    const isExpr = (v) => !!v && typeof v === 'object' && typeof v.__jsExpr === 'string'
    const fitsKind = (kind, v) => v === undefined || (kind === 'boolean' ? typeof v === 'boolean' : kind === 'number' ? typeof v === 'number' : kind === 'string' || kind === 'enum' ? typeof v === 'string' : true)

    /** Default of a parameter as text: the schema value when known, else the catalog's @default tag; undefined when unknown. */
    const defaultText = (field) => {
      if ('defaultValue' in field) {
        const v = field.defaultValue
        return typeof v === 'string' ? (v === '' ? '""' : v) : JSON.stringify(v)
      }
      return field.default
    }

    /** One typed parameter editor. `undefined` means "not set": the plugin default applies. */
    function ParamInput({ field, value, onChange, disabled, t }) {
      const label = field.name
      const dflt = defaultText(field)
      const unsetLabel = dflt === undefined ? t('unset') : t('unsetWith', { value: dflt })
      if (isExpr(value)) {
        return h('div', { className: 'dpc-bar' },
          h('span', { className: 'dpc-tag' }, '!!js'),
          h('input', { className: 'dpc-in dpc-grow', 'aria-label': label, value: value.__jsExpr, disabled, onChange: (e) => onChange({ __jsExpr: e.target.value }) }),
          h('button', { className: 'dpc-btn', type: 'button', disabled, onClick: () => onChange(undefined) }, t('clearValue')))
      }
      const kind = fitsKind(field.kind, value) ? field.kind : 'json'
      if (kind === 'boolean') {
        return h('select', { className: 'dpc-sel', 'aria-label': label, disabled, value: value === undefined ? '' : String(value),
          onChange: (e) => onChange(e.target.value === '' ? undefined : e.target.value === 'true') },
        h('option', { value: '' }, unsetLabel), h('option', { value: 'true' }, 'true'), h('option', { value: 'false' }, 'false'))
      }
      if (kind === 'enum') {
        return h('select', { className: 'dpc-sel', 'aria-label': label, disabled, value: value === undefined ? '' : value, onChange: (e) => onChange(e.target.value === '' ? undefined : e.target.value) },
          h('option', { value: '' }, unsetLabel), (field.options || []).map(o => h('option', { key: o, value: o }, o)))
      }
      if (kind === 'number') {
        return h('input', { className: 'dpc-in', type: 'number', step: 'any', 'aria-label': label, disabled, placeholder: unsetLabel, value: value === undefined ? '' : value,
          onChange: (e) => { const v = e.target.value; onChange(v === '' || Number.isNaN(Number(v)) ? undefined : Number(v)) } })
      }
      if (kind === 'string') {
        return h('textarea', { className: 'dpc-ta dpc-short', spellCheck: false, 'aria-label': label, disabled, placeholder: unsetLabel, value: value === undefined ? '' : value,
          onChange: (e) => onChange(e.target.value === '' ? undefined : e.target.value) })
      }
      return h(JsonBox, { key: label, value, t, empty: undefined, onValid: onChange })
    }

    /** Modal that lists every parameter of one plugin row and writes the result back as its config. */
    function ParamDialog({ row, fields, loadError, readOnly, title, desc, onApply, onClose, t }) {
      const structured = !!fields && fields.length > 0 && (row.config === undefined || isMapValue(row.config))
      const [values, setValues] = useState(() => (structured ? clone(row.config || {}) : {}))
      const [raw, setRaw] = useState(row.config)
      const [bad, setBad] = useState(false)
      const box = useRef(null)
      useEffect(() => { if (box.current) box.current.focus() }, [])
      const known = new Set((fields || []).map(f => f.name))
      const extras = {}
      for (const [k, v] of Object.entries(values)) if (!known.has(k)) extras[k] = v
      const hasExtras = Object.keys(extras).length > 0
      const setField = (name, v) => setValues(prev => { const next = { ...prev }; if (v === undefined) delete next[name]; else next[name] = v; return next })
      const setExtras = (parsed) => setValues(prev => {
        const next = {}
        for (const k of known) if (k in prev) next[k] = prev[k]
        if (isMapValue(parsed)) for (const [k, v] of Object.entries(parsed)) if (!known.has(k)) next[k] = v
        return next
      })
      const missing = structured ? fields.filter(f => !f.optional && values[f.name] === undefined).map(f => f.name) : []
      const apply = () => {
        const config = structured ? (Object.keys(values).length === 0 ? undefined : values) : raw
        onApply(config)
      }
      return h('div', { className: 'dpc-overlay', onMouseDown: (e) => { if (e.target === e.currentTarget) onClose() } },
        h('div', { className: 'dpc-dialog', role: 'dialog', 'aria-modal': true, 'aria-label': title, tabIndex: -1, ref: box,
          onKeyDown: (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } } },
        h('div', { className: 'dpc-dialoghead' },
          h('div', { className: 'dpc-grow', style: { minWidth: 0 } },
            h('p', { className: 'dpc-h' }, title),
            h('span', { className: 'dpc-sub' }, row.name),
            desc ? h('p', { className: 'dpc-desc' }, desc) : null),
          h('button', { className: 'dpc-btn', type: 'button', title: t('close'), 'aria-label': t('close'), onClick: onClose }, '✕')),
        h('div', { className: 'dpc-dialogbody' },
          structured ? h(React.Fragment, null,
            fields.map(f => h('div', { key: f.name, className: 'dpc-param' },
              h('div', { className: 'dpc-paramhead' },
                h('span', { className: 'dpc-pname' }, f.name),
                h('span', { className: 'dpc-sub' }, f.type),
                f.optional ? null : h('span', { className: 'dpc-tag' }, t('requiredTag')),
                defaultText(f) === undefined && values[f.name] === undefined ? h('span', { className: 'dpc-sub' }, t('usesDefault')) : null),
              f.doc ? h('p', { className: 'dpc-desc' }, f.doc) : null,
              h(ParamInput, { field: f, value: values[f.name], onChange: (v) => setField(f.name, v), disabled: readOnly, t }))),
            hasExtras ? h('div', { className: 'dpc-param' },
              h('div', { className: 'dpc-paramhead' }, h('span', { className: 'dpc-pname' }, t('otherSettings'))),
              h('p', { className: 'dpc-desc' }, t('otherSettingsNote')),
              h(JsonBox, { key: 'extras', value: extras, t, empty: undefined, onValid: setExtras })) : null)
            : h('div', { className: 'dpc-param' },
              loadError ? h('p', { className: 'dpc-err', role: 'alert' }, t('catalogFailed', { message: loadError })) : null,
              h('p', { className: 'dpc-desc' }, fields ? t('rawNoteShape') : t('rawNote')),
              h(JsonBox, { key: 'raw', value: raw, t, empty: undefined, onValid: setRaw, onBad: setBad }))),
        missing.length > 0 ? h('p', { className: 'dpc-warn' }, t('missingRequired', { names: missing.join(', ') })) : null,
        h('div', { className: 'dpc-bar dpc-dialogfoot' },
          h('span', { className: 'dpc-grow' }),
          h('button', { className: 'dpc-btn', type: 'button', onClick: onClose }, readOnly ? t('close') : t('cancel')),
          readOnly ? null : h('button', { className: 'dpc-btn primary', type: 'button', disabled: bad, onClick: apply }, t('applyParams')))))
    }
    const draftFrom = (preset) => clone({ id: preset.id, name: preset.name, description: preset.description, order: preset.order, plugins: preset.plugins || [] })

    function Section(props) {
      const t = props.t
      const lang = props.lang || 'en'
      const [data, setData] = useState(null)
      const [loadError, setLoadError] = useState(null)
      const [selectedId, setSelectedId] = useState(null)
      const [draft, setDraft] = useState(null)
      const [base, setBase] = useState(null)
      const [isNew, setIsNew] = useState(false)
      const [rowPath, setRowPath] = useState(null)
      const [busy, setBusy] = useState(false)
      const [message, setMessage] = useState(null)
      const [confirm, setConfirm] = useState(null)
      const [pending, setPending] = useState(null)
      const [mode, setMode] = useState('view')
      const [catalog, setCatalog] = useState(null)
      const [catalogError, setCatalogError] = useState(null)
      const [dialogPath, setDialogPath] = useState(null)
      const dragRef = useRef(null)
      const alive = useRef(true)
      useEffect(() => () => { alive.current = false }, [])

      const open = useCallback((preset, asNew) => {
        const next = draftFrom(preset)
        setDraft(next); setBase(next); setIsNew(asNew); setRowPath(null); setConfirm(null); setMessage(null); setMode('view')
        setSelectedId(asNew ? null : preset.id)
      }, [])

      const load = useCallback(async (keepId) => {
        const result = await call('state')
        if (!alive.current) return
        if (!result.ok) { setLoadError(result); return }
        setLoadError(null)
        setData(result.data)
        const pick = result.data.presets.find(p => p.id === keepId) || result.data.presets.find(p => p.isDefault) || result.data.presets[0]
        if (pick) open(pick, false)
      }, [open])
      useEffect(() => { void load(null) }, [load])
      // Parameter lists load once, the first time an edit page needs them.
      useEffect(() => {
        if (mode !== 'edit' || catalog) return
        void call('catalog').then((result) => {
          if (!alive.current) return
          if (result.ok && result.data && result.data.modules) { setCatalog(result.data.modules); setCatalogError(null) }
          else { setCatalog({}); setCatalogError(result.ok ? 'empty response' : `${result.code}: ${result.message}`) }
        })
      }, [mode, catalog])

      const current = data && selectedId ? data.presets.find(p => p.id === selectedId) : undefined
      const dirty = !!draft && !!base && JSON.stringify(draft) !== JSON.stringify(base)
      const problem = draft ? presetProblem(draft) : undefined
      const editable = !!data && data.editable && (isNew || (current && current.source !== 'readonly'))
      const titles = useMemo(() => {
        const map = new Map()
        for (const p of (data && data.palette) || []) { const title = metaTitle(p.meta, lang); if (title) map.set(p.name, title) }
        return map
      }, [data, lang])
      const descs = useMemo(() => {
        const map = new Map()
        for (const p of (data && data.palette) || []) { const text = metaDesc(p.meta, lang); if (text) map.set(p.name, text) }
        return map
      }, [data, lang])

      const unmet = useMemo(() => (draft ? missingDeps(draft.plugins, data && data.deps) : []), [draft, data])
      const shortName = (name) => titles.get(name) || name.replace(/^@deepseek-ai\/dsh-/, '')
      const onAddProvider = (item, provider) => edit((d) => {
        const parent = item.path.slice(0, -1)
        const list = listAt(d.plugins, parent) || []
        return { ...d, plugins: addRow(d.plugins, parent, { id: uniqueId(list, provider.replace(/^@deepseek-ai\/dsh-/, '')), name: provider }) }
      })

      const guarded = (action) => { if (dirty) setPending(() => action); else action() }

      const edit = (fn) => { setMessage(null); setDraft(fn(draft)) }
      const onToggle = (path, checked) => edit(d => ({ ...d, plugins: updateRow(d.plugins, path, (row) => {
        const next = { ...row }
        if (checked) delete next.disabled; else next.disabled = true
        return next
      }) }))
      const onOpenRow = (path) => {
        setRowPath(path)
        const row = rowAt(draft.plugins, path)
        if (row && row.group !== true) setDialogPath(path)
      }
      const onMove = (path, delta) => edit(d => ({ ...d, plugins: moveRow(d.plugins, path, delta) }))
      const onRemove = (path) => { edit(d => ({ ...d, plugins: removeRow(d.plugins, path) })); setRowPath(null) }
      const onReorder = (parent, from, to) => { edit(d => ({ ...d, plugins: reorderRow(d.plugins, parent, from, to) })); setRowPath(null) }
      const targetParent = () => {
        const row = rowPath ? rowAt(draft.plugins, rowPath) : undefined
        return row && row.group === true ? rowPath : []
      }
      const onAdd = (item) => edit((d) => {
        const parent = targetParent()
        const list = listAt(d.plugins, parent) || []
        const row = { id: uniqueId(list, item.name), name: item.name }
        if (item.sampleConfig) row.config = clone(item.sampleConfig)
        return { ...d, plugins: addRow(d.plugins, parent, row) }
      })
      const onAddGroup = () => edit((d) => {
        const parent = targetParent()
        const list = listAt(d.plugins, parent) || []
        return { ...d, plugins: addRow(d.plugins, parent, { id: uniqueId(list, 'group'), name: 'cordis:group', group: true, config: [] }) }
      })

      const run = async (path, body, success) => {
        setBusy(true); setMessage(null)
        const result = await call(path, body)
        if (!alive.current) return
        setBusy(false); setConfirm(null)
        if (!result.ok) { setMessage({ kind: 'err', text: errorText(t, result), stale: result.code === 'stale' }); return }
        setData(result.data)
        const next = success(result.data)
        const pick = result.data.presets.find(p => p.id === next)
        if (pick) { open(pick, false); setMessage({ kind: 'ok', text: t('saved') }) }
        else {
          const first = result.data.presets.find(p => p.isDefault) || result.data.presets[0]
          if (first) open(first, false)
        }
      }
      const save = () => run('save', { preset: draft, baseRevision: isNew ? undefined : current && current.revision }, () => draft.id)
      const del = () => run('delete', { id: current.id, baseRevision: current.revision }, () => null)
      const reset = () => run('reset', { id: current.id }, () => current.id)

      const startNew = () => guarded(() => {
        const next = { id: '', plugins: clone(data.template || []) }
        setDraft(next); setBase({ id: '', plugins: [] }); setIsNew(true); setSelectedId(null); setRowPath(null); setConfirm(null); setMessage(null); setMode('edit')
      })
      const duplicate = () => guarded(() => {
        const taken = new Set(data.presets.map(p => p.id))
        let id = `${current.id}-copy`
        for (let n = 2; taken.has(id); n++) id = `${current.id}-copy-${n}`
        const copy = draftFrom({ ...current, id, name: current.name ? `${current.name} (copy)` : undefined, order: undefined })
        setDraft(copy); setBase({ id: '', plugins: [] }); setIsNew(true); setSelectedId(null); setRowPath(null); setConfirm(null); setMessage(null); setMode('edit')
      })

      if (loadError) return h('div', { className: 'dpc' }, h('style', null, CSS), h('span', { className: 'dpc-err' }, errorText(t, loadError)),
        h('div', null, h('button', { className: 'dpc-btn', type: 'button', onClick: () => { setLoadError(null); void load(selectedId) } }, t('retry'))))
      if (!data || !draft) return h('div', { className: 'dpc' }, h('style', null, CSS), h('span', { className: 'dpc-sub' }, t('loading')))

      const sourceLabel = (p) => t(p.source)
      const isEdit = mode === 'edit'
      const dialogRow = isEdit && dialogPath && draft ? rowAt(draft.plugins, dialogPath) : undefined
      const back = () => guarded(() => {
        if (isNew) { const first = data.presets.find(p => p.isDefault) || data.presets[0]; if (first) open(first, false); else setMode('view') }
        else { setDraft(base); setRowPath(null); setConfirm(null); setMessage(null); setMode('view') }
      })
      const msgBar = message ? h('div', { className: 'dpc-bar', role: 'status' }, h('span', { className: message.kind === 'ok' ? 'dpc-note' : 'dpc-err' }, message.text),
        message.stale ? h('button', { className: 'dpc-btn', type: 'button', onClick: () => { setMessage(null); void load(selectedId) } }, t('retry')) : null) : null
      const confirmBar = confirm === 'delete'
        ? h('div', { className: 'dpc-bar', role: 'alert' }, h('button', { className: 'dpc-btn danger', type: 'button', disabled: busy, onClick: del }, t('confirmDelete')), h('button', { className: 'dpc-btn', type: 'button', onClick: () => setConfirm(null) }, t('cancel')))
        : confirm === 'reset'
          ? h('div', { className: 'dpc-bar', role: 'alert' }, h('span', { className: 'dpc-warn' }, t('resetWarn')), h('button', { className: 'dpc-btn danger', type: 'button', disabled: busy, onClick: reset }, t('reset')), h('button', { className: 'dpc-btn', type: 'button', onClick: () => setConfirm(null) }, t('cancel')))
          : null
      const depsBar = unmet.length === 0 ? null : h('div', { className: 'dpc-deps', role: 'alert' },
        h('p', { className: 'dpc-warn' }, t('depsTitle')),
        unmet.map(item => h('div', { key: item.path.join('.') + item.service, className: 'dpc-bar' },
          h('span', { className: 'dpc-warn dpc-grow' }, t('depsMissing', { plugin: shortName(item.name), service: item.service })),
          item.providers.map(provider => h('button', { key: provider, className: 'dpc-btn', type: 'button', disabled: busy || !editable, onClick: () => onAddProvider(item, provider) }, t('depsAdd', { name: shortName(provider) }))))))
      const brokenNote = current && current.broken ? h('span', { className: 'dpc-err' }, current.broken) : null

      const listPanel = h('div', { className: 'dpc-panel' },
        h('div', { className: 'dpc-listhead' },
          h('p', { className: 'dpc-h dpc-grow' }, t('presets')),
          h('button', { className: 'dpc-btn dpc-iconbtn', type: 'button', title: t('newPresetTip'), 'aria-label': t('newPreset'), disabled: busy || !data.editable, onClick: startNew }, '+'),
          h('button', { className: 'dpc-btn dpc-iconbtn', type: 'button', title: t('duplicateTip'), 'aria-label': t('duplicate'), disabled: busy || !data.editable || !current || !current.plugins, onClick: duplicate }, '⧉')),
        data.presets.map(p => h('button', { key: p.id, type: 'button', className: 'dpc-item' + (p.id === selectedId ? ' sel' : ''), onClick: () => guarded(() => open(p, false)) },
          h('span', { className: 'dpc-name', title: p.name || p.id }, p.name || p.id),
          h('span', { className: 'dpc-tags' },
            h('span', { className: 'dpc-tag' }, sourceLabel(p)),
            p.isDefault ? h('span', { className: 'dpc-tag ok' }, t('default')) : null,
            p.overridden ? h('span', { className: 'dpc-tag' }, t('overridden')) : null,
            p.broken ? h('span', { className: 'dpc-tag bad', title: p.broken }, t('broken')) : null))))

      const viewPage = h('div', { className: 'dpc-cols' },
        listPanel,
        h('div', { className: 'dpc-detail' },
          h('div', { className: 'dpc-panel' },
            h('div', { className: 'dpc-bar' },
              h('p', { className: 'dpc-h dpc-grow' }, t('composition')),
              h('button', { className: 'dpc-btn primary', type: 'button', disabled: busy || !editable, title: editable ? t('editTip') : t('editReadonly'), onClick: () => { setMessage(null); setMode('edit') } }, t('edit'))),
            msgBar,
            brokenNote,
            depsBar,
            current && !current.plugins ? h('div', null, h('span', { className: 'dpc-sub' }, t('readonlyNote')), current.yaml ? h('pre', { className: 'dpc-yaml' }, current.yaml) : null)
              : (draft.plugins.length === 0 ? h('span', { className: 'dpc-sub' }, t('empty'))
                : h(ViewRows, { rows: draft.plugins, titles, descs, t })))))

      const editPage = h('div', { className: 'dpc-detail' },
        h('div', { className: 'dpc-panel' },
          h('div', { className: 'dpc-pagehead' },
            h('button', { className: 'dpc-btn', type: 'button', disabled: busy, onClick: back }, `← ${t('back')}`),
            h('p', { className: 'dpc-h dpc-grow' }, `${t('edit')} · ${draft.name || draft.id || t('newPreset')}`),
            h('button', { className: 'dpc-btn primary', type: 'button', disabled: busy || !editable || !dirty || !!problem, onClick: save }, busy ? t('saving') : t('save')),
            h('button', { className: 'dpc-btn', type: 'button', disabled: busy || !dirty, onClick: () => setDraft(base) }, t('discard')),
            !isNew && current && current.source === 'shipped' && current.overridden ? h('button', { className: 'dpc-btn', type: 'button', disabled: busy, onClick: () => setConfirm('reset') }, t('reset')) : null,
            !isNew && current && current.source === 'custom' ? h('button', { className: 'dpc-btn danger', type: 'button', disabled: busy || current.isDefault, onClick: () => setConfirm('delete') }, t('delete')) : null),
          confirmBar,
          msgBar,
          brokenNote,
          depsBar),
        h('div', { className: 'dpc-edit' },
          h('div', { className: 'dpc-panel' },
            h('p', { className: 'dpc-h' }, t('composition')),
            draft.plugins.length === 0 ? h('span', { className: 'dpc-sub' }, t('empty'))
              : h(Tree, { rows: draft.plugins, parent: [], selected: rowPath, onSelect: onOpenRow, onMove, onRemove, onToggle, onReorder, t, lang, titles, descs, dragRef })),
          h('div', { className: 'dpc-tools' },
            h(Inspector, { draft, setDraft: (d) => edit(() => d), selected: rowPath, t, isNew, readOnly: !editable, descs }),
            h(Palette, { palette: data.palette, titles, descs, onAdd, onAddGroup, t, disabled: !editable, deps: data.deps }))))

      return h('div', { className: 'dpc' },
        h('style', null, CSS),
        isEdit ? null : h('p', { className: 'dpc-intro' }, t('intro')),
        !data.editable ? h('span', { className: 'dpc-warn' }, t('noEditor')) : null,
        data.storeProblems && data.storeProblems.length > 0 ? h('span', { className: 'dpc-warn' }, t('storeProblems') + data.storeProblems.map(p => `${p.id} (${p.message})`).join('; ')) : null,
        pending ? h('div', { className: 'dpc-bar', role: 'alert' }, h('span', { className: 'dpc-warn' }, t('dirtyGuard')),
          h('button', { className: 'dpc-btn danger', type: 'button', onClick: () => { const action = pending; setPending(null); action() } }, t('discard')),
          h('button', { className: 'dpc-btn', type: 'button', onClick: () => setPending(null) }, t('cancel'))) : null,
        isEdit ? editPage : viewPage,
        dialogRow && !catalog ? h('div', { className: 'dpc-overlay' }, h('div', { className: 'dpc-dialog', role: 'status' }, t('paramsLoading'))) : null,
        dialogRow && catalog ? h(ParamDialog, {
          key: dialogPath.join('.'), row: dialogRow, fields: catalog[dialogRow.name] || null, loadError: catalogError, readOnly: !editable,
          title: titles.get(dialogRow.name) || dialogRow.name, desc: descs.get(dialogRow.name), t,
          onClose: () => setDialogPath(null),
          onApply: (config) => { edit(d => ({ ...d, plugins: updateRow(d.plugins, dialogPath, (row) => { const next = { ...row }; if (config === undefined) delete next.config; else next.config = config; return next }) })); setDialogPath(null) },
        }) : null)
    }

    const name = 'dsh-preset-composer'
    const inject = ['slots', 'locale']

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'preset-composer locale')
      const t = ctx.locale.bind(NS)
      const activeLang = () => {
        let active = ''
        try { active = (ctx.locale.getSnapshot && ctx.locale.getSnapshot().active) || '' } catch { /* fall through */ }
        if (!active && typeof navigator !== 'undefined') active = navigator.language || ''
        return String(active).toLowerCase().startsWith('zh') ? 'zh' : 'en'
      }
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'preset-composer',
        order: 21,
        label: () => t('nav'),
        locale: NS,
        inject: () => ({ t, lang: activeLang() }),
      }, Section))
    }

    return { name, inject, apply }
  },
})
