/**
 * Regression tests for editing DisplayID: each codec must decode the way
 * edid-decode does, re-encode its own decode byte-for-byte WITHOUT the
 * open-and-save safety net (common/source-bytes.ts), and change only the bits
 * of the field that was edited. Plus the 0x70 block layout rules: zero fill is
 * free space, content that does not fit throws instead of being cut off, and
 * every new section gets its own 0x70 block.
 */
import { describe, expect, it } from 'vitest';
import { checksum8, isChecksum8Valid } from '../src/common';
import {
  DisplayIdDataBlockTag,
  DISPLAY_ID_V1_BLOCK_TAGS,
  createDefaultDisplayIdBlock,
  decodeDisplayIdSection,
  encodeDisplayIdBlock,
  encodeDisplayIdSection,
  isRawDisplayIdBlock,
  type DisplayIdDataBlock,
  type DisplayIdDisplayParametersBlock,
  type DisplayIdDynamicVideoTimingRangeLimitsBlock,
  type DisplayIdProductIdentificationBlock,
  type DisplayIdSection,
  type DisplayIdTiledDisplayTopologyBlock,
  type DisplayIdTypeVIIDetailedTimingBlock,
  type DisplayIdTypeXTimingBlock,
  type DisplayIdTypeXTimingDescriptor,
  type DisplayIdV1ProductIdentificationBlock,
  type DisplayIdV1TypeIDetailedTimingBlock,
  type DisplayIdVendorSpecificBlock,
} from '../src/displayid';
import { encodeKnownPayload } from '../src/displayid/blocks';
import {
  DISPLAY_ID_PAYLOAD_CAPACITY_BYTES,
  addDisplayIdExtensionSection,
  decodeExtension,
  encodeExtension,
  getDisplayIdFreePayloadBytes,
  getDisplayIdSectionChain,
  getDisplayIdSectionEncodedLengths,
  removeDisplayIdExtensionSection,
  removeDisplayIdStructure,
  type DisplayIdExtension,
  type Extension,
  type OpaqueExtension,
} from '../src/eedid/extension';
import { EEDID } from '../src/eedid/eedid';
import { EDID } from '../src/edid';
import { ExtensionBlockParser, type DisplayIdExtensionBlock } from '../src/cta/extension-block';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A section: header, `area` (blocks + fill), checksum. */
function section(versionByte: number, area: number[], primaryUseCase = 0x04, extensionCount = 0): Uint8Array {
  const bytes = new Uint8Array([versionByte, area.length, primaryUseCase, extensionCount, ...area, 0]);
  bytes[bytes.length - 1] = checksum8(bytes, bytes.length - 1);
  return bytes;
}

/** One data block: tag, revision/flags byte, length, payload. */
function dataBlock(tag: number, payload: number[], revisionAndFlags = 0): number[] {
  return [tag, revisionAndFlags, payload.length, ...payload];
}

/** A 128-byte 0x70 extension block carrying `sections` from byte 1, zero padded. */
function block70(...sections: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(128);
  out[0] = 0x70;
  let offset = 1;
  for (const s of sections) {
    out.set(s, offset);
    offset += s.length;
  }
  out[127] = checksum8(out, 127);
  return out;
}

/** Decode one data block from its payload through a v2.0 (or `versionByte`) section. */
function decodeBlock<T extends DisplayIdDataBlock>(tag: number, payload: number[], revisionAndFlags = 0, versionByte = 0x20): T {
  return decodeDisplayIdSection(section(versionByte, dataBlock(tag, payload, revisionAndFlags))).blocks[0] as T;
}

/** Encode a block's payload straight from its model (no source-bytes safety net). */
function modelPayload(block: DisplayIdDataBlock): number[] {
  return Array.from(encodeKnownPayload(block));
}

/** A deep copy of an extension without remembered source bytes, so encoding re-encodes every block. */
function withoutSourceBytes<T>(value: T): T {
  return structuredClone(value);
}

