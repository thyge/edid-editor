import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdTypeVIIDetailedTiming,
  type DisplayIdTypeVIIDetailedTimingBlock,
} from './types';

const TYPE_VII_TIMING_ENTRY_LENGTH = 12;

export function isTypeVIITimingPayloadLengthValid(length: number): boolean {
  return length % TYPE_VII_TIMING_ENTRY_LENGTH === 0;
}

export function decodeTypeVIITimingBlock(block: DisplayIdDataBlock): DisplayIdTypeVIIDetailedTimingBlock {
  const timings: DisplayIdTypeVIIDetailedTiming[] = [];

  for (let offset = 0; offset < block.payload.length; offset += TYPE_VII_TIMING_ENTRY_LENGTH) {
    const flags = block.payload[offset + 11] ?? 0;

    timings.push({
      pixelClockKHz: readUint16LE(block.payload, offset) * 100,
      horizontalActive: (block.payload[offset + 2] ?? 0) | (((block.payload[offset + 3] ?? 0) & 0x0f) << 8),
      horizontalBlanking: ((block.payload[offset + 3] ?? 0) >> 4) | ((block.payload[offset + 4] ?? 0) << 4),
      horizontalSyncOffset: block.payload[offset + 5] ?? 0,
      horizontalSyncWidth: block.payload[offset + 6] ?? 0,
      verticalActive: (block.payload[offset + 7] ?? 0) | (((block.payload[offset + 8] ?? 0) & 0x0f) << 8),
      verticalBlanking: ((block.payload[offset + 8] ?? 0) >> 4) | ((block.payload[offset + 9] ?? 0) << 4),
      verticalSyncOffset: (block.payload[offset + 10] ?? 0) & 0x0f,
      verticalSyncWidth: ((block.payload[offset + 10] ?? 0) >> 4) & 0x0f,
      preferred: (flags & 0x01) !== 0,
      interlaced: (flags & 0x02) !== 0,
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
    writeUint16LE(payload, offset, Math.round(timing.pixelClockKHz / 100));
    payload[offset + 2] = timing.horizontalActive & 0xff;
    payload[offset + 3] = ((timing.horizontalActive >> 8) & 0x0f) | ((timing.horizontalBlanking & 0x0f) << 4);
    payload[offset + 4] = (timing.horizontalBlanking >> 4) & 0xff;
    payload[offset + 5] = timing.horizontalSyncOffset & 0xff;
    payload[offset + 6] = timing.horizontalSyncWidth & 0xff;
    payload[offset + 7] = timing.verticalActive & 0xff;
    payload[offset + 8] = ((timing.verticalActive >> 8) & 0x0f) | ((timing.verticalBlanking & 0x0f) << 4);
    payload[offset + 9] = (timing.verticalBlanking >> 4) & 0xff;
    payload[offset + 10] = (timing.verticalSyncOffset & 0x0f) | ((timing.verticalSyncWidth & 0x0f) << 4);
    payload[offset + 11] = (timing.preferred ? 0x01 : 0) | (timing.interlaced ? 0x02 : 0);
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
