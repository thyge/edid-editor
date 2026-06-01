import { describe, expect, it } from 'vitest';
import { checksum8, isChecksum8Valid } from '../src/common';
import {
  DisplayIdDataBlockTag,
  decodeDisplayIdSection,
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
  it('decodes display size, color depth, dynamic range, and feature flags', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x0a, 0x04, 0x00,
      0x21, 0x00, 0x07,
      0x58, 0x02, 0x22, 0x01, 0x0a, 0x03, 0x1d,
      0x00,
    ]));

    const block = section.blocks[0] as DisplayIdDisplayParametersBlock;

    expect(block.tag).toBe(DisplayIdDataBlockTag.DisplayParameters);
    expect(block.horizontalImageSizeMm).toBe(600);
    expect(block.verticalImageSizeMm).toBe(290);
    expect(block.nativeColorBitDepth).toBe(10);
    expect(block.dynamicRange).toBe(3);
    expect(block.audioSupport).toBe(true);
    expect(block.fixedPixelFormat).toBe(true);
    expect(block.fixedTiming).toBe(true);
    expect(block.deinterlacing).toBe(true);
  });

  it('encodes Display Parameters from typed fields', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x0a, 0x04, 0x00,
      0x21, 0x00, 0x07,
      0x00, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdDisplayParametersBlock;

    block.horizontalImageSizeMm = 344;
    block.verticalImageSizeMm = 194;
    block.nativeColorBitDepth = 8;
    block.dynamicRange = 2;
    block.audioSupport = true;
    block.separateAudioInputs = true;
    block.fixedPixelFormat = false;
    block.fixedTiming = true;
    block.deinterlacing = false;

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdDisplayParametersBlock;

    expect(reparsedBlock.horizontalImageSizeMm).toBe(344);
    expect(reparsedBlock.verticalImageSizeMm).toBe(194);
    expect(reparsedBlock.nativeColorBitDepth).toBe(8);
    expect(reparsedBlock.dynamicRange).toBe(2);
    expect(reparsedBlock.audioSupport).toBe(true);
    expect(reparsedBlock.separateAudioInputs).toBe(true);
    expect(reparsedBlock.fixedTiming).toBe(true);
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('preserves trailing bytes when encoding longer Display Parameters payloads', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x0c, 0x04, 0x00,
      0x21, 0x00, 0x09,
      0x58, 0x02, 0x22, 0x01, 0x0a, 0x03, 0x1d, 0xaa, 0xbb,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdDisplayParametersBlock;

    block.horizontalImageSizeMm = 344;

    const encoded = encodeDisplayIdSection(section);
    const reparsed = decodeDisplayIdSection(encoded);
    const reparsedBlock = reparsed.blocks[0] as DisplayIdDisplayParametersBlock;

    expect(reparsedBlock.horizontalImageSizeMm).toBe(344);
    expect(reparsedBlock.payloadLength).toBe(9);
    expect(Array.from(reparsedBlock.payload.slice(7))).toEqual([0xaa, 0xbb]);
    expect(isChecksum8Valid(encoded)).toBe(true);
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
  it('decodes and encodes Type VII detailed timings as 12-byte entries', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x0f, 0x04, 0x00,
      0x22, 0x00, 0x0c,
      0x88, 0x13, 0x80, 0x87, 0x11, 0x2c, 0x38, 0x38, 0x54, 0x06, 0x0a, 0x01,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdTypeVIIDetailedTimingBlock;

    expect(block.timings).toHaveLength(1);
    expect(block.timings[0]).toMatchObject({
      pixelClockKHz: 500000,
      horizontalActive: 1920,
      horizontalBlanking: 280,
      horizontalSyncOffset: 44,
      horizontalSyncWidth: 56,
      verticalActive: 1080,
      verticalBlanking: 101,
      verticalSyncOffset: 10,
      verticalSyncWidth: 0,
      preferred: true,
      interlaced: false,
    });

    block.timings[0].preferred = false;
    const encoded = encodeDisplayIdSection(section);
    expect(Array.from(encoded.slice(7, 19))).toEqual([
      0x88, 0x13, 0x80, 0x87, 0x11, 0x2c, 0x38, 0x38, 0x54, 0x06, 0x0a, 0x00,
    ]);
    const reparsed = decodeDisplayIdSection(encoded);
    expect((reparsed.blocks[0] as DisplayIdTypeVIIDetailedTimingBlock).timings[0].preferred).toBe(false);
  });

  it('decodes and encodes Type VIII enumerated timing codes', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x07, 0x04, 0x00,
      0x23, 0x00, 0x04,
      0x01, 0x02, 0x40, 0x7f,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdTypeVIIIEnumeratedTimingCodeBlock;

    expect(block.timingCodes).toEqual([0x01, 0x02, 0x40, 0x7f]);
    block.timingCodes = [0x10, 0x11];

    const reparsed = decodeDisplayIdSection(encodeDisplayIdSection(section));
    expect((reparsed.blocks[0] as DisplayIdTypeVIIIEnumeratedTimingCodeBlock).timingCodes).toEqual([0x10, 0x11]);
  });

  it('decodes and encodes Type IX formula timings as 6-byte entries', () => {
    const section = decodeDisplayIdSection(withChecksum([
      0x20, 0x09, 0x04, 0x00,
      0x24, 0x00, 0x06,
      0x80, 0x07, 0x38, 0x04, 0x3c, 0x03,
      0x00,
    ]));
    const block = section.blocks[0] as DisplayIdTypeIXFormulaBasedTimingBlock;

    expect(block.timings[0]).toMatchObject({
      horizontalActive: 1920,
      verticalActive: 1080,
      refreshRateHz: 60,
      preferred: true,
      reducedBlanking: true,
    });

    block.timings[0].refreshRateHz = 75;
    const reparsed = decodeDisplayIdSection(encodeDisplayIdSection(section));
    expect((reparsed.blocks[0] as DisplayIdTypeIXFormulaBasedTimingBlock).timings[0].refreshRateHz).toBe(75);
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
      pixelClockKHz: 500000,
      horizontalActive: 1920,
      horizontalBlanking: 280,
      horizontalSyncOffset: 44,
      horizontalSyncWidth: 56,
      verticalActive: 1080,
      verticalBlanking: 101,
      verticalSyncOffset: 10,
      verticalSyncWidth: 0,
      preferred: true,
      interlaced: false,
    };
    const block: DisplayIdTypeVIIDetailedTimingBlock = {
      tag: DisplayIdDataBlockTag.TypeVIIDetailedTiming,
      revision: 0,
      flags: 0,
      payloadLength: 0,
      payload: new Uint8Array(0),
      timings: Array.from({ length: 22 }, () => ({ ...timing })),
    };

    expect(() => encodeDisplayIdBlock(block)).toThrow(
      'DisplayID data block 0x22 payload length 264 exceeds 255 bytes',
    );
  });

  it('throws when a Type VIII timing code payload exceeds one-byte block length', () => {
    const block: DisplayIdTypeVIIIEnumeratedTimingCodeBlock = {
      tag: DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode,
      revision: 0,
      flags: 0,
      payloadLength: 0,
      payload: new Uint8Array(0),
      timingCodes: Array.from({ length: 256 }, (_, index) => index),
    };

    expect(() => encodeDisplayIdBlock(block)).toThrow(
      'DisplayID data block 0x23 payload length 256 exceeds 255 bytes',
    );
  });

  it('throws when a Type IX formula timing payload exceeds one-byte block length', () => {
    const timing: DisplayIdTypeIXFormulaBasedTiming = {
      horizontalActive: 1920,
      verticalActive: 1080,
      refreshRateHz: 60,
      preferred: true,
      reducedBlanking: true,
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
