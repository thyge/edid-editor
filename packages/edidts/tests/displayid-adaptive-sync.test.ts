import { describe, expect, it } from 'vitest';
import type { DisplayIdDataBlock } from '../src/displayid/types';
import {
  decodeAdaptiveSyncBlock,
  encodeAdaptiveSyncBlock,
  isAdaptiveSyncPayloadValid,
  type DisplayIdAdaptiveSyncBlock,
} from '../src/displayid/adaptive-sync';

function makeBlock(payload: number[], flags = 0): DisplayIdDataBlock {
  return {
    tag: 0x2b,
    revision: 0,
    flags,
    payloadLength: payload.length,
    payload: new Uint8Array(payload),
  };
}

describe('DisplayID Adaptive Sync (0x2B) codec', () => {
  it('decodes two 6-byte descriptors with all modeled fields', () => {
    // Descriptor 1:
    //   byte0 = 0x3B: range=1, incTol=1, modes=2, seamlessNotSupport=1, decTol=1
    //   byte1 = 0x40 (maxSingleFrameInc), byte2 = 0x30 (minRefreshRate)
    //   byte3 = 0x90, byte4 = 0x01 -> maxRefreshRateRaw = (1<<8)|0x90 = 400
    //   byte5 = 0x20 (maxSingleFrameDec)
    // Descriptor 2:
    //   byte0 = 0x04: range=0, incTol=0, modes=1 (bits3:2=01), seamlessNotSupport=0, decTol=0
    //   byte1 = 0x10, byte2 = 0x3C
    //   byte3 = 0xE2, byte4 = 0x02 -> maxRefreshRateRaw = (2<<8)|0xE2 = 738
    //   byte5 = 0x0A
    const block = makeBlock([
      0x3b, 0x40, 0x30, 0x90, 0x01, 0x20,
      0x04, 0x10, 0x3c, 0xe2, 0x02, 0x0a,
    ]);
    const decoded = decodeAdaptiveSyncBlock(block);

    expect(decoded.tag).toBe(0x2b);
    expect(decoded.descriptors).toHaveLength(2);

    const d1 = decoded.descriptors[0];
    expect(d1.range).toBe(true);
    expect(d1.successiveFrameIncTolerance).toBe(true);
    expect(d1.modes).toBe(2);
    expect(d1.seamlessTransitionNotSupport).toBe(true);
    expect(d1.successiveFrameDecTolerance).toBe(true);
    expect(d1.maxSingleFrameInc).toBe(0x40);
    expect(d1.minRefreshRate).toBe(0x30);
    expect(d1.maxRefreshRateRaw).toBe(400);
    expect(d1.maxRefreshRateHz).toBe(401);
    expect(d1.maxSingleFrameDec).toBe(0x20);

    const d2 = decoded.descriptors[1];
    expect(d2.range).toBe(false);
    expect(d2.successiveFrameIncTolerance).toBe(false);
    expect(d2.modes).toBe(1);
    expect(d2.seamlessTransitionNotSupport).toBe(false);
    expect(d2.successiveFrameDecTolerance).toBe(false);
    expect(d2.maxSingleFrameInc).toBe(0x10);
    expect(d2.minRefreshRate).toBe(0x3c);
    expect(d2.maxRefreshRateRaw).toBe(738);
    expect(d2.maxRefreshRateHz).toBe(739);
    expect(d2.maxSingleFrameDec).toBe(0x0a);
  });

  it('preserves reserved bits in byte 0 (7:6) and byte 4 (7:2) across round-trip', () => {
    // byte0 = 0xAD: reserved bit7=1, bit6=0; range=1, incTol=0, modes=3, seamless=0, decTol=1
    //   0x80 (res) | 0x20 (decTol) | 0x0C (modes=3) | 0x01 (range) = 0xAD
    // byte4 = 0xFD: reserved bits7:2 = 0b111111 (0xFC), high bits 1:0 = 0x01
    //   -> maxRefreshRateRaw = (1<<8)|0x0F = 271
    const original = [0xad, 0x05, 0x24, 0x0f, 0xfd, 0x07];
    const block = makeBlock(original);
    const decoded = decodeAdaptiveSyncBlock(block);

    const d = decoded.descriptors[0];
    expect(d.range).toBe(true);
    expect(d.successiveFrameIncTolerance).toBe(false);
    expect(d.modes).toBe(3);
    expect(d.seamlessTransitionNotSupport).toBe(false);
    expect(d.successiveFrameDecTolerance).toBe(true);
    expect(d.maxSingleFrameInc).toBe(0x05);
    expect(d.minRefreshRate).toBe(0x24);
    expect(d.maxRefreshRateRaw).toBe(271);
    expect(d.maxSingleFrameDec).toBe(0x07);

    const encoded = encodeAdaptiveSyncBlock(decoded);
    expect(Array.from(encoded)).toEqual(original);
  });

  it('mutates a decoded field, re-encodes, re-decodes, and keeps other fields stable (TASK-61)', () => {
    // The corpus has zero Adaptive-Sync fixtures, so this synthetic mutation
    // test is the only safety net for the encode path.
    const block = makeBlock([
      0x3b, 0x40, 0x30, 0x90, 0x01, 0x20,
      0x04, 0x10, 0x3c, 0xe2, 0x02, 0x0a,
    ]);
    const decoded = decodeAdaptiveSyncBlock(block);
    expect(decoded.descriptors[0].minRefreshRate).toBe(0x30);
    expect(decoded.descriptors[0].maxSingleFrameInc).toBe(0x40);
    expect(decoded.descriptors[1].minRefreshRate).toBe(0x3c);

    // Edit minRefreshRate of descriptor 0; leave maxSingleFrameInc and descriptor 1 untouched.
    decoded.descriptors[0].minRefreshRate = 0x48;
    const encoded = encodeAdaptiveSyncBlock(decoded);
    const redecoded = decodeAdaptiveSyncBlock({ ...block, payload: encoded });

    expect(redecoded.descriptors[0].minRefreshRate).toBe(0x48);
    expect(redecoded.descriptors[0].maxSingleFrameInc).toBe(0x40);
    expect(redecoded.descriptors[1].minRefreshRate).toBe(0x3c);
  });

  it('round-trips decode -> encode -> re-decode with stable fields and identical bytes', () => {
    const originalPayload = [
      0x3b, 0x40, 0x30, 0x90, 0x01, 0x20,
      0x04, 0x10, 0x3c, 0xe2, 0x02, 0x0a,
    ];
    const block = makeBlock(originalPayload);
    const decoded = decodeAdaptiveSyncBlock(block);
    const encoded = encodeAdaptiveSyncBlock(decoded);
    expect(Array.from(encoded)).toEqual(originalPayload);

    const redecoded = decodeAdaptiveSyncBlock({ ...block, payload: encoded.slice() });
    expect(redecoded.descriptors).toHaveLength(2);
    expect(redecoded.descriptors[0]).toEqual(decoded.descriptors[0]);
    expect(redecoded.descriptors[1]).toEqual(decoded.descriptors[1]);
  });

  it('falls back to empty descriptors when payload length is not a multiple of 6', () => {
    const block = makeBlock([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
    const decoded = decodeAdaptiveSyncBlock(block);
    expect((decoded as DisplayIdAdaptiveSyncBlock).descriptors).toEqual([]);
    expect(decoded.tag).toBe(0x2b);
    // payload preserved unchanged for opaque fallback
    expect(Array.from(decoded.payload)).toEqual([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
  });

  it('falls back to empty descriptors when descriptorLenCode is nonzero', () => {
    // flags = 0x02 -> descriptorLenCode = (0x02 >> 1) & 0x07 = 1 (reserved)
    const block = makeBlock([0x3b, 0x40, 0x30, 0x90, 0x01, 0x20], 0x02);
    const decoded = decodeAdaptiveSyncBlock(block);
    expect((decoded as DisplayIdAdaptiveSyncBlock).descriptors).toEqual([]);
    expect(decoded.tag).toBe(0x2b);
  });

  it('isAdaptiveSyncPayloadValid reports positive multiples of 6', () => {
    expect(isAdaptiveSyncPayloadValid(6)).toBe(true);
    expect(isAdaptiveSyncPayloadValid(12)).toBe(true);
    expect(isAdaptiveSyncPayloadValid(0)).toBe(false);
    expect(isAdaptiveSyncPayloadValid(7)).toBe(false);
    expect(isAdaptiveSyncPayloadValid(1)).toBe(false);
  });
});