function zeroFillFreeTarget(): DisplayIdExtension {
  // A v2.0 base section whose length byte (0x79) covers zero fill up to the
  // end of the payload — common in real files.
  const productId = dataBlock(0x20, [0x00, 0x10, 0xfa, 0x34, 0x12, 0, 0, 0, 0, 0x01, 0x20, 0x00]);
  const fill = new Array(121 - productId.length).fill(0);
  return decodeExtension(block70(section(0x20, [...productId, ...fill]))) as DisplayIdExtension;
}

// ---------------------------------------------------------------------------
// 1. Zero fill / zero padding is free space
// ---------------------------------------------------------------------------

describe('DisplayID free space (zero fill and padding)', () => {
  it('counts a full-length section\'s zero fill as free and keeps the section valid when a block is added', () => {
    const ext = zeroFillFreeTarget();
    expect(ext.section.bytesInSection).toBe(0x79);
    // 126 - (4 header + 15 product id + 1 checksum)
    expect(getDisplayIdFreePayloadBytes(ext)).toBe(106);

    const containerId = createDefaultDisplayIdBlock(DisplayIdDataBlockTag.ContainerId);
    ext.section.blocks = [...ext.section.blocks, containerId];
    expect(getDisplayIdFreePayloadBytes(ext)).toBe(106 - 19);
    expect(getDisplayIdSectionEncodedLengths(ext)).toEqual([126]);

    const encoded = encodeExtension(ext);
    expect(encoded[2]).toBe(0x79); // section keeps its full length
    expect(isChecksum8Valid(encoded)).toBe(true);
    const reparsed = decodeExtension(encoded) as DisplayIdExtension;
    expect(reparsed.kind).toBe('displayid');
    expect(reparsed.section.isChecksumValid).toBe(true);
    expect(reparsed.section.blocks.map((b) => b.tag)).toEqual([0x20, 0x29]);
    expect(reparsed.section.fillBytes).toBe(121 - 15 - 19);
  });

  it('counts zero padding after a compact section as free and grows the section into it', () => {
    const productId = dataBlock(0x20, [0x00, 0x10, 0xfa, 0x34, 0x12, 0, 0, 0, 0, 0x01, 0x20, 0x00]);
    const ext = decodeExtension(block70(section(0x20, productId))) as DisplayIdExtension;
    expect(ext.trailingBytes?.length).toBe(126 - 20);
    expect(getDisplayIdFreePayloadBytes(ext)).toBe(126 - 20);

    ext.section.blocks = [...ext.section.blocks, createDefaultDisplayIdBlock(DisplayIdDataBlockTag.ContainerId)];
    const reparsed = decodeExtension(encodeExtension(ext)) as DisplayIdExtension;
    expect(reparsed.section.bytesInSection).toBe(15 + 19);
    expect(reparsed.section.isChecksumValid).toBe(true);
  });

  it('reports free space for an extension the editor created, after save and reload', () => {
    const created: DisplayIdExtension = {
      kind: 'displayid',
      tag: 0x70,
      revision: 0,
      checksum: 0,
      section: {
        version: 2, revision: 0, versionByte: 0x20, bytesInSection: 0, totalLength: 5,
        primaryUseCase: 0x04, extensionCount: 0, blocks: [], fillBytes: 0, checksum: 0, isChecksumValid: true,
      },
    };
    expect(getDisplayIdFreePayloadBytes(created)).toBe(121);
    const reloaded = decodeExtension(encodeExtension(created)) as DisplayIdExtension;
    expect(getDisplayIdFreePayloadBytes(reloaded)).toBe(121);
  });

  it('keeps non-zero trailing bytes and counts them as used', () => {
    const bytes = block70(section(0x20, []));
    bytes[10] = 0xab; // stray byte after the 5-byte section
    bytes[127] = checksum8(bytes, 127);
    const ext = decodeExtension(bytes) as DisplayIdExtension;
    expect(getDisplayIdFreePayloadBytes(ext)).toBe(126 - 5 - 5); // section + bytes up to 0xab
    expect(Array.from(encodeExtension(withoutSourceBytes(ext)))).toEqual(Array.from(bytes));
  });

  it('round-trips open-and-save byte-exactly for zero-filled sections', () => {
    const ext = zeroFillFreeTarget();
    const bytes = encodeExtension(ext);
    expect(Array.from(encodeExtension(withoutSourceBytes(decodeExtension(bytes))))).toEqual(Array.from(bytes));
  });
});

