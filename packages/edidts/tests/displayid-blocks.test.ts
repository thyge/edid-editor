import { describe, expect, it } from 'vitest';
import { checksum8, isChecksum8Valid } from '../src/common';
import {
  DisplayIdDataBlockTag,
  decodeDisplayIdSection,
  encodeDisplayIdSection,
  type DisplayIdDisplayParametersBlock,
  type DisplayIdTypeVIIDetailedTimingBlock,
  type DisplayIdTypeVIIIEnumeratedTimingCodeBlock,
  type DisplayIdTypeIXFormulaBasedTimingBlock,
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
});
