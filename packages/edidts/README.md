# edidts

Framework-agnostic TypeScript library for decoding and encoding EDID (Extended
Display Identification Data), CEA-861 extension blocks, and DisplayID data.

## Features

The core data model is byte-oriented: every block parses a `Uint8Array` via a
static `decode()` and serializes back via a static `encode()`. The top-level
container is `EEDID` (base block + extensions); consumers use
`EEDID.decode/encode/blank` and reach base-block fields through `.base`.

- **EDID 1.4 base block** (`edid/`) — header, video input, screen size, gamma,
  feature-support flags, color characteristics, established / standard / detailed
  timings, and the four 18-byte display-descriptor slots (DTD or tagged text
  blocks such as serial number, monitor ranges, CVT 0xF8, Established Timings III).
- **CTA-861 extension** (`cta/`) — full block encode/decode (`encodeCEA` /
  `ExtensionBlockParser`) covering the 0x02 CEA tag, the 0x10 VTB and 0xF0 Block
  Map arms, data blocks (video, audio, speaker, vendor-specific), and the
  extended-tag data blocks (`cta-extended-blocks.ts`: HDR static metadata,
  colorimetry, video capability, YCbCr 4:2:0, etc.). HDMI 1.4 and HDMI 2.0 VSDBs
  are decoded as `VendorSpecificDataBlock` variants.
- **DisplayID 2.0** (`displayid/`) — section encode/decode plus per-tag block
  types: product identification, display parameters, Type VII/VIII/IX/X timings,
  tiled topology, adaptive-sync, AR/VR, dynamic range limits, and more.
- **CVT timing generator** (`common/cvt-timing-generator.ts`) — CVT-RB blanking
  math (`calculateCVTTiming`, `generateCVTDetailedTiming`) and analysis helpers.
- **CTA block generation** — CTA-861 extension blocks serialize via
  `ExtensionBlockParser.encode()` (dispatching the 0x02 CEA, 0x10 VTB, and 0xF0
  Block Map arms), building the block from its data-block and detailed-timing
  lists with the DTD offset and checksum computed automatically.
- **Cross-format helpers** — `collectTimingsByPriority` (VESA E-EDID §5 timing
  order) and `collectVideoModeRefs` (a uniform `VideoModeRef` view over CTA VICs,
  DisplayID enumerated codes, DTDs, Standard Timings, and CVT codes).
- **Binary utilities** (`common/`) — 8-bit checksum, IEEE OUI read/write, PnP ID
  registry, standard-timing aspect-ratio helpers, and the shared 18-byte
  Detailed Timing Descriptor codec used by both EDID and CTA.

## Build

```sh
npm install
npm run build          # tsc + Vite, produces dist/index.js + .d.ts
```

## Examples

`examples/print-edid.ts` decodes the built-in demo EDID (the same blob the Vue app loads on mount) into the `EEDID` data model and prints a human-readable summary, then re-encodes it to show the round-trip. Run it from the repo root:

```sh
npx tsx packages/edidts/examples/print-edid.ts
# or decode a different EDID (commas/spaces ok):
npx tsx packages/edidts/examples/print-edid.ts "00,FF,FF,..."
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