// ---------------------------------------------------------------------------
// 2. Content that does not fit throws instead of being cut off
// ---------------------------------------------------------------------------

describe('DisplayID size limits', () => {
  /** A full v1.2 section: product id + Type I block with 5 timings + 3 zero fill bytes. */
  function fullV1Section(): Uint8Array {
    const timing = [
      0xf1, 0x39, 0x00, 0x04, 0x7f, 0x07, 0x17, 0x01, 0x57, 0x80,
      0x2b, 0x00, 0x37, 0x04, 0x2c, 0x00, 0x03, 0x80, 0x04, 0x00,
    ];
    const productId = dataBlock(0x00, [0x41, 0x42, 0x43, 0, 0, 0, 0, 0, 0, 0, 0x20, 0]);
    const timings = dataBlock(0x03, [...timing, ...timing, ...timing, ...timing, ...timing]);
    return section(0x12, [...productId, ...timings, 0, 0, 0]);
  }

  it('throws instead of truncating when a timing no longer fits a full v1.2 section', () => {
    const bytes = block70(fullV1Section());
    const ext = decodeExtension(bytes) as DisplayIdExtension;
    expect(ext.section.bytesInSection).toBe(121);
    expect(getDisplayIdFreePayloadBytes(ext)).toBe(3);

    const typeI = ext.section.blocks[1] as DisplayIdV1TypeIDetailedTimingBlock;
    ext.section.blocks[1] = { ...typeI, timings: [...typeI.timings, { ...typeI.timings[0] }] };
    expect(getDisplayIdFreePayloadBytes(ext)).toBe(-17);
    expect(() => encodeExtension(ext)).toThrow(/does not fit/);
  });

  it('encodes a 126-byte section without overwriting its checksum', () => {
    const vendorPayload = [0x11, 0x22, 0x33, ...new Array(115).fill(0x5a)];
    const bytes = block70(section(0x20, dataBlock(0x7e, vendorPayload)));
    const ext = decodeExtension(bytes) as DisplayIdExtension;
    expect(ext.section.totalLength).toBe(126);
    const encoded = encodeExtension(withoutSourceBytes(ext));
    expect(Array.from(encoded)).toEqual(Array.from(bytes));
    expect(decodeDisplayIdSection(encoded.subarray(1, 127)).isChecksumValid).toBe(true);

    const vendor = ext.section.blocks[0] as DisplayIdVendorSpecificBlock;
    ext.section.blocks[0] = { ...vendor, payload: new Uint8Array([...vendorPayload, 0x5a]) };
    expect(() => encodeExtension(ext)).toThrow(/does not fit/);
  });
});

// ---------------------------------------------------------------------------
// 3. Display Parameters: device technology is bits 6:4
// ---------------------------------------------------------------------------

describe('Display Parameters device technology', () => {
  function params(byte27: number): DisplayIdDisplayParametersBlock {
    const payload = new Array(29).fill(0);
    payload[27] = byte27;
    payload[28] = 0xff;
    return decodeBlock<DisplayIdDisplayParametersBlock>(0x21, payload);
  }

  it('reads technology from bits 6:4 like edid-decode', () => {
    const lcd = params(0x12);
    expect(lcd.displayDeviceTechnology).toBe(1); // Active Matrix LCD
    expect(lcd.nativeColorDepth).toBe(2);
    expect(params(0x20).displayDeviceTechnology).toBe(2); // OLED
  });

  it('writes technology to bits 6:4 and keeps reserved bits', () => {
    const block = params(0x02);
    expect(modelPayload({ ...block, displayDeviceTechnology: 1 })[27]).toBe(0x12);
    expect(modelPayload(params(0x40))[27]).toBe(0x40);
    expect(modelPayload(params(0x08))[27]).toBe(0x08); // reserved bit 3
    const featureReserved = new Array(29).fill(0);
    featureReserved[8] = 0x20;
    expect(modelPayload(decodeBlock(0x21, featureReserved))).toEqual(featureReserved);
  });
});

