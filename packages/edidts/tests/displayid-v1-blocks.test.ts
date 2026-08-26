import { describe, expect, it } from 'vitest';
import { checksum8 } from '../src/common';
import {
  DISPLAY_ID_V1_BLOCK_TAGS,
  decodeDisplayIdSection,
  encodeDisplayIdBlock,
  encodeDisplayIdSection,
  isV1DisplayParametersPayloadLengthValid,
  isV1ProductIdentificationPayloadLengthValid,
  isV1TiledDisplayTopologyPayloadLengthValid,
  isV1TypeITimingPayloadLengthValid,
  isV1VendorSpecificPayloadLengthValid,
  type DisplayIdV1DisplayParametersBlock,
  type DisplayIdV1ProductIdentificationBlock,
  type DisplayIdV1TiledDisplayTopologyBlock,
  type DisplayIdV1TypeIDetailedTimingBlock,
  type DisplayIdV1VendorSpecificBlock,
} from '../src/displayid';

function withChecksum(bytes: number[]): Uint8Array {
  const data = new Uint8Array(bytes);
  data[data.length - 1] = checksum8(data);
  return data;
}

/**
 * Wrap a v1.x data-block area (tag + rev/flags + length + payload) in a
 * minimal v1.x section header (version byte 0x10, desktop use, 0 extensions)
 * with a trailing checksum byte.
 */
function v1SectionWith(blockArea: number[]): Uint8Array {
  const bytesInSection = blockArea.length;
  return withChecksum([0x10, bytesInSection, 0x02, 0x00, ...blockArea, 0x00]);
}

describe('DisplayID 1.x section', () => {
  it('decodes the v1.x section header (version 1, revision 0, versionByte 0x10)', () => {
    const sectionBytes = v1SectionWith([
      0x7e, 0x00, 0x00, // unknown v1.x tag, zero-length → raw carrier
    ]);

    const section = decodeDisplayIdSection(sectionBytes);
    expect(section.version).toBe(1);
    expect(section.revision).toBe(0);
    expect(section.versionByte).toBe(0x10);
    expect(section.bytesInSection).toBe(3);
    expect(section.totalLength).toBe(8);
    expect(section.primaryUseCase).toBe(0x02);
    expect(section.extensionCount).toBe(0);
    expect(section.isChecksumValid).toBe(true);
    expect(section.fillBytes).toBe(0);
    expect(section.fillBytesRaw).toBeInstanceOf(Uint8Array);
    expect(section.fillBytesRaw?.length).toBe(0);
  });

  it('round-trips a v1.x section byte-exactly through decode + encode', () => {
    const sectionBytes = v1SectionWith([
      0x7e, 0x00, 0x04, 0xaa, 0xbb, 0xcc, 0xdd, // unknown tag 0x7e, 4-byte payload
    ]);
    const section = decodeDisplayIdSection(sectionBytes);
    const reencoded = encodeDisplayIdSection(section);
    expect(Array.from(reencoded)).toEqual(Array.from(sectionBytes));
  });

  it('preserves the v1.x end-marker (tag 0, len 0) verbatim in fillBytesRaw', () => {
    // tag=0x00 with len=0 is the v1.x end-marker (NOT a Product ID block, which
    // is tag 0x00 with len>0). The walker stops and preserves the marker + any
    // trailing bytes raw in fillBytesRaw so they round-trip.
    const sectionBytes = v1SectionWith([
      0x00, 0x00, 0x00, // end-marker triple
      0xff, 0xff,       // trailing leftover bytes
    ]);
    const section = decodeDisplayIdSection(sectionBytes);
    expect(section.blocks).toHaveLength(0);
    expect(section.fillBytes).toBe(5);
    expect(Array.from(section.fillBytesRaw ?? [])).toEqual([0x00, 0x00, 0x00, 0xff, 0xff]);
    // Byte-exact round-trip including the preserved trailing bytes.
    expect(Array.from(encodeDisplayIdSection(section))).toEqual(Array.from(sectionBytes));
  });

  it('treats tag 0x00 with len>0 as a real Product Identification block (not a marker)', () => {
    // A Product ID block is tag 0x00 with a non-zero length. The walker must NOT
    // treat it as the end-marker. Use a minimal 12-byte payload (no name).
    const productPayload = [
      0x41, 0x42, 0x43, // vendor "ABC"
      0x34, 0x12,       // product code 0x1234
      0x78, 0x56, 0x34, 0x12, // serial 0x12345678
      0x00,             // week (0 → undefined)
      0x00,             // year (0 → undefined)
      0x00,             // name length 0
    ];
    const sectionBytes = v1SectionWith([0x00, 0x00, productPayload.length, ...productPayload]);
    const section = decodeDisplayIdSection(sectionBytes);
    expect(section.blocks).toHaveLength(1);
    expect(section.blocks[0].tag).toBe(DISPLAY_ID_V1_BLOCK_TAGS.ProductIdentification);
    // No trailing fill — the block consumed the whole payload area.
    expect(section.fillBytes).toBe(0);
  });

  it('preserves a declared block that overruns the section payload as raw trailing bytes', () => {
    // Block declares 5 payload bytes but only 2 remain before the checksum.
    // The walker stops and preserves the remainder raw in fillBytesRaw.
    const sectionBytes = v1SectionWith([
      0x7e, 0x00, 0x05, 0xaa, 0xbb, // tag 0x7e, claims 5 bytes, only 2 available
    ]);
    const section = decodeDisplayIdSection(sectionBytes);
    expect(section.blocks).toHaveLength(0);
    expect(Array.from(section.fillBytesRaw ?? [])).toEqual([0x7e, 0x00, 0x05, 0xaa, 0xbb]);
    expect(Array.from(encodeDisplayIdSection(section))).toEqual(Array.from(sectionBytes));
  });
});

