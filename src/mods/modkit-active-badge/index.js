/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * pve-modkit default mod: active badge
 * -------------------------------------------------------------------------
 * The one mod pve-modkit ships enabled by default. It places a small, quiet
 * "modkit: active" pill immediately to the right of the "Virtual Environment
 * {version}" text in the Proxmox VE header, so an operator can confirm at a
 * glance that pve-modkit is installed and loading mods.
 *
 * Design intent: unobtrusive and theme-native. The badge derives its colour
 * from the header's own `currentColor` (a faint currentColor fill + border,
 * muted opacity until hover) rather than a hardcoded accent, so it reads
 * correctly in both light and dark PVE themes instead of looking like an
 * ad-hoc overlay.
 *
 * DOM strategy (grounded in proxmox/pve-manager www/manager6/Workspace.js,
 * ExtJS 6.x): the version text lives on a div with the stable DOM id
 * `#versioninfo`. PVE rewrites that element's innerHTML via el.update() after
 * the async /version call, so the badge must NOT be a descendant of
 * `#versioninfo` (updateVersionInfo() would wipe it).
 *
 * Layout reality (confirmed from a live PVE 9.x rendered header): the header
 * toolbar is an ExtJS ABSOLUTE-positioned box layout -- the container
 * (`.x-box-target`) lays every `.x-box-item` (logo, #versioninfo, search,
 * buttons) out with `position:absolute` and an explicit inline `left`/`top`.
 * A plain in-flow sibling span therefore has no offset and collapses to the
 * container origin (0,0), painting ON TOP of the logo.
 *
 * So the badge is injected as an absolutely-positioned sibling of #versioninfo
 * inside that box container, and glued to the RIGHT edge of the actual version
 * TEXT. We measure the innermost text element (`#versioninfo-innerCt`, which
 * shrink-wraps the text) rather than #versioninfo's wider measured box, so the
 * pill hugs "...9.2.4" instead of floating after a gap. Coordinates are
 * re-synced whenever the layout shifts (window resize, and PVE's async version
 * update) via ResizeObserver + a MutationObserver on #versioninfo. Purely
 * additive DOM, fully idempotent.
 */