// ---------------------------------------------------------------------------
// 4 + 5. Product Identification: big-endian OUI, name length
// ---------------------------------------------------------------------------

describe('Product Identification', () => {
  const panel = [0x00, 0x10, 0xfa, 0x34, 0x12, 0x78, 0x56, 0x34, 0x12, 0x16, 0x19, 0x05, 0x50, 0x61, 0x6e, 0x65, 0x6c];

  it('reads and writes the OUI big-endian like edid-decode', () => {
    const block = decodeBlock<DisplayIdProductIdentificationBlock>(0x20, panel);
    expect(block.ieeeOui).toBe(0x0010fa);
    expect(modelPayload(block)).toEqual(panel);
    expect(modelPayload({ ...block, ieeeOui: 0x3a0292 }).slice(0, 3)).toEqual([0x3a, 0x02, 0x92]);
  });

  it('shortens the payload when the product name gets shorter', () => {
    const block = decodeBlock<DisplayIdProductIdentificationBlock>(0x20, panel);
    const renamed = modelPayload({
      ...block,
      productName: 'AB',
      productNameBytes: new Uint8Array([0x41, 0x42]),
      productNameLength: 2,
    });
    expect(renamed).toEqual([...panel.slice(0, 11), 0x02, 0x41, 0x42]);
    // Setting only the string works too.
    expect(modelPayload({ ...block, productName: 'AB' })).toEqual(renamed);
  });

  it('keeps bytes after the name and moves them with a rename', () => {
    const block = decodeBlock<DisplayIdProductIdentificationBlock>(0x20, [...panel, 0xaa, 0xbb]);
    expect(modelPayload(block)).toEqual([...panel, 0xaa, 0xbb]);
    expect(modelPayload({ ...block, productName: 'AB' })).toEqual([...panel.slice(0, 11), 0x02, 0x41, 0x42, 0xaa, 0xbb]);
  });

  it('leaves a name longer than its payload raw (edid-decode rejects it)', () => {
    const block = decodeBlock(0x20, [...panel.slice(0, 11), 0x09, 0x41]);
    expect(isRawDisplayIdBlock(block)).toBe(true);
  });

  it('shortens a DisplayID 1.x product name the same way', () => {
    const v1 = [0x41, 0x42, 0x43, 0x34, 0x12, 0, 0, 0, 0, 0x16, 0x19, 0x05, 0x50, 0x61, 0x6e, 0x65, 0x6c];
    const block = decodeBlock<DisplayIdV1ProductIdentificationBlock>(0x00, v1, 0, 0x12);
    expect(modelPayload(block)).toEqual(v1);
    expect(modelPayload({ ...block, productName: 'AB' })).toEqual([...v1.slice(0, 11), 0x02, 0x41, 0x42]);
  });
});

// ---------------------------------------------------------------------------
// 6. Dynamic Video Timing Range Limits (9-byte edid-decode layout)
// ---------------------------------------------------------------------------

