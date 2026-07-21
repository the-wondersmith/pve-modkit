# demo-logo-glow

A reference example mod for pve-modkit: adds a soft, slow "breathing" orange
glow to the Proxmox VE logo in the top banner, intensifying subtly on hover.

> **Reference example — not installed by default.**
> This mod lives in the source tree under `examples/` and is *not* shipped by
> the `.deb`. The package ships a single subtle default mod
> (`modkit-active-badge`) instead. Copy this directory into a live system if
> you want it (see below).

## What it does

Applies a gentle, brand-appropriate orange drop-shadow glow to the PVE logo
that pulses slowly (an infinite ease-in-out alternate animation) and brightens
on hover. It never modifies logo markup beyond adding one CSS class.

## How it works

- **Logo lookup cascade.** `findLogo()` tries, in order: an `<img>` whose
  `src` contains `proxmox_logo`, then any `<img>` whose `src` contains `logo`,
  then the first `<img>` inside a known header region
  (`.x-panel-header, .pve-webui-header`). If nothing matches it returns `null`
  and the mod does nothing rather than guessing at an arbitrary image.
- **Class-based styling.** A single `<style>` element (injected once, by id) is
  added to the head and the class `pve-modkit-glow` is added to the logo. All
  animation lives in CSS.
- **Idempotent.** The style id and the class membership are both checked before
  applying; re-running is a no-op.
- **Retry loop.** The header/logo can render slightly after `onReady`, so it
  retries on a `setInterval` (~250 ms, up to 20 tries ≈ 5 s), then emits a
  `console.warn` breadcrumb if the logo was never found.
- **Motion-aware.** Under `@media (prefers-reduced-motion: reduce)` the pulse
  animation is replaced with a static, gentle glow.
- **Boot.** Runs via `Ext.onReady` when ExtJS is present, otherwise
  immediately.

## The `mod.json`

```json
{
  "name": "demo-logo-glow",
  "version": "1.0.0",
  "description": "Demo mod: a soft breathing orange glow on the Proxmox VE logo.",
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
cp -r examples/demo-logo-glow /usr/share/pve-modkit/mods/

# Remove it again (the watcher syncs the removal the same way):
rm -rf /usr/share/pve-modkit/mods/demo-logo-glow
pve-modkit index
```
