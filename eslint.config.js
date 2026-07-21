// ESLint flat config for pve-modkit.
//
// Strictness policy (mirrors the Perl::Critic "brutal + documented exclusions"
// approach in .perlcriticrc): start from `@eslint/js` `all` (every core rule
// enabled) and then disable ONLY the handful of rules that actively fight a
// deliberately-simple, dependency-free browser IIFE. Every disable below has a
// one-line justification. Everything else stays at maximum strictness.
//
// The linted files are vanilla browser scripts injected into the Proxmox VE web
// UI (not ES modules): a classic-script loader (src/share/ext.js) plus mods
// under src/mods and examples. They run in the browser and may reference the
// Proxmox-provided `Ext` / `PVE` globals.

"use strict";

const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    {
        ignores: [
            "node_modules/**",
            "dist/**",
            ".build-tmp/**",
            ".local/**",
        ],
    },
    {
        files: ["src/**/*.js", "examples/**/*.js"],
        languageOptions: {
            // Classic browser scripts (IIFEs), not ES modules.
            sourceType: "script",
            ecmaVersion: 2023,
            globals: {
                ...globals.browser,
                // Proxmox VE web UI globals present at runtime.
                Ext: "readonly",
                PVE: "readonly",
            },
        },
        // Enable every core ESLint rule, then relax the documented few.
        ...js.configs.all,
        rules: {
            ...js.configs.all.rules,

            // --- Documented, intentional relaxations -------------------------

            // Multiple `var`/`const` declarations per function are fine; forcing
            // a single combined declaration hurts readability in these scripts.
            "one-var": "off",

            // Short, conventional identifiers (id, fn, el, cb) are clear here.
            "id-length": "off",

            // These are terse operational scripts; not every comment is a
            // capitalized sentence, and inline/trailing comments are useful.
            "capitalized-comments": "off",
            "no-inline-comments": "off",
            "line-comment-position": "off",

            // Ternaries and nested ternaries are used sparingly and readably.
            "no-ternary": "off",
            "no-nested-ternary": "off",

            // Object key order is semantic (e.g. CSS-ish/DOM order), not alpha.
            "sort-keys": "off",

            // Named function declarations are the intended style for the IIFE
            // helper functions; do not force function expressions.
            "func-style": ["error", "declaration", { allowArrowFunctions: true }],

            // Retry counters / index walks read best with ++ / --.
            "no-plusplus": "off",

            // DOM geometry, timings, HTTP status codes, retry counts, etc. are
            // self-evident literals; a magic-number ban is pure noise here.
            "no-magic-numbers": "off",

            // A single guard `return;` before the main body is clearer than
            // wrapping the whole function in an if.
            "no-negated-condition": "off",

            // These small DOM helpers are cohesive; arbitrary size/branch caps
            // would force unnatural splitting.
            "max-statements": "off",
            "max-lines-per-function": "off",
            "complexity": "off",

            // Allow a reasonable line width consistent with the rest of the repo.
            "max-len": ["error", { code: 100, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],

            // We intentionally keep `'use strict';` directives (classic scripts).
            "strict": ["error", "function"],

            // Sorting import/var groups alphabetically is not desired.
            "sort-vars": "off",

            // These are browser-injected loader/mod scripts; console.info,
            // console.warn and console.error are deliberate operator-facing
            // diagnostics (load summary, give-up warnings, fetch failures).
            // Plain console.log stays banned.
            "no-console": ["error", { allow: ["info", "warn", "error"] }],

            // Loop-scoped temporaries (i, src, node, text) are assigned inside
            // the loop body; a placeholder initializer at declaration is noise.
            "init-declarations": "off",

            // Early `continue` is idiomatic control flow in the leaf-node
            // text-scan cascades; banning it forces awkward extra nesting.
            "no-continue": "off",

            // Anonymous IIFEs and anonymous timer/event/observer callbacks are
            // idiomatic vanilla browser JS; forcing every function expression to
            // carry a name adds noise without value.
            "func-names": "off",

            // `window.__pveModkitLoaded` / `window.__pveModkitBadgeObserving`
            // are intentional double-underscore global-guard names used to make
            // the injected scripts idempotent; the dangle ban fights that.
            "no-underscore-dangle": "off",
        },
    },
];