describe('Dynamic Video Timing Range Limits', () => {
  // 25 MHz .. 600 MHz (stored minus one), 48 .. 144 Hz, seamless.
  const payload = [0xa7, 0x61, 0x00, 0xbf, 0x27, 0x09, 0x30, 0x90, 0x80];

  it('decodes the 9-byte layout', () => {
    const block = decodeBlock<DisplayIdDynamicVideoTimingRangeLimitsBlock>(0x25, payload);
    expect(isRawDisplayIdBlock(block)).toBe(false);
    expect(block.minimumPixelClockKHz).toBe(25_000);
    expect(block.maximumPixelClockKHz).toBe(600_000);
    expect(block.minimumVerticalFrequencyHz).toBe(48);
    expect(block.maximumVerticalFrequencyHz).toBe(144);
    expect(block.seamlessDynamicVideoTiming).toBe(true);
    expect(modelPayload(block)).toEqual(payload);
  });

  it('reads the 10-bit maximum refresh rate of block revision 1', () => {
    const rev1 = [...payload.slice(0, 7), 0x2c, 0x81]; // 0x12c = 300 Hz
    const block = decodeBlock<DisplayIdDynamicVideoTimingRangeLimitsBlock>(0x25, rev1, 0x01);
    expect(block.maximumVerticalFrequencyHz).toBe(300);
    expect(modelPayload(block)).toEqual(rev1);
    // Revision 0 has no high bits: they are reserved and kept as-is.
    const rev0 = decodeBlock<DisplayIdDynamicVideoTimingRangeLimitsBlock>(0x25, rev1, 0x00);
    expect(rev0.maximumVerticalFrequencyHz).toBe(0x2c);
    expect(modelPayload(rev0)).toEqual(rev1);
  });

  it('changes only the edited field', () => {
    const block = decodeBlock<DisplayIdDynamicVideoTimingRangeLimitsBlock>(0x25, [...payload.slice(0, 8), 0x0c]);
    expect(modelPayload({ ...block, seamlessDynamicVideoTiming: true })).toEqual([...payload.slice(0, 8), 0x8c]);
    expect(modelPayload({ ...block, minimumVerticalFrequencyHz: 50 })[6]).toBe(50);
  });

  it('has a default block that encodes to the edid-decode layout', () => {
    const block = createDefaultDisplayIdBlock(DisplayIdDataBlockTag.DynamicVideoTimingRangeLimits);
    expect(Array.from(encodeDisplayIdBlock(block))).toEqual([0x25, 0x00, 0x09, ...payload.slice(0, 8), 0x00]);
  });
});

// ---------------------------------------------------------------------------
// 7. Type X timings use the +1 convention
// ---------------------------------------------------------------------------

describe('Type X timings', () => {
  it('decodes 3840x2160@144 with the +1 convention', () => {
    const block = decodeBlock<DisplayIdTypeXTimingBlock>(0x2a, [0x00, 0xff, 0x0e, 0x6f, 0x08, 0x8f]);
    expect(block.timings[0]).toMatchObject({ horizontalActivePixels: 3840, verticalActiveLines: 2160, refreshRate: 144 });
    expect(modelPayload(block)).toEqual([0x00, 0xff, 0x0e, 0x6f, 0x08, 0x8f]);
  });

  it('encodes the editor default 1920x1080@60 as edid-decode reads it', () => {
    const timing: DisplayIdTypeXTimingDescriptor = {
      timingFormula: 0, earlyVsync: false, rr1000div1001OrHblank: false, stereoSupport: 0, ycc420Support: false,
      horizontalActivePixels: 1920, verticalActiveLines: 1080, refreshRate: 60,
      deltaHblank: 0, additionalVblankTiming: 0, additionalMiniVblank: false,
    };
    const block = createDefaultDisplayIdBlock(DisplayIdDataBlockTag.TypeXTiming) as DisplayIdTypeXTimingBlock;
    expect(modelPayload({ ...block, timings: [timing] } as DisplayIdTypeXTimingBlock)).toEqual([0x00, 0x7f, 0x07, 0x37, 0x04, 0x3b]);
  });

  it('carries refresh rates above 256 Hz in 7-byte descriptors and clamps 6-byte ones', () => {
    const seven = decodeBlock<DisplayIdTypeXTimingBlock>(0x2a, [0x02, 0xff, 0x0e, 0x6f, 0x08, 0xdf, 0x01], 0x10);
    expect(seven.descriptorSize).toBe(7);
    expect(seven.timings[0].refreshRate).toBe(480);
    expect(modelPayload(seven)).toEqual([0x02, 0xff, 0x0e, 0x6f, 0x08, 0xdf, 0x01]);
    const six = decodeBlock<DisplayIdTypeXTimingBlock>(0x2a, [0x00, 0xff, 0x0e, 0x6f, 0x08, 0x8f]);
    six.timings[0].refreshRate = 480;
    expect(modelPayload(six)[5]).toBe(0xff); // 256 Hz, not 480 wrapped
  });
});