describe('DisplayID 1.x Product Identification block (tag 0x00)', () => {
  // 17-byte payload: vendor "ABC", product code 0x1234, serial 0x12345678,
  // week 22, year 2025 (yearByte 25), name length 5, name "Panel".
  const payload = new Uint8Array([
    0x41, 0x42, 0x43, 0x34, 0x12, 0x78, 0x56, 0x34, 0x12, 0x16, 0x19, 0x05,
    0x50, 0x61, 0x6e, 0x65, 0x6c,
  ]);
  const sectionBytes = v1SectionWith([0x00, 0x00, payload.length, ...payload]);

  it('decodes all structured fields', () => {
    const section = decodeDisplayIdSection(sectionBytes);
    const block = section.blocks[0] as DisplayIdV1ProductIdentificationBlock;
    expect(block.tag).toBe(DISPLAY_ID_V1_BLOCK_TAGS.ProductIdentification);
    expect(block.vendorId).toBe('ABC');
    expect(block.productCode).toBe(0x1234);
    expect(block.serialNumber).toBe(0x12345678);
    expect(block.manufactureWeek).toBe(22);
    expect(block.year).toBe(2025);
    expect(block.isModelYear).toBe(false);
    expect(block.productNameLength).toBe(5);
    expect(block.productName).toBe('Panel');
  });

  it('marks a 0xff week as a model year (isModelYear=true, week undefined)', () => {
    const modelYearPayload = new Uint8Array(payload);
    modelYearPayload[9] = 0xff; // model-year sentinel
    const bytes = v1SectionWith([0x00, 0x00, modelYearPayload.length, ...modelYearPayload]);
    const block = decodeDisplayIdSection(bytes).blocks[0] as DisplayIdV1ProductIdentificationBlock;
    expect(block.isModelYear).toBe(true);
    expect(block.manufactureWeek).toBeUndefined();
    expect(block.year).toBe(2025);
  });

  it('round-trips byte-exactly through decode + encode', () => {
    const section = decodeDisplayIdSection(sectionBytes);
    expect(Array.from(encodeDisplayIdSection(section))).toEqual(Array.from(sectionBytes));
  });

  it('re-encodes an edited product name and product code', () => {
    const section = decodeDisplayIdSection(sectionBytes);
    const block = section.blocks[0] as DisplayIdV1ProductIdentificationBlock;
    // The encoder prioritizes `productNameBytes` over `productName` (mirrors
    // v2.0), so drive the edit through the bytes + length so a longer name
    // grows the payload (and the block re-frames via encodeDisplayIdBlock).
    block.productName = 'Monitor';
    block.productNameBytes = new Uint8Array([0x4d, 0x6f, 0x6e, 0x69, 0x74, 0x6f, 0x72]);
    block.productNameLength = 7;
    block.productCode = 0xabcd;
    section.blocks[0] = { ...block, payload: encodeDisplayIdBlock(block) };

    const reencoded = encodeDisplayIdSection(section);
    const redecoded = decodeDisplayIdSection(reencoded);
    const reblock = redecoded.blocks[0] as DisplayIdV1ProductIdentificationBlock;
    expect(reblock.productName).toBe('Monitor');
    expect(reblock.productCode).toBe(0xabcd);
    expect(reblock.vendorId).toBe('ABC'); // untouched field preserved
  });

  it('isV1ProductIdentificationPayloadLengthValid accepts >= 12 bytes', () => {
    expect(isV1ProductIdentificationPayloadLengthValid(12)).toBe(true);
    expect(isV1ProductIdentificationPayloadLengthValid(17)).toBe(true);
    expect(isV1ProductIdentificationPayloadLengthValid(11)).toBe(false);
  });
});

