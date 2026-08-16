// packages/edidts/tests/vsvdb/hdr10plus.test.ts

import { describe, it, expect } from 'vitest';
import {
  HDR10PlusVsvdbDecoder,
  HDR10PlusVsvdbEncoder,
  VENDOR_VSVDB_DECODERS,
  VENDOR_VSVDB_ENCODERS,
  decodeVSVDB,
  reassembleVsvdbBlock,
} from '../../src/cta/vsvdb/registry';
import { OUI } from '../../src/cta/vsdb/types';

describe('HDR10PlusVsvdbDecoder', () => {
  it('decodes applicationVersion from byte 0 and the remainder as payload', () => {
    const payload = new Uint8Array([0x02, 0xaa, 0xbb]);
    const result = new HDR10PlusVsvdbDecoder().decode(payload);
    expect(result.applicationVersion).toBe(2);
    expect(Array.from(result.payload)).toEqual([0xaa, 0xbb]);
  });

  it('returns defaults for empty payload without throwing', () => {
    const result = new HDR10PlusVsvdbDecoder().decode(new Uint8Array(0));
    expect(result.applicationVersion).toBe(0);
    expect(result.payload).toEqual(new Uint8Array(0));
  });
});

describe('HDR10PlusVsvdbEncoder', () => {
  it('reconstructs the post-OUI payload byte-identically', () => {
    const encoded = new HDR10PlusVsvdbEncoder().encode({
      applicationVersion: 2,
      payload: new Uint8Array([0xaa, 0xbb]),
    });
    expect(encoded).toEqual(new Uint8Array([0x02, 0xaa, 0xbb]));
  });

  it('round-trips through decode/encode byte-identically', () => {
    const payload = new Uint8Array([0x02, 0xaa, 0xbb]);
    const decoded = new HDR10PlusVsvdbDecoder().decode(payload);
    const encoded = new HDR10PlusVsvdbEncoder().encode(decoded);
    expect(encoded).toEqual(payload);
  });
});

describe('VSVDB registry — HDR10+', () => {
  it('registers the HDR10+ decoder under OUI.HDR10_PLUS', () => {
    expect(VENDOR_VSVDB_DECODERS[OUI.HDR10_PLUS]).toBeDefined();
  });

  it('registers the HDR10+ encoder under the hdr10PlusVsvdb kind', () => {
    expect(VENDOR_VSVDB_ENCODERS['hdr10PlusVsvdb']).toBeDefined();
  });

  it('round-trips fields through the registry decoder/encoder', () => {
    const decoder = VENDOR_VSVDB_DECODERS[OUI.HDR10_PLUS]!;
    const encoder = VENDOR_VSVDB_ENCODERS['hdr10PlusVsvdb']!;
    const payload = new Uint8Array([0x02, 0xaa, 0xbb]);
    const decoded = decoder.decode(payload) as { applicationVersion: number; payload: Uint8Array };
    const encoded = encoder.encode(decoded);
    expect(encoded).toEqual(payload);
    expect(decoded.applicationVersion).toBe(2);
    expect(Array.from(decoded.payload)).toEqual([0xaa, 0xbb]);
  });
});

describe('HDR10+ VSVDB end-to-end carrier', () => {
  it('reassembles, carrier-decodes, then registry-decodes/encodes the post-OUI payload', () => {
    const postOui = new Uint8Array([0x02, 0xaa, 0xbb]);
    // reassembleVsvdbBlock emits extended-tag byte + 3 LE OUI bytes + payload
    // (the full post-header block data). decodeVSVDB consumes the
    // post-extended-tag slice, so drop the leading extended-tag byte.
    const block = reassembleVsvdbBlock(OUI.HDR10_PLUS, postOui);
    const decoded = decodeVSVDB(
      { tag: 0x07, extendedTag: 0x01, data: new Uint8Array(0) },
      block.slice(1),
    );
    expect(decoded.ieeeOui).toBe(OUI.HDR10_PLUS);
    expect(Array.from(decoded.payload)).toEqual([0x02, 0xaa, 0xbb]);

    const decoder = VENDOR_VSVDB_DECODERS[OUI.HDR10_PLUS]!;
    const encoder = VENDOR_VSVDB_ENCODERS['hdr10PlusVsvdb']!;
    const fields = decoder.decode(decoded.payload) as { applicationVersion: number; payload: Uint8Array };
    const encoded = encoder.encode(fields);
    expect(encoded).toEqual(postOui);
  });
});