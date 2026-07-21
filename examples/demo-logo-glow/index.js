/*
 * pve-modkit demo mod: animated logo glow
 * -------------------------------------------------------------------------
 * A demonstration of the pve-modkit authoring pattern: create a self-contained
 * named directory under /usr/share/pve-modkit/mods/{mod-name}/ containing a
 * mod.json (name, optional version/description, optional entry [default
 * index.js], optional enabled [default true]) and the entry script. Run
 * `pve-modkit index` (or drop it and let enable/disable + the dpkg trigger
 * regenerate the manifest); it is then listed in /modkit/index.json and
 * auto-loaded by ext.js at /modkit/{mod-name}/{entry} on the next page load.
 *
 * This mod adds a soft, slow "breathing" glow to the Proxmox VE logo in the
 * top banner -- brand-appropriate orange, gentle easing, intensifying subtly
 * on hover. It honours prefers-reduced-motion and never hard-fails if the
 * logo element cannot be found.
 */
(function () {
    "use strict";

    const STYLE_ID = "pve-modkit-demo-logo-glow";
    const GLOW_CLASS = "pve-modkit-glow";

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }
        const css = [
            "@keyframes pve-modkit-glow-pulse {",
            "  0%   { filter: drop-shadow(0 0 1px rgba(229,112,0,0.35)); }",
            "  100% { filter: drop-shadow(0 0 8px rgba(229,112,0,0.85)); }",
            "}",
            `.${  GLOW_CLASS  } {`,
            "  animation: pve-modkit-glow-pulse 3.5s ease-in-out infinite alternate;",
            "  will-change: filter;",
            "}",
            `.${  GLOW_CLASS  }:hover {`,
            "  filter: drop-shadow(0 0 12px rgba(229,112,0,1)) !important;",
            "}",
            "@media (prefers-reduced-motion: reduce) {",
            `  .${  GLOW_CLASS  } {`,
            "    animation: none;",
            "    filter: drop-shadow(0 0 4px rgba(229,112,0,0.6));",
            "  }",
            "}"
        ].join("\n");

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.type = "text/css";
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

    function findLogo() {
        // Strategy 1: an <img> whose src references the proxmox logo.
        const imgs = document.getElementsByTagName("img");
        let i, src;
        for (i = 0; i < imgs.length; i++) {
            src = (imgs[i].getAttribute("src") || "").toLowerCase();
            if (src.indexOf("proxmox_logo") !== -1) {
                return imgs[i];
            }
        }
        for (i = 0; i < imgs.length; i++) {
            src = (imgs[i].getAttribute("src") || "").toLowerCase();
            if (src.indexOf("logo") !== -1) {
                return imgs[i];
            }
        }
        // Strategy 2: a known Proxmox header region, first img within it.
        const header = document.querySelector(
            ".x-panel-header, .pve-webui-header");
        if (header) {
            const [hImg] = header.getElementsByTagName("img");
            if (hImg) {
                return hImg;
            }
        }
        // No logo found: do not guess at an arbitrary image.
        return null;
    }

    function decorate() {
        const logo = findLogo();
        if (!logo) {
            return false;
        }
        injectStyle();
        if (logo.classList) {
            if (logo.classList.contains(GLOW_CLASS)) {
                return true; // already decorated (idempotent)
            }
            logo.classList.add(GLOW_CLASS);
        } else {
            if ((` ${  logo.className  } `).indexOf(` ${  GLOW_CLASS  } `) !== -1) {
                return true;
            }
            logo.className += ` ${  GLOW_CLASS}`;
        }
        return true;
    }

    function run() {
        if (decorate()) {
            return;
        }
        // The header/logo may render slightly after onReady; retry briefly.
        let tries = 0;
        const timer = setInterval(() => {
            tries += 1;
            if (decorate() || tries >= 20) { // ~5s at 250ms
                clearInterval(timer);
                if (tries >= 20 && !document.querySelector(`.${  GLOW_CLASS}`)) {
                    console.warn(
                        "[pve-modkit] demo-logo-glow: logo element not " +
                        "found; skipping");
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
