import { type DisplayIdDataBlock } from './types';

/** DisplayID 2.0 Adaptive Sync data block tag. */
export const ADAPTIVE_SYNC_TAG = 0x2b;

/** Per-descriptor size in bytes for the only defined descriptor-length code (0). */
const ADAPTIVE_SYNC_DESCRIPTOR_SIZE = 6;

/**
 * DisplayID 2.0 Adaptive Sync operation-range descriptor (6-byte form, len code 0).
 *
 * Field layout (payload-relative offsets within each descriptor):
 * - byte 0 — operation_range_info
 * - byte 1 — maxSingleFrameInc (raw 6.2 fixed-point byte)
 * - byte 2 — minRefreshRate (raw byte)
 * - bytes 3-4 — maxRefreshRate, 10-bit little-endian split (byte 3 = low 8 bits,
 *   byte 4 bits 1:0 = high 2 bits, byte 4 bits 7:2 reserved)
 * - byte 5 — maxSingleFrameDec (raw 6.2 fixed-point byte)
 */
export interface DisplayIdAdaptiveSyncDescriptor {
  /** bit 0 — operation range support. */
  range: boolean;
  /** bit 1 — successive frame increase-tolerance (duration inc flicker perf). */
  successiveFrameIncTolerance: boolean;
  /** bits 3:2 — adaptive-sync mode (0..3). */
  modes: number;
  /** bit 4 — seamless transition NOT supported. */
  seamlessTransitionNotSupport: boolean;
  /** bit 5 — successive frame decrease-tolerance (duration dec flicker perf). */
  successiveFrameDecTolerance: boolean;
  /** byte 1 — raw 6.2 fixed-point value (0.00–63.75 ms). */
  maxSingleFrameInc: number;
  /** byte 2 — raw minimum refresh rate. */
  minRefreshRate: number;
  /** bytes 3-4 — raw 10-bit max refresh rate field ((high<<8)|low). */
  maxRefreshRateRaw: number;
  /** Decoded max refresh rate in Hz = maxRefreshRateRaw + 1 (computed, not encoded). */
  maxRefreshRateHz?: number;
  /** byte 5 — raw 6.2 fixed-point value. */
  maxSingleFrameDec: number;
}

export interface DisplayIdAdaptiveSyncBlock extends DisplayIdDataBlock {
  tag: typeof ADAPTIVE_SYNC_TAG;
  descriptors: DisplayIdAdaptiveSyncDescriptor[];
}

/**
 * Reports whether a payload length is valid for the code-0 (6-byte descriptor) case:
 * a positive multiple of the descriptor size.
 */
export function isAdaptiveSyncPayloadValid(length: number): boolean {
  return length > 0 && length % ADAPTIVE_SYNC_DESCRIPTOR_SIZE === 0;
}

/**
 * Decodes a DisplayID 2.0 Adaptive Sync (tag 0x2B) data block.
 *
 * The per-descriptor length code is carried in the block flags:
 * `descriptorLenCode = (flags >> 1) & 0x07` (bits 6:4 of the revision/flags byte).
 * Only code 0 (6-byte descriptors) is defined; any other code, or a payload that
 * is not a positive multiple of 6, triggers an opaque fallback that returns the
 * block unchanged with an empty `descriptors` array (no throw).
 */
export function decodeAdaptiveSyncBlock(block: DisplayIdDataBlock): DisplayIdAdaptiveSyncBlock {
  const descriptorLenCode = (block.flags >> 1) & 0x07;

  if (descriptorLenCode !== 0 || !isAdaptiveSyncPayloadValid(block.payload.length)) {
    return { ...block, tag: ADAPTIVE_SYNC_TAG, descriptors: [] };
  }

  const descriptors: DisplayIdAdaptiveSyncDescriptor[] = [];
  for (let offset = 0; offset < block.payload.length; offset += ADAPTIVE_SYNC_DESCRIPTOR_SIZE) {
    const info = block.payload[offset];
    const maxLow = block.payload[offset + 3];
    const maxHighByte = block.payload[offset + 4];
    const maxHigh = maxHighByte & 0x03;
    const maxRefreshRateRaw = (maxHigh << 8) | maxLow;

    descriptors.push({
      range: (info & 0x01) !== 0,
      successiveFrameIncTolerance: (info & 0x02) !== 0,
      modes: (info >> 2) & 0x03,
      seamlessTransitionNotSupport: (info & 0x10) !== 0,
      successiveFrameDecTolerance: (info & 0x20) !== 0,
      maxSingleFrameInc: block.payload[offset + 1],
      minRefreshRate: block.payload[offset + 2],
      maxRefreshRateRaw,
      maxRefreshRateHz: maxRefreshRateRaw + 1,
      maxSingleFrameDec: block.payload[offset + 5],
    });
  }

  return { ...block, tag: ADAPTIVE_SYNC_TAG, descriptors };
}

/**
 * Encodes a DisplayID 2.0 Adaptive Sync (tag 0x2B) data block back to bytes.
 *
 * Starts from a copy of the original payload so reserved bits (byte 0 bits 7:6
 * and byte 4 bits 7:2) are preserved, then overwrites the modeled fields per
 * descriptor. When the payload length does not match `descriptors.length * 6`,
 * a fresh zeroed array of the correct size is used instead.
 */
export function encodeAdaptiveSyncBlock(block: DisplayIdAdaptiveSyncBlock): Uint8Array {
  const expectedLength = block.descriptors.length * ADAPTIVE_SYNC_DESCRIPTOR_SIZE;
  const payload =
    block.payload.length === expectedLength
      ? block.payload.slice()
      : new Uint8Array(expectedLength);

  block.descriptors.forEach((descriptor, index) => {
    const offset = index * ADAPTIVE_SYNC_DESCRIPTOR_SIZE;

    // byte 0: preserve bits 7:6, overwrite bits 5:0.
    payload[offset] =
      (payload[offset] & 0xc0) |
      (descriptor.range ? 0x01 : 0) |
      (descriptor.successiveFrameIncTolerance ? 0x02 : 0) |
      ((descriptor.modes & 0x03) << 2) |
      (descriptor.seamlessTransitionNotSupport ? 0x10 : 0) |
      (descriptor.successiveFrameDecTolerance ? 0x20 : 0);

    // byte 1: raw.
    payload[offset + 1] = descriptor.maxSingleFrameInc & 0xff;
    // byte 2: raw.
    payload[offset + 2] = descriptor.minRefreshRate & 0xff;

    // bytes 3-4: 10-bit little-endian, preserve byte 4 bits 7:2.
    payload[offset + 3] = descriptor.maxRefreshRateRaw & 0xff;
    payload[offset + 4] =
      (payload[offset + 4] & 0xfc) | ((descriptor.maxRefreshRateRaw >> 8) & 0x03);

    // byte 5: raw.
    payload[offset + 5] = descriptor.maxSingleFrameDec & 0xff;
  });

  return payload;
}