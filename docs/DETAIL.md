# Preset composer

Compose agent presets visually in **Settings → Preset composer**.

## What you can do

- Browse every preset in the roster with its source: custom, shipped, or read-only.
- Reorder plugin rows by drag and drop or with the up and down buttons.
- Enable or disable a row, remove it, or add one from the palette of plugins known to this profile.
- Nest rows in a `cordis:group` and edit its `isolate` map.
- Edit a row's id, module name, and JSON config in the inspector.
- Click a plugin in the edit page (or its gear button) to open a window with all of its parameters: one typed input per parameter (switch, number, text, choice, or JSON for lists and maps), with its type, whether it is required, its default when the plugin documents one, and its description. A parameter left unset is omitted from the saved config, so the plugin default applies. Press Apply to put the values into the draft, then Save the preset. Esc or a click outside closes the window without applying.
- Create a new preset, or duplicate an existing one as a starting point. A new preset starts with three rows: a persona, file tools (`tool-fs`) and one shell tool (`tool-bash`, or `tool-pwsh` on Windows). Remove or add rows as needed.
- Read what each plugin does. Its one-line description shows under the plugin name in the composition, in the inspector, and in the palette, in the interface language. The palette search also matches descriptions. The text comes from the plugin package's own metadata, so a plugin that publishes no description shows only its name.

## Where changes are stored

- **Custom presets** are saved in the config of this plugin's store entry (`dsh-preset-composer/store`). The store registers them with the agent preset registry at startup.
- **Shipped presets** (for example `standard` or `minimal`) are saved as a full-config override row in your profile patch, written through the config editor. **Reset** removes that override.
- Presets that cannot be edited this way (for example ones supplied by another bundle) are shown read-only with their YAML.

## Where parameter lists come from

The parameter lists are read from `docs/config-catalog.md` of the DSH installation, which documents the `Config` of each official plugin. A plugin that is not in that file (a third-party plugin, or one whose config is not a plain interface) has no list, so its config is edited as JSON. Keys in a saved config that the catalog does not list are kept and shown under "Other settings".

Default values come from `lib/defaults.json`, generated from `dsh web --dump-config-schema` with `node scripts/gen-defaults.mjs schema.json`. Each parameter shows its default next to its name and in the "Not set" option. A parameter with no published default shows "Default not published". Regenerate the file after upgrading DSH.

## Limits

- A preset change applies to **new sessions**. Sessions that already started keep the preset they began with.
- The default preset cannot be deleted. Change the default in the agent preset settings first.
- Saving fails with a "changed elsewhere" message when the preset was modified since you opened it. Reload and re-apply your edit.
- Rows with a `!!js` condition (for example the Windows-only shell tools) are shown as conditional. Their expression can be edited, but not toggled with the checkbox.
- This plugin offers no agent tool. Changing which plugins an agent runs grants authority, so it stays a user action.
- The parameter window does not validate values against the plugin. The Host validates a config when a session starts, so a wrong value shows up there.
