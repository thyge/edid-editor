import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdTypeIXFormulaBasedTiming,
  type DisplayIdTypeIXFormulaBasedTimingBlock,
} from './types';

const TYPE_IX_TIMING_ENTRY_LENGTH = 6;

export function isTypeIXTimingPayloadLengthValid(length: number): boolean {
  return length % TYPE_IX_TIMING_ENTRY_LENGTH === 0;
}

export function decodeTypeIXTimingBlock(block: DisplayIdDataBlock): DisplayIdTypeIXFormulaBasedTimingBlock {
  const timings: DisplayIdTypeIXFormulaBasedTiming[] = [];

  for (let offset = 0; offset < block.payload.length; offset += TYPE_IX_TIMING_ENTRY_LENGTH) {
    const flags = block.payload[offset + 5] ?? 0;

    timings.push({
      horizontalActive: readUint16LE(block.payload, offset),
      verticalActive: readUint16LE(block.payload, offset + 2),
      refreshRateHz: block.payload[offset + 4] ?? 0,
      preferred: (flags & 0x01) !== 0,
      reducedBlanking: (flags & 0x02) !== 0,
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
    writeUint16LE(payload, offset, timing.horizontalActive);
    writeUint16LE(payload, offset + 2, timing.verticalActive);
    payload[offset + 4] = timing.refreshRateHz & 0xff;
    payload[offset + 5] = (timing.preferred ? 0x01 : 0) | (timing.reducedBlanking ? 0x02 : 0);
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
