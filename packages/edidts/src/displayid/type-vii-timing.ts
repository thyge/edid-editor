import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdTypeVIIDetailedTiming,
  type DisplayIdTypeVIIDetailedTimingBlock,
} from './types';
import { clampBits, clampMinusOne } from './clamp';
import { decodeOptionsBit7, encodeOptionsBit7 } from './timing-options';

/**
 * DisplayID 2.0 §4.3.1 Type VII Detailed Timing descriptor length (Table 4-18).
 * Each descriptor is exactly 20 bytes. (edid-decode also adds optional extra
 * bytes from the block revision's bits 6:4 for 3D stereo; DisplayID 2.0 rev 0
 * reserves those, so the base 20-byte case is modeled here.)
 */
const TYPE_VII_TIMING_ENTRY_LENGTH = 20;

export function isTypeVIITimingPayloadLengthValid(length: number): boolean {
  return length % TYPE_VII_TIMING_ENTRY_LENGTH === 0;
}

export function decodeTypeVIITimingBlock(block: DisplayIdDataBlock): DisplayIdTypeVIIDetailedTimingBlock {
  const timings: DisplayIdTypeVIIDetailedTiming[] = [];

  for (let offset = 0; offset + TYPE_VII_TIMING_ENTRY_LENGTH <= block.payload.length; offset += TYPE_VII_TIMING_ENTRY_LENGTH) {
    const options = block.payload[offset + 3] ?? 0;

    timings.push({
      pixelClockKHz: 1 + readUint24LE(block.payload, offset),
      aspectRatio: options & 0x0f,
      interlaced: (options & 0x10) !== 0,
      stereo: (options >> 5) & 0x03,
      // Bit 7: "preferred" before block revision 2, "YCbCr 4:2:0" from it on.
      ...decodeOptionsBit7(options, block.revision),
      horizontalActive: 1 + readUint16LE(block.payload, offset + 4),
      horizontalBlanking: 1 + readUint16LE(block.payload, offset + 6),
      horizontalSyncOffset: 1 + readFrontPorch(block.payload, offset + 8),
      horizontalSyncPolarity: ((block.payload[offset + 9] ?? 0) & 0x80) !== 0,
      horizontalSyncWidth: 1 + readUint16LE(block.payload, offset + 10),
      verticalActive: 1 + readUint16LE(block.payload, offset + 12),
      verticalBlanking: 1 + readUint16LE(block.payload, offset + 14),
      verticalSyncOffset: 1 + readFrontPorch(block.payload, offset + 16),
      verticalSyncPolarity: ((block.payload[offset + 17] ?? 0) & 0x80) !== 0,
      verticalSyncWidth: 1 + readUint16LE(block.payload, offset + 18),
    });
  }

  return {
    ...block,
    tag: DisplayIdDataBlockTag.TypeVIIDetailedTiming,
    timings,
  };
}

export function encodeTypeVIITimingBlock(block: DisplayIdTypeVIIDetailedTimingBlock): Uint8Array {
  const payload = new Uint8Array(block.timings.length * TYPE_VII_TIMING_ENTRY_LENGTH);

  block.timings.forEach((timing, index) => {
    const offset = index * TYPE_VII_TIMING_ENTRY_LENGTH;

    writeUint24LE(payload, offset, clampMinusOne(timing.pixelClockKHz, 24));

    payload[offset + 3] =
      clampBits(timing.aspectRatio, 4) |
      (timing.interlaced ? 0x10 : 0) |
      (clampBits(timing.stereo, 2) << 5) |
      encodeOptionsBit7(timing, block.revision);

    writeUint16LE(payload, offset + 4, clampMinusOne(timing.horizontalActive, 16));
    writeUint16LE(payload, offset + 6, clampMinusOne(timing.horizontalBlanking, 16));
    writeFrontPorch(payload, offset + 8, clampMinusOne(timing.horizontalSyncOffset, 15), timing.horizontalSyncPolarity);
    writeUint16LE(payload, offset + 10, clampMinusOne(timing.horizontalSyncWidth, 16));
    writeUint16LE(payload, offset + 12, clampMinusOne(timing.verticalActive, 16));
    writeUint16LE(payload, offset + 14, clampMinusOne(timing.verticalBlanking, 16));
    writeFrontPorch(payload, offset + 16, clampMinusOne(timing.verticalSyncOffset, 15), timing.verticalSyncPolarity);
    writeUint16LE(payload, offset + 18, clampMinusOne(timing.verticalSyncWidth, 16));
  });

  return payload;
}

/** Front porch is a 15-bit value (low 8 bits in byte n, high 7 bits in byte n+1 bits 6:0); byte n+1 bit 7 is the sync polarity. */
function readFrontPorch(data: Uint8Array, offset: number): number {
  const low = data[offset] ?? 0;
  const high = data[offset + 1] ?? 0;
  return low | ((high & 0x7f) << 8);
}

function writeFrontPorch(data: Uint8Array, offset: number, raw14: number, polarity: boolean): void {
  data[offset] = raw14 & 0xff;
  data[offset + 1] = ((raw14 >> 8) & 0x7f) | (polarity ? 0x80 : 0);
}

function readUint16LE(data: Uint8Array, offset: number): number {
  return (data[offset] ?? 0) | ((data[offset + 1] ?? 0) << 8);
}

function writeUint16LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
}

function readUint24LE(data: Uint8Array, offset: number): number {
  return (data[offset] ?? 0) | ((data[offset + 1] ?? 0) << 8) | ((data[offset + 2] ?? 0) << 16);
}

function writeUint24LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
  data[offset + 2] = (value >> 16) & 0xff;
}
