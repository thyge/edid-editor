import { describe, expect, it } from 'vitest';
import { checksum8, isChecksum8Valid } from '../src/common';
import {
  DisplayIdDataBlockTag,
  decodeDisplayIdSection,
  encodeDisplayIdSection,
  type DisplayIdDisplayParametersBlock,
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
});
