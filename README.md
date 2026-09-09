# edid-editor

Client-side EDID viewer and editor.

The project is a continuation of [goedid](https://github.com/thyge/goedid).

## Architecture

The project has two layers:

- **[edidts](https://github.com/thyge/edid-editor/tree/main/packages/edidts)** (`packages/edidts/`) — the core: a framework-agnostic TypeScript library (an npm workspace package) that owns all EDID, CTA-861, and DisplayID decoding and encoding. The data model is byte-oriented: each format class parses a `Uint8Array` via a static `decode()` and serializes back via a static `encode()`. `EEDID` is the top-level container, `EDID` is the 128-byte base block, and the per-spec extension types (CTA-861, DisplayID, VTB, Block Map) live alongside.
- **Vue app** (`src/`) — the editor UI built on top of the library. View components mirror the data model, mutations bind directly to the reactive `EEDID` tree, and a single computed re-encodes the bytes after every edit.

## Goals

- Being able to visualise EDID, CEA and DisplayID
- Being able to edit key aspects of EDID, CEA and DisplayID

## Development

```sh
npm run dev      # start the Vite development server
npm run build    # type-check with vue-tsc and build for production
npm run preview  # preview the production build locally
```

The `edidts` package has its own scripts, run from `packages/edidts/`:

```sh
npm run build  # type-check with tsc and build with Vite
npx vitest run # run the library's test suite
```

### Testing

```sh
npm test            # run the Vue app + edidts test suites (in-module fixtures only)
npm run test:corpus # run the edidts corpus tests against the linuxhw/EDID collection
```

The corpus run exercises the parser against the ~175k real EDIDs in
[linuxhw/EDID](https://github.com/linuxhw/EDID). That collection is **not** tracked
in this repo — clone it locally (one-time, ~5 GB) where the loader reads from:

```sh
git clone --depth=1 https://github.com/linuxhw/EDID.git packages/edidts/tests/fixtures-linuxhw
```

The `packages/edidts/tests/fixtures-linuxhw/` directory (and a root `tests/`
checkout) is gitignored. If the directory is absent the loader silently skips it
and falls back to the in-module fixtures, so CI and fresh clones see no change.
To run a deterministic sample instead of the full corpus, set `EDID_FIXTURE_LIMIT`
(see `packages/edidts/README.md` for details).

### Tech stack

Vue 3 (Composition API), Vite 7, TypeScript 5.9, Tailwind CSS v4, shadcn-vue, `@vueuse/core`, `reka-ui`, Vitest.

### Inspired by

- https://tomverbeure.github.io/video_timings_calculator
- https://github.com/dgallegos/edidreader
- https://github.com/ValZapod/edid-decode
- https://www.monitortests.com/forum/Thread-Custom-Resolution-Utility-CRU