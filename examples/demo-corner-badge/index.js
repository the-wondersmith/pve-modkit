/*
 * pve-modkit demo mod: corner badge
 * -------------------------------------------------------------------------
 * A demon mod, showing that multiple independent mods coexist cleanly: each
 * lives in its own /usr/share/pve-modkit/mods/{mod-name}/ directory, is
 * listed in /modkit/index.json, and is injected by ext.js at
 * /modkit/{mod-name}/{entry}.
 *
 * This mod pins a small, unobtrusive pill-shaped badge to the bottom-right of
 * the viewport reading "modded with pve-modkit". It is purely additive DOM
 * (no ExtJS components touched), fades in gently, dims until hovered, honours
 * prefers-reduced-motion, and is fully idempotent (re-injection is a no-op).
 */
(function () {
    "use strict";

    const STYLE_ID = "pve-modkit-demo-corner-badge-style";
    const BADGE_ID = "pve-modkit-demo-corner-badge";
    const LABEL = "modded with pve-modkit";

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }
        const css = [
            "@keyframes pve-modkit-badge-in {",
            "  from { opacity: 0; transform: translateY(8px); }",
            "  to   { opacity: 0.55; transform: translateY(0); }",
            "}",
            `#${  BADGE_ID  } {`,
            "  position: fixed;",
            "  right: 12px;",
            "  bottom: 12px;",
            "  z-index: 100000;",
            "  padding: 5px 11px;",
            "  border-radius: 999px;",
            "  font: 600 11px/1.4 -apple-system, 'Segoe UI', Roboto, sans-serif;",
            "  letter-spacing: 0.02em;",
            "  color: #fff;",
            "  background: linear-gradient(135deg, #e57000 0%, #b35700 100%);",
            "  box-shadow: 0 2px 8px rgba(0,0,0,0.35);",
            "  opacity: 0.55;",
            "  cursor: default;",
            "  user-select: none;",
            "  pointer-events: auto;",
            "  animation: pve-modkit-badge-in 0.6s ease-out;",
            "  transition: opacity 0.25s ease, transform 0.25s ease;",
            "}",
            `#${  BADGE_ID  }:hover {`,
            "  opacity: 1;",
            "  transform: translateY(-2px);",
            "}",
            `#${  BADGE_ID  }::before {`,
            "  content: '';",
            "  display: inline-block;",
            "  width: 7px;",
            "  height: 7px;",
            "  margin-right: 6px;",
            "  border-radius: 50%;",
            "  background: #fff;",
            "  vertical-align: middle;",
            "  box-shadow: 0 0 4px rgba(255,255,255,0.9);",
            "}",
            "@media (prefers-reduced-motion: reduce) {",
            `  #${  BADGE_ID  } { animation: none; transition: none; }`,
            "}"
        ].join("\n");

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.type = "text/css";
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

    function decorate() {
        if (!document.body) {
            return false;
        }
        injectStyle();
        if (document.getElementById(BADGE_ID)) {
            return true; // already present (idempotent)
        }
        const badge = document.createElement("div");
        badge.id = BADGE_ID;
        badge.setAttribute("title", LABEL);
        badge.appendChild(document.createTextNode(LABEL));
        document.body.appendChild(badge);
        return true;
    }

    function run() {
        if (decorate()) {
            return;
        }
        let tries = 0;
        const timer = setInterval(() => {
            tries += 1;
            if (decorate() || tries >= 20) { // ~5s at 250ms
                clearInterval(timer);
                if (tries >= 20 && !document.getElementById(BADGE_ID)) {
                    console.warn(
                        "[pve-modkit] demo-corner-badge: document.body not " +
                        "available; skipping");
                }
            }
        }, 250);
    }

    if (window.Ext && typeof Ext.onReady === "function") {
        Ext.onReady(run);
    } else {
        run();
    }
})();
