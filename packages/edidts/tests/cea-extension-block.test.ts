import { describe, it, expect } from 'vitest';
import { ExtensionBlockParser, type CEAExtensionBlock, type VideoDataBlock } from '../src/cta';

/** Build a Video Data Block with `count` non-native VICs. */
function videoBlock(count: number): VideoDataBlock {
  return {
    tag: 0x02,
    vics: Array.from({ length: count }, (_, i) => ({ vic: (i % 127) + 1, native: false })),
  };
}

/** Minimal CEA extension shell with the given data blocks and no DTDs. */
function ceaWith(dataBlocks: CEAExtensionBlock['dataBlocks']): CEAExtensionBlock {
  return {
    tag: 0x02,
    revision: 3,
    checksum: 0,
    data: new Uint8Array(0),
    dtdOffset: 0,
    underscan: false,
    basicAudio: false,
    ycbcr444: false,
    ycbcr422: false,
    nativeFormats: 0,
    dataBlocks,
    detailedTimings: [],
  };
}

describe('CEA extension block container', () => {
  describe('data-block area overflow guard', () => {
    it('throws a descriptive error when data blocks exceed the 127-byte payload area', () => {
      // Usable data-block area is bytes 4..126 = 123 bytes.
      // Four 31-VIC video blocks = 4 * (1 header + 31 payload) = 128 bytes > 123.
      const block = ceaWith([videoBlock(31), videoBlock(31), videoBlock(31), videoBlock(31)]);

      expect(() => ExtensionBlockParser.encode(block)).toThrow(/exceeds|overflow|127/i);
    });
  });
});