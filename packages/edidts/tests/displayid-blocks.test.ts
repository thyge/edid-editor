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

  it('decodes and round-trips all Display Interface Features fields (§4.5, 9+N payload)', () => {
    // N=2 additional combinations => 11-byte payload.
    // [0] RGB 6/8/10/12/14/16=0x3f  [1] 444 8/10/12=0x0e  [2] 422 8/10/12/14/16=0x1f
    // [3] 420 10/12=0x06  [4] 420 min rate mult=5  [5] audio 48k+44.1k=0x60
    // [6] std1 sRGB|BT.709/1886|DCI-P3|BT.2020/ST2084=0x55  [7] std2 reserved=0x00
    // [8] N=2=0x02  [9] BT.2020/ST2084=0x68  [10] sRGB/sRGB=0x11
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x0e, 0x04, 0x00,
      0x26, 0x00, 0x0b,
      0x3f, 0x0e, 0x1f, 0x06, 0x05, 0x60, 0x55, 0x00, 0x02, 0x68, 0x11,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdDisplayInterfaceFeaturesBlock;

    expect(block.rgbColorDepths).toEqual([6, 8, 10, 12, 14, 16]);
    expect(block.ycbcr444ColorDepths).toEqual([8, 10, 12]);
    expect(block.ycbcr422ColorDepths).toEqual([8, 10, 12, 14, 16]);
    expect(block.ycbcr420ColorDepths).toEqual([10, 12]);
    expect(block.ycbcr420MinPixelRateMultiplier).toBe(5);
    expect(block.audioSampleRates).toEqual({ sr32kHz: false, sr44_1kHz: true, sr48kHz: true });
    expect(block.colorSpaceEotfStandard1).toEqual({
      srgb: true, bt601: false, bt709Bt1886: true, adobeRgb: false,
      dciP3: true, bt2020: false, bt2020St2084: true,
    });
    expect(block.additionalColorSpaceEotfCombinations).toEqual([
      { colorSpace: 6, eotf: 8 },
      { colorSpace: 1, eotf: 1 },
    ]);
    expect(Array.from(block.trailing)).toEqual([]);

    // Edit a combination (color space/EOTF) and an audio rate, then round-trip.
    block.additionalColorSpaceEotfCombinations = [
      { colorSpace: 3, eotf: 9 }, // BT.709 / Hybrid Log
    ];
    block.audioSampleRates = { sr32kHz: true, sr44_1kHz: false, sr48kHz: true };

    const encoded = encodeDisplayIdSection(section);
    const reparsedBlock = decodeDisplayIdSection(encoded).blocks[0] as DisplayIdDisplayInterfaceFeaturesBlock;

    expect(reparsedBlock.additionalColorSpaceEotfCombinations).toEqual([{ colorSpace: 3, eotf: 9 }]);
    expect(reparsedBlock.audioSampleRates).toEqual({ sr32kHz: true, sr44_1kHz: false, sr48kHz: true });
    // payload shrinks to 9 + 1 = 10 bytes; [5]=32k+48k=0xa0, [8]=N=1, [9]=0x39.
    expect(Array.from(reparsedBlock.payload)).toEqual([0x3f, 0x0e, 0x1f, 0x06, 0x05, 0xa0, 0x55, 0x00, 0x01, 0x39]);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('preserves Display Interface Features reserved bits, std2 byte, and trailing bytes', () => {
    // N=1 declared, length 12 => 9+1 combination + 2 trailing bytes.
    // Reserved bits set in every modeled byte (7:6, 7:5, audio 4:0, std1 bit7,
    // std2 all, N-count 7:3) must be preserved; trailing 0xaa 0xbb preserved.
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x0f, 0x04, 0x00,
      0x26, 0x00, 0x0c,
      0x8b, 0xc5, 0xe1, 0xe2, 0x03, 0x1f, 0x81, 0xab, 0xf9, 0x68, 0xaa, 0xbb,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdDisplayInterfaceFeaturesBlock;

    expect(block.rgbColorDepths).toEqual([6, 8, 12]); // 0x8b & 0x3f
    expect(block.ycbcr444ColorDepths).toEqual([6, 10]); // 0xc5 & 0x1f
    expect(block.ycbcr422ColorDepths).toEqual([8]); // 0xe1 & 0x1f
    expect(block.ycbcr420ColorDepths).toEqual([10]); // 0xe2 & 0x1f
    expect(block.ycbcr420MinPixelRateMultiplier).toBe(3);
    expect(block.audioSampleRates).toEqual({ sr32kHz: false, sr44_1kHz: false, sr48kHz: false });
    expect(block.colorSpaceEotfStandard1).toEqual({
      srgb: true, bt601: false, bt709Bt1886: false, adobeRgb: false,
      dciP3: false, bt2020: false, bt2020St2084: false,
    });
    expect(block.additionalColorSpaceEotfCombinations).toEqual([{ colorSpace: 6, eotf: 8 }]);
    expect(Array.from(block.trailing)).toEqual([0xaa, 0xbb]);

    block.ycbcr444ColorDepths = [8, 10, 12]; // bits 1,2,3 = 0x0e

    const encoded = encodeDisplayIdSection(section);
    const reparsedBlock = decodeDisplayIdSection(encoded).blocks[0] as DisplayIdDisplayInterfaceFeaturesBlock;

    expect(Array.from(reparsedBlock.payload)).toEqual([
      0x8b, 0xce, 0xe1, 0xe2, 0x03, 0x1f, 0x81, 0xab, 0xf9, 0x68, 0xaa, 0xbb,
    ]);
    expect(reparsedBlock.additionalColorSpaceEotfCombinations).toEqual([{ colorSpace: 6, eotf: 8 }]);
    expect(Array.from(reparsedBlock.trailing)).toEqual([0xaa, 0xbb]);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('decodes, edits, and encodes Stereo Display Interface method codes and parameters (§4.6)', () => {
    // Frame/Field Sequential (method 0x00, 1 param byte = polarity), then
    // Side-by-side (0x01, 1 param), Pixel-interleaved (0x02, 8 param bytes),
    // Multi-view (0x04, 2 params), and Proprietary (0xff, 0 params) in separate
    // sections. Here: Pixel-interleaved with an 8x8 L/R pattern + a trailing byte.
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x0e, 0x04, 0x00,
      0x27, 0x00, 0x0b,
      0x09, 0x02, 0xaa, 0x55, 0xf0, 0x0f, 0xcc, 0x33, 0x81, 0x7e, 0xdd,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdStereoDisplayInterfaceBlock;

    expect(block.methodCode).toBe(0x02);
    expect(block.timingSupport).toBe(0);
    expect(Array.from(block.methodParameters)).toEqual([0xaa, 0x55, 0xf0, 0x0f, 0xcc, 0x33, 0x81, 0x7e]);
    expect(Array.from(block.trailing)).toEqual([0xdd]);
    expect(block.stereoTimingCodeDescriptors).toEqual([]);

    // Edit: switch to Multi-view (0x04, 2 param bytes: views + interleaving code).
    block.methodCode = 0x04;
    block.methodParameters = new Uint8Array([0x03, 0x01]);

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdStereoDisplayInterfaceBlock;

    expect(reparsedBlock.methodCode).toBe(0x04);
    expect(reparsedBlock.payload[0]).toBe(0x03); // N+1 = 2+1
    expect(Array.from(reparsedBlock.methodParameters)).toEqual([0x03, 0x01]);
    expect(Array.from(reparsedBlock.trailing)).toEqual([0xdd]);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('decodes, edits, and encodes Stereo Display Interface 3D Timing Code descriptors (§4.6)', () => {
    // timingSupport 0x01 (explicit-3D + codes listed) => header byte 01h bits 7:6 = 01b.
    // flags = byte >> 3, so byte 01h = 0x40 => flags = 0x08. Method: Proprietary
    // (0xff, 0 params). Then two 3D Timing Descriptor entries:
    //   - DMT (type 0): codes [0x20, 0x21]  (header 0x02, 2 codes)
    //   - HDMI VIC (type 2): codes [0x01]  (header 0x81, 1 code)
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x0a, 0x04, 0x00,
      0x27, 0x40, 0x07,
      0x01, 0xff,
      0x02, 0x20, 0x21,
      0x81, 0x01,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdStereoDisplayInterfaceBlock;

    expect(block.timingSupport).toBe(0x01);
    expect(block.methodCode).toBe(0xff);
    expect(Array.from(block.methodParameters)).toEqual([]);
    expect(block.stereoTimingCodeDescriptors).toEqual([
      { type: 0x00, timingCodes: [0x20, 0x21] },
      { type: 0x02, timingCodes: [0x01] },
    ]);

    // Edit: replace the HDMI VIC descriptor with a CTA VIC (type 1) of [16, 31].
    block.stereoTimingCodeDescriptors = [
      { type: 0x00, timingCodes: [0x20, 0x21] },
      { type: 0x01, timingCodes: [16, 31] },
    ];

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdStereoDisplayInterfaceBlock;

    expect(reparsedBlock.timingSupport).toBe(0x01);
    expect(reparsedBlock.methodCode).toBe(0xff);
    expect(reparsedBlock.stereoTimingCodeDescriptors).toEqual([
      { type: 0x00, timingCodes: [0x20, 0x21] },
      { type: 0x01, timingCodes: [16, 31] },
    ]);
    // header byte 01h (flags<<3 | revision) preserved at 0x40, payload[0]=1, payload[1]=0xff.
    expect(reparsedBlock.payload[0]).toBe(0x01);
    expect(reparsedBlock.payload[1]).toBe(0xff);
    // Edited payload = [0x01,0xff, 0x02,0x20,0x21, 0x42,0x10,0x1f] (8 bytes);
    // CTA VIC descriptor header = (1<<6)|2 = 0x42. Block region = 3+8 = 11 = 0x0b.
    expect(Array.from(encoded)).toEqual(Array.from(withChecksum([
      0x20, 0x0b, 0x04, 0x00,
      0x27, 0x40, 0x08,
      0x01, 0xff,
      0x02, 0x20, 0x21,
      0x42, 0x10, 0x1f,
      0x00,
    ])));
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('decodes, edits, and encodes the full 22-byte Tiled Display Topology (§4.7)', () => {
    // Capabilities 0xC9: singleTileBehavior=1, subsetTileBehavior=1, bezel present, single enclosure.
    // 6-bit packed topology (payload[1..3]): hCount=50, vCount=18, hLoc=49, vLoc=34
    //   (exercises all four high-bit fields of payload[3] = 0xDE).
    // Tile size 1920x1080 (stored -1). Multiplier 5, bezel 10/20/30/40.
    // Topology ID: OUI 0x001234, product 0xBEEF, serial 0xDEADBEEF.
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x19, 0x04, 0x00,
      0x28, 0x00, 0x16,
      0xc9, 0x11, 0x01, 0xde,
      0x7f, 0x07, 0x37, 0x04,
      0x05, 0x0a, 0x14, 0x1e, 0x28,
      0x00, 0x12, 0x34, 0xef, 0xbe, 0xef, 0xbe, 0xad, 0xde,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdTiledDisplayTopologyBlock;

    expect(block.singleTileBehavior).toBe(1);
    expect(block.subsetTileBehavior).toBe(1);
    expect(block.bezelInfoPresent).toBe(true);
    expect(block.singleEnclosure).toBe(true);
    expect(block.tileCountHorizontal).toBe(50);
    expect(block.tileCountVertical).toBe(18);
    expect(block.tileLocationHorizontal).toBe(49);
    expect(block.tileLocationVertical).toBe(34);
    expect(block.tileWidthPixels).toBe(1920);
    expect(block.tileHeightPixels).toBe(1080);
    expect(block.pixelMultiplier).toBe(5);
    expect(block.topBezelSize).toBe(10);
    expect(block.bottomBezelSize).toBe(20);
    expect(block.rightBezelSize).toBe(30);
    expect(block.leftBezelSize).toBe(40);
    expect(block.vendorOui).toBe(0x001234);
    expect(block.productId).toBe(0xbeef);
    expect(block.serialNumber).toBe(0xdeadbeef);

    // Edit: max 64 horizontal tiles, drop bezel info (and its multiplier), serial = 1.
    block.tileCountHorizontal = 64;
    block.bezelInfoPresent = false;
    block.pixelMultiplier = 0;
    block.serialNumber = 1;

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdTiledDisplayTopologyBlock;

    expect(reparsedBlock.tileCountHorizontal).toBe(64);
    expect(reparsedBlock.tileCountVertical).toBe(18);
    expect(reparsedBlock.tileLocationHorizontal).toBe(49);
    expect(reparsedBlock.tileLocationVertical).toBe(34);
    expect(reparsedBlock.bezelInfoPresent).toBe(false);
    expect(reparsedBlock.singleEnclosure).toBe(true);
    expect(reparsedBlock.pixelMultiplier).toBe(0);
    expect(reparsedBlock.vendorOui).toBe(0x001234);
    expect(reparsedBlock.productId).toBe(0xbeef);
    expect(reparsedBlock.serialNumber).toBe(1);
    // Capabilities byte: bezel bit (0x40) cleared, enclosure bit (0x80) kept.
    expect(reparsedBlock.payload[0]).toBe(0x89);
    // 64 tiles => stored 63 = 0x3F; payload[1] low nibble of hCount = 0xf << 4.
    expect(reparsedBlock.payload[1]).toBe(0xf1);
    // hCount high bits (0x30) still land in payload[3] bits 7:6 => 0xC0 portion.
    expect(reparsedBlock.payload[3] & 0xc0).toBe(0xc0);
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
      0x20, 0x08, 0x04, 0x00,
      0x26, 0x00, 0x05,
      0x8b, 0xf5, 0xfc, 0xaa, 0xbb,
      0x00,
    ]);
    const section = decodeDisplayIdSection(source);
    const block = section.blocks[0];

    expect(block.tag).toBe(DisplayIdDataBlockTag.DisplayInterfaceFeatures);
    expect(block.payloadLength).toBe(5);
    expect(Array.from(block.payload)).toEqual([0x8b, 0xf5, 0xfc, 0xaa, 0xbb]);
    expect('rgbColorDepths' in block).toBe(false);

    Object.assign(block, {
      rgbColorDepths: [8],
      ycbcr444ColorDepths: [],
      ycbcr422ColorDepths: [],
      ycbcr420ColorDepths: [],
      ycbcr420MinPixelRateMultiplier: 0,
      audioSampleRates: { sr32kHz: true, sr44_1kHz: false, sr48kHz: true },
      colorSpaceEotfStandard1: {
        srgb: true, bt601: false, bt709Bt1886: false, adobeRgb: false,
        dciP3: false, bt2020: false, bt2020St2084: false,
      },
      additionalColorSpaceEotfCombinations: [],
      trailing: new Uint8Array(),
    });

    const encoded = encodeDisplayIdSection(section);
    const reparsedBlock = decodeDisplayIdSection(encoded).blocks[0];

    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(reparsedBlock.payloadLength).toBe(5);
    expect(Array.from(reparsedBlock.payload)).toEqual([0x8b, 0xf5, 0xfc, 0xaa, 0xbb]);
    expect('rgbColorDepths' in reparsedBlock).toBe(false);
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
    expect('methodCode' in block).toBe(false);

    Object.assign(block, {
      methodCode: 0xff,
      methodParameters: new Uint8Array(),
    });

    const encoded = encodeDisplayIdSection(section);
    const reparsedBlock = decodeDisplayIdSection(encoded).blocks[0];

    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(reparsedBlock.payloadLength).toBe(1);
    expect(Array.from(reparsedBlock.payload)).toEqual([0xcc]);
    expect('methodCode' in reparsedBlock).toBe(false);
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
    expect('singleTileBehavior' in block).toBe(false);

    Object.assign(block, {
      singleTileBehavior: 1,
      tileCountHorizontal: 4,
      tileWidthPixels: 1920,
    });

    const encoded = encodeDisplayIdSection(section);
    const reparsedBlock = decodeDisplayIdSection(encoded).blocks[0];

    expect(Array.from(encoded)).toEqual(Array.from(source));
    expect(reparsedBlock.payloadLength).toBe(5);
    expect(Array.from(reparsedBlock.payload)).toEqual([0x02, 0x03, 0x01, 0x02, 0xdd]);
    expect('singleTileBehavior' in reparsedBlock).toBe(false);
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
