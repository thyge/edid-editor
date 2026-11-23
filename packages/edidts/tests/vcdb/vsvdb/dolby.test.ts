// packages/edidts/tests/vsvdb/dolby.test.ts

import { describe, it, expect } from 'vitest';
import { DolbyVSDBDecoder, DolbyVSDBEncoder } from '../../../src/cta/vcdb/vsvdb/dolby';
import { OUI } from '../../../src/cta/vsdb/types';
import {
  decodeExtendedDataBlock,
  encodeExtendedDataBlock,
  type VendorSpecificVideoDataBlock,
} from '../../../src/cta';

// The byte-0 layout depends on the version (edid-decode `cta_dolby_video`):
// v0 bit 1 2160p60 / bit 2 global dimming; v1 bit 1 2160p60 / bits 4:2 DM
// version, global dimming in byte 1 bit 0; v2 bit 1 backlight control / bits
// 4:2 DM version, global dimming in byte 1 bit 2.

describe('DolbyVSDBEncoder', () => {
  it('round-trips a well-formed v1 fields object', () => {
    const fields = {
      version: 1,
      supportsYUV422_12bit: true,
      supports2160p60: true,
      dmVersion: 2,
      supportsGlobalDimming: true,
      byte0Reserved: 0,
      byte1Rest: 0x4e,
      trailing: new Uint8Array([0x6a, 0x01]),
    };
    const encoded = new DolbyVSDBEncoder().encode(fields);
    expect(encoded).toEqual(new Uint8Array([0x2b, 0x4f, 0x6a, 0x01]));
    const decoded = new DolbyVSDBDecoder().decode(encoded);
    expect(decoded).toEqual(fields);
  });

  it('encodes v0 capability flags into byte 0', () => {
    // version=0, all flags off => 0x00
    const encoded = new DolbyVSDBEncoder().encode({
      version: 0, supportsYUV422_12bit: false, supports2160p60: false, supportsGlobalDimming: false,
      byte0Reserved: 0, trailing: new Uint8Array(),
    });
    expect(encoded).toEqual(new Uint8Array([0x00]));

    // version=0, YUV422=1, 2160p60=0, dimming=1 => 0b00000101 = 0x05
    const encoded2 = new DolbyVSDBEncoder().encode({
      version: 0, supportsYUV422_12bit: true, supports2160p60: false, supportsGlobalDimming: true,
      byte0Reserved: 0, trailing: new Uint8Array(),
    });
    expect(encoded2).toEqual(new Uint8Array([0x05]));
  });

  it('writes v2 global dimming to byte 1 bit 2, not into the DM version', () => {
    // version=2 (010), YUV422=1, backlight=0, DM version code 0, dimming=1
    const encoded = new DolbyVSDBEncoder().encode({
      version: 2, supportsYUV422_12bit: true, supports2160p60: false, supportsBacklightControl: false,
      dmVersion: 0, supportsGlobalDimming: true, byte0Reserved: 0, trailing: new Uint8Array(),
    });
    expect(encoded).toEqual(new Uint8Array([0x41, 0x04]));
  });

  it('preserves trailing vendor bytes verbatim (byte-complete)', () => {
    // v0 keeps everything after byte 0 in `trailing`.
    const trailing = new Uint8Array([0x11, 0x22, 0x33]);
    const encoded = new DolbyVSDBEncoder().encode({
      version: 0, supportsYUV422_12bit: true, supports2160p60: false, supportsGlobalDimming: true,
      byte0Reserved: 0, trailing: trailing,
    });
    expect(encoded).toEqual(new Uint8Array([0x05, 0x11, 0x22, 0x33]));
    const decoded = new DolbyVSDBDecoder().decode(encoded);
    expect(Array.from(decoded.trailing)).toEqual([0x11, 0x22, 0x33]);
  });

  it('keeps v2 byte 0 bits 4:2 as the DM version so real v2 blocks round-trip', () => {
    // Real Dolby Vision v2 block (Amazon AMZ0000/65E0FEBCEAE9): byte0 = 0x48
    // = version 2, bits 4:2 = 0b010 → DM version code 2 (DM 4.x).
    const decoded = new DolbyVSDBDecoder().decode(new Uint8Array([0x48]));
    expect(decoded.version).toBe(2);
    expect(decoded.dmVersion).toBe(2);
    expect(decoded.supportsGlobalDimming).toBe(false);
    expect(new DolbyVSDBEncoder().encode(decoded)).toEqual(new Uint8Array([0x48]));
  });

  it('clamps out-of-range versions instead of throwing', () => {
    const encoded = new DolbyVSDBEncoder().encode({
      version: 8, supportsYUV422_12bit: false, supports2160p60: false, supportsGlobalDimming: false,
      byte0Reserved: 0, trailing: new Uint8Array(),
    });
    expect(encoded[0] >> 5).toBe(7);
  });
});

