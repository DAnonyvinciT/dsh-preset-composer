# dsh-preset-composer

[English](README.md) | 简体中文

DSH Agent 预设的可视化编辑器。它在「设置」里加一个**预设编排**页面，位于 Agent 预设旁边。

![icon](assets/icon-180.png)

## 功能

- 列出所有 Agent 预设（内置和自定义），只读显示每个预设的插件行、参数和 `!!js` 表达式。
- 以树的形式编辑预设：添加、删除、排序和拖拽插件行，启用或停用，以及把行放进 `cordis:group` 分组。
- 点开某个插件行会弹出参数对话框。字段来自已安装 DSH 的 `docs/config-catalog.md`（DSH 0.2.2-rc.5 共 144 个模块），默认值来自配置 schema。目录里没有的插件退回为原始 JSON 编辑。
- 插件库按用途分组（工具、提示词与上下文、模型、子智能体、会话与存储、权限与沙箱、终端与运行时、宿主服务、界面、实验性），可按名称、标题和描述搜索。
- 依赖提醒：当插件需要某个服务而预设里没有插件提供它时给出警告（例如持久化 bash 需要 `terminals` 服务，由 `@deepseek-ai/dsh-terminal` 提供），并提供一键添加提供方的按钮。插件库里这类插件会标注「依赖：…」。警告不会阻止保存。
- 同名工具冲突提醒：两个已启用的插件注册了同一个工具名时给出警告（例如 `dsh-tool-bash` 和 `dsh-tool-bash-persistent` 都注册 `bash`，Host 会报 `tool "bash" is already registered in this scope`），并提供「禁用后加的那个」按钮。
- 新建和复制自定义预设。保存内置预设时，会通过 `configEditor` 服务写入一条覆盖；点「重置」即可移除。

预设的修改只对新会话生效，已有会话继续使用它启动时的预设。

## 安装

需要 DSH 0.2.x。从最新 release 下载 `dsh-preset-composer.tgz`，然后执行：

```sh
dsh plugin --profile <name> add ./dsh-preset-composer.tgz
```

安装后重启 DSH。

## 组成

- `lib/index.js`：Host 插件。提供 `GET /api/preset-composer/state` 和 `POST /api/preset-composer/{save,delete,reset}`。
- `lib/store.js`：Host 插件（`dsh-preset-composer/store`）。把自己 `presets` 配置里有效的自定义预设注册到 `agentPresets`。
- `lib/model.js`：校验、规范化、版本号和插件库。
- `lib/deps.js` 和 `lib/deps.json`：记录哪些插件需要预设里有提供方，才能拿到哪个服务。`lib/deps.json` 由 `scripts/gen-deps.mjs` 生成，升级 DSH 后需要重新运行。
- `lib/catalog.js`：把已安装的 `config-catalog.md` 解析成每个插件的字段列表。
- `lib/defaults.json`：由 `scripts/gen-defaults.mjs` 根据 `dsh web --dump-config-schema` 生成的参数默认值。升级 DSH 后需要重新生成。
- `client.js`：设置页面（React，样式以 `dpc-` 为前缀，使用宿主主题变量）。

## 开发

```sh
node --test test/
node --check client.js lib/*.js
```

## 已知限制

- 只读视图按存储的原样显示配置值，其中的密钥会以明文出现。
- 部分模块没有参数默认值，这些字段不显示默认值。
- 编辑预设要求插件装在 profile 根下，可编辑的 profile 才能保存。

## 许可证

MIT
