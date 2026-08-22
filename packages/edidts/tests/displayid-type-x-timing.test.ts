import { describe, expect, it } from 'vitest';
import {
  decodeTypeXTimingBlock,
  encodeTypeXTimingBlock,
  isTypeXTimingPayloadLengthValid,
  type DisplayIdDataBlock,
  type DisplayIdTypeXTimingBlock,
} from '../src/displayid/type-x-timing';

const TYPE_X_TAG = 0x2a;

function buildBlock(descriptorSizeCode: number, payload: number[]): DisplayIdDataBlock {
  return {
    tag: TYPE_X_TAG,
    revision: 0,
    flags: descriptorSizeCode << 1,
    payloadLength: payload.length,
    payload: new Uint8Array(payload),
  };
}

describe('DisplayID Type X Timing (tag 0x2A)', () => {
  describe('isTypeXTimingPayloadLengthValid', () => {
    it('returns true when length is a positive whole multiple of descriptorSize', () => {
      expect(isTypeXTimingPayloadLengthValid(12, 6)).toBe(true);
      expect(isTypeXTimingPayloadLengthValid(14, 7)).toBe(true);
      expect(isTypeXTimingPayloadLengthValid(16, 8)).toBe(true);
    });

    it('returns false for zero or non-multiple lengths', () => {
      expect(isTypeXTimingPayloadLengthValid(0, 6)).toBe(false);
      expect(isTypeXTimingPayloadLengthValid(7, 6)).toBe(false);
      expect(isTypeXTimingPayloadLengthValid(13, 8)).toBe(false);
    });
  });

  it('decodes a 6-byte descriptor block (2 descriptors) with all fields', () => {
    // descriptor 0: options=0b11011011 (0xdb)
    //   timingFormula=3 (bits 2:0=011), earlyVsync=1 (bit3), rr1000div1001OrHblank=1 (bit4),
    //   stereoSupport=2 (bits 6:5=10), ycc420Support=1 (bit7)
    //   horizontalActivePixels=1920 (0x80,0x07), verticalActiveLines=1080 (0x38,0x04)
    //   refreshRate=60 (0x3c)
    // descriptor 1: options=0b00000000
    //   timingFormula=0, earlyVsync=0, rr1000div1001OrHblank=0, stereoSupport=0, ycc420Support=0
    //   horizontalActivePixels=1280 (0x00,0x05), verticalActiveLines=720 (0xd0,0x02)
    //   refreshRate=50 (0x32)
    const block = buildBlock(0, [
      0xdb, 0x80, 0x07, 0x38, 0x04, 0x3c,
      0x00, 0x00, 0x05, 0xd0, 0x02, 0x32,
    ]);

    const decoded = decodeTypeXTimingBlock(block);

    expect(decoded.tag).toBe(TYPE_X_TAG);
    expect(decoded.descriptorSize).toBe(6);
    expect(decoded.timings).toHaveLength(2);

    expect(decoded.timings[0]).toMatchObject({
      timingFormula: 3,
      earlyVsync: true,
      rr1000div1001OrHblank: true,
      stereoSupport: 2,
      ycc420Support: true,
      horizontalActivePixels: 1920,
      verticalActiveLines: 1080,
      refreshRate: 60,
    });

    expect(decoded.timings[1]).toMatchObject({
      timingFormula: 0,
      earlyVsync: false,
      rr1000div1001OrHblank: false,
      stereoSupport: 0,
      ycc420Support: false,
      horizontalActivePixels: 1280,
      verticalActiveLines: 720,
      refreshRate: 50,
    });
  });

  it('decodes a 7-byte descriptor block with refreshRateHigh, deltaHblank, additionalVblankTiming', () => {
    // byte 6 = 0b10101010 (0xaa)
    //   refreshRateHigh = 0b10 = 2
    //   deltaHblank = 0b010 = 2
    //   additionalVblankTiming = 0b101 = 5
    // base refreshRate = 0x01 -> full = 0x01 | (2 << 8) = 513
    const block = buildBlock(1, [
      0x00, 0x80, 0x07, 0x38, 0x04, 0x01, 0xaa,
    ]);

    const decoded = decodeTypeXTimingBlock(block);

    expect(decoded.descriptorSize).toBe(7);
    expect(decoded.timings).toHaveLength(1);
    expect(decoded.timings[0]).toMatchObject({
      refreshRate: 1,
      refreshRateHigh: 2,
      deltaHblank: 2,
      additionalVblankTiming: 5,
    });
    // full 10-bit refresh rate reconstruction
    expect(decoded.timings[0].refreshRate | (decoded.timings[0].refreshRateHigh << 8)).toBe(513);
  });

  it('decodes an 8-byte descriptor block and preserves reserved bits in byte 7 on round-trip', () => {
    // byte 7 = 0b11111111: bit0 = additionalMiniVblank=1, bits 7:1 reserved = 0b1111111
    const originalPayload = new Uint8Array([
      0x01, 0x80, 0x07, 0x38, 0x04, 0x3c, 0x00, 0xff,
    ]);
    const block = buildBlock(2, Array.from(originalPayload));

    const decoded = decodeTypeXTimingBlock(block);
    expect(decoded.descriptorSize).toBe(8);
    expect(decoded.timings).toHaveLength(1);
    expect(decoded.timings[0].additionalMiniVblank).toBe(true);

    const encoded = encodeTypeXTimingBlock(decoded);
    expect(Array.from(encoded)).toEqual(Array.from(originalPayload));
  });

  it('encode produces byte-identical output for a 6-byte descriptor block', () => {
    const originalPayload = new Uint8Array([
      0xdb, 0x80, 0x07, 0x38, 0x04, 0x3c,
      0x00, 0x00, 0x05, 0xd0, 0x02, 0x32,
    ]);
    const block = buildBlock(0, Array.from(originalPayload));

    const decoded = decodeTypeXTimingBlock(block);
    const encoded = encodeTypeXTimingBlock(decoded);

    expect(Array.from(encoded)).toEqual(Array.from(originalPayload));
  });

  it('encode produces byte-identical output for a 7-byte descriptor block', () => {
    const originalPayload = new Uint8Array([
      0x00, 0x80, 0x07, 0x38, 0x04, 0x01, 0xaa,
      0x10, 0x00, 0x05, 0xd0, 0x02, 0x32, 0x05,
    ]);
    const block = buildBlock(1, Array.from(originalPayload));

    const decoded = decodeTypeXTimingBlock(block);
    const encoded = encodeTypeXTimingBlock(decoded);

    expect(Array.from(encoded)).toEqual(Array.from(originalPayload));
  });

  it('mutates a decoded field, re-encodes, re-decodes, and keeps other fields stable (TASK-61)', () => {
    // The corpus has zero Type X Timing fixtures, so this synthetic mutation
    // test is the only safety net for the encode path.
    const block = buildBlock(0, [
      0xdb, 0x80, 0x07, 0x38, 0x04, 0x3c,
      0x00, 0x00, 0x05, 0xd0, 0x02, 0x32,
    ]);
    const decoded = decodeTypeXTimingBlock(block);
    expect(decoded.timings[0].horizontalActivePixels).toBe(1920);
    expect(decoded.timings[0].verticalActiveLines).toBe(1080);
    expect(decoded.timings[1].horizontalActivePixels).toBe(1280);

    // Edit horizontalActivePixels of timing 0; leave verticalActiveLines and timing 1 untouched.
    decoded.timings[0].horizontalActivePixels = 2048;
    const encoded = encodeTypeXTimingBlock(decoded);
    const redecoded = decodeTypeXTimingBlock({ ...block, payload: encoded });

    expect(redecoded.timings[0].horizontalActivePixels).toBe(2048);
    expect(redecoded.timings[0].verticalActiveLines).toBe(1080);
    expect(redecoded.timings[1].horizontalActivePixels).toBe(1280);
  });

  it('round-trips decode -> encode -> re-decode with stable fields (8-byte)', () => {
    const originalPayload = new Uint8Array([
      0x2b, 0x80, 0x07, 0x38, 0x04, 0x3c, 0x07, 0xfe,
    ]);
    const block = buildBlock(2, Array.from(originalPayload));

    const first = decodeTypeXTimingBlock(block);
    const encoded = encodeTypeXTimingBlock(first);
    const second = decodeTypeXTimingBlock({ ...block, payload: encoded });

    expect(second.timings).toHaveLength(1);
    expect(second.timings[0]).toMatchObject(first.timings[0]);
    expect(Array.from(encoded)).toEqual(Array.from(originalPayload));
  });

  it('falls back to empty timings when payload length is not a whole multiple of descriptorSize', () => {
    // descriptorSize=6 but payload length=7 (not divisible)
    const block = buildBlock(0, [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);

    const decoded = decodeTypeXTimingBlock(block);

    expect(decoded.timings).toEqual([]);
    expect(decoded.descriptorSize).toBe(6);
    expect(decoded.tag).toBe(TYPE_X_TAG);
  });

  it('falls back to empty timings when descriptorSizeCode is reserved (>=3)', () => {
    // descriptorSizeCode=3 -> reserved
    const block = buildBlock(3, [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);

    const decoded = decodeTypeXTimingBlock(block);

    expect(decoded.timings).toEqual([]);
    expect(decoded.tag).toBe(TYPE_X_TAG);
  });
});