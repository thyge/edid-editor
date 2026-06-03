# edidts

Framework-agnostic TypeScript library for decoding and encoding EDID (Extended
Display Identification Data), CEA-861 extension blocks, and DisplayID data.

## Build

```sh
npm install
npm run build          # tsc + Vite, produces dist/index.js + .d.ts
```

## Tests

```sh
# From packages/edidts/ (or via `npm run test:corpus` at the repo root):
npx vitest run             # all tests against the in-module fixtures
npm run test:corpus        # tests/testedids.test.ts against the full corpus
                           # (requires fixtures-linuxhw/ — see below)
```

## Real-world corpus (linuxhw/EDID)

The corpus tests in `tests/testedids.test.ts` parse every EDID it loads. To
exercise the parser against the ~175k EDIDs in
[linuxhw/EDID](https://github.com/linuxhw/EDID):

```sh
# 1. Clone the corpus (one-time, ~5 GB)
git clone --depth=1 https://github.com/linuxhw/EDID.git tests/fixtures-linuxhw

# 2. Run the corpus tests
npm run test:corpus
```

The `tests/fixtures-linuxhw/` directory is gitignored.

### Limiting the sample size

Set `EDID_FIXTURE_LIMIT` to a positive integer to run a deterministic uniform
sample of that size instead of the full corpus. The sample spans the full
alphabetically-sorted list, so it covers vendors from A to Z rather than
concentrating at the start. `0` (the default) loads everything.

```sh
EDID_FIXTURE_LIMIT=500 npx vitest run testedids.test.ts
```

The loader (`tests/fixture-loader.ts`) reads the limit from the env var. If the
linuxhw directory is absent, the loader silently skips it and falls back to
the in-module fixtures — CI and downstream consumers see no change.

### What the corpus exercises

`testedids.test.ts` runs the same set of `it.each` cases against every loaded
EDID: parse without throwing, header validity, base-block checksum, decode
→ encode → decode round-trip, header mutation round-trip, established
timing mutation, and content extraction. A failing file surfaces immediately
in the test report with its relative path (e.g. `Digital/LG Display/LGD0217/925C880E8A08`).