(function () {
    "use strict";

    const STYLE_ID = "pve-modkit-active-badge-style";
    const BADGE_ID = "pve-modkit-active-badge";
    const LABEL = "modkit: active";

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }
        const css = [
            "@keyframes pve-modkit-active-badge-in {",
            "  from { opacity: 0; }",
            "  to   { opacity: 0.72; }",
            "}",
            `#${  BADGE_ID  } {`,
            "  position: absolute;",
            "  box-sizing: border-box;",
            "  padding: 1px 8px;",
            "  font-size: 11px;",
            "  line-height: 16px;",
            "  font-weight: 600;",
            "  letter-spacing: 0.02em;",
            "  border-radius: 999px;",
            // Theme-native: inherit the header text colour, then render it at
            // low intensity so the pill sits quietly next to the version text.
            "  color: currentColor;",
            "  border: 1px solid;",
            "  border-color: currentColor;",
            "  background: rgba(127, 127, 127, 0.14);",
            "  opacity: 0.72;",
            "  user-select: none;",
            "  cursor: default;",
            "  white-space: nowrap;",
            "  animation: pve-modkit-active-badge-in 0.5s ease-out;",
            "  transition: opacity 0.2s ease;",
            "}",
            `#${  BADGE_ID  }:hover {`,
            "  opacity: 1;",
            "}",
            `#${  BADGE_ID  }::before {`,
            "  content: '';",
            "  display: inline-block;",
            "  width: 6px;",
            "  height: 6px;",
            "  margin-right: 6px;",
            "  border-radius: 50%;",
            "  background: currentColor;",
            "  vertical-align: middle;",
            "  opacity: 0.85;",
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

    // Locate the "Virtual Environment {version}" element. Defensive cascade:
    // the canonical DOM id first, then a broader id match, then a last-resort
    // text scan over a narrow candidate set (leaf nodes only, never <title>).
    function findVersionInfo() {
        let el = document.getElementById("versioninfo");
        if (el) {
            return el;
        }
        el = document.querySelector('div[id="versioninfo"]');
        if (el) {
            return el;
        }
        const candidates = document.querySelectorAll("div, span");
        let i, node, text;
        for (i = 0; i < candidates.length; i++) {
            node = candidates[i];
            if (node.tagName === "TITLE" || node.children.length !== 0) {
                continue;
            }
            text = (node.textContent || "").trim();
            if (text.indexOf("Virtual Environment") === 0) {
                return node;
            }
        }
        return null;
    }

    // The innermost element that shrink-wraps the actual version text, so we
    // can hug its right edge rather than #versioninfo's wider measured box.
    // Falls back to #versioninfo itself if the inner structure differs.
    function findVersionText(versionInfo) {
        return (
            document.getElementById("versioninfo-innerCt") ||
            versionInfo.querySelector(".x-autocontainer-innerCt") ||
            versionInfo
        );
    }

    // Position the (absolutely-positioned) badge immediately to the right of
    // the version text, vertically centred on it, expressed in the badge's
    // offsetParent coordinate space (the box container). Uses live geometry so
    // it stays correct regardless of ExtJS's pixel offsets and theme metrics.
    function position(badge, versionInfo) {
        const parent = badge.offsetParent || versionInfo.parentNode;
        if (!parent) {
            return;
        }
        const textEl = findVersionText(versionInfo);
        const textRect = textEl.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const GAP = 8;

        // Right edge of the version text, relative to the badge's parent.
        const left = textRect.right - parentRect.left + GAP;
        // Vertically centre the badge on the text's midline.
        const midY = textRect.top - parentRect.top + textRect.height / 2;
        const top = midY - badge.offsetHeight / 2;

        badge.style.left = `${Math.round(left)  }px`;
        badge.style.top = `${Math.round(top)  }px`;
    }

    function sync() {
        const versionInfo = findVersionInfo();
        const badge = document.getElementById(BADGE_ID);
        if (versionInfo && badge) {
            position(badge, versionInfo);
        }
    }

    // Re-glue the badge whenever the header re-lays-out: window resize, and
    // PVE's async version update (el.update() on #versioninfo changes the text
    // width and, via ExtJS box layout, sibling offsets).
    function observe(versionInfo) {
        if (window.__pveModkitBadgeObserving) {
            return;
        }
        window.__pveModkitBadgeObserving = true;

        window.addEventListener("resize", sync);

        if (typeof ResizeObserver === "function") {
            const ro = new ResizeObserver(sync);
            ro.observe(versionInfo);
            if (versionInfo.parentNode) {
                ro.observe(versionInfo.parentNode);
            }
        }
        if (typeof MutationObserver === "function") {
            // Text/attr changes on #versioninfo (the async version populate,
            // and ExtJS re-writing inline left/width on relayout).
            const mo = new MutationObserver(sync);
            mo.observe(versionInfo, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ["style"]
            });
        }
    }

    function decorate() {
        const anchor = findVersionInfo();
        if (!anchor || !anchor.parentNode) {
            return false;
        }
        injectStyle();
        let badge = document.getElementById(BADGE_ID);
        if (!badge) {
            badge = document.createElement("span");
            badge.id = BADGE_ID;
            badge.setAttribute("title", "pve-modkit is installed and active");
            badge.appendChild(document.createTextNode(LABEL));
            // Inject as an absolutely-positioned SIBLING of #versioninfo inside
            // the box container -- NOT a child of #versioninfo (el.update()
            // clobbers its children). Absolute positioning is required because
            // the container lays siblings out with position:absolute; a plain
            // in-flow span would collapse to (0,0) over the logo.
            anchor.parentNode.appendChild(badge);
        }
        position(badge, anchor);
        observe(anchor);
        return true;
    }

    function run() {
        if (decorate()) {
            return;
        }
        // The header renders on Ext.onReady, but #versioninfo can settle a
        // moment later; retry briefly while the viewport mounts.
        let tries = 0;
        const timer = setInterval(() => {
            tries += 1;
            if (decorate() || tries >= 60) { // ~12s at 200ms
                clearInterval(timer);
                if (tries >= 60 && !document.getElementById(BADGE_ID)) {
                    console.warn(
                        "[pve-modkit] modkit-active-badge: version header " +
                        "not found; skipping");
                }
            }
        }, 200);
    }

    if (window.Ext && typeof Ext.onReady === "function") {
        Ext.onReady(run);
    } else if (document.readyState !== "loading") {
        run();
    } else {
        document.addEventListener("DOMContentLoaded", run);
    }
})();
