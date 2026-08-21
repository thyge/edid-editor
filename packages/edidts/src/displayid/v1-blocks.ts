// packages/edidts/src/displayid/v1-blocks.ts
//
// DisplayID 1.x section data-block codec. DisplayID 1.x (VESA DisplayID
// v1.0–v1.3) reuses the v2.0 section header and 3-byte block framing, but a
// different block-tag space (0x00–0x13 + 0x7f vendor) and per-block layouts.
// This file holds the v1.x block walker, the per-tag dispatch, and the four
// first-increment block codecs (Product Identification 0x00, Display Parameters
// 0x01, Type 1 Detailed Timings 0x03, Tiled Display Topology 0x12). Unknown v1.x
// tags — and known tags with a malformed/short payload — fall through to the
// raw generic carrier so the section still round-trips byte-identically.
//
// All field layouts cross-checked against edid-decode parse-displayid-block.cpp
// (the `version < 0x20` arm of each parser, where the v1.x and v2.0 paths split).

import {
  DISPLAY_ID_V1_BLOCK_TAGS,
  type DisplayIdDataBlock,
  type DisplayIdTypeVIIDetailedTiming,
  type DisplayIdV1DisplayParametersBlock,
  type DisplayIdV1ProductIdentificationBlock,
  type DisplayIdV1TiledDisplayTopologyBlock,
  type DisplayIdV1TypeIDetailedTimingBlock,
} from './types';

export interface DecodeV1BlocksResult {
  blocks: DisplayIdDataBlock[];
  /** Verbatim trailing bytes after the last decoded block (may be empty). */
  fillBytesRaw: Uint8Array;
}

const HEADER_LENGTH = 3;
const TYPE_I_TIMING_ENTRY_LENGTH = 20;
const TILED_TOPOLOGY_PAYLOAD_LENGTH = 22;
const DISPLAY_PARAMETERS_PAYLOAD_LENGTH = 12;
const PRODUCT_ID_FIXED_LENGTH = 12;

// ---------------------------------------------------------------------------
// Walker + dispatch
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

/**
 * Decode a single v1.x data block. Known tags with a valid payload length
 * decode to a structured block; everything else (unknown tags, known tags with
 * a malformed/short payload) is returned as the raw generic carrier.
 */
export function decodeKnownV1Block(block: DisplayIdDataBlock): DisplayIdDataBlock {
  const { tag, payload, payloadLength } = block;

  if (tag === DISPLAY_ID_V1_BLOCK_TAGS.ProductIdentification) {
    const nameLen = payload[11] ?? 0;
    if (payloadLength >= PRODUCT_ID_FIXED_LENGTH && PRODUCT_ID_FIXED_LENGTH + nameLen <= payloadLength) {
      return decodeV1ProductIdentificationBlock(block);
    }
  }

  if (tag === DISPLAY_ID_V1_BLOCK_TAGS.DisplayParameters && payloadLength === DISPLAY_PARAMETERS_PAYLOAD_LENGTH) {
    return decodeV1DisplayParametersBlock(block);
  }

  if (tag === DISPLAY_ID_V1_BLOCK_TAGS.TypeIDetailedTiming && payloadLength % TYPE_I_TIMING_ENTRY_LENGTH === 0) {
    return decodeV1TypeITimingBlock(block);
  }

  if (tag === DISPLAY_ID_V1_BLOCK_TAGS.TiledDisplayTopology && payloadLength === TILED_TOPOLOGY_PAYLOAD_LENGTH) {
    return decodeV1TiledDisplayTopologyBlock(block);
  }

  // Unknown v1.x tag, or vendor-specific (0x7f) — not modeled in this increment.
  return block;
}

// ---------------------------------------------------------------------------
// Encode routing
// ---------------------------------------------------------------------------

/**
 * Encode a v1.x block's payload from its structured fields. Called by the
 * shared `encodeDisplayIdBlock` (via `encodeKnownPayload`) when a v1.x typed
 * block is detected. Unknown/raw v1.x blocks keep their `payload` as-is.
 */
