import { describe, it, expect } from 'vitest';
import { decodeVendorSpecificBlock } from '../../src/cta/vsdb/registry';
import { reassembleVsdbBlock } from '../../src/cta/vsdb/registry';

describe('Unknown VSDB handling', () => {
  it('decodes an unrecognized OUI to kind: "unknown"', () => {
    // OUI 0x112233 (a fake one) with arbitrary payload
    const payload = new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD]);
    const block = reassembleVsdbBlock(0x112233, payload);
    const decoded = decodeVendorSpecificBlock(block);
    expect(decoded.ieeeOui).toBe(0x112233);
    expect(decoded.vendor?.kind).toBe('unknown');
    if (decoded.vendor?.kind === 'unknown') {
      expect(Array.from(decoded.vendor.raw)).toEqual(Array.from(payload));
    }
  });

  it('preserves raw bytes for unknown VSDBs during round-trip via data', () => {
    const payload = new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD]);
    const block = reassembleVsdbBlock(0x112233, payload);
    const decoded = decodeVendorSpecificBlock(block);
    // The original block bytes are preserved in decoded.data
    expect(Array.from(decoded.data)).toEqual(Array.from(block));
  });
});
