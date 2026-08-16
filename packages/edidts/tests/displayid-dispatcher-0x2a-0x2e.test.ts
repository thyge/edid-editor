import { describe, expect, it } from 'vitest';
import { decodeDisplayIdBlocks, encodeDisplayIdBlock } from '../src/displayid';

/**
 * Dispatcher integration tests for the DisplayID 2.0 data blocks added in
 * TASK-33..36 (tags 0x2A–0x2E). These exercise the shared dispatcher in
 * blocks.ts end-to-end: decodeDisplayIdBlocks must route each tag to its
 * structured decoder, and encodeDisplayIdBlock must route the typed block
 * back to its structured encoder, producing byte-identical output. Malformed-
 * length payloads must stay opaque (generic DisplayIdDataBlock) and also
 * round-trip byte-for-byte.
 */

/** Packs a single data block: [tag, revision/flags, payloadLength, ...payload]. */
function packBlock(tag: number, revFlags: number, payload: number[]): Uint8Array {
  return new Uint8Array([tag, revFlags, payload.length, ...payload]);
}

/** Deterministic non-zero byte pattern, used to fill payloads. */
function pattern(len: number): number[] {
  const out = new Array<number>(len);
  for (let i = 0; i < len; i++) out[i] = (i * 31 + 7) & 0xff;
  return out;
}

/** Decode the single block in `bytes` and re-encode it. */
function roundTrip(bytes: Uint8Array): Uint8Array {
  const { blocks } = decodeDisplayIdBlocks(bytes, 0, bytes.length);
  expect(blocks).toHaveLength(1);
  return encodeDisplayIdBlock(blocks[0]);
}

// revision/flags byte = revision 1, flags 0 (flags 0 gives the code-0 descriptor
// size that Type X and Adaptive Sync require; revision is arbitrary).
const REV_FLAGS = 0x01;

describe('DisplayID dispatcher routes 0x2A–0x2E', () => {
  it('0x2A Type X Timing: decodes structured and round-trips byte-for-byte', () => {
    const payload = pattern(6); // 6-byte descriptor, all fields modeled
    const bytes = packBlock(0x2a, REV_FLAGS, payload);

    const { blocks } = decodeDisplayIdBlocks(bytes, 0, bytes.length);
    const block = blocks[0];
    expect(Array.isArray((block as { timings?: unknown }).timings)).toBe(true);
    expect((block as { timings: unknown[] }).timings).toHaveLength(1);
    expect((block as { descriptorSize?: number }).descriptorSize).toBe(6);

    expect(Array.from(roundTrip(bytes))).toEqual(Array.from(bytes));
  });

  it('0x2B Adaptive Sync: decodes structured and round-trips byte-for-byte', () => {
    const payload = pattern(6);
    payload[0] &= ~0xc0; // reserved bits 7:6 → 0
    payload[4] &= ~0xfc; // reserved bits 7:2 → 0
    const bytes = packBlock(0x2b, REV_FLAGS, payload);

    const { blocks } = decodeDisplayIdBlocks(bytes, 0, bytes.length);
    const block = blocks[0];
    expect(Array.isArray((block as { descriptors?: unknown }).descriptors)).toBe(true);
    expect((block as { descriptors: unknown[] }).descriptors).toHaveLength(1);

    expect(Array.from(roundTrip(bytes))).toEqual(Array.from(bytes));
  });

  it('0x2C AR/VR HMD: decodes structured and round-trips byte-for-byte', () => {
    const payload = pattern(79);
    // Zero the reserved bits the HMD encoder preserves, so source == re-encoded.
    payload[0] &= ~0x8c;
    payload[15] &= ~0x88;
    payload[22] &= ~0xe0;
    payload[33] &= ~0xf0;
    payload[34] &= ~0xfc;
    payload[77] &= ~0xf0;
    const bytes = packBlock(0x2c, REV_FLAGS, payload);

    const { blocks } = decodeDisplayIdBlocks(bytes, 0, bytes.length);
    const block = blocks[0];
    expect(
      typeof (block as { dualLayerSingleStreamTransport?: number }).dualLayerSingleStreamTransport,
    ).toBe('number');

    expect(Array.from(roundTrip(bytes))).toEqual(Array.from(bytes));
  });

  it('0x2D AR/VR Layer: decodes structured and round-trips byte-for-byte', () => {
    const payload = pattern(20);
    payload[9] &= ~0xc0;
    payload[11] &= ~0xf0;
    payload[13] &= ~0xf0;
    payload[19] &= ~0xfc;
    const bytes = packBlock(0x2d, REV_FLAGS, payload);

    const { blocks } = decodeDisplayIdBlocks(bytes, 0, bytes.length);
    const block = blocks[0];
    expect(typeof (block as { hmdManufacturerOui?: number }).hmdManufacturerOui).toBe('number');

    expect(Array.from(roundTrip(bytes))).toEqual(Array.from(bytes));
  });

  it('0x2E Brightness Luminance Range: decodes structured and round-trips byte-for-byte', () => {
    const payload = pattern(6); // three LE u16 fields, all modeled
    const bytes = packBlock(0x2e, REV_FLAGS, payload);

    const { blocks } = decodeDisplayIdBlocks(bytes, 0, bytes.length);
    const block = blocks[0];
    expect(typeof (block as { minSdrLuminance?: number }).minSdrLuminance).toBe('number');

    expect(Array.from(roundTrip(bytes))).toEqual(Array.from(bytes));
  });
});

describe('DisplayID dispatcher leaves malformed-length 0x2A–0x2E opaque', () => {
  type Maybe = { [k: string]: unknown };

  function decodeSingle(bytes: Uint8Array): Maybe {
    const { blocks } = decodeDisplayIdBlocks(bytes, 0, bytes.length);
    expect(blocks).toHaveLength(1);
    return blocks[0] as Maybe;
  }

  it('0x2A with a non-multiple-of-6 payload stays opaque and round-trips', () => {
    const bytes = packBlock(0x2a, REV_FLAGS, pattern(5));
    const block = decodeSingle(bytes);
    expect(block.timings).toBeUndefined();
    expect(Array.from(roundTrip(bytes))).toEqual(Array.from(bytes));
  });

  it('0x2B with a non-multiple-of-6 payload stays opaque and round-trips', () => {
    const bytes = packBlock(0x2b, REV_FLAGS, pattern(5));
    const block = decodeSingle(bytes);
    expect(block.descriptors).toBeUndefined();
    expect(Array.from(roundTrip(bytes))).toEqual(Array.from(bytes));
  });

  it('0x2C with a non-79-byte payload stays opaque and round-trips', () => {
    const bytes = packBlock(0x2c, REV_FLAGS, pattern(78));
    const block = decodeSingle(bytes);
    expect(block.dualLayerSingleStreamTransport).toBeUndefined();
    expect(Array.from(roundTrip(bytes))).toEqual(Array.from(bytes));
  });

  it('0x2D with a non-20-byte payload stays opaque and round-trips', () => {
    const bytes = packBlock(0x2d, REV_FLAGS, pattern(19));
    const block = decodeSingle(bytes);
    expect(block.hmdManufacturerOui).toBeUndefined();
    expect(Array.from(roundTrip(bytes))).toEqual(Array.from(bytes));
  });

  it('0x2E with a non-6-byte payload stays opaque and round-trips', () => {
    const bytes = packBlock(0x2e, REV_FLAGS, pattern(5));
    const block = decodeSingle(bytes);
    expect(block.minSdrLuminance).toBeUndefined();
    expect(Array.from(roundTrip(bytes))).toEqual(Array.from(bytes));
  });
});