export function encodeV1KnownPayload(block: DisplayIdDataBlock): Uint8Array | null {
  if (isTypedV1ProductIdentificationBlock(block)) {
    return encodeV1ProductIdentificationBlock(block);
  }
  if (isTypedV1DisplayParametersBlock(block)) {
    return encodeV1DisplayParametersBlock(block);
  }
  if (isTypedV1TypeITimingBlock(block)) {
    return encodeV1TypeITimingBlock(block);
  }
  if (isTypedV1TiledDisplayTopologyBlock(block)) {
    return encodeV1TiledDisplayTopologyBlock(block);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Product Identification (tag 0x00)
// ---------------------------------------------------------------------------

export function isV1ProductIdentificationPayloadLengthValid(payloadLength: number): boolean {
  return payloadLength >= PRODUCT_ID_FIXED_LENGTH;
}

export function decodeV1ProductIdentificationBlock(
  block: DisplayIdDataBlock,
): DisplayIdV1ProductIdentificationBlock {
  const payload = block.payload;
  const productNameLength = payload[11] ?? 0;
  const productNameBytes = payload.slice(PRODUCT_ID_FIXED_LENGTH, PRODUCT_ID_FIXED_LENGTH + productNameLength);
  const serialNumber = readU32le(payload, 5);
  const weekByte = payload[9] ?? 0;
  const yearByte = payload[10] ?? 0;

  return {
    ...block,
    tag: DISPLAY_ID_V1_BLOCK_TAGS.ProductIdentification,
    vendorId: decodeAscii(payload.slice(0, 3)),
    productCode: readU16le(payload, 3),
    serialNumber,
    manufactureWeek: weekByte === 0 || weekByte === 0xff ? undefined : weekByte,
    year: yearByte === 0 ? undefined : 2000 + yearByte,
    isModelYear: weekByte === 0xff,
    productNameLength,
    productNameBytes,
    productName: decodeAscii(productNameBytes),
  };
}

export function encodeV1ProductIdentificationBlock(
  block: DisplayIdV1ProductIdentificationBlock,
): Uint8Array {
  const productNameBytes = block.productNameBytes.length > 0
    ? block.productNameBytes
    : encodeAscii(block.productName);
  const minimumLength = PRODUCT_ID_FIXED_LENGTH + productNameBytes.length;
  // Start from the existing payload so any trailing bytes (after the name) are
  // preserved verbatim — mirrors the v2.0 product-identification encoder.
  const payload = block.payload.length >= minimumLength
    ? block.payload.slice()
    : new Uint8Array(minimumLength);

  const vendorBytes = encodeAscii(block.vendorId);
  payload[0] = vendorBytes[0] ?? 0;
  payload[1] = vendorBytes[1] ?? 0;
  payload[2] = vendorBytes[2] ?? 0;
  writeU16le(payload, 3, block.productCode);
  writeU32le(payload, 5, block.serialNumber);
  payload[9] = block.isModelYear ? 0xff : (block.manufactureWeek ?? 0);
  payload[10] = block.year === undefined ? 0 : Math.max(0, block.year - 2000) & 0xff;
  payload[11] = productNameBytes.length & 0xff;
  payload.set(productNameBytes, PRODUCT_ID_FIXED_LENGTH);

  return payload;
}

// ---------------------------------------------------------------------------
// Display Parameters (tag 0x01, fixed 12 bytes)
// ---------------------------------------------------------------------------

export function isV1DisplayParametersPayloadLengthValid(length: number): boolean {
  return length === DISPLAY_PARAMETERS_PAYLOAD_LENGTH;
}

export function decodeV1DisplayParametersBlock(block: DisplayIdDataBlock): DisplayIdV1DisplayParametersBlock {
  const p = block.payload;
  const colorDepthByte = p[11] ?? 0;

  return {
    ...block,
    tag: DISPLAY_ID_V1_BLOCK_TAGS.DisplayParameters,
    horizontalImageSizeTenthsMm: readU16le(p, 0),
    verticalImageSizeTenthsMm: readU16le(p, 2),
    horizontalPixelCount: readU16le(p, 4),
    verticalPixelCount: readU16le(p, 6),
    featureSupportFlags: p[8] ?? 0,
    gamma: p[9] ?? 0xff,
    aspectRatio: p[10] ?? 0,
    nativeColorDepthCode: colorDepthByte & 0x0f,
    overallColorDepthCode: (colorDepthByte >> 4) & 0x0f,
  };
}

export function encodeV1DisplayParametersBlock(block: DisplayIdV1DisplayParametersBlock): Uint8Array {
  const payload = new Uint8Array(DISPLAY_PARAMETERS_PAYLOAD_LENGTH);

  writeU16le(payload, 0, block.horizontalImageSizeTenthsMm);
  writeU16le(payload, 2, block.verticalImageSizeTenthsMm);
  writeU16le(payload, 4, block.horizontalPixelCount);
  writeU16le(payload, 6, block.verticalPixelCount);
  payload[8] = block.featureSupportFlags & 0xff;
  payload[9] = block.gamma & 0xff;
  payload[10] = block.aspectRatio & 0xff;
  payload[11] = ((block.overallColorDepthCode & 0x0f) << 4) | (block.nativeColorDepthCode & 0x0f);

  return payload;
}

// ---------------------------------------------------------------------------
// Type 1 Detailed Timings (tag 0x03, 20-byte descriptors)
// ---------------------------------------------------------------------------

export function isV1TypeITimingPayloadLengthValid(length: number): boolean {
  return length % TYPE_I_TIMING_ENTRY_LENGTH === 0;
}

export function decodeV1TypeITimingBlock(block: DisplayIdDataBlock): DisplayIdV1TypeIDetailedTimingBlock {
  const timings: DisplayIdTypeVIIDetailedTiming[] = [];

  for (
    let offset = 0;
    offset + TYPE_I_TIMING_ENTRY_LENGTH <= block.payload.length;
    offset += TYPE_I_TIMING_ENTRY_LENGTH
  ) {
    const options = block.payload[offset + 3] ?? 0;
    // Type 1 pixel clock is 10 kHz resolution: pixclk_khz = 10 * (1 + raw24).
    // (Type VII is 1 kHz; the only difference between the two codecs.)
    timings.push({
      pixelClockKHz: 10 * (1 + readU24le(block.payload, offset)),
      aspectRatio: options & 0x0f,
      interlaced: (options & 0x10) !== 0,
      stereo: (options >> 5) & 0x03,
      preferred: (options & 0x80) !== 0,
      horizontalActive: 1 + readU16le(block.payload, offset + 4),
      horizontalBlanking: 1 + readU16le(block.payload, offset + 6),
      horizontalSyncOffset: 1 + readFrontPorch(block.payload, offset + 8),
      horizontalSyncPolarity: ((block.payload[offset + 9] ?? 0) & 0x80) !== 0,
      horizontalSyncWidth: 1 + readU16le(block.payload, offset + 10),
      verticalActive: 1 + readU16le(block.payload, offset + 12),
      verticalBlanking: 1 + readU16le(block.payload, offset + 14),
      verticalSyncOffset: 1 + readFrontPorch(block.payload, offset + 16),
      verticalSyncPolarity: ((block.payload[offset + 17] ?? 0) & 0x80) !== 0,
      verticalSyncWidth: 1 + readU16le(block.payload, offset + 18),
    });
  }

  return {
    ...block,
    tag: DISPLAY_ID_V1_BLOCK_TAGS.TypeIDetailedTiming,
    timings,
  };
}

export function encodeV1TypeITimingBlock(block: DisplayIdV1TypeIDetailedTimingBlock): Uint8Array {
  const payload = new Uint8Array(block.timings.length * TYPE_I_TIMING_ENTRY_LENGTH);

  block.timings.forEach((timing, index) => {
    const offset = index * TYPE_I_TIMING_ENTRY_LENGTH;
    // Reverse the 10 kHz scaling: raw24 = pixclk_khz / 10 - 1.
    writeU24le(payload, offset, clampNonNeg(Math.floor(timing.pixelClockKHz / 10) - 1));

    payload[offset + 3] =
      (timing.aspectRatio & 0x0f) |
      (timing.interlaced ? 0x10 : 0) |
      ((timing.stereo & 0x03) << 5) |
      (timing.preferred ? 0x80 : 0);

    writeU16le(payload, offset + 4, clampNonNeg(timing.horizontalActive - 1));
    writeU16le(payload, offset + 6, clampNonNeg(timing.horizontalBlanking - 1));
    writeFrontPorch(payload, offset + 8, clampNonNeg(timing.horizontalSyncOffset - 1), timing.horizontalSyncPolarity);
    writeU16le(payload, offset + 10, clampNonNeg(timing.horizontalSyncWidth - 1));
    writeU16le(payload, offset + 12, clampNonNeg(timing.verticalActive - 1));
    writeU16le(payload, offset + 14, clampNonNeg(timing.verticalBlanking - 1));
    writeFrontPorch(payload, offset + 16, clampNonNeg(timing.verticalSyncOffset - 1), timing.verticalSyncPolarity);
    writeU16le(payload, offset + 18, clampNonNeg(timing.verticalSyncWidth - 1));
  });

  return payload;
}

// ---------------------------------------------------------------------------
// Tiled Display Topology (tag 0x12, fixed 22 bytes)
// ---------------------------------------------------------------------------

export function isV1TiledDisplayTopologyPayloadLengthValid(length: number): boolean {
  return length === TILED_TOPOLOGY_PAYLOAD_LENGTH;
}

export function decodeV1TiledDisplayTopologyBlock(
  block: DisplayIdDataBlock,
): DisplayIdV1TiledDisplayTopologyBlock {
  const p = block.payload;
  const caps = p[0] ?? 0;
  const b1 = p[1] ?? 0;
  const b2 = p[2] ?? 0;
  const b3 = p[3] ?? 0;

  // 6-bit packed topology & location (payload[1..3]); human value = stored + 1.
  const tileCountVertical = ((b1 & 0x0f) | (b3 & 0x30)) + 1;
  const tileCountHorizontal = ((b1 >> 4) | ((b3 & 0xc0) >> 2)) + 1;
  const tileLocationVertical = ((b2 & 0x0f) | ((b3 & 0x03) << 4)) + 1;
  const tileLocationHorizontal = ((b2 >> 4) | ((b3 & 0x0c) << 2)) + 1;

  return {
    ...block,
    tag: DISPLAY_ID_V1_BLOCK_TAGS.TiledDisplayTopology,
    singleTileBehavior: caps & 0x07,
    subsetTileBehavior: (caps >> 3) & 0x03,
    bezelInfoPresent: (caps & 0x40) !== 0,
    singleEnclosure: (caps & 0x80) !== 0,
    tileCountHorizontal,
    tileCountVertical,
    tileLocationHorizontal,
    tileLocationVertical,
    tileWidthPixels: readU16le(p, 4) + 1,
    tileHeightPixels: readU16le(p, 6) + 1,
    pixelMultiplier: p[8] ?? 0,
    topBezelSize: p[9] ?? 0,
    bottomBezelSize: p[10] ?? 0,
    rightBezelSize: p[11] ?? 0,
    leftBezelSize: p[12] ?? 0,
    // v1.x carries a 3-character ASCII vendor ID (not the big-endian OUI of v2.0).
    vendorId: decodeAscii(p.slice(13, 16)),
    productId: readU16le(p, 16),
    serialNumber: readU32le(p, 18),
  };
}

export function encodeV1TiledDisplayTopologyBlock(
  block: DisplayIdV1TiledDisplayTopologyBlock,
): Uint8Array {
  const payload = new Uint8Array(TILED_TOPOLOGY_PAYLOAD_LENGTH);
  // Preserve reserved bit 5 of the capabilities byte from the incoming payload.
  const reservedBit5 = (block.payload[0] ?? 0) & 0x20;

  payload[0] =
    reservedBit5 |
    (block.singleTileBehavior & 0x07) |
    ((block.subsetTileBehavior & 0x03) << 3) |
    (block.bezelInfoPresent ? 0x40 : 0) |
    (block.singleEnclosure ? 0x80 : 0);

  const vCount = clamp6(block.tileCountVertical - 1);
  const hCount = clamp6(block.tileCountHorizontal - 1);
  const vLoc = clamp6(block.tileLocationVertical - 1);
  const hLoc = clamp6(block.tileLocationHorizontal - 1);
  payload[1] = ((hCount & 0x0f) << 4) | (vCount & 0x0f);
  payload[2] = ((hLoc & 0x0f) << 4) | (vLoc & 0x0f);
  payload[3] =
    ((hCount & 0x30) << 2) |
    (vCount & 0x30) |
    ((hLoc & 0x30) >> 2) |
    ((vLoc & 0x30) >> 4);

  writeU16le(payload, 4, clamp16(block.tileWidthPixels - 1));
  writeU16le(payload, 6, clamp16(block.tileHeightPixels - 1));
  payload[8] = block.pixelMultiplier & 0xff;
  payload[9] = block.topBezelSize & 0xff;
  payload[10] = block.bottomBezelSize & 0xff;
  payload[11] = block.rightBezelSize & 0xff;
  payload[12] = block.leftBezelSize & 0xff;

  const vendorBytes = encodeAscii(block.vendorId);
  payload[13] = vendorBytes[0] ?? 0;
  payload[14] = vendorBytes[1] ?? 0;
  payload[15] = vendorBytes[2] ?? 0;
  writeU16le(payload, 16, clamp16(block.productId));
  writeU32le(payload, 18, block.serialNumber);

  return payload;
}

// ---------------------------------------------------------------------------
// Encode type guards
// ---------------------------------------------------------------------------

function isTypedV1ProductIdentificationBlock(
  block: DisplayIdDataBlock,
): block is DisplayIdV1ProductIdentificationBlock {
  const maybe = block as Partial<DisplayIdV1ProductIdentificationBlock>;
  return (
    block.tag === DISPLAY_ID_V1_BLOCK_TAGS.ProductIdentification &&
    typeof maybe.vendorId === 'string' &&
    typeof maybe.productCode === 'number' &&
    typeof maybe.serialNumber === 'number' &&
    typeof maybe.isModelYear === 'boolean' &&
    maybe.productNameBytes instanceof Uint8Array &&
    typeof maybe.productName === 'string'
  );
}

function isTypedV1DisplayParametersBlock(
  block: DisplayIdDataBlock,
): block is DisplayIdV1DisplayParametersBlock {
  const maybe = block as Partial<DisplayIdV1DisplayParametersBlock>;
  return (
    block.tag === DISPLAY_ID_V1_BLOCK_TAGS.DisplayParameters &&
    typeof maybe.horizontalImageSizeTenthsMm === 'number' &&
    typeof maybe.verticalImageSizeTenthsMm === 'number' &&
    typeof maybe.featureSupportFlags === 'number'
  );
}

function isTypedV1TypeITimingBlock(
  block: DisplayIdDataBlock,
): block is DisplayIdV1TypeIDetailedTimingBlock {
  const maybe = block as Partial<DisplayIdV1TypeIDetailedTimingBlock>;
  return (
    block.tag === DISPLAY_ID_V1_BLOCK_TAGS.TypeIDetailedTiming &&
    Array.isArray(maybe.timings)
  );
}

function isTypedV1TiledDisplayTopologyBlock(
  block: DisplayIdDataBlock,
): block is DisplayIdV1TiledDisplayTopologyBlock {
  const maybe = block as Partial<DisplayIdV1TiledDisplayTopologyBlock>;
  return (
    block.tag === DISPLAY_ID_V1_BLOCK_TAGS.TiledDisplayTopology &&
    typeof maybe.vendorId === 'string' &&
    typeof maybe.singleTileBehavior === 'number' &&
    typeof maybe.productId === 'number' &&
    typeof maybe.serialNumber === 'number'
  );
}

// ---------------------------------------------------------------------------
// Binary helpers (local copies; the v2.0 codecs keep theirs private too)
// ---------------------------------------------------------------------------

function readU16le(data: Uint8Array, offset: number): number {
  return (data[offset] | (data[offset + 1] << 8)) >>> 0;
}

function writeU16le(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
}

function readU24le(data: Uint8Array, offset: number): number {
  return (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16)) >>> 0;
}

function writeU24le(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
  data[offset + 2] = (value >> 16) & 0xff;
}

function readU32le(data: Uint8Array, offset: number): number {
  return (
    (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)) >>> 0
  );
}