// ---------------------------------------------------------------------------
// 8 + 13. Vendor-specific blocks
// ---------------------------------------------------------------------------

describe('Vendor-specific (0x7e)', () => {
  it('writes the OUI of a newly added block', () => {
    const block = createDefaultDisplayIdBlock(DisplayIdDataBlockTag.VendorSpecific) as DisplayIdVendorSpecificBlock;
    expect(Array.from(encodeDisplayIdBlock({ ...block, ieeeOui: 0x3a0292 }))).toEqual([0x7e, 0x00, 0x03, 0x3a, 0x02, 0x92]);
  });

  it('applies payload and OUI edits of an unknown-OUI block', () => {
    const block = decodeBlock<DisplayIdVendorSpecificBlock>(0x7e, [0x11, 0x22, 0x33, 0xaa]);
    expect(block.ieeeOui).toBe(0x112233);
    expect(modelPayload(block)).toEqual([0x11, 0x22, 0x33, 0xaa]);
    // The editor's hex field sets the payload and the OUI it starts with.
    expect(modelPayload({ ...block, payload: new Uint8Array([0x44, 0x55, 0x66, 0xbb]), ieeeOui: 0x445566 }))
      .toEqual([0x44, 0x55, 0x66, 0xbb]);
    // Editing only the OUI replaces only the first three bytes.
    expect(modelPayload({ ...block, ieeeOui: 0x00001b })).toEqual([0x00, 0x00, 0x1b, 0xaa]);
  });

  it('keeps the VESA DisplayPort reserved bits and changes only edited fields', () => {
    const payload = [0x3a, 0x02, 0x92, 0xf9, 0x90, 0xc5, 0xf3];
    const block = decodeBlock<DisplayIdVendorSpecificBlock>(0x7e, payload);
    expect(block.vesaDisplayPort).toMatchObject({ structureType: 1, horizontalOverlapPixels: 0, dscBitsPerPixel: 5 + 3 / 16 });
    expect(modelPayload(block)).toEqual(payload);
    const edited = modelPayload({ ...block, vesaDisplayPort: { ...block.vesaDisplayPort!, structureType: 0, horizontalOverlapPixels: 8 } });
    expect(edited).toEqual([0x3a, 0x02, 0x92, 0xf8, 0x98, 0xc5, 0xf3]);
  });

  it('clamps out-of-range section header values instead of wrapping', () => {
    const decoded = decodeDisplayIdSection(section(0x20, []));
    const encoded = encodeDisplayIdSection({ ...decoded, primaryUseCase: 300, extensionCount: -1 });
    expect(encoded[2]).toBe(0xff); // not 300 & 0xff = 44
    expect(encoded[3]).toBe(0x00);
  });
});

// ---------------------------------------------------------------------------
// 9 + 10. Sections live in their own 0x70 blocks
// ---------------------------------------------------------------------------