describe('DolbyVSDBDecoder', () => {
  it('decodes a v2 byte 0: backlight control, DM version, YUV422', () => {
    // version=2 (010), bits 4:2 = 0b011 (DM code 3), bit 1 backlight=0, bit 0 YUV422=1
    const payload = new Uint8Array([0x4D]);
    const result = new DolbyVSDBDecoder().decode(payload);
    expect(result.version).toBe(2);
    expect(result.supportsYUV422_12bit).toBe(true);
    expect(result.supportsBacklightControl).toBe(false);
    expect(result.dmVersion).toBe(3);
    // No byte 1, so no global dimming.
    expect(result.supportsGlobalDimming).toBe(false);
    expect(result.trailing).toEqual(new Uint8Array(0));
  });

  it('decodes a v0 byte 0: 2160p60, global dimming, reserved bits 4:3', () => {
    const result = new DolbyVSDBDecoder().decode(new Uint8Array([0x0f]));
    expect(result.version).toBe(0);
    expect(result.supportsYUV422_12bit).toBe(true);
    expect(result.supports2160p60).toBe(true);
    expect(result.supportsGlobalDimming).toBe(true);
    expect(result.byte0Reserved).toBe(1);
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
// re-encode from it, byte-identically.
describe('Dolby VSVDB carrier (CTA extended tag 0x01)', () => {
  // Dolby OUI is 00-D0-46; on-wire (LE) the three OUI bytes are 46 D0 00.
  const dolbyWire = (postOui: number[]) =>
    new Uint8Array([0x01, 0x46, 0xd0, 0x00, ...postOui]);

  it('decode attaches a structured dolbyVsdb vendor shape to the carrier', () => {
    // byte0 = (1<<5) | 0b011 = 0x23 (v1), then byte 1 (bit 0 = global
    // dimming, rest kept raw) and one more vendor byte.
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
    expect(fields.byte1Rest).toBe(0xaa);
    expect(Array.from(fields.trailing)).toEqual([0xbb]);
  });

  it('round-trips byte-identically through the carrier, including trailing bytes', () => {
    const wire = dolbyWire([0x23, 0xaa, 0xbb]);
    const block = decodeExtendedDataBlock(wire) as VendorSpecificVideoDataBlock;
    const encoded = encodeExtendedDataBlock(block);
    expect(encoded).toEqual(wire);
  });

  it('re-encodes from edited vendor.fields and preserves the other bytes', () => {
    const wire = dolbyWire([0x23, 0xaa, 0xbb]);
    const block = decodeExtendedDataBlock(wire) as VendorSpecificVideoDataBlock;
    // v1: global dimming is byte 1 bit 0; byte 0 (and its DM version) stays.
    const fields = block.vendor!.fields;
    fields.supportsGlobalDimming = true;
    const encoded = encodeExtendedDataBlock(block);
    expect(encoded).toEqual(dolbyWire([0x23, 0xab, 0xbb]));
    // Re-decode to confirm the edit landed on the carrier.
    const redecoded = decodeExtendedDataBlock(encoded) as VendorSpecificVideoDataBlock;
    expect(redecoded.vendor!.fields.version).toBe(1);
    expect(redecoded.vendor!.fields.supportsGlobalDimming).toBe(true);
    expect(Array.from(redecoded.vendor!.fields.trailing)).toEqual([0xbb]);
  });
});