// packages/edidts/tests/vsvdb/hdr10plus.test.ts

import { describe, it, expect } from 'vitest';
import {
  HDR10PlusVsvdbDecoder,
  HDR10PlusVsvdbEncoder,
  VENDOR_VSVDB_DECODERS,
  VENDOR_VSVDB_ENCODERS,
  decodeVSVDB,
  reassembleVsvdbBlock,
} from '../../../src/cta/vcdb/vsvdb/registry';
import {
  decodeExtendedDataBlock,
  encodeExtendedDataBlock,
  type VendorSpecificVideoDataBlock,
} from '../../../src/cta';
import { OUI } from '../../../src/cta/vsdb/types';

describe('HDR10PlusVsvdbDecoder', () => {
  it('decodes applicationVersion from byte 0 and the remainder as payload', () => {
    const payload = new Uint8Array([0x02, 0xaa, 0xbb]);
    const result = new HDR10PlusVsvdbDecoder().decode(payload);
    expect(result.applicationVersion).toBe(2);
    expect(Array.from(result.trailing)).toEqual([0xaa, 0xbb]);
  });

  it('returns defaults for empty payload without throwing', () => {
    const result = new HDR10PlusVsvdbDecoder().decode(new Uint8Array(0));
    expect(result.applicationVersion).toBe(0);
    expect(result.trailing).toEqual(new Uint8Array(0));
  });
});

describe('HDR10PlusVsvdbEncoder', () => {
  it('reconstructs the post-OUI payload byte-identically', () => {
    const encoded = new HDR10PlusVsvdbEncoder().encode({
      applicationVersion: 2,
      trailing: new Uint8Array([0xaa, 0xbb]),
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
    const decoded = decoder.decode(payload) as { applicationVersion: number; trailing: Uint8Array };
    const encoded = encoder.encode(decoded);
    expect(encoded).toEqual(payload);
    expect(decoded.applicationVersion).toBe(2);
    expect(Array.from(decoded.trailing)).toEqual([0xaa, 0xbb]);
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
      { tag: 0x07, extendedTag: 0x01, payload: new Uint8Array(0) },
      block.slice(1),
    );
    expect(decoded.ieeeOui).toBe(OUI.HDR10_PLUS);
    expect(Array.from(decoded.vendorPayload)).toEqual([0x02, 0xaa, 0xbb]);

    const decoder = VENDOR_VSVDB_DECODERS[OUI.HDR10_PLUS]!;
    const encoder = VENDOR_VSVDB_ENCODERS['hdr10PlusVsvdb']!;
    const fields = decoder.decode(decoded.vendorPayload) as { applicationVersion: number; trailing: Uint8Array };
    const encoded = encoder.encode(fields);
    expect(encoded).toEqual(postOui);
  });

  it('decodes a real HDR10+ VSVDB using the on-wire LE OUI bytes 8B 84 90', () => {
    // Real HDR10+ OUI is 90-84-8B (HDR10+ Technologies, LLC, IEEE oui.txt).
    // On-wire (LE) the three OUI bytes are 8B 84 90; the dispatcher reads them
    // as the integer 0x90848B, which must equal OUI.HDR10_PLUS and resolve to
    // the registered decoder. This guards against the byte-reversed 0x8B8490
    // regression (with that value the decoder would never fire on real EDIDs).
    expect(OUI.HDR10_PLUS).toBe(0x90848b);
    // extended-tag byte (0x01) + LE OUI 8B 84 90 + post-OUI body (version, ...)
    const wire = new Uint8Array([0x01, 0x8b, 0x84, 0x90, 0x02, 0xaa, 0xbb]);
    const decoded = decodeVSVDB(
      { tag: 0x07, extendedTag: 0x01, payload: new Uint8Array(0) },
      wire.slice(1), // drop extended-tag byte
    );
    expect(decoded.ieeeOui).toBe(0x90848b);
    expect(VENDOR_VSVDB_DECODERS[decoded.ieeeOui]).toBeDefined();
    const fields = VENDOR_VSVDB_DECODERS[decoded.ieeeOui]!.decode(decoded.vendorPayload) as {
      applicationVersion: number;
      trailing: Uint8Array;
    };
    expect(fields.applicationVersion).toBe(0x02);
    expect(Array.from(fields.trailing)).toEqual([0xaa, 0xbb]);
  });
});

// Carrier-level behaviour through the CTA extended-block decode/encode path:
// the registered HDR10+ decoder's structured shape must be surfaced
// on the carrier and re-encoded from it, byte-identically.
describe('HDR10+ VSVDB carrier (CTA extended tag 0x01)', () => {
  // HDR10+ OUI 90-84-8B; on-wire (LE) the three OUI bytes are 8B 84 90.
  const hdr10Wire = (postOui: number[]) =>
    new Uint8Array([0x01, 0x8b, 0x84, 0x90, ...postOui]);

  it('decode attaches a structured hdr10PlusVsvdb vendor shape to the carrier', () => {
    const wire = hdr10Wire([0x02, 0xaa, 0xbb]);
    const block = decodeExtendedDataBlock(wire) as VendorSpecificVideoDataBlock;
    expect(block.extendedTag).toBe(0x01);
    expect(block.ieeeOui).toBe(OUI.HDR10_PLUS);
    expect(block.vendor?.kind).toBe('hdr10PlusVsvdb');
    expect(block.vendor!.fields.applicationVersion).toBe(0x02);
    expect(Array.from(block.vendor!.fields.trailing)).toEqual([0xaa, 0xbb]);
  });

  it('round-trips byte-identically through the carrier', () => {
    const wire = hdr10Wire([0x02, 0xaa, 0xbb]);
    const block = decodeExtendedDataBlock(wire) as VendorSpecificVideoDataBlock;
    expect(encodeExtendedDataBlock(block)).toEqual(wire);
  });

  it('re-encodes from edited vendor.fields and preserves the opaque payload', () => {
    const wire = hdr10Wire([0x02, 0xaa, 0xbb]);
    const block = decodeExtendedDataBlock(wire) as VendorSpecificVideoDataBlock;
    block.vendor!.fields.applicationVersion = 0x05;
    const encoded = encodeExtendedDataBlock(block);
    expect(encoded).toEqual(hdr10Wire([0x05, 0xaa, 0xbb]));
    const redecoded = decodeExtendedDataBlock(encoded) as VendorSpecificVideoDataBlock;
    expect(redecoded.vendor!.fields.applicationVersion).toBe(0x05);
    expect(Array.from(redecoded.vendor!.fields.trailing)).toEqual([0xaa, 0xbb]);
  });
});