describe('DisplayID section chain across 0x70 blocks', () => {
  function edidWithDisplayId(): EEDID {
    const base = decodeExtension(block70(section(0x20, dataBlock(0x29, new Array(16).fill(0x11))))) as DisplayIdExtension;
    return new EEDID({ base: EDID.blank(), extensions: [base] });
  }

  it('adds a section as a new 0x70 block and updates the base extension count', () => {
    const edid = edidWithDisplayId();
    edid.extensions = addDisplayIdExtensionSection(edid.extensions);
    const chain = getDisplayIdSectionChain(edid);
    expect(chain).toHaveLength(2);
    expect(chain[1].extension).not.toBe(chain[0].extension);
    expect(chain[0].section.extensionCount).toBe(1);
    chain[1].section.blocks = [createDefaultDisplayIdBlock(DisplayIdDataBlockTag.ContainerId)];

    const bytes = EEDID.encode(edid);
    expect(bytes.length).toBe(3 * 128);
    expect(bytes[126]).toBe(2);
    const second = bytes.subarray(256, 384);
    expect(Array.from(second.subarray(0, 5))).toEqual([0x70, 0x20, 19, 0x00, 0x00]);
    expect(isChecksum8Valid(second)).toBe(true);
    // Everything after the section (5 + 19 bytes) is zero padding.
    expect(second.subarray(1 + 5 + 19, 127).every((b) => b === 0)).toBe(true);

    const reloaded = EEDID.decode(bytes);
    const reloadedChain = getDisplayIdSectionChain(reloaded);
    expect(reloadedChain.map((e) => e.section.isChecksumValid)).toEqual([true, true]);
    expect(reloadedChain[0].section.extensionCount).toBe(1);
    expect(reloadedChain[1].section.blocks[0].tag).toBe(0x29);
  });

  it('removes an extension section together with its block', () => {
    const edid = edidWithDisplayId();
    edid.extensions = addDisplayIdExtensionSection(edid.extensions);
    edid.extensions = removeDisplayIdExtensionSection(edid.extensions, 1);
    expect(edid.extensions).toHaveLength(1);
    expect(getDisplayIdSectionChain(edid)[0].section.extensionCount).toBe(0);
    expect(removeDisplayIdExtensionSection(edid.extensions, 0)).toBe(edid.extensions);
  });

  it('removes a section packed into a legacy multi-section block and keeps the file decodable', () => {
    const legacy = decodeExtension(block70(section(0x20, [], 0x04, 1), section(0x20, [], 0x00, 0))) as DisplayIdExtension;
    const edid = new EEDID({ base: EDID.blank(), extensions: [legacy] });
    expect(getDisplayIdSectionChain(edid)).toHaveLength(2);
    edid.extensions = removeDisplayIdExtensionSection(edid.extensions, 1);
    expect(edid.extensions).toHaveLength(1);
    expect(legacy.sections).toHaveLength(1);
    expect(legacy.section.extensionCount).toBe(0);
  });

  it('removes only DisplayID blocks when the DisplayID is removed', () => {
    const opaque70: OpaqueExtension = { kind: 'opaque', tag: 0x70, revision: 0, bytes: new Uint8Array(128), checksum: 0 };
    const edid = edidWithDisplayId();
    edid.extensions = addDisplayIdExtensionSection(edid.extensions);
    const extensions: Extension[] = [...edid.extensions, opaque70];
    expect(removeDisplayIdStructure(extensions)).toEqual([opaque70]);
  });
});

// ---------------------------------------------------------------------------
// 11. Type VII / Type I options bit 7
// ---------------------------------------------------------------------------

describe('Type VII options bit 7', () => {
  const descriptor = [
    0x13, 0x44, 0x02, 0x84, 0x7f, 0x07, 0x17, 0x01, 0x57, 0x80,
    0x2b, 0x00, 0x37, 0x04, 0x2c, 0x00, 0x03, 0x80, 0x04, 0x00,
  ];

  it('means YCbCr 4:2:0 from block revision 2 on, preferred before', () => {
    const rev2 = decodeBlock<DisplayIdTypeVIIDetailedTimingBlock>(0x22, descriptor, 0x02);
    expect(rev2.timings[0]).toMatchObject({ preferred: false, ycbcr420: true });
    expect(modelPayload(rev2)).toEqual(descriptor);
    rev2.timings[0].ycbcr420 = false;
    expect(modelPayload(rev2)[3]).toBe(0x04);

    const rev0 = decodeBlock<DisplayIdTypeVIIDetailedTimingBlock>(0x22, descriptor, 0x00);
    expect(rev0.timings[0].preferred).toBe(true);
    expect(rev0.timings[0].ycbcr420).toBeUndefined();
    expect(modelPayload(rev0)).toEqual(descriptor);
  });
});

// ---------------------------------------------------------------------------
// 12. Tile location is 0-based
// ---------------------------------------------------------------------------