describe('DisplayID 1.x Display Parameters block (tag 0x01, fixed 12 bytes)', () => {
  // image size 600.0x340.0mm, pixels 1920x1080, feature 0x49, gamma 0x64,
  // aspect 0x10, color-depth byte 0x26 (overall 2, native 6).
  const payload = new Uint8Array([
    0x70, 0x17, 0x48, 0x0d, 0x80, 0x07, 0x38, 0x04, 0x49, 0x64, 0x10, 0x26,
  ]);
  const sectionBytes = v1SectionWith([0x01, 0x00, payload.length, ...payload]);

  it('decodes all structured fields (raw wire values)', () => {
    const section = decodeDisplayIdSection(sectionBytes);
    const block = section.blocks[0] as DisplayIdV1DisplayParametersBlock;
    expect(block.tag).toBe(DISPLAY_ID_V1_BLOCK_TAGS.DisplayParameters);
    expect(block.horizontalImageSizeTenthsMm).toBe(6000);
    expect(block.verticalImageSizeTenthsMm).toBe(3400);
    expect(block.horizontalPixelCount).toBe(1920);
    expect(block.verticalPixelCount).toBe(1080);
    expect(block.featureSupportFlags).toBe(0x49);
    expect(block.gamma).toBe(0x64);
    expect(block.aspectRatio).toBe(0x10);
    expect(block.nativeColorDepthCode).toBe(6);
    expect(block.overallColorDepthCode).toBe(2);
  });

  it('round-trips byte-exactly through decode + encode', () => {
    const section = decodeDisplayIdSection(sectionBytes);
    expect(Array.from(encodeDisplayIdSection(section))).toEqual(Array.from(sectionBytes));
  });

  it('re-encodes an edited pixel count and color-depth nibbles', () => {
    const section = decodeDisplayIdSection(sectionBytes);
    const block = section.blocks[0] as DisplayIdV1DisplayParametersBlock;
    block.horizontalPixelCount = 2560;
    block.verticalPixelCount = 1440;
    block.nativeColorDepthCode = 8;
    block.overallColorDepthCode = 4;
    section.blocks[0] = { ...block, payload: encodeDisplayIdBlock(block) };

    const redecoded = decodeDisplayIdSection(encodeDisplayIdSection(section));
    const reblock = redecoded.blocks[0] as DisplayIdV1DisplayParametersBlock;
    expect(reblock.horizontalPixelCount).toBe(2560);
    expect(reblock.verticalPixelCount).toBe(1440);
    expect(reblock.nativeColorDepthCode).toBe(8);
    expect(reblock.overallColorDepthCode).toBe(4);
  });

  it('isV1DisplayParametersPayloadLengthValid accepts exactly 12 bytes', () => {
    expect(isV1DisplayParametersPayloadLengthValid(12)).toBe(true);
    expect(isV1DisplayParametersPayloadLengthValid(11)).toBe(false);
    expect(isV1DisplayParametersPayloadLengthValid(13)).toBe(false);
  });
});

