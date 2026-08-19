import { describe, expect, it } from 'vitest';
import { checksum8, isChecksum8Valid } from '../src/common';
import {
  DisplayIdDataBlockTag,
  decodeDisplayIdSection,
  displayIdChromaticityValue,
  displayIdGammaValue,
  displayIdLuminanceToCdM2,
  encodeDisplayIdBlock,
  encodeDisplayIdSection,
  type DisplayIdDisplayParametersBlock,
  type DisplayIdDisplayInterfaceFeaturesBlock,
  type DisplayIdDynamicVideoTimingRangeLimitsBlock,
  type DisplayIdContainerIdBlock,
  type DisplayIdCtaBlock,
  type DisplayIdStereoDisplayInterfaceBlock,
  type DisplayIdTiledDisplayTopologyBlock,
  type DisplayIdTypeVIIDetailedTiming,
  type DisplayIdTypeVIIDetailedTimingBlock,
  type DisplayIdTypeVIIIEnumeratedTimingCodeBlock,
  type DisplayIdTypeIXFormulaBasedTiming,
  type DisplayIdTypeIXFormulaBasedTimingBlock,
  type DisplayIdVendorSpecificBlock,
} from '../src/displayid';

function withChecksum(bytes: number[]): Uint8Array {
  const data = new Uint8Array(bytes);
  data[data.length - 1] = checksum8(data);
  return data;
}

