import { describe, it, expect } from 'vitest';
import {
  decodeExtendedDataBlock,
  encodeExtendedDataBlock,
  type RoomEnvironmentDataBlock,
} from '../src/cta/cta-extended-blocks';

describe('Room Environment Data Block (Extended Tag 0x15) — EXPERIMENTAL', () => {
  // CTA-861-H §7.5.17 Room Environment Data Block; field semantics per
  // ITU-T H.265 Ambient Viewing Environment SEI. Layout not verified against
  // a parser — byte-identical round-trip is the correctness gate.

  it('decodes a full 8-byte payload block and round-trips byte-identical', () => {
    // ext-tag 0x15, then 8 payload bytes:
    //   ambientIlluminance = 0x00012345 (BE32)
    //   ambientLightX       = 0x6789    (BE16)
    //   ambientLightY       = 0xABCD    (BE16)
    const data = new Uint8Array([0x15, 0x00, 0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD]);
    const block = decodeExtendedDataBlock(data) as RoomEnvironmentDataBlock;

    expect(block.extendedTag).toBe(0x15);
    expect(block.ambientIlluminance).toBe(0x00012345);
    expect(block.ambientLightX).toBe(0x6789);
    expect(block.ambientLightY).toBe(0xABCD);

    const encoded = encodeExtendedDataBlock(block);
    expect(encoded).toEqual(data);
  });

  it('decodes a 4-byte payload block (only ambientIlluminance) and round-trips', () => {
    const data = new Uint8Array([0x15, 0xFF, 0xEE, 0xDD, 0xCC]);
    const block = decodeExtendedDataBlock(data) as RoomEnvironmentDataBlock;

    expect(block.extendedTag).toBe(0x15);
    expect(block.ambientIlluminance).toBe(((0xff << 24) | (0xee << 16) | (0xdd << 8) | 0xcc) >>> 0);
    expect(block.ambientLightX).toBeUndefined();
    expect(block.ambientLightY).toBeUndefined();

    const encoded = encodeExtendedDataBlock(block);
    expect(encoded).toEqual(data);
  });

  it('decodes a 6-byte payload block (illuminance + X) and round-trips', () => {
    const data = new Uint8Array([0x15, 0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC]);
    const block = decodeExtendedDataBlock(data) as RoomEnvironmentDataBlock;

    expect(block.extendedTag).toBe(0x15);
    expect(block.ambientIlluminance).toBe(((0x12 << 24) | (0x34 << 16) | (0x56 << 8) | 0x78) >>> 0);
    expect(block.ambientLightX).toBe((0x9a << 8) | 0xbc);
    expect(block.ambientLightY).toBeUndefined();

    const encoded = encodeExtendedDataBlock(block);
    expect(encoded).toEqual(data);
  });

  it('mutates a decoded field, re-encodes, re-decodes, and keeps other fields stable', () => {
    // Field-level decode → edit → encode → re-decode (TASK-61): the corpus has
    // zero Room Environment fixtures, so this synthetic mutation test is the
    // only safety net for the encode path.
    const data = new Uint8Array([0x15, 0x00, 0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD]);
    const block = decodeExtendedDataBlock(data) as RoomEnvironmentDataBlock;
    expect(block.ambientIlluminance).toBe(0x00012345);
    expect(block.ambientLightY).toBe(0xABCD);

    // Edit one field; leave another untouched.
    block.ambientIlluminance = 0xFFFFFFFF;
    const reencoded = encodeExtendedDataBlock(block);
    const redecoded = decodeExtendedDataBlock(reencoded) as RoomEnvironmentDataBlock;

    expect(redecoded.ambientIlluminance).toBe(0xFFFFFFFF);
    expect(redecoded.ambientLightY).toBe(0xABCD);
    // X is adjacent to the mutated field and must not be disturbed.
    expect(redecoded.ambientLightX).toBe(0x6789);
  });

  it('preserves trailing bytes past the modeled 8-byte payload on round-trip', () => {
    // 8 modeled payload bytes + 2 trailing reserved bytes
    const data = new Uint8Array([
      0x15,
      0x00, 0x01, 0x23, 0x45, // illuminance
      0x67, 0x89,             // X
      0xAB, 0xCD,             // Y
      0xDE, 0xF0,             // trailing reserved
    ]);
    const block = decodeExtendedDataBlock(data) as RoomEnvironmentDataBlock;

    expect(block.extendedTag).toBe(0x15);
    expect(block.ambientIlluminance).toBe(0x00012345);
    expect(block.ambientLightX).toBe(0x6789);
    expect(block.ambientLightY).toBe(0xABCD);

    const encoded = encodeExtendedDataBlock(block);
    expect(encoded).toEqual(data);
  });

  it('does not throw on empty or 1-byte payload and round-trips', () => {
    const empty = new Uint8Array([0x15]);
    const emptyBlock = decodeExtendedDataBlock(empty) as RoomEnvironmentDataBlock;
    expect(emptyBlock.extendedTag).toBe(0x15);
    expect(emptyBlock.ambientIlluminance).toBeUndefined();
    expect(emptyBlock.ambientLightX).toBeUndefined();
    expect(emptyBlock.ambientLightY).toBeUndefined();
    expect(encodeExtendedDataBlock(emptyBlock)).toEqual(empty);

    // 1-byte payload: not enough for any modeled field (illuminance needs 4)
    const oneByte = new Uint8Array([0x15, 0x42]);
    const oneByteBlock = decodeExtendedDataBlock(oneByte) as RoomEnvironmentDataBlock;
    expect(oneByteBlock.extendedTag).toBe(0x15);
    expect(oneByteBlock.ambientIlluminance).toBeUndefined();
    expect(encodeExtendedDataBlock(oneByteBlock)).toEqual(oneByte);
  });
});