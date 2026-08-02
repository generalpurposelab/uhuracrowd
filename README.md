# Uhura

A crowdsourced atlas mapping LLM evaluation benchmarks to low-resource languages — built by [General Purpose](https://generalpurpose.io). Browse a rotating 3D globe or a searchable list of ~1,200 languages, see which ones have documented LLM benchmarks, and submit ones you know about.

## Running it locally

```bash
npm install
npm run dev
```

The app is a static export served from a `/uhuracrowd` subpath (see "Deployment" below), so **the dev server lives at `http://localhost:3000/uhuracrowd`**, not `http://localhost:3000/`.

```bash
npm run lint   # eslint
npm run build  # production static export, also type-checks
```

## Architecture notes

- **Next.js 16 App Router**, all client-side (`"use client"` everywhere) — there's no backend; `data/languages.json` and `data/benchmarks.json` are static, bundled at build time.
- **The globe** ([`components/Globe.tsx`](components/Globe.tsx)) is rendered with [cobe](https://cobe.vercel.app), a WebGL globe library. It replaced an earlier flat SVG map (`react-simple-maps`). cobe only rasterizes to a `<canvas>` — it has no click/hover picking API and (in the v2 API this project uses) no per-frame render callback — so this file reimplements cobe's marker-projection math to do hit-testing by hand, and owns its own `requestAnimationFrame` loop with hand-rolled fling-momentum physics for drag-to-rotate. Read the comments at the top of that file before touching the rotation/hit-testing math.
- **Data pipeline**: `scripts/build-languages.py` builds `data/languages.json` from a raw Wikidata export (`data/wikidata-raw.json`) — it's a one-off/occasionally-rerun script, not part of the Next.js build.

## Brand system

Colors, type, and logo assets follow the General Purpose brand guide (Figma). Status:

| Piece | Status |
|---|---|
| Color palette (`--gp-black/silver/offwhite/blue/orange` in [`app/globals.css`](app/globals.css)) | ✅ Implemented from the brand guide's exact hex values |
| Body/label type (IBM Plex Sans, IBM Plex Mono) | ✅ Implemented |
| Headline type ("Exposure", Klim Type Foundry) | ⚠️ Not implemented — it's a licensed font with no web-font source available. Headlines use IBM Plex Sans Bold instead; see the comment in [`app/layout.tsx`](app/layout.tsx). |
| "GENERAL PURPOSE" logotype (footer) | ✅ Implemented as an inline SVG component ([`components/GPLogotype.tsx`](components/GPLogotype.tsx)), sourced from the brand guide's exported SVG |
| "Uhura" dot-matrix icon mark | ❌ Removed. An earlier attempt procedurally generated an approximation of the brand's halftone icon (no exported source asset existed to recreate exactly) and it didn't read well at header size — it was pulled rather than shipped looking sloppy. If a real vector export of that mark ever turns up, it belongs in the header where `UHURA` currently stands alone. |
| Endorsed lockup ("by GENERAL PURPOSE") | Exported asset exists at `public/brand/gp-logo-endorsed-stacked.svg` but isn't currently used anywhere in the UI (superseded by the plain logotype in the footer) |

Raw brand SVG exports live in `public/brand/` regardless of whether they're currently wired into a component — treat that directory as the asset library, not dead weight.

## Deployment

`output: "export"` + `basePath: "/uhuracrowd"` in [`next.config.ts`](next.config.ts) — this is a static site meant to be deployed under a `/uhuracrowd` path on a larger host, not a standalone Node server at a domain root.
