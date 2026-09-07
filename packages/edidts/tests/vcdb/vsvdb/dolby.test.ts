// packages/edidts/tests/vsvdb/dolby.test.ts

import { describe, it, expect } from 'vitest';
import { DolbyVSDBDecoder, DolbyVSDBEncoder } from '../../../src/cta/vcdb/vsvdb/dolby';
import { OUI } from '../../../src/cta/vsdb/types';
import {
  decodeExtendedDataBlock,
  encodeExtendedDataBlock,
  type VendorSpecificVideoDataBlock,
} from '../../../src/cta';

describe('DolbyVSDBEncoder', () => {
  it('round-trips a well-formed fields object', () => {
    const fields = {
      version: 1,
      supportsYUV422_12bit: true,
      supports2160p60: true,
      supportsGlobalDimming: false,
      byte0Reserved: 0,
      trailing: new Uint8Array(),
    };
    const encoded = new DolbyVSDBEncoder().encode(fields);
    const decoded = new DolbyVSDBDecoder().decode(encoded);
    expect(decoded).toEqual(fields);
  });

  it('encodes the version and capability flags into a single payload byte', () => {
    // version=0, all flags off => 0x00
    const encoded = new DolbyVSDBEncoder().encode({
      version: 0, supportsYUV422_12bit: false, supports2160p60: false, supportsGlobalDimming: false,
      byte0Reserved: 0, trailing: new Uint8Array(),
    });
    expect(encoded).toEqual(new Uint8Array([0x00]));

    // version=2 (010), YUV422=1, 2160p60=0, dimming=1 => 0b01000101 = 0x45
    const encoded2 = new DolbyVSDBEncoder().encode({
      version: 2, supportsYUV422_12bit: true, supports2160p60: false, supportsGlobalDimming: true,
      byte0Reserved: 0, trailing: new Uint8Array(),
    });
    expect(encoded2).toEqual(new Uint8Array([0x45]));
  });

  it('preserves trailing vendor-reserved bytes verbatim (byte-complete)', () => {
    // A v1/v2 Dolby VSVDB carries reserved bytes after byte 0 that the codec
    // does not model field-by-field; they must survive encode/decode intact.
    const trailing = new Uint8Array([0x11, 0x22, 0x33]);
    const encoded = new DolbyVSDBEncoder().encode({
      version: 1, supportsYUV422_12bit: true, supports2160p60: false, supportsGlobalDimming: true,
      byte0Reserved: 0, trailing: trailing,
    });
    // byte0 = (1<<5) | 0b101 = 0x25, then the trailing bytes.
    expect(encoded).toEqual(new Uint8Array([0x25, 0x11, 0x22, 0x33]));
    const decoded = new DolbyVSDBDecoder().decode(encoded);
    expect(Array.from(decoded.trailing)).toEqual([0x11, 0x22, 0x33]);
  });

  it('preserves byte0 bits 4:3 (byte0Reserved) so real v2 blocks round-trip', () => {
    // Real Dolby Vision v2 block (Amazon AMZ0000/65E0FEBCEAE9): byte0 = 0x48
    // = version 2, bits 4:3 = 0b01, flags 0. A lossy codec that ignores bits
    // 4:3 would re-encode 0x40 and break byte-identical round-trip.
    const decoded = new DolbyVSDBDecoder().decode(new Uint8Array([0x48]));
    expect(decoded.version).toBe(2);
    expect(decoded.byte0Reserved).toBe(1);
    expect(new DolbyVSDBEncoder().encode(decoded)).toEqual(new Uint8Array([0x48]));
  });

  it('rejects out-of-range versions', () => {
    expect(() => new DolbyVSDBEncoder().encode({
      version: 8, supportsYUV422_12bit: false, supports2160p60: false, supportsGlobalDimming: false,
      byte0Reserved: 0, trailing: new Uint8Array(),
    })).toThrow(RangeError);
  });
});

