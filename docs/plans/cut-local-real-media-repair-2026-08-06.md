# CUT/LOCAL real-media repair plan

- `Tease:` Turn the deployed CUT/LOCAL shell into a verified local-first editor for real video and audio.
- `Lede:` Repair imported-media decoding, editing, audio scheduling, export, persistence, and browser proof before redeploying the existing `launchcut` Firebase Hosting site.
- `Why it matters:` The current app presents NLE controls but its export and verification paths do not prove that imported frames and audio survive the edit.
- `Go deeper:` Keep the generated BUILD/CUT/SHIP demo, but make two generated real-media files the acceptance path for import, source ranges, linked edits, export, replay, and phone usability.

## Scope and boundaries

- Work inside `apps/cut-local`, plus this progress record and the existing root lockfile only if dependency resolution changes it.
- Preserve all unrelated dirty-worktree changes.
- Deploy only the configured `cut-local` target after a successful dry run and local verification.
- Do not commit, push, provision, or modify any other Firebase Hosting site.

## Progress

- [x] Baseline environment doctor passed with Bun 1.3.14 and the pinned browser installed.
- [x] Baseline repository verification stopped on pre-existing CUT/LOCAL CSS formatting drift.
- [x] Audited the importer, compositor, audio engine, exporter, persistence, browser smoke, deployment mapping, and live site.
- [x] Replaced MIME-trusting ingestion with Mediabunny container and track validation.
- [x] Decoded requested imported frames before preview and export composition.
- [x] Scheduled preview audio continuously and rendered the export mix deterministically.
- [x] Completed source monitor, overwrite, timeline movement, title, track, relink, and persistence controls.
- [x] Independently parsed and replayed exported media before marking it verified.
- [x] Proved the real-media workflow at desktop and phone widths with fresh screenshots.
- [x] Ran app and repository verification, deployed only `launchcut`, live-verified it, and added the vanity URL to the app README.

## Proof record

### Local verification

- `bun run verify` passed the repository format, lint, typecheck, 68 root tests, and all app checks on 2026-08-06.
- `bun run app:verify --app cut-local` passed the completed app contract, dependency policy, typecheck, 21 unit tests with 74 expectations, production build, and browser verification.
- The project-owned browser smoke imported generated AVC/AAC media through the same file-input path as a user, restored the project from IndexedDB after reload, proved distinct source/program pixels, performed linked split and four-direction trim operations, moved clips across video tracks, exercised copy/paste/duplicate/undo/redo/ripple delete, and canceled then retried an export.
- Desktop viewport: 1440x900; independently parsed export: MP4 AVC/AAC, 720x720, 3.20 seconds. Screenshot: `apps/cut-local/test-results/smoke-desktop.png`.
- Phone viewport: 390x844; independently parsed export: MP4 AVC/AAC, 720x1280, 3.27 seconds. Screenshot: `apps/cut-local/test-results/smoke-phone.png`.

### Deployment proof

- `bun run deploy cut-local --dry-run` resolved project `sam-carlton-creative`, app `cut-local`, site `launchcut`, and `apps/cut-local/dist`; no mutation occurred.
- `bun run deploy cut-local --yes` built, deployed, verified the Hosting site, and verified the live URL on 2026-08-06.
- Live vanity URL: [https://launchcut.web.app](https://launchcut.web.app).
- A cache-busted HTTPS request returned `HTTP/2 200`; the live `index.html` SHA-256 matched the locally browser-verified build exactly: `1808d50779885f9b55567f5af92236caef737ef3b24a45624b50f2b28927917b`.
- The live hashed JavaScript and CSS assets also matched the local build byte for byte: `index-DCbRSNHG.js` and `index-CqqK5Fw7.css`.
- The deployment targeted the configured secondary Hosting site only. No commit, push, provisioning, default-site deployment, or other Firebase mutation was performed.

### Known limits

- Processing and export remain local to the browser; supported input and output codecs depend on the browser's media capabilities.
- Imported blobs persist in IndexedDB and are bounded by the browser's storage quota, so very large or long-form productions are not yet equivalent to a desktop NLE's disk-backed media cache.
- The production JavaScript chunk is about 555 kB before gzip and triggers Vite's advisory chunk-size warning; it does not fail the build or runtime proof.