describe('Tiled Display Topology location', () => {
  it('exposes the tile location 0-based, bytes unchanged', () => {
    const payload = [0x81, 0x11, 0x10, 0x00, 0x7f, 0x07, 0x37, 0x04, 0, 0, 0, 0, 0, 0x00, 0x10, 0xfa, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00];
    const block = decodeBlock<DisplayIdTiledDisplayTopologyBlock>(0x28, payload);
    expect(block.tileCountHorizontal).toBe(2);
    expect(block.tileLocationHorizontal).toBe(1); // edid-decode "Tile location: 1, 0"
    expect(block.tileLocationVertical).toBe(0);
    expect(modelPayload(block)).toEqual(payload);
  });
});

// ---------------------------------------------------------------------------
// 14. ExtensionBlockParser 0x70 path matches eedid/extension.ts framing
// ---------------------------------------------------------------------------

describe('ExtensionBlockParser 0x70 framing', () => {
  it('decodes a real block (section from byte 1) and re-encodes it byte-exactly', () => {
    const bytes = block70(section(0x20, dataBlock(0x7e, [0x11, 0x22, 0x33, ...new Array(115).fill(0x5a)])));
    const decoded = ExtensionBlockParser.decode(bytes) as DisplayIdExtensionBlock;
    expect(decoded.section.totalLength).toBe(126);
    expect(Array.from(ExtensionBlockParser.encode(decoded))).toEqual(Array.from(bytes));
  });
});

// ---------------------------------------------------------------------------
// 15. DisplayID 2.1 sections use the 2.0 block walker
// ---------------------------------------------------------------------------

describe('DisplayID 2.1', () => {
  it('decodes version 0x21 sections into structured blocks and round-trips them', () => {
    const bytes = block70(section(0x21, dataBlock(0x25, [0xa7, 0x61, 0x00, 0xbf, 0x27, 0x09, 0x30, 0x90, 0x80])));
    const ext = decodeExtension(bytes) as DisplayIdExtension;
    expect(ext.kind).toBe('displayid');
    const s: DisplayIdSection = ext.section;
    expect(s.version).toBe(2);
    expect(s.revision).toBe(1);
    expect(isRawDisplayIdBlock(s.blocks[0])).toBe(false);
    expect(Array.from(encodeExtension(withoutSourceBytes(ext)))).toEqual(Array.from(bytes));
  });
});

// ---------------------------------------------------------------------------
// Safety net off: unedited blocks re-encode from their model byte-exactly
// ---------------------------------------------------------------------------

describe('model round-trip without the source-bytes safety net', () => {
  it.each([
    ['product id (v1)', DISPLAY_ID_V1_BLOCK_TAGS.ProductIdentification, [0xc1, 0xc2, 0x43, 0x34, 0x12, 1, 2, 3, 4, 0xff, 0x19, 0x01, 0xd0], 0x12],
    ['tiled (v1, high-bit vendor)', DISPLAY_ID_V1_BLOCK_TAGS.TiledDisplayTopology, [0xa9, 0x21, 0x10, 0x00, 0x7f, 0x07, 0x37, 0x04, 2, 10, 12, 8, 9, 0xd8, 0x59, 0x5a, 0x42, 0x42, 0xbe, 0xba, 0xfe, 0xca], 0x12],
    ['display parameters', 0x21, [0x58, 0x02, 0x22, 0x01, 0x80, 0x07, 0x38, 0x04, 0x69, 0x00, 0x02, 0x10, 0x40, 0x06, 0x32, 0x20, 0x83, 0x25, 0x60, 0x09, 0xa0, 0x48, 0x42, 0x48, 0x4a, 0x00, 0x00, 0x9e, 0x64], 0x20],
  ])('%s', (_name, tag, payload, versionByte) => {
    const block = decodeBlock(tag as number, payload as number[], 0, versionByte as number);
    expect(isRawDisplayIdBlock(block)).toBe(false);
    expect(modelPayload(block)).toEqual(payload);
  });

  it('a full extension re-encodes byte-exactly from a source-free copy', () => {
    expect(DISPLAY_ID_PAYLOAD_CAPACITY_BYTES).toBe(126);
    const ext = zeroFillFreeTarget();
    const bytes = encodeExtension(ext);
    expect(Array.from(encodeExtension(withoutSourceBytes(ext)))).toEqual(Array.from(bytes));
  });
});
