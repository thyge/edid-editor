import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdTypeIXFormulaBasedTiming,
  type DisplayIdTypeIXFormulaBasedTimingBlock,
} from './types';

/**
 * DisplayID 2.0 §4.3.3 Type IX Formula-based Timing descriptor (Table 4-21).
 *
 * Fixed 6-byte descriptor. Byte 0 carries the formula (bits 2:0), NTSC
 * pull-down (bit 4), and stereo (bits 6:5). Active pixel/line counts use the
 * "1 + raw16" convention; refresh rate is 1 + byte5 (1-256 Hz). Source:
 * edid-decode parse_displayid_type_9_timing.
 */
const TYPE_IX_TIMING_ENTRY_LENGTH = 6;

export function isTypeIXTimingPayloadLengthValid(length: number): boolean {
  return length % TYPE_IX_TIMING_ENTRY_LENGTH === 0;
}

export function decodeTypeIXTimingBlock(block: DisplayIdDataBlock): DisplayIdTypeIXFormulaBasedTimingBlock {
  const timings: DisplayIdTypeIXFormulaBasedTiming[] = [];

  for (let offset = 0; offset + TYPE_IX_TIMING_ENTRY_LENGTH <= block.payload.length; offset += TYPE_IX_TIMING_ENTRY_LENGTH) {
    const options = block.payload[offset] ?? 0;

    timings.push({
      formula: options & 0x07,
      ntscPullDown: (options & 0x10) !== 0,
      stereo: (options >> 5) & 0x03,
      horizontalActive: 1 + readUint16LE(block.payload, offset + 1),
      verticalActive: 1 + readUint16LE(block.payload, offset + 3),
      refreshRateHz: 1 + (block.payload[offset + 5] ?? 0),
    });
  }

  return {
    ...block,
    tag: DisplayIdDataBlockTag.TypeIXFormulaBasedTiming,
    timings,
  };
}

export function encodeTypeIXTimingBlock(block: DisplayIdTypeIXFormulaBasedTimingBlock): Uint8Array {
  const payload = new Uint8Array(block.timings.length * TYPE_IX_TIMING_ENTRY_LENGTH);

  block.timings.forEach((timing, index) => {
    const offset = index * TYPE_IX_TIMING_ENTRY_LENGTH;

    payload[offset] =
      (timing.formula & 0x07) |
      (timing.ntscPullDown ? 0x10 : 0) |
      ((timing.stereo & 0x03) << 5);

    writeUint16LE(payload, offset + 1, clampNonNeg(timing.horizontalActive - 1));
    writeUint16LE(payload, offset + 3, clampNonNeg(timing.verticalActive - 1));
    payload[offset + 5] = clampNonNeg(timing.refreshRateHz - 1) & 0xff;
  });

  return payload;
}

function readUint16LE(data: Uint8Array, offset: number): number {
  return (data[offset] ?? 0) | ((data[offset + 1] ?? 0) << 8);
}

function writeUint16LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
}

function clampNonNeg(value: number): number {
  return value < 0 ? 0 : Math.floor(value);
}