describe('DisplayID 1.x Type I Detailed Timings block (tag 0x03, 20-byte entries)', () => {
  // 1920x1080@60: pixelClockKHz = 10*(1+14849) = 148500, preferred, progressive.
  const descriptor = new Uint8Array([
    0x01, 0x3a, 0x00, // pixel clock raw24 (14849 → 148500 kHz)
    0x80,             // options: preferred, aspect 0, progressive
    0x7f, 0x07,       // hactive 1919 → 1920
    0x17, 0x01,       // hblank 279 → 280
    0x57, 0x00,       // hsync offset 87 → 88, polarity positive
    0x2b, 0x00,       // hsync width 43 → 44
    0x37, 0x04,       // vactive 1079 → 1080
    0x2c, 0x00,       // vblank 44 → 45
    0x03, 0x00,       // vsync offset 3 → 4, polarity positive
    0x04, 0x00,       // vsync width 4 → 5
  ]);
  const sectionBytes = v1SectionWith([0x03, 0x00, descriptor.length, ...descriptor]);

  it('decodes the timing with 10 kHz pixel-clock scaling (Type 1, not Type VII 1 kHz)', () => {
    const section = decodeDisplayIdSection(sectionBytes);
    const block = section.blocks[0] as DisplayIdV1TypeIDetailedTimingBlock;
    expect(block.tag).toBe(DISPLAY_ID_V1_BLOCK_TAGS.TypeIDetailedTiming);
    expect(block.timings).toHaveLength(1);
    const timing = block.timings[0];
    // Type 1: pixelClockKHz = 10*(1+raw24) = 148500 (Type VII would be 14850).
    expect(timing.pixelClockKHz).toBe(148500);
    expect(timing.horizontalActive).toBe(1920);
    expect(timing.verticalActive).toBe(1080);
    expect(timing.horizontalBlanking).toBe(280);
    expect(timing.verticalBlanking).toBe(45);
    expect(timing.horizontalSyncWidth).toBe(44);
    expect(timing.verticalSyncWidth).toBe(5);
    expect(timing.horizontalSyncOffset).toBe(88);
    expect(timing.verticalSyncOffset).toBe(4);
    expect(timing.preferred).toBe(true);
    expect(timing.interlaced).toBe(false);
  });

  it('round-trips byte-exactly through decode + encode', () => {
    const section = decodeDisplayIdSection(sectionBytes);
    expect(Array.from(encodeDisplayIdSection(section))).toEqual(Array.from(sectionBytes));
  });

  it('re-encodes an edited pixel clock and active dimensions', () => {
    const section = decodeDisplayIdSection(sectionBytes);
    const block = section.blocks[0] as DisplayIdV1TypeIDetailedTimingBlock;
    block.timings[0].pixelClockKHz = 74250; // 74.25 MHz → raw24 = 7425-1 = 7424
    block.timings[0].horizontalActive = 1280;
    block.timings[0].verticalActive = 720;
    section.blocks[0] = { ...block, payload: encodeDisplayIdBlock(block) };

    const redecoded = decodeDisplayIdSection(encodeDisplayIdSection(section));
    const reblock = redecoded.blocks[0] as DisplayIdV1TypeIDetailedTimingBlock;
    expect(reblock.timings[0].pixelClockKHz).toBe(74250);
    expect(reblock.timings[0].horizontalActive).toBe(1280);
    expect(reblock.timings[0].verticalActive).toBe(720);
  });

  it('decodes multiple 20-byte entries in a single block', () => {
    const twoTimings = new Uint8Array([...descriptor, ...descriptor]);
    const bytes = v1SectionWith([0x03, 0x00, twoTimings.length, ...twoTimings]);
    const block = decodeDisplayIdSection(bytes).blocks[0] as DisplayIdV1TypeIDetailedTimingBlock;
    expect(block.timings).toHaveLength(2);
    expect(block.timings[0].pixelClockKHz).toBe(148500);
    expect(block.timings[1].pixelClockKHz).toBe(148500);
  });

  it('isV1TypeITimingPayloadLengthValid accepts multiples of 20 bytes', () => {
    expect(isV1TypeITimingPayloadLengthValid(20)).toBe(true);
    expect(isV1TypeITimingPayloadLengthValid(40)).toBe(true);
    expect(isV1TypeITimingPayloadLengthValid(19)).toBe(false);
    expect(isV1TypeITimingPayloadLengthValid(21)).toBe(false);
  });
});