describe('DolbyVSDBDecoder', () => {
  it('decodes the union of the version, supportsYUV422_12bit, supports2160p60, supportsGlobalDimming fields', () => {
    // version=2 (010), supportsYUV422_12bit=1, supports2160p60=0, supportsGlobalDimming=1
    // byte0 = (0b010 << 5) | 0b101 = 0x4D
    const payload = new Uint8Array([0x4D]);
    const result = new DolbyVSDBDecoder().decode(payload);
    expect(result.version).toBe(2);
    expect(result.supportsYUV422_12bit).toBe(true);
    expect(result.supports2160p60).toBe(false);
    expect(result.supportsGlobalDimming).toBe(true);
    // 0x4D = 0x40 (v2) | 0x08 (bit3) | 0x05 (flags) => bits 4:3 = 0b01.
    expect(result.byte0Reserved).toBe(1);
    expect(result.trailing).toEqual(new Uint8Array(0));
  });

  it('returns defaults for empty payload', () => {
    const result = new DolbyVSDBDecoder().decode(new Uint8Array(0));
    expect(result.version).toBe(0);
    expect(result.supportsYUV422_12bit).toBe(false);
    expect(result.supports2160p60).toBe(false);
    expect(result.supportsGlobalDimming).toBe(false);
    expect(result.byte0Reserved).toBe(0);
    expect(result.trailing).toEqual(new Uint8Array(0));
  });
});

describe('VSVDB registry', () => {
  it('registers the Dolby decoder under OUI.DOLBY', async () => {
    const { VENDOR_VSVDB_DECODERS } = await import('../../../src/cta/vcdb/vsvdb/registry');
    expect(VENDOR_VSVDB_DECODERS[OUI.DOLBY]).toBeDefined();
  });
});

// Carrier-level behaviour: the CTA extended-block decode/encode path must
// surface the registered Dolby decoder's structured shape on the carrier and
// re-encode from it. This is the TASK-59 contract.
describe('Dolby VSVDB carrier (CTA extended tag 0x01)', () => {
  // Dolby OUI is 00-D0-46; on-wire (LE) the three OUI bytes are 46 D0 00.
  const dolbyWire = (postOui: number[]) =>
    new Uint8Array([0x01, 0x46, 0xd0, 0x00, ...postOui]);

  it('decode attaches a structured dolbyVsdb vendor shape to the carrier', () => {
    // byte0 = (1<<5) | 0b011 = 0x23, plus two trailing reserved bytes.
    const wire = dolbyWire([0x23, 0xaa, 0xbb]);
    const block = decodeExtendedDataBlock(wire) as VendorSpecificVideoDataBlock;
    expect(block.extendedTag).toBe(0x01);
    expect(block.ieeeOui).toBe(OUI.DOLBY);
    expect(block.vendor?.kind).toBe('dolbyVsdb');
    const fields = block.vendor!.fields;
    expect(fields.version).toBe(1);
    expect(fields.supportsYUV422_12bit).toBe(true);
    expect(fields.supports2160p60).toBe(true);
    expect(fields.supportsGlobalDimming).toBe(false);
    expect(Array.from(fields.trailing)).toEqual([0xaa, 0xbb]);
  });

  it('round-trips byte-identically through the carrier, including trailing bytes', () => {
    const wire = dolbyWire([0x23, 0xaa, 0xbb]);
    const block = decodeExtendedDataBlock(wire) as VendorSpecificVideoDataBlock;
    const encoded = encodeExtendedDataBlock(block);
    expect(encoded).toEqual(wire);
  });

  it('re-encodes from edited vendor.fields and preserves trailing bytes', () => {
    const wire = dolbyWire([0x23, 0xaa, 0xbb]);
    const block = decodeExtendedDataBlock(wire) as VendorSpecificVideoDataBlock;
    // Flip supportsGlobalDimming on (bit 2) and bump version to 2.
    const fields = block.vendor!.fields;
    fields.supportsGlobalDimming = true;
    fields.version = 2;
    // byte0 becomes (2<<5) | 0b111 = 0x47; trailing [0xaa,0xbb] preserved.
    const encoded = encodeExtendedDataBlock(block);
    expect(encoded).toEqual(dolbyWire([0x47, 0xaa, 0xbb]));
    // Re-decode to confirm the edit landed on the carrier.
    const redecoded = decodeExtendedDataBlock(encoded) as VendorSpecificVideoDataBlock;
    expect(redecoded.vendor!.fields.version).toBe(2);
    expect(redecoded.vendor!.fields.supportsGlobalDimming).toBe(true);
    expect(Array.from(redecoded.vendor!.fields.trailing)).toEqual([0xaa, 0xbb]);
  });
});