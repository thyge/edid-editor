// packages/edidts/src/displayid/v1-blocks.ts
//
// DisplayID 1.x section data-block walker + dispatch delegates.
//
// DisplayID 1.x (VESA DisplayID v1.0–v1.3) reuses the v2.0 section header and
// 3-byte block framing, but a different block-tag space (0x00–0x13 + 0x7f
// vendor) and per-block layouts. The per-block codecs live in v1-codecs.ts (a
// leaf module) so the shared `DISPLAYID_BLOCK_CODECS` registry in blocks.ts can
// reference them without an import cycle. This file holds only the block
// walker; `decodeKnownV1Block`/`encodeV1KnownPayload` are thin delegates to the
// shared registry so v1.x dispatch is the same `Record<tag, {decode, encode}>`
// single dispatch site as v2.0.
//
// All field layouts cross-checked against edid-decode parse-displayid-block.cpp
// (the `version < 0x20` arm of each parser, where the v1.x and v2.0 paths split).

import type { DisplayIdDataBlock } from './types';
import { decodeKnownBlock, encodeKnownPayload } from './blocks';

// Re-export the payload-length validators so the public index keeps its
// existing surface (tests import these from the package root).
export {
  isV1ProductIdentificationPayloadLengthValid,
  isV1DisplayParametersPayloadLengthValid,
  isV1TypeITimingPayloadLengthValid,
  isV1TiledDisplayTopologyPayloadLengthValid,
  isV1VendorSpecificPayloadLengthValid,
} from './v1-codecs';

export interface DecodeV1BlocksResult {
  blocks: DisplayIdDataBlock[];
  /** Verbatim trailing bytes after the last decoded block (may be empty). */
  fillBytesRaw: Uint8Array;
}

const HEADER_LENGTH = 3;

// ---------------------------------------------------------------------------
// Walker
// ---------------------------------------------------------------------------

/**
 * Walk the data-block area of a DisplayID 1.x section and decode every block.
 *
 * `startOffset`/`endOffset` bound the data-block area (section bytes 4..4+
 * bytesInSection). The v1.x stop conditions mirror edid-decode's
 * parse_displayid_block loop (parse-displayid-block.cpp:1610):
 *   - fewer than 3 bytes remain → stop (preserve the 1-2 leftover bytes raw);
 *   - `tag === 0 && len === 0` → v1.x end-marker, stop (preserve from here raw);
 *   - a declared block overruns `endOffset` → stop (preserve from here raw).
 * Unlike v2.0, a `tag === 0x00` byte is NOT fill — it is the Product
 * Identification block; only the zero-length zero-tag triple is the marker.
 */
export function decodeDisplayIdBlocksV1(
  data: Uint8Array,
  startOffset: number,
  endOffset: number,
): DecodeV1BlocksResult {
  const blocks: DisplayIdDataBlock[] = [];
  let offset = startOffset;

  while (offset < endOffset) {
    if (offset + HEADER_LENGTH > endOffset) {
      // 1-2 trailing bytes with no room for a full block header.
      return { blocks, fillBytesRaw: data.slice(offset, endOffset) };
    }

    const tag = data[offset];
    const revisionAndFlags = data[offset + 1];
    const payloadLength = data[offset + 2];
    const blockEnd = offset + HEADER_LENGTH + payloadLength;

    if (tag === 0 && payloadLength === 0) {
      // v1.x end-marker: stop without consuming it.
      return { blocks, fillBytesRaw: data.slice(offset, endOffset) };
    }

    if (blockEnd > endOffset) {
      // Declared block overruns the section payload — preserve the remainder raw.
      return { blocks, fillBytesRaw: data.slice(offset, endOffset) };
    }

    const genericBlock: DisplayIdDataBlock = {
      tag,
      revision: revisionAndFlags & 0x07,
      flags: revisionAndFlags >> 3,
      payloadLength,
      payload: data.slice(offset + HEADER_LENGTH, blockEnd),
    };

    blocks.push(decodeKnownV1Block(genericBlock));
    offset = blockEnd;
  }

  return { blocks, fillBytesRaw: new Uint8Array() };
}

// ---------------------------------------------------------------------------
// Dispatch delegates — thin wrappers over the shared registry in blocks.ts.
// Kept as the public entry points so the package index surface is unchanged;
// the actual dispatch is one `Record<tag, {decode, encode}>` lookup.
// ---------------------------------------------------------------------------

/**
 * Decode a single v1.x data block via the shared DisplayID block registry.
 * Known tags with a valid payload length decode to a structured block;
 * everything else (unknown tags, known tags with a malformed/short payload)
 * falls through to the opaque default entry and returns the raw carrier.
 */
export function decodeKnownV1Block(block: DisplayIdDataBlock): DisplayIdDataBlock {
  return decodeKnownBlock(block);
}

/**
 * Encode a v1.x block's payload from its structured fields via the shared
 * DisplayID block registry. Unknown/raw v1.x blocks keep their `payload` as-is
 * via the opaque default entry. Always returns bytes (the opaque entry is a
 * verbatim `payload` pass-through; the legacy `| null` sentinel is gone).
 */
export function encodeV1KnownPayload(block: DisplayIdDataBlock): Uint8Array {
  return encodeKnownPayload(block);
}