describe('DisplayID Display Parameters block', () => {
  // Full 29-byte DisplayID 2.0 §4.2 payload (Table 4-7), field-by-field crafted.
  // image size 600x290 (0.1mm), pixel count 1920x1080, feature byte 0x49
  // (scan 1, luminance info 1, CIE 1976, audio integrated),
  // primaries P1=(0x200,0x100) P2=(0x640,0x320) P3=(0x320,0x258),
  // white point (0x960,0xA00), luminance raw16 0x4248/0x4A48/0x0000,
  // color-depth byte 0x96 (depth 6, tech 2, dark theme), gamma 0x64 (2.00).
  const payload = new Uint8Array([
    0x58, 0x02, 0x22, 0x01, 0x80, 0x07, 0x38, 0x04, 0x49,
    0x00, 0x02, 0x10, 0x40, 0x06, 0x32, 0x20, 0x83, 0x25, 0x60, 0x09, 0xa0,
    0x48, 0x42, 0x48, 0x4a, 0x00, 0x00, 0x96, 0x64,
  ]);
  if (payload.length !== 29) throw new Error(`payload must be 29 bytes, got ${payload.length}`);

  function sectionWith(payloadBytes: Uint8Array): Uint8Array {
    const bytesInSection = 3 + payloadBytes.length;
    return withChecksum([
      0x20, bytesInSection, 0x04, 0x00,
      0x21, 0x00, payloadBytes.length,
      ...payloadBytes,
      0x00,
    ]);
  }

  it('decodes the full 29-byte field set (chromaticity, luminance, gamma, scan orientation)', () => {
    const section = decodeDisplayIdSection(sectionWith(payload));
    const block = section.blocks[0] as DisplayIdDisplayParametersBlock;

    expect(block.tag).toBe(DisplayIdDataBlockTag.DisplayParameters);
    // Image size + pixel count
    expect(block.horizontalImageSizeMm).toBe(600);
    expect(block.verticalImageSizeMm).toBe(290);
    expect(block.horizontalPixelCount).toBe(1920);
    expect(block.verticalPixelCount).toBe(1080);
    // Feature byte (scan orientation, luminance info, CIE, audio)
    expect(block.scanOrientation).toBe(1);
    expect(block.luminanceInformation).toBe(1);
    expect(block.colorInformationCie1976).toBe(true);
    expect(block.audioSpeakerNotIntegrated).toBe(false);
    // Chromaticity (AC #1) — 12-bit packed
    expect(block.primary1).toEqual({ x: 0x200, y: 0x100 });
    expect(block.primary2).toEqual({ x: 0x640, y: 0x320 });
    expect(block.primary3).toEqual({ x: 0x320, y: 0x258 });
    expect(block.whitePoint).toEqual({ x: 0x960, y: 0xa00 });
    // Luminance (AC #2) — IEEE 754 binary16 raw
    expect(block.maxLuminanceFullCoverage).toBe(0x4248);
    expect(block.maxLuminance10PercentRect).toBe(0x4a48);
    expect(block.minLuminance).toBe(0x0000);
    // Color depth + technology + theme
    expect(block.nativeColorDepth).toBe(6);
    expect(block.displayDeviceTechnology).toBe(2);
    expect(block.displayDeviceThemePreference).toBe(true);
    // Gamma (AC #3)
    expect(block.gammaEotf).toBe(0x64);
  });

  it('round-trips the full 29-byte block byte-identically (AC #5)', () => {
    const source = sectionWith(payload);
    const section = decodeDisplayIdSection(source);
    const encoded = encodeDisplayIdSection(section);
    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('encodes Display Parameters from edited typed fields', () => {
    const section = decodeDisplayIdSection(sectionWith(new Uint8Array(29)));
    const block = section.blocks[0] as DisplayIdDisplayParametersBlock;

    block.horizontalImageSizeMm = 3440;
    block.verticalImageSizeMm = 1940;
    block.horizontalPixelCount = 2560;
    block.verticalPixelCount = 1440;
    block.scanOrientation = 4;
    block.colorInformationCie1976 = false;
    block.primary1 = { x: 0x640, y: 0x350 };
    block.whitePoint = { x: 0x950, y: 0xa50 };
    block.maxLuminanceFullCoverage = 0x4248;
    block.minLuminance = 0x0001;
    block.nativeColorDepth = 4; // 3-bit field (0..7)
    block.displayDeviceTechnology = 3;
    block.gammaEotf = 0x78; // (100+0x78)/100 = 2.20

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdDisplayParametersBlock;

    expect(reparsedBlock.horizontalImageSizeMm).toBe(3440);
    expect(reparsedBlock.verticalImageSizeMm).toBe(1940);
    expect(reparsedBlock.horizontalPixelCount).toBe(2560);
    expect(reparsedBlock.verticalPixelCount).toBe(1440);
    expect(reparsedBlock.scanOrientation).toBe(4);
    expect(reparsedBlock.colorInformationCie1976).toBe(false);
    expect(reparsedBlock.primary1).toEqual({ x: 0x640, y: 0x350 });
    expect(reparsedBlock.whitePoint).toEqual({ x: 0x950, y: 0xa50 });
    expect(reparsedBlock.maxLuminanceFullCoverage).toBe(0x4248);
    expect(reparsedBlock.minLuminance).toBe(0x0001);
    expect(reparsedBlock.nativeColorDepth).toBe(4);
    expect(reparsedBlock.displayDeviceTechnology).toBe(3);
    expect(reparsedBlock.gammaEotf).toBe(0x78);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('decodes the image-size precision multiplier from the block flags bit 7', () => {
    // flags byte (section[5]) bit 7 set → 1.0 mm precision. byte1 = (flags<<3)|rev,
    // so flags 0x10 (bit 4) → byte1 bit 7 = 0x80. With revision 0, byte1 = 0x80.
    const source = withChecksum([
      0x20, 0x20, 0x04, 0x00,
      0x21, 0x80, 0x1d,
      ...payload,
      0x00,
    ]);
    const block = decodeDisplayIdSection(source).blocks[0] as DisplayIdDisplayParametersBlock;
    expect(block.imageSizeInMm).toBe(true);
    // Round-trips the flags byte unchanged.
    const reencoded = encodeDisplayIdSection(decodeDisplayIdSection(source));
    expect(reencoded[5]).toBe(0x80);
  });

  it('exposes luminance/gamma/chromaticity helper decoders', () => {
    expect(displayIdLuminanceToCdM2(0x4248)).toBeCloseTo(3.140625, 5);
    expect(Number.isNaN(displayIdLuminanceToCdM2(0x8000))).toBe(true); // "do not use"
    expect(Number.isNaN(displayIdLuminanceToCdM2(0x8400))).toBe(true); // reserved
    expect(displayIdGammaValue(0xff)).toBeNull();
    expect(displayIdGammaValue(0x64)).toBeCloseTo(2.0, 5);
    expect(displayIdChromaticityValue(0x200)).toBeCloseTo(0.125, 5);
  });

  it('preserves malformed short Display Parameters payloads as generic blocks', () => {
    const source = withChecksum([
      0x20, 0x05, 0x04, 0x00,
      0x21, 0x00, 0x02,
      0xaa, 0xbb,
      0x00,
    ]);
    const section = decodeDisplayIdSection(source);
    const block = section.blocks[0];

    expect(block.tag).toBe(DisplayIdDataBlockTag.DisplayParameters);
    expect(block.payloadLength).toBe(2);
    expect(Array.from(block.payload)).toEqual([0xaa, 0xbb]);
    expect('horizontalImageSizeMm' in block).toBe(false);

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0];

    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(reparsedBlock.tag).toBe(DisplayIdDataBlockTag.DisplayParameters);
    expect(reparsedBlock.payloadLength).toBe(2);
    expect(Array.from(reparsedBlock.payload)).toEqual([0xaa, 0xbb]);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });
});

describe('DisplayID timing blocks', () => {
  // Type VII: 20-byte Detailed Timing descriptor (DisplayID 2.0 §4.3.1, Table 4-18).
  // pixelClock 148.5 MHz (raw24 = 148499 = 0x24413), aspect 16:9 (4), stereo (1),
  // preferred, 1920x1080 with 280/45 blanking, 44/4 front porch, 56/5 sync, +/+ polarity.
  const typeViiDescriptor = [
    0x13, 0x44, 0x02, 0xa4, 0x7f, 0x07, 0x17, 0x01, 0x2b, 0x80, 0x37, 0x00, 0x37, 0x04, 0x2c, 0x00, 0x03, 0x80, 0x04, 0x00,
  ];

  it('decodes and encodes Type VII detailed timings as full 20-byte descriptors', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x17, 0x04, 0x00,
      0x22, 0x00, 0x14,
      ...typeViiDescriptor,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdTypeVIIDetailedTimingBlock;

    expect(block.timings).toHaveLength(1);
    expect(block.timings[0]).toEqual({
      pixelClockKHz: 148500,
      aspectRatio: 4,
      interlaced: false,
      stereo: 1,
      preferred: true,
      horizontalActive: 1920,
      horizontalBlanking: 280,
      horizontalSyncOffset: 44,
      horizontalSyncPolarity: true,
      horizontalSyncWidth: 56,
      verticalActive: 1080,
      verticalBlanking: 45,
      verticalSyncOffset: 4,
      verticalSyncPolarity: true,
      verticalSyncWidth: 5,
    });

    block.timings[0].preferred = false;
    const encoded = encodeDisplayIdSection(section);
    // Options byte (payload byte 3, section index 10) loses the preferred bit 0x80 → 0x24.
    expect(encoded[10]).toBe(0x24);
    const reparsed = decodeDisplayIdSection(encoded);
    expect((reparsed.blocks[0] as DisplayIdTypeVIIDetailedTimingBlock).timings[0].preferred).toBe(false);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('round-trips a multi-entry Type VII block byte-identically', () => {
    const source = withChecksum([
      0x20, 0x2b, 0x04, 0x00,
      0x22, 0x00, 0x28,
      ...typeViiDescriptor, ...typeViiDescriptor,
      0x00,
    ]);
    const encoded = encodeDisplayIdSection(decodeDisplayIdSection(source));
    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('decodes and encodes Type VIII 1-byte CTA VIC timing codes', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x07, 0x04, 0x00,
      0x23, 0x40, 0x04,
      0x01, 0x02, 0x40, 0x7f,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdTypeVIIIEnumeratedTimingCodeBlock;

    expect(block.codeType).toBe(1); // CTA VIC
    expect(block.codeSize).toBe(1);
    expect(block.timingCodes).toEqual([0x01, 0x02, 0x40, 0x7f]);

    block.timingCodes = [0x10, 0x11];
    const reparsed = decodeDisplayIdSection(encodeDisplayIdSection(section)) as unknown as { blocks: DisplayIdTypeVIIIEnumeratedTimingCodeBlock[] };
    expect(reparsed.blocks[0].timingCodes).toEqual([0x10, 0x11]);
    expect(reparsed.blocks[0].codeSize).toBe(1);
  });

  it('decodes and encodes Type VIII 2-byte HDMI VIC timing codes', () => {
    const source = withChecksum([
      0x20, 0x07, 0x04, 0x00,
      0x23, 0x88, 0x04,
      0x23, 0x01, 0x67, 0x45,
      0x00,
    ]);
    const section = decodeDisplayIdSection(source);
    const block = section.blocks[0] as DisplayIdTypeVIIIEnumeratedTimingCodeBlock;

    expect(block.codeType).toBe(2); // HDMI VIC
    expect(block.codeSize).toBe(2);
    expect(block.timingCodes).toEqual([0x0123, 0x4567]);

    const encoded = encodeDisplayIdSection(section);
    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('preserves malformed odd-length 2-byte Type VIII payloads as generic blocks', () => {
    const source = withChecksum([
      0x20, 0x06, 0x04, 0x00,
      0x23, 0x88, 0x03,
      0xaa, 0xbb, 0xcc,
      0x00,
    ]);
    const section = decodeDisplayIdSection(source);
    const block = section.blocks[0];

    expect(block.payloadLength).toBe(3);
    expect('timingCodes' in block).toBe(false);

    const encoded = encodeDisplayIdSection(section);
    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('decodes and encodes Type IX formula timings as full 6-byte descriptors', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x09, 0x04, 0x00,
      0x24, 0x00, 0x06,
      0x11, 0x7f, 0x07, 0x37, 0x04, 0x3b,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdTypeIXFormulaBasedTimingBlock;

    expect(block.timings[0]).toEqual({
      formula: 1,
      ntscPullDown: true,
      stereo: 0,
      horizontalActive: 1920,
      verticalActive: 1080,
      refreshRateHz: 60,
    });

    block.timings[0].refreshRateHz = 75;
    const reparsed = decodeDisplayIdSection(encodeDisplayIdSection(section));
    expect((reparsed.blocks[0] as DisplayIdTypeIXFormulaBasedTimingBlock).timings[0].refreshRateHz).toBe(75);
    expect(isChecksum8Valid(encodeDisplayIdSection(section))).toBe(true);
  });

  it('preserves malformed Type VII payloads as generic blocks', () => {
    const source = withChecksum([
      0x20, 0x04, 0x04, 0x00,
      0x22, 0x00, 0x01,
      0xaa,
      0x00,
    ]);
    const section = decodeDisplayIdSection(source);
    const block = section.blocks[0];

    expect(block.tag).toBe(DisplayIdDataBlockTag.TypeVIIDetailedTiming);
    expect(block.payloadLength).toBe(1);
    expect(Array.from(block.payload)).toEqual([0xaa]);
    expect('timings' in block).toBe(false);

    const encoded = encodeDisplayIdSection(section);
    const reparsedBlock = decodeDisplayIdSection(encoded).blocks[0];

    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(Array.from(reparsedBlock.payload)).toEqual([0xaa]);
    expect('timings' in reparsedBlock).toBe(false);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('preserves malformed Type IX payloads as generic blocks', () => {
    const source = withChecksum([
      0x20, 0x04, 0x04, 0x00,
      0x24, 0x00, 0x01,
      0xbb,
      0x00,
    ]);
    const section = decodeDisplayIdSection(source);
    const block = section.blocks[0];

    expect(block.tag).toBe(DisplayIdDataBlockTag.TypeIXFormulaBasedTiming);
    expect(block.payloadLength).toBe(1);
    expect(Array.from(block.payload)).toEqual([0xbb]);
    expect('timings' in block).toBe(false);

    const encoded = encodeDisplayIdSection(section);
    const reparsedBlock = decodeDisplayIdSection(encoded).blocks[0];

    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(Array.from(reparsedBlock.payload)).toEqual([0xbb]);
    expect('timings' in reparsedBlock).toBe(false);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('throws when a Type VII detailed timing payload exceeds one-byte block length', () => {
    const timing: DisplayIdTypeVIIDetailedTiming = {
      pixelClockKHz: 148500,
      aspectRatio: 4,
      interlaced: false,
      stereo: 0,
      preferred: true,
      horizontalActive: 1920,
      horizontalBlanking: 280,
      horizontalSyncOffset: 44,
      horizontalSyncPolarity: true,
      horizontalSyncWidth: 56,
      verticalActive: 1080,
      verticalBlanking: 45,
      verticalSyncOffset: 4,
      verticalSyncPolarity: true,
      verticalSyncWidth: 5,
    };
    const block: DisplayIdTypeVIIDetailedTimingBlock = {
      tag: DisplayIdDataBlockTag.TypeVIIDetailedTiming,
      revision: 0,
      flags: 0,
      payloadLength: 0,
      payload: new Uint8Array(0),
      timings: Array.from({ length: 13 }, () => ({ ...timing })),
    };

    expect(() => encodeDisplayIdBlock(block)).toThrow(
      'DisplayID data block 0x22 payload length 260 exceeds 255 bytes',
    );
  });

  it('throws when a Type VIII timing code payload exceeds one-byte block length', () => {
    const block: DisplayIdTypeVIIIEnumeratedTimingCodeBlock = {
      tag: DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode,
      revision: 0,
      flags: 0,
      payloadLength: 0,
      payload: new Uint8Array(0),
      codeType: 0,
      codeSize: 1,
      timingCodes: Array.from({ length: 256 }, (_, index) => index),
    };

    expect(() => encodeDisplayIdBlock(block)).toThrow(
      'DisplayID data block 0x23 payload length 256 exceeds 255 bytes',
    );
  });

  it('throws when a Type IX formula timing payload exceeds one-byte block length', () => {
    const timing: DisplayIdTypeIXFormulaBasedTiming = {
      formula: 1,
      ntscPullDown: false,
      stereo: 0,
      horizontalActive: 1920,
      verticalActive: 1080,
      refreshRateHz: 60,
    };
    const block: DisplayIdTypeIXFormulaBasedTimingBlock = {
      tag: DisplayIdDataBlockTag.TypeIXFormulaBasedTiming,
      revision: 0,
      flags: 0,
      payloadLength: 0,
      payload: new Uint8Array(0),
      timings: Array.from({ length: 43 }, () => ({ ...timing })),
    };

    expect(() => encodeDisplayIdBlock(block)).toThrow(
      'DisplayID data block 0x24 payload length 258 exceeds 255 bytes',
    );
  });
});

describe('remaining DisplayID semantic blocks', () => {
  it('decodes, edits, and encodes Dynamic Video Timing Range Limits while preserving trailing bytes', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x11, 0x04, 0x00,
      0x25, 0x00, 0x0e,
      0x34, 0x12, 0x78, 0x56, 0x2c, 0x01, 0x58, 0x02, 0x30, 0x00, 0x90, 0x00, 0x00, 0xee,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdDynamicVideoTimingRangeLimitsBlock;

    expect(block.minimumPixelClockKHz).toBe(0x1234);
    expect(block.maximumPixelClockKHz).toBe(0x5678);
    expect(block.minimumHorizontalFrequencyHz).toBe(300);
    expect(block.maximumHorizontalFrequencyHz).toBe(600);
    expect(block.minimumVerticalFrequencyHz).toBe(48);
    expect(block.maximumVerticalFrequencyHz).toBe(144);
    expect(block.seamlessDynamicVideoTiming).toBe(false);

    block.seamlessDynamicVideoTiming = true;

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdDynamicVideoTimingRangeLimitsBlock;

    expect(reparsedBlock.seamlessDynamicVideoTiming).toBe(true);
    expect(reparsedBlock.payload[13]).toBe(0xee);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('decodes, edits, and encodes Display Interface Features while preserving reserved and trailing bytes', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x08, 0x04, 0x00,
      0x26, 0x00, 0x05,
      0x0b, 0x05, 0x00, 0xaa, 0xbb,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdDisplayInterfaceFeaturesBlock;

    expect(block.supportedColorDepths).toEqual([6, 8, 12]);
    expect(block.rgb444).toBe(true);
    expect(block.ycbcr444).toBe(false);
    expect(block.ycbcr422).toBe(true);
    expect(block.ycbcr420).toBe(false);
    expect(block.audioOnInterface).toBe(false);
    expect(block.contentProtection).toBe(false);

    block.audioOnInterface = true;

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdDisplayInterfaceFeaturesBlock;

    expect(reparsedBlock.audioOnInterface).toBe(true);
    expect(reparsedBlock.payload[3]).toBe(0xaa);
    expect(reparsedBlock.payload[4]).toBe(0xbb);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('preserves Display Interface Features reserved bits while editing known fields', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x08, 0x04, 0x00,
      0x26, 0x00, 0x05,
      0x8b, 0xf5, 0xfc, 0xaa, 0xbb,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdDisplayInterfaceFeaturesBlock;

    block.supportedColorDepths = [8, 10];
    block.ycbcr444 = true;
    block.ycbcr422 = false;
    block.ycbcr420 = true;
    block.contentProtection = true;

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdDisplayInterfaceFeaturesBlock;

    expect(Array.from(reparsedBlock.payload)).toEqual([0x86, 0xfb, 0xfe, 0xaa, 0xbb]);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('decodes, edits, and encodes Stereo Display Interface while preserving trailing bytes', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x06, 0x04, 0x00,
      0x27, 0x00, 0x03,
      0x00, 0x05, 0xcc,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdStereoDisplayInterfaceBlock;

    expect(block.stereoSupported).toBe(false);
    expect(block.stereoTypes).toEqual([0, 2]);

    block.stereoSupported = true;
    block.stereoTypes = [1, 7];

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdStereoDisplayInterfaceBlock;

    expect(reparsedBlock.stereoSupported).toBe(true);
    expect(reparsedBlock.stereoTypes).toEqual([1, 7]);
    expect(reparsedBlock.payload[2]).toBe(0xcc);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('decodes, edits, and encodes Tiled Display Topology while preserving reserved and trailing bytes', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x0d, 0x04, 0x00,
      0x28, 0x00, 0x0a,
      0x02, 0x03, 0x01, 0x02, 0x80, 0x07, 0x38, 0x04, 0xdd, 0xee,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdTiledDisplayTopologyBlock;

    expect(block.tileCountHorizontal).toBe(2);
    expect(block.tileCountVertical).toBe(3);
    expect(block.tileLocationHorizontal).toBe(1);
    expect(block.tileLocationVertical).toBe(2);
    expect(block.tileWidthPixels).toBe(1920);
    expect(block.tileHeightPixels).toBe(1080);

    block.tileLocationHorizontal = 0;
    block.tileWidthPixels = 2560;

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdTiledDisplayTopologyBlock;

    expect(reparsedBlock.tileLocationHorizontal).toBe(0);
    expect(reparsedBlock.tileWidthPixels).toBe(2560);
    expect(reparsedBlock.payload[8]).toBe(0xdd);
    expect(reparsedBlock.payload[9]).toBe(0xee);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('decodes, edits, and encodes ContainerID as exactly 16 bytes', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x13, 0x04, 0x00,
      0x29, 0x00, 0x10,
      0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
      0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdContainerIdBlock;

    expect(Array.from(block.containerId)).toEqual([
      0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
      0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
    ]);

    block.containerId = new Uint8Array([
      0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17,
      0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f,
    ]);

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdContainerIdBlock;

    expect(reparsedBlock.payloadLength).toBe(16);
    expect(Array.from(reparsedBlock.containerId)).toEqual(Array.from(block.containerId));
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('decodes, edits, and encodes Vendor-Specific payloads while preserving raw bytes', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x08, 0x04, 0x00,
      0x7e, 0x00, 0x05,
      0x01, 0x02, 0x03, 0xaa, 0xbb,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdVendorSpecificBlock;

    expect(block.ieeeOui).toBe(0x030201);
    expect(Array.from(block.payload)).toEqual([0x01, 0x02, 0x03, 0xaa, 0xbb]);

    block.ieeeOui = 0x0c0b0a;

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdVendorSpecificBlock;

    expect(reparsedBlock.ieeeOui).toBe(0x0c0b0a);
    expect(Array.from(reparsedBlock.payload)).toEqual([0x0a, 0x0b, 0x0c, 0xaa, 0xbb]);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('decodes, edits, and encodes CTA DisplayID from ctaPayload', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x07, 0x04, 0x00,
      0x81, 0x00, 0x04,
      0x11, 0x22, 0x33, 0x44,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdCtaBlock;

    expect(Array.from(block.payload)).toEqual([0x11, 0x22, 0x33, 0x44]);
    expect(Array.from(block.ctaPayload)).toEqual([0x11, 0x22, 0x33, 0x44]);

    block.ctaPayload = new Uint8Array([0x55, 0x66]);

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdCtaBlock;

    expect(Array.from(reparsedBlock.ctaPayload)).toEqual([0x55, 0x66]);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('preserves malformed short Dynamic Video Timing Range Limits payloads as generic blocks', () => {
    const source = withChecksum([
      0x20, 0x05, 0x04, 0x00,
      0x25, 0x00, 0x02,
      0xaa, 0xbb,
      0x00,
    ]);
    const section = decodeDisplayIdSection(source);
    const block = section.blocks[0];

    expect(block.tag).toBe(DisplayIdDataBlockTag.DynamicVideoTimingRangeLimits);
    expect(Array.from(block.payload)).toEqual([0xaa, 0xbb]);
    expect('minimumPixelClockKHz' in block).toBe(false);

    Object.assign(block, {
      minimumPixelClockKHz: 1,
      maximumPixelClockKHz: 2,
      minimumHorizontalFrequencyHz: 3,
      maximumHorizontalFrequencyHz: 4,
      minimumVerticalFrequencyHz: 5,
      maximumVerticalFrequencyHz: 6,
      seamlessDynamicVideoTiming: true,
    });

    const encoded = encodeDisplayIdSection(section);
    const reparsedBlock = decodeDisplayIdSection(encoded).blocks[0];

    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(Array.from(reparsedBlock.payload)).toEqual([0xaa, 0xbb]);
    expect('minimumPixelClockKHz' in reparsedBlock).toBe(false);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('preserves malformed short Display Interface Features payloads as generic blocks', () => {
    const source = withChecksum([
      0x20, 0x06, 0x04, 0x00,
      0x26, 0x00, 0x03,
      0x8b, 0xf5, 0xfc,
      0x00,
    ]);
    const section = decodeDisplayIdSection(source);
    const block = section.blocks[0];

    expect(block.tag).toBe(DisplayIdDataBlockTag.DisplayInterfaceFeatures);
    expect(block.payloadLength).toBe(3);
    expect(Array.from(block.payload)).toEqual([0x8b, 0xf5, 0xfc]);
    expect('supportedColorDepths' in block).toBe(false);

    Object.assign(block, {
      supportedColorDepths: [8],
      rgb444: false,
      ycbcr444: true,
      ycbcr422: false,
      ycbcr420: true,
      audioOnInterface: true,
      contentProtection: true,
    });

    const encoded = encodeDisplayIdSection(section);
    const reparsedBlock = decodeDisplayIdSection(encoded).blocks[0];

    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(reparsedBlock.payloadLength).toBe(3);
    expect(Array.from(reparsedBlock.payload)).toEqual([0x8b, 0xf5, 0xfc]);
    expect('supportedColorDepths' in reparsedBlock).toBe(false);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('preserves malformed short Stereo Display Interface payloads as generic blocks', () => {
    const source = withChecksum([
      0x20, 0x04, 0x04, 0x00,
      0x27, 0x00, 0x01,
      0xcc,
      0x00,
    ]);
    const section = decodeDisplayIdSection(source);
    const block = section.blocks[0];

    expect(block.tag).toBe(DisplayIdDataBlockTag.StereoDisplayInterface);
    expect(block.payloadLength).toBe(1);
    expect(Array.from(block.payload)).toEqual([0xcc]);
    expect('stereoSupported' in block).toBe(false);

    Object.assign(block, {
      stereoSupported: true,
      stereoTypes: [0, 1],
    });

    const encoded = encodeDisplayIdSection(section);
    const reparsedBlock = decodeDisplayIdSection(encoded).blocks[0];

    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(reparsedBlock.payloadLength).toBe(1);
    expect(Array.from(reparsedBlock.payload)).toEqual([0xcc]);
    expect('stereoSupported' in reparsedBlock).toBe(false);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('preserves malformed short Tiled Display Topology payloads as generic blocks', () => {
    const source = withChecksum([
      0x20, 0x08, 0x04, 0x00,
      0x28, 0x00, 0x05,
      0x02, 0x03, 0x01, 0x02, 0xdd,
      0x00,
    ]);
    const section = decodeDisplayIdSection(source);
    const block = section.blocks[0];

    expect(block.tag).toBe(DisplayIdDataBlockTag.TiledDisplayTopology);
    expect(block.payloadLength).toBe(5);
    expect(Array.from(block.payload)).toEqual([0x02, 0x03, 0x01, 0x02, 0xdd]);
    expect('tileCountHorizontal' in block).toBe(false);

    Object.assign(block, {
      tileCountHorizontal: 4,
      tileCountVertical: 4,
      tileLocationHorizontal: 1,
      tileLocationVertical: 1,
      tileWidthPixels: 1920,
      tileHeightPixels: 1080,
    });

    const encoded = encodeDisplayIdSection(section);
    const reparsedBlock = decodeDisplayIdSection(encoded).blocks[0];

    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(reparsedBlock.payloadLength).toBe(5);
    expect(Array.from(reparsedBlock.payload)).toEqual([0x02, 0x03, 0x01, 0x02, 0xdd]);
    expect('tileCountHorizontal' in reparsedBlock).toBe(false);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('preserves malformed short ContainerID payloads as generic blocks', () => {
    const source = withChecksum([
      0x20, 0x07, 0x04, 0x00,
      0x29, 0x00, 0x04,
      0x01, 0x02, 0x03, 0x04,
      0x00,
    ]);
    const section = decodeDisplayIdSection(source);
    const block = section.blocks[0];

    expect(block.tag).toBe(DisplayIdDataBlockTag.ContainerId);
    expect(Array.from(block.payload)).toEqual([0x01, 0x02, 0x03, 0x04]);
    expect('containerId' in block).toBe(false);

    const encoded = encodeDisplayIdSection(section);
    const reparsedBlock = decodeDisplayIdSection(encoded).blocks[0];

    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(Array.from(reparsedBlock.payload)).toEqual([0x01, 0x02, 0x03, 0x04]);
    expect('containerId' in reparsedBlock).toBe(false);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });
});
