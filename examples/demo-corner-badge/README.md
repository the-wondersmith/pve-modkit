# demo-corner-badge

A reference example mod for pve-modkit: pins a small, unobtrusive pill-shaped
badge to the bottom-right corner of the Proxmox VE viewport reading
**"modded with pve-modkit"**.

> **Reference example — not installed by default.**
> This mod lives in the source tree under `examples/` and is *not* shipped by
> the `.deb`. The package ships a single subtle default mod
> (`modkit-active-badge`) instead. Copy this directory into a live system if
> you want it (see below).

## What it does

Adds a fixed-position, pill-shaped badge in the bottom-right of the window. It
fades in gently, sits at reduced opacity, and brightens on hover. It is purely
additive DOM — no ExtJS components are touched.

## How it works

- **Purely additive DOM.** The badge is a single `<div>` appended to
  `document.body`; styling is injected once as a `<style>` element in the head.
- **Idempotent.** Both the style element and the badge are guarded by fixed
  ids (`pve-modkit-demo-corner-badge-style`, `pve-modkit-demo-corner-badge`);
  re-running the mod is a no-op.
- **Retry loop.** If `document.body` is not ready yet, it retries on a
  `setInterval` (~250 ms, up to 20 tries ≈ 5 s), then gives up with a
  `console.warn` breadcrumb rather than hard-failing.
- **Motion-aware.** Under `@media (prefers-reduced-motion: reduce)` the fade-in
  animation and transitions are disabled.
- **Boot.** Runs via `Ext.onReady` when ExtJS is present, otherwise
  immediately.

## The `mod.json`

```json
{
  "name": "demo-corner-badge",
  "version": "1.0.0",
  "description": "Demo mod: a small floating corner badge announcing the UI is modded with pve-modkit.",
  "entry": "index.js",
  "enabled": true
}
```

- `name` (required) — the mod's directory name and manifest key.
- `version`, `description` — optional, informational.
- `entry` — optional, defaults to `index.js`; the script served and injected.
- `enabled` — optional, defaults to `true`; only honored when a real JSON
  boolean.

Installed mods live at `/usr/share/pve-modkit/mods/{name}/` and are served at
`/modkit/{name}/{entry}`. The loader (`ext.js`) reads the enabled-only manifest
`/modkit/index.json` and injects each mod's script on page load.

## Try it on a live system

```sh
# 1. Copy the example into the served mods directory (drop the folder in as a
#    unit) — the .path watcher runs `pve-modkit sync`, which regenerates the
#    manifest and restarts pveproxy automatically. Then just refresh the web UI.
cp -r examples/demo-corner-badge /usr/share/pve-modkit/mods/

# Remove it again (the watcher syncs the removal the same way):
rm -rf /usr/share/pve-modkit/mods/demo-corner-badge
pve-modkit index
```