describe('DisplayID 1.x Tiled Display Topology block (tag 0x12, fixed 22 bytes)', () => {
  // caps 0xC9 (singleEnclosure, bezelInfo, subsetTile 1, singleTile 1),
  // 3x2 tile grid, location (2,1), tile 1920x1080, bezels 10/12/8/9,
  // vendor "XYZ", product 0x4242, serial 0xCAFEBABE.
  const payload = new Uint8Array([
    0xc9, 0x21, 0x10, 0x00, 0x7f, 0x07, 0x37, 0x04, 0x02, 0x0a, 0x0c, 0x08, 0x09,
    0x58, 0x59, 0x5a, 0x42, 0x42, 0xbe, 0xba, 0xfe, 0xca,
  ]);
  const sectionBytes = v1SectionWith([0x12, 0x00, payload.length, ...payload]);

  it('decodes all structured fields with human (1-based) tile counts/locations', () => {
    const section = decodeDisplayIdSection(sectionBytes);
    const block = section.blocks[0] as DisplayIdV1TiledDisplayTopologyBlock;
    expect(block.tag).toBe(DISPLAY_ID_V1_BLOCK_TAGS.TiledDisplayTopology);
    expect(block.singleTileBehavior).toBe(1);
    expect(block.subsetTileBehavior).toBe(1);
    expect(block.bezelInfoPresent).toBe(true);
    expect(block.singleEnclosure).toBe(true);
    expect(block.tileCountHorizontal).toBe(3);
    expect(block.tileCountVertical).toBe(2);
    expect(block.tileLocationHorizontal).toBe(2);
    expect(block.tileLocationVertical).toBe(1);
    expect(block.tileWidthPixels).toBe(1920);
    expect(block.tileHeightPixels).toBe(1080);
    expect(block.pixelMultiplier).toBe(2);
    expect(block.topBezelSize).toBe(10);
    expect(block.bottomBezelSize).toBe(12);
    expect(block.rightBezelSize).toBe(8);
    expect(block.leftBezelSize).toBe(9);
    expect(block.vendorId).toBe('XYZ');
    expect(block.productId).toBe(0x4242);
    expect(block.serialNumber).toBe(0xcafebabe);
  });

  it('round-trips byte-exactly through decode + encode (incl. reserved bit 5)', () => {
    // Set reserved bit 5 of the capabilities byte; the encoder preserves it
    // verbatim from the incoming payload even though it is not a named field.
    const bit5Payload = new Uint8Array(payload);
    bit5Payload[0] |= 0x20; // caps → 0xE9
    const bytes = v1SectionWith([0x12, 0x00, bit5Payload.length, ...bit5Payload]);
    const section = decodeDisplayIdSection(bytes);
    expect(Array.from(encodeDisplayIdSection(section))).toEqual(Array.from(bytes));
  });

  it('re-encodes edited tile counts, location, and vendor id', () => {
    const section = decodeDisplayIdSection(sectionBytes);
    const block = section.blocks[0] as DisplayIdV1TiledDisplayTopologyBlock;
    block.tileCountHorizontal = 4; // hCount → 3
    block.tileCountVertical = 3;    // vCount → 2
    block.tileLocationHorizontal = 1; // hLoc → 0
    block.vendorId = 'QED';
    section.blocks[0] = { ...block, payload: encodeDisplayIdBlock(block) };

    const redecoded = decodeDisplayIdSection(encodeDisplayIdSection(section));
    const reblock = redecoded.blocks[0] as DisplayIdV1TiledDisplayTopologyBlock;
    expect(reblock.tileCountHorizontal).toBe(4);
    expect(reblock.tileCountVertical).toBe(3);
    expect(reblock.tileLocationHorizontal).toBe(1);
    expect(reblock.vendorId).toBe('QED');
  });

  it('isV1TiledDisplayTopologyPayloadLengthValid accepts exactly 22 bytes', () => {
    expect(isV1TiledDisplayTopologyPayloadLengthValid(22)).toBe(true);
    expect(isV1TiledDisplayTopologyPayloadLengthValid(21)).toBe(false);
    expect(isV1TiledDisplayTopologyPayloadLengthValid(23)).toBe(false);
  });
});

