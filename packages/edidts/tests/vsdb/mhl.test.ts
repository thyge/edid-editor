// packages/edidts/tests/vsdb/mhl.test.ts

import { describe, it, expect } from 'vitest';
import {
  MHLDecoder,
  MHLEncoder,
  VENDOR_DECODERS,
  VENDOR_ENCODERS,
  reassembleVsdbBlock,
  decodeVendorSpecificBlock,
} from '../../src/cta/vsdb/registry';
import { OUI } from '../../src/cta/vsdb/types';

describe('MHLDecoder', () => {
  it('decodes version/revision/deviceCapability and trailing payload', () => {
    // 0x20 -> major 2, minor 0; 0x40 deviceCapability; 0xAA,0xBB trailing
    const payload = new Uint8Array([0x20, 0x40, 0xAA, 0xBB]);
    const result = new MHLDecoder().decode(payload);
    expect(result.version).toBe(2);
    expect(result.revision).toBe(0);
    expect(result.deviceCapability).toBe(0x40);
    expect(Array.from(result.payload)).toEqual([0xAA, 0xBB]);
  });

  it('byte-identical round-trip for a well-formed payload', () => {
    const fields = {
      version: 2,
      revision: 0,
      deviceCapability: 0x40,
      payload: new Uint8Array([0xAA, 0xBB]),
    };
    const encoded = new MHLEncoder().encode(fields);
    expect(encoded).toEqual(new Uint8Array([0x20, 0x40, 0xAA, 0xBB]));
  });

  it('returns defaults for empty payload without throwing', () => {
    const result = new MHLDecoder().decode(new Uint8Array(0));
    expect(result.version).toBe(0);
    expect(result.revision).toBe(0);
    expect(result.deviceCapability).toBe(0);
    expect(result.payload.length).toBe(0);
  });
});

describe('MHL VSDB registry', () => {
  it('registers a decoder under OUI.MHL and an encoder under "mhl"', () => {
    expect(VENDOR_DECODERS[OUI.MHL]).toBeDefined();
    expect(VENDOR_ENCODERS['mhl']).toBeDefined();
  });

  it('end-to-end decodes an MHL block and re-encodes byte-identically', () => {
    const block = reassembleVsdbBlock(OUI.MHL, new Uint8Array([0x20, 0x40, 0xAA, 0xBB]));
    const decoded = decodeVendorSpecificBlock(block);
    expect(decoded.ieeeOui).toBe(OUI.MHL);
    expect(decoded.vendor?.kind).toBe('mhl');
    const fields = decoded.vendor!.fields as { version: number; revision: number; deviceCapability: number; payload: Uint8Array };
    expect(fields.version).toBe(2);
    expect(fields.revision).toBe(0);
    expect(fields.deviceCapability).toBe(0x40);
    expect(Array.from(fields.payload)).toEqual([0xAA, 0xBB]);

    const reencoded = reassembleVsdbBlock(OUI.MHL, VENDOR_ENCODERS['mhl'].encode(fields));
    expect(reencoded).toEqual(block);
  });
});