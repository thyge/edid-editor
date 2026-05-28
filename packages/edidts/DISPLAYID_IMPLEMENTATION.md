# DisplayID v2.0 Implementation Plan and Log

## Scope

This work adds DisplayID v2.0 support to the `edidts` library only. Vue UI integration is out of scope for this milestone.

## Design

Add `packages/edidts/src/displayid/` as a sibling module to `edid/` and `cta/`, then export it from `packages/edidts/src/index.ts`.

The first implementation layer handles DisplayID section/container mechanics:

- `types.ts`: public DisplayID section, warning, block, tag, and error types.
- `checksum.ts`: section checksum calculation and validation.
- `blocks.ts`: generic three-byte data block header parsing, encoding, dispatch, and unknown block preservation.
- `section.ts`: DisplayID section decode/encode.
- `index.ts`: public DisplayID exports.

Known data block implementations are added section by section after the container is stable:

- Section 4.1 Product Identification, tag `0x20`.
- Section 4.2 Display Parameters, tag `0x21`.
- Section 4.3 Video Timing Mode blocks, tags `0x22`, `0x23`, `0x24`.
- Section 4.4 Dynamic Video Timing Range Limits, tag `0x25`.
- Section 4.5 Display Interface Features, tag `0x26`.
- Section 4.6 Stereo Display Interface, tag `0x27`.
- Section 4.7 Tiled Display Topology, tag `0x28`.
- Section 4.8 ContainerID, tag `0x29`.
- Section 4.9 Vendor-specific, tag `0x7e`.
- Section 4.10 CTA DisplayID, tag `0x81`.

## Parsing Rules

- Decode starts from a `Uint8Array` containing one DisplayID section.
- Byte `0x00` is the structure version and revision. The initial implementation supports DisplayID v2.0 byte `0x20`.
- Byte `0x01` stores bytes in section excluding the four-byte header and checksum, so total section length is `bytesInSection + 5`.
- Byte `0x02` is the base section product primary use case. In extension sections it is `0x00`.
- Byte `0x03` is the base section extension count or extension index/count metadata.
- Data blocks begin at byte `0x04`.
- A section checksum is valid when the unsigned sum of all declared section bytes is `0` modulo 256.
- Fixed-length trailing `0x00` fill after the last valid data block is ignored.
- Unknown or unsupported blocks are preserved byte-for-byte as generic blocks.

## Error and Warning Policy

- Throw `DisplayIdDecodeError` only when the input cannot represent a DisplayID section, such as fewer than five bytes or a declared section length beyond the available buffer.
- Return warnings for recoverable issues such as invalid checksum, unsupported structure version, malformed data block length, reserved legacy tags, and fixed-length trailing fill.

## Test Strategy

Use `packages/edidts/tests/displayid.test.ts`.

Each section gets decode, encode, and round-trip tests. The first tests cover:

- Valid section header decode.
- Checksum validation.
- Encode recalculates checksum.
- Unknown block round-trip preservation.
- Fixed-length trailing fill handling.
- Malformed data block length warning.
- Reserved DisplayID v1.x tag warning.

## Task Checklist

- [x] Section 2: DisplayID section header, declared length, checksum, fixed-length fill handling.
- [x] Section 3: Generic data block header parsing, unknown block preservation, reserved tag warnings.
- [x] Section 4.1: Product Identification block.
- [ ] Section 4.2: Display Parameters block.
- [ ] Section 4.3: Video Timing Mode blocks, starting with Type VII Detailed Timing.
- [ ] Section 4.4: Dynamic Video Timing Range Limits block.
- [ ] Section 4.5: Display Interface Features block.
- [ ] Section 4.6: Stereo Display Interface block.
- [ ] Section 4.7: Tiled Display Topology block.
- [ ] Section 4.8: ContainerID block.
- [ ] Section 4.9: Vendor-specific block.
- [ ] Section 4.10: CTA DisplayID data block.
- [ ] E-EDID integration: route extension tag `0x70` to the DisplayID decoder once the section decoder is stable.

## Progress Log

### 2026-05-28

- Created isolated worktree at `/Users/thygehaarberg/Documents/edid-editor/.worktrees/displayid-edidts`.
- Created branch `displayid-edidts`.
- Ran baseline verification with `npm test`.
- Baseline result: 6 test files passed, 70 tests passed.
- Confirmed milestone scope is `edidts` library only.
- Chose a tracked library-local plan/log file because `docs/` is gitignored and ignored files should not be added.
- Implemented Section 2 and Section 3 container support:
  - `decodeDisplayIdSection`
  - `encodeDisplayIdSection`
  - checksum calculation and validation
  - generic DisplayID data block decoding and encoding
  - unknown block preservation
  - trailing fill handling
  - malformed block length and reserved legacy tag warnings
- Added `packages/edidts/tests/displayid.test.ts`.
- Focused verification: `npm test -- packages/edidts/tests/displayid.test.ts`, 1 test file passed, 6 tests passed.
- Implemented Section 4.1 Product Identification support:
  - IEEE OUI decode/encode
  - vendor product ID decode/encode
  - optional numeric serial number
  - manufacture week and model-year handling
  - product name byte preservation and ASCII-compatible text
- Focused verification: `npm test -- packages/edidts/tests/displayid.test.ts`, 1 test file passed, 8 tests passed.
