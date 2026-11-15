import { describe, it, expect } from 'vitest';
import {
  ExtensionBlockParser,
  createDefaultCEADataBlock,
  makeVesaTransferCurve,
  type CEADataBlock,
  type CEAExtensionBlock,
  type VESADisplayTransferCharacteristicBlock,
} from '../src/cta';
import { checksum8 } from '../src/common';

/**
 * VESA Display Transfer Characteristic Data Block (CTA tag 5), as edid-decode
 * `cta_vesa_dtcdb` reads it: byte 0 bits 7:6 = channel (white/red/green/blue),
 * bits 5:0 = first curve point; each later byte adds to the running value;
 * the curve ends at an implied 1023. Valid bodies are 7, 15 or 31 bytes.
 */

/** A 128-byte CEA extension carrying one data block with this body. */
function ceaWithSingleDataBlock(tag: number, body: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(128);
  bytes[0] = 0x02;
  bytes[1] = 3;
  bytes[2] = 4 + 1 + body.length;
  bytes[4] = ((tag & 0x07) << 5) | body.length;
  bytes.set(body, 5);
  bytes[127] = checksum8(bytes, 127);
  return bytes;
}

function decodeBlock(body: number[]): VESADisplayTransferCharacteristicBlock {
  const raw = ceaWithSingleDataBlock(0x05, new Uint8Array(body));
  const cea = ExtensionBlockParser.decode(raw) as CEAExtensionBlock;
  return cea.dataBlocks[0] as VESADisplayTransferCharacteristicBlock;
}

/** Encode a block as edited (a spread copy, so the open-and-save safety net
 *  doesn't hand back the original bytes). */
function encodeBlockBody(block: VESADisplayTransferCharacteristicBlock): number[] {
  const stream = ExtensionBlockParser.encodeCtaDataBlockStream([{ ...block } as CEADataBlock]);
  return Array.from(stream.subarray(1));
}

describe('VESA Display Transfer Characteristic data block (CTA tag 0x05)', () => {
  it('reads the channel from bits 7:6 and the curve as running sums', () => {
    // Green (2 << 6) with first point 10, then steps 20, 30, ... (7-byte body).
    const block = decodeBlock([(2 << 6) | 10, 20, 30, 40, 50, 60, 70]);
    expect(block.transferType).toBe('green');
    expect(block.points).toEqual([10, 30, 60, 100, 150, 210, 280]);
  });

  it.each([
    ['white, 7 bytes', [0x00, 14, 51, 94, 139, 190, 240]],
    ['red, 15 bytes', [0x40 | 5, ...new Array(14).fill(60)]],
    ['blue, 31 bytes', [0xc0 | 63, ...new Array(30).fill(31)]],
  ])('round-trips the %s curve byte-exactly when edited', (_label, body) => {
    expect(encodeBlockBody(decodeBlock(body))).toEqual(body);
  });

  it('changes only the touched byte when one point is edited', () => {
    const body = [0x00, 14, 51, 94, 139, 190, 240];
    const block = decodeBlock(body);
    block.points = block.points.map((p, i) => (i === 3 ? p + 5 : p));
    const out = encodeBlockBody(block);
    expect(out[3]).toBe(99); // step into point 3 grows by 5
    expect(out[4]).toBe(134); // step out of point 3 shrinks by 5
    expect(out.filter((b, i) => b !== body[i])).toHaveLength(2);
  });

  it('clamps unreachable points instead of wrapping', () => {
    const block = decodeBlock([0x00, 0, 0, 0, 0, 0, 0]);
    block.transferType = 'red';
    block.points = [100, 600, 500, 500, 500, 500, 500]; // first > 63, a step > 255, a step down
    const out = encodeBlockBody(block);
    expect(out[0]).toBe((1 << 6) | 63);
    expect(out[1]).toBe(255);
    expect(out[2]).toBe(182); // 500 - (63 + 255)
    expect(out.slice(3)).toEqual([0, 0, 0, 0]);
  });

  it('creates a valid 7-byte gamma curve as the default block', () => {
    const block = createDefaultCEADataBlock('vesa-transfer') as VESADisplayTransferCharacteristicBlock;
    const body = encodeBlockBody(block);
    expect(body).toHaveLength(7);
    expect(decodeBlock(body).points).toEqual(block.points);
  });

  it('builds representable curves for every valid point count', () => {
    for (const count of [7, 15, 31]) {
      const points = makeVesaTransferCurve(count);
      expect(points).toHaveLength(count);
      expect(points[0]).toBeLessThanOrEqual(63);
      for (let i = 1; i < count; i++) {
        expect(points[i] - points[i - 1]).toBeGreaterThanOrEqual(0);
        expect(points[i] - points[i - 1]).toBeLessThanOrEqual(255);
      }
      expect(points[count - 1]).toBeLessThan(1023);
    }
  });
});