function writeU32le(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
  data[offset + 2] = (value >> 16) & 0xff;
  data[offset + 3] = (value >> 24) & 0xff;
}

/** Front porch: 14-bit value (low 8 in byte n, high 6 in byte n+1 bits 6:0); byte n+1 bit 7 is sync polarity. */
function readFrontPorch(data: Uint8Array, offset: number): number {
  const low = data[offset] ?? 0;
  const high = data[offset + 1] ?? 0;
  return low | ((high & 0x7f) << 8);
}

function writeFrontPorch(data: Uint8Array, offset: number, raw14: number, polarity: boolean): void {
  data[offset] = raw14 & 0xff;
  data[offset + 1] = ((raw14 >> 8) & 0x7f) | (polarity ? 0x80 : 0);
}

function clamp6(value: number): number {
  return Math.max(0, Math.min(0x3f, value | 0));
}

function clamp16(value: number): number {
  return Math.max(0, Math.min(0xffff, value | 0));
}

function clampNonNeg(value: number): number {
  return value < 0 ? 0 : Math.floor(value);
}

function decodeAscii(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => String.fromCharCode(byte & 0x7f)).join('');
}

function encodeAscii(value: string): Uint8Array {
  return new Uint8Array(Array.from(value, (ch) => ch.charCodeAt(0) & 0xff));
}