import { describe, expect, it } from 'vitest';
import type { DisplayIdDataBlock } from '../src/displayid/types';
import {
  BRIGHTNESS_LUMINANCE_RANGE_PAYLOAD_LENGTH,
  decodeBrightnessLuminanceRangeBlock,
  encodeBrightnessLuminanceRangeBlock,
  isBrightnessLuminanceRangePayloadLengthValid,
  type DisplayIdBrightnessLuminanceRangeBlock,
} from '../src/displayid/brightness-luminance';

function makeBlock(payload: Uint8Array): DisplayIdDataBlock {
  return {
    tag: 0x2e,
    revision: 0,
    flags: 0,
    payloadLength: payload.length,
    payload,
  };
}

describe('isBrightnessLuminanceRangePayloadLengthValid', () => {
  it('returns true only for the fixed 6-byte payload length', () => {
    expect(isBrightnessLuminanceRangePayloadLengthValid(6)).toBe(true);
    expect(isBrightnessLuminanceRangePayloadLengthValid(4)).toBe(false);
    expect(isBrightnessLuminanceRangePayloadLengthValid(8)).toBe(false);
    expect(isBrightnessLuminanceRangePayloadLengthValid(0)).toBe(false);
  });

  it('exports the payload length constant as 6', () => {
    expect(BRIGHTNESS_LUMINANCE_RANGE_PAYLOAD_LENGTH).toBe(6);
  });
});

describe('decodeBrightnessLuminanceRangeBlock', () => {
  it('decodes the three LE u16 SDR luminance fields from a 6-byte payload', () => {
    // min=0x0064, max=0x01F4, boost=0x02BC (little-endian)
    const payload = new Uint8Array([0x64, 0x00, 0xf4, 0x01, 0xbc, 0x02]);
    const decoded = decodeBrightnessLuminanceRangeBlock(makeBlock(payload));

    expect(decoded.tag).toBe(0x2e);
    expect(decoded.minSdrLuminance).toBe(0x0064);
    expect(decoded.maxSdrLuminance).toBe(0x01f4);
    expect(decoded.maxBoostSdrLuminance).toBe(0x02bc);
  });

  it('falls back to zeroed fields without throwing when payload is not 6 bytes', () => {
    const tooShort = decodeBrightnessLuminanceRangeBlock(
      makeBlock(new Uint8Array([0x64, 0x00, 0xf4, 0x01])),
    );
    expect(tooShort.minSdrLuminance).toBe(0);
    expect(tooShort.maxSdrLuminance).toBe(0);
    expect(tooShort.maxBoostSdrLuminance).toBe(0);

    const tooLong = decodeBrightnessLuminanceRangeBlock(
      makeBlock(new Uint8Array([0x64, 0x00, 0xf4, 0x01, 0xbc, 0x02, 0xff, 0xff])),
    );
    expect(tooLong.minSdrLuminance).toBe(0);
    expect(tooLong.maxSdrLuminance).toBe(0);
    expect(tooLong.maxBoostSdrLuminance).toBe(0);
  });
});

describe('encodeBrightnessLuminanceRangeBlock', () => {
  it('writes the three LE u16 fields into a 6-byte payload', () => {
    const block: DisplayIdBrightnessLuminanceRangeBlock = {
      ...makeBlock(new Uint8Array(6)),
      tag: 0x2e,
      minSdrLuminance: 0x0064,
      maxSdrLuminance: 0x01f4,
      maxBoostSdrLuminance: 0x02bc,
    };

    const encoded = encodeBrightnessLuminanceRangeBlock(block);
    expect(Array.from(encoded)).toEqual([0x64, 0x00, 0xf4, 0x01, 0xbc, 0x02]);
  });

  it('produces a 6-byte zeroed payload from a fallback (zeroed) block', () => {
    const fallback = decodeBrightnessLuminanceRangeBlock(
      makeBlock(new Uint8Array([0x64, 0x00, 0xf4, 0x01])),
    );
    const encoded = encodeBrightnessLuminanceRangeBlock(fallback);
    expect(encoded.length).toBe(6);
    expect(Array.from(encoded)).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe('Brightness Luminance Range round-trip', () => {
  it('decode -> encode reproduces the original payload and keeps fields stable', () => {
    const original = new Uint8Array([0x64, 0x00, 0xf4, 0x01, 0xbc, 0x02]);
    const decoded = decodeBrightnessLuminanceRangeBlock(makeBlock(original));
    const encoded = encodeBrightnessLuminanceRangeBlock(decoded);

    expect(Array.from(encoded)).toEqual(Array.from(original));

    const redecoded = decodeBrightnessLuminanceRangeBlock({
      ...makeBlock(encoded),
      payload: encoded,
    });
    expect(redecoded.minSdrLuminance).toBe(decoded.minSdrLuminance);
    expect(redecoded.maxSdrLuminance).toBe(decoded.maxSdrLuminance);
    expect(redecoded.maxBoostSdrLuminance).toBe(decoded.maxBoostSdrLuminance);
  });
});