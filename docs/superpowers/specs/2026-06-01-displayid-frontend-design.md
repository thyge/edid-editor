# DisplayID 2.0 Frontend Support Design

## Goal

Flesh out the DisplayID portion of the EDID editor so DisplayID-based EDIDs can be decoded, edited, reordered, and re-encoded through the frontend. The target milestone is semantic support for every DisplayID 2.0 data block, built on the existing `packages/edidts` workspace package.

## Scope

This work includes:

- Complete DisplayID 2.0 block decode and encode support in `packages/edidts`.
- EDID extension integration for tag `0x70`.
- Block-centric Vue UI for DisplayID sections and blocks.
- Add, remove, and reorder controls for DisplayID sections and blocks.
- Validation and error states for malformed or out-of-range DisplayID data.
- Tests for library behavior and EDID extension integration.

This work does not include DisplayID 1.x semantic support.

## Architecture

`packages/edidts` remains the source of truth for DisplayID binary behavior. The existing DisplayID module already supports section mechanics, generic blocks, and Product Identification. The implementation will expand that module to cover every DisplayID 2.0 block listed in the current implementation log:

- Product Identification, tag `0x20`.
- Display Parameters, tag `0x21`.
- Type VII Detailed Timing, tag `0x22`.
- Type VIII Enumerated Timing Code, tag `0x23`.
- Type IX Formula Based Timing, tag `0x24`.
- Dynamic Video Timing Range Limits, tag `0x25`.
- Display Interface Features, tag `0x26`.
- Stereo Display Interface, tag `0x27`.
- Tiled Display Topology, tag `0x28`.
- ContainerID, tag `0x29`.
- Vendor-specific, tag `0x7e`.
- CTA DisplayID, tag `0x81`.

The EDID extension parser will route extension tag `0x70` to a typed DisplayID extension instead of treating it as a generic extension. DisplayID section lengths and checksums are computed by `edidts`, not by Vue components.

Unknown or vendor payloads must be preserved losslessly where the specification allows them. The UI may expose those payloads as hex, but encoding remains owned by `edidts`.

## UI Model

DisplayID uses the same block-centric navigation style as CEA. When a DisplayID extension exists, the left nav shows a DisplayID root with an overview and block entries.

DisplayID sections:

- Overview.
- Section Header.
- Product Identification.
- Display Parameters.
- Type VII Detailed Timings.
- Type VIII Enumerated Timings.
- Type IX Formula Timings.
- Dynamic Range Limits.
- Display Interface Features.
- Stereo Display Interface.
- Tiled Display Topology.
- ContainerID.
- Vendor-specific.
- CTA DisplayID.

Overview and header are always available for a DisplayID extension. Other sections appear when at least one matching block exists. Repeated blocks, especially timing and vendor blocks, are shown as editable lists with move up, move down, duplicate where useful, and remove controls.

The main panel should stay dense and utilitarian. Use compact headers, tables for timing lists, grouped rows for packed flags, toggles for booleans, numeric inputs for byte and word fields, and hex previews for payload-heavy data. The existing `HexViewer` remains the live encoded-byte feedback surface.

## Editing Flow

DisplayID editing mutates typed `edidts` objects, then uses the existing EDID synchronization path so the full EDID re-encodes and the hex viewer refreshes.

New app-level handlers mirror the CEA handlers:

- `addDisplayIdExtension()` creates a valid DisplayID 2.0 extension.
- `removeDisplayIdExtension()` removes the `0x70` block and returns navigation to overview if needed.
- `addDisplayIdBlock(type)` appends a typed default block.
- `removeDisplayIdBlock(index)` removes one DisplayID block.
- `moveDisplayIdBlock(index, direction)` reorders blocks.
- `updateDisplayId(field, value)` updates section header fields and per-block fields.

The binary model does not need persistent UI-only IDs. Vue can route repeated blocks by array index and tag while the encoded order remains the source of truth.

## Validation And Errors

Imported EDIDs should fail clearly when bytes cannot represent a DisplayID section. Recoverable issues should remain visible and editable where possible.

The UI should show:

- Section checksum validity.
- Declared versus encoded section length.
- DisplayID version and revision.
- Missing required fields for a block.
- Values outside byte, word, or specification ranges.
- Extension payloads too large for one 128-byte EDID extension block.
- Unknown or vendor payload preservation status.

Controls may constrain obvious ranges, but invalid imported values should not be silently clamped. The UI should mark invalid fields and avoid presenting invalid encoded bytes as a valid EDID.

## Testing

Library tests are the primary safety net.

For each DisplayID 2.0 block, add tests for:

- Decode from known bytes.
- Encode from typed fields.
- Exact round-trip preservation.
- Invalid length and range behavior.
- Checksum recalculation.
- Unknown or vendor payload preservation.

Add EDID integration tests proving extension tag `0x70` decodes to a typed DisplayID extension and re-encodes as a valid 128-byte extension block.

Vue tests are optional and should focus on small update helpers or form behavior if the repo adds a practical component test pattern. The required verification path for this milestone is `npm test` plus `npm run build`, followed by manual UI verification with at least one DisplayID-based EDID fixture.

## Implementation Strategy

Proceed in vertical slices:

1. Complete and test the next DisplayID block type in `edidts`.
2. Add or update the DisplayID extension integration if needed.
3. Expose the typed block through a Vue section.
4. Verify decode, edit, encode, and hex refresh.

This keeps the frontend aligned with tested binary behavior and prevents the UI from depending on placeholder parsing logic.
