import { describe, expect, it } from 'vitest';
import {
  DisplayIdDataBlockTag,
  EDID,
  ExtensionBlockParser,
  createDefaultDisplayIdBlock,
  type DisplayIdExtensionBlock,
} from '../src';
import { isChecksum8Valid } from '../src/common';

function createDisplayIdExtension(): DisplayIdExtensionBlock {
  return {
    tag: 0x70,
    revision: 0,
    checksum: 0,
    data: new Uint8Array(125),
    section: {
      version: 2,
      revision: 0,
      versionByte: 0x20,
      bytesInSection: 0,
      totalLength: 5,
      primaryUseCase: 0x04,
      extensionCount: 0,
      blocks: [createDefaultDisplayIdBlock(DisplayIdDataBlockTag.DisplayParameters)],
      fillBytes: 0,
      checksum: 0,
      isChecksumValid: true,
    },
  };
}

describe('DisplayID EDID extension integration', () => {
  it('encodes and decodes EDID extension tag 0x70 as DisplayID', () => {
    const encoded = ExtensionBlockParser.encode(createDisplayIdExtension());

    expect(encoded[0]).toBe(0x70);
    expect(isChecksum8Valid(encoded)).toBe(true);

    const decoded = ExtensionBlockParser.decode(encoded) as DisplayIdExtensionBlock;

    expect(decoded.tag).toBe(0x70);
    expect(decoded.section.blocks[0].tag).toBe(DisplayIdDataBlockTag.DisplayParameters);
    expect(decoded.section.isChecksumValid).toBe(true);
  });

  it('exposes displayIdExtension from EDID and re-encodes it as an extension block', () => {
    const edid = new EDID();

    edid.extensionBlocks = [createDisplayIdExtension()];

    expect(edid.displayIdExtension?.tag).toBe(0x70);

    const encoded = edid.encode();
    const reparsed = new EDID(encoded);

    expect(encoded.length).toBe(256);
    expect(encoded[126]).toBe(1);
    expect(encoded[128]).toBe(0x70);
    expect(reparsed.displayIdExtension?.section.blocks[0].tag).toBe(DisplayIdDataBlockTag.DisplayParameters);
  });

  it('throws when a DisplayID section is too large for one EDID extension block', () => {
    const extension = createDisplayIdExtension();
    extension.section.fillBytes = 111;

    expect(() => ExtensionBlockParser.encode(extension)).toThrow(
      'DisplayID EDID extension payload length 126 exceeds 125 bytes',
    );
  });
});
