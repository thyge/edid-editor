import { describe, expect, it } from 'vitest';
import { checksum8, isChecksum8Valid } from '../src/common';
import {
  decodeDisplayIdSection,
  encodeDisplayIdSection,
  DisplayIdDataBlockTag,
  type DisplayIdVendorSpecificBlock,
} from '../src/displayid';
import {
  DISPLAY_ID_VENDOR_DECODERS,
  DISPLAY_ID_VENDOR_ENCODERS,
  VESA_OUI,
} from '../src/displayid/vendor-specific';

function withChecksum(bytes: number[]): Uint8Array {
  const data = new Uint8Array(bytes);
  data[data.length - 1] = checksum8(data);
  return data;
}

describe('DisplayID 0x7e vendor registry', () => {
  it('registers a paired decoder/encoder for the VESA OUI', () => {
    const decoder = DISPLAY_ID_VENDOR_DECODERS[VESA_OUI];
    expect(decoder).toBeDefined();
    expect(decoder!.kind).toBe('vesaDisplayPort');
    // 3-byte OUI + 2 mandatory vendor bytes = payload length 5.
    expect(decoder!.minLength).toBe(2);
    expect(DISPLAY_ID_VENDOR_ENCODERS['vesaDisplayPort']).toBeDefined();
  });

  it('has a paired encoder for every registered decoder', () => {
    for (const [ouiStr, decoder] of Object.entries(DISPLAY_ID_VENDOR_DECODERS)) {
      expect(DISPLAY_ID_VENDOR_ENCODERS[decoder.kind]).toBeDefined();
      expect(Number(ouiStr)).toBeGreaterThan(0);
    }
  });

  it('dispatches a VESA block to the registered decoder (attaches vesaDisplayPort)', () => {
    // OUI 3A-02-92 (VESA), DP + native colorspace, 5 overlap, Multi-SST Two
    // Streams, DSC bpp 12.5 (vendor bytes 81 25 0c 08).
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x0a, 0x04, 0x00,
      0x7e, 0x00, 0x07,
      0x3a, 0x02, 0x92, 0x81, 0x25, 0x0c, 0x08,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdVendorSpecificBlock;
    expect(block.tag).toBe(DisplayIdDataBlockTag.VendorSpecific);
    expect(block.ieeeOui).toBe(VESA_OUI);
    expect(block.vesaDisplayPort).toBeDefined();
    expect(block.vesaDisplayPort!.structureType).toBe(1);
    expect(block.vesaDisplayPort!.dscBitsPerPixel).toBeCloseTo(12.5, 5);
  });

  it('round-trips an unknown OUI byte-identically via the raw fallback', () => {
    const payload = [0x11, 0x22, 0x33, 0xde, 0xad, 0xbe, 0xef, 0x42];
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x0b, 0x04, 0x00,
      0x7e, 0x00, payload.length,
      ...payload,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdVendorSpecificBlock;
    expect(block.ieeeOui).toBe(0x112233);
    expect(block.vesaDisplayPort).toBeUndefined();
    expect(Array.from(block.payload)).toEqual(payload);

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdVendorSpecificBlock;
    expect(Array.from(reparsedBlock.payload)).toEqual(payload);
    expect(reparsedBlock.vesaDisplayPort).toBeUndefined();
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('does not attach vesaDisplayPort when the VESA body is too short', () => {
    // VESA OUI but only the 3 OUI bytes, no mandatory vendor bytes: not a
    // valid VESA block, so it falls through to the raw shape.
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x06, 0x04, 0x00,
      0x7e, 0x00, 0x03,
      0x3a, 0x02, 0x92,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdVendorSpecificBlock;
    expect(block.ieeeOui).toBe(VESA_OUI);
    expect(block.vesaDisplayPort).toBeUndefined();
    expect(Array.from(block.payload)).toEqual([0x3a, 0x02, 0x92]);
  });
});