describe('DisplayID 1.x Vendor-Specific block (tag 0x7f, 3-byte OUI + raw body)', () => {
  // OUI 0x000C03 (HDMI, big-endian bytes 00 0C 03) + a 4-byte vendor body.
  const payload = new Uint8Array([0x00, 0x0c, 0x03, 0x01, 0x02, 0x03, 0x04]);
  const sectionBytes = v1SectionWith([0x7f, 0x00, payload.length, ...payload]);

  it('decodes the big-endian OUI and the raw vendor body', () => {
    const section = decodeDisplayIdSection(sectionBytes);
    const block = section.blocks[0] as DisplayIdV1VendorSpecificBlock;
    expect(block.tag).toBe(DISPLAY_ID_V1_BLOCK_TAGS.VendorSpecific);
    expect(block.ieeeOui).toBe(0x000c03);
    expect(Array.from(block.vendorPayload)).toEqual([0x01, 0x02, 0x03, 0x04]);
  });

  it('round-trips byte-exactly through decode + encode', () => {
    const section = decodeDisplayIdSection(sectionBytes);
    expect(Array.from(encodeDisplayIdSection(section))).toEqual(Array.from(sectionBytes));
  });

  it('re-encodes an edited OUI and vendor body', () => {
    const section = decodeDisplayIdSection(sectionBytes);
    const block = section.blocks[0] as DisplayIdV1VendorSpecificBlock;
    block.ieeeOui = 0x3a0292; // VESA
    block.vendorPayload = new Uint8Array([0xaa, 0xbb]);
    section.blocks[0] = { ...block, payload: encodeDisplayIdBlock(block) };

    const redecoded = decodeDisplayIdSection(encodeDisplayIdSection(section));
    const reblock = redecoded.blocks[0] as DisplayIdV1VendorSpecificBlock;
    expect(reblock.ieeeOui).toBe(0x3a0292);
    expect(Array.from(reblock.vendorPayload)).toEqual([0xaa, 0xbb]);
  });

  it('decodes an OUI-only block (empty vendor body) and round-trips it', () => {
    const ouiOnly = new Uint8Array([0x3a, 0x02, 0x92]); // VESA OUI, no body
    const bytes = v1SectionWith([0x7f, 0x00, ouiOnly.length, ...ouiOnly]);
    const section = decodeDisplayIdSection(bytes);
    const block = section.blocks[0] as DisplayIdV1VendorSpecificBlock;
    expect(block.tag).toBe(DISPLAY_ID_V1_BLOCK_TAGS.VendorSpecific);
    expect(block.ieeeOui).toBe(0x3a0292);
    expect(block.vendorPayload.length).toBe(0);
    expect(Array.from(encodeDisplayIdSection(section))).toEqual(Array.from(bytes));
  });

  it('falls through to the opaque carrier when the payload is too short for an OUI', () => {
    // 2-byte payload: not enough for the 3-byte OUI, so the length gate fails and
    // the block stays a raw generic carrier (no ieeeOui field) that round-trips.
    const bytes = v1SectionWith([0x7f, 0x00, 0x02, 0xaa, 0xbb]);
    const section = decodeDisplayIdSection(bytes);
    const block = section.blocks[0] as Partial<DisplayIdV1VendorSpecificBlock>;
    expect(block.tag).toBe(DISPLAY_ID_V1_BLOCK_TAGS.VendorSpecific);
    expect(block.ieeeOui).toBeUndefined();
    expect(Array.from(encodeDisplayIdSection(section))).toEqual(Array.from(bytes));
  });

  it('isV1VendorSpecificPayloadLengthValid accepts >= 3 bytes (body may be empty)', () => {
    expect(isV1VendorSpecificPayloadLengthValid(3)).toBe(true);
    expect(isV1VendorSpecificPayloadLengthValid(7)).toBe(true);
    expect(isV1VendorSpecificPayloadLengthValid(2)).toBe(false);
    expect(isV1VendorSpecificPayloadLengthValid(0)).toBe(false);
  });
});