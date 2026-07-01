import { describe, it, expect } from 'vitest';
import { ExtensionBlockParser, type CEAExtensionBlock, type VideoDataBlock, type AudioDataBlock, type ExtendedDataBlock } from '../src/cta';
import { isChecksum8Valid, checksum8 } from '../src/common';

/** Build a Video Data Block with `count` non-native VICs. */
function videoBlock(count: number): VideoDataBlock {
  return {
    tag: 0x02,
    vics: Array.from({ length: count }, (_, i) => ({ vic: (i % 127) + 1, native: false })),
  };
}

/** Minimal CEA extension shell with the given data blocks and no DTDs. */
function ceaWith(dataBlocks: CEAExtensionBlock['dataBlocks'], partial: Partial<CEAExtensionBlock> = {}): CEAExtensionBlock {
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
    ...partial,
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

  describe('full-block round-trip', () => {
    it('round-trips a CEA extension with mixed data blocks and header flags', () => {
      const audio: AudioDataBlock = {
        tag: 0x01,
        data: new Uint8Array(0),
        descriptors: [
          {
            format: 1, // LPCM
            channels: 2,
            samplingRates: {
              sr32kHz: false, sr44_1kHz: true, sr48kHz: true, sr88_2kHz: false,
              sr96kHz: false, sr176_4kHz: false, sr192kHz: false,
            },
            bitDepths: { bd16: true, bd20: false, bd24: false },
          },
        ],
      };

      const original = ceaWith([videoBlock(4), audio], {
        underscan: true,
        basicAudio: true,
        ycbcr444: true,
        nativeFormats: 2,
      });

      const bytes = ExtensionBlockParser.encode(original);
      expect(bytes.length).toBe(128);
      expect(bytes[0]).toBe(0x02);
      expect(isChecksum8Valid(bytes)).toBe(true);

      const decoded = ExtensionBlockParser.decode(bytes) as CEAExtensionBlock;
      expect(decoded.tag).toBe(0x02);
      expect(decoded.underscan).toBe(true);
      expect(decoded.basicAudio).toBe(true);
      expect(decoded.ycbcr444).toBe(true);
      expect(decoded.nativeFormats).toBe(2);
      expect(decoded.dataBlocks.length).toBe(2);

      const video = decoded.dataBlocks[0] as VideoDataBlock;
      expect(video.tag).toBe(0x02);
      expect(video.vics.length).toBe(4);
      expect(video.vics.map((v) => v.vic)).toEqual([1, 2, 3, 4]);

      const audioOut = decoded.dataBlocks[1] as AudioDataBlock;
      expect(audioOut.tag).toBe(0x01);
      expect(audioOut.descriptors.length).toBe(1);
      const sad = audioOut.descriptors[0];
      expect(sad.format).toBe(1);
      expect(sad.channels).toBe(2);
      expect(sad.samplingRates.sr44_1kHz).toBe(true);
      expect(sad.samplingRates.sr48kHz).toBe(true);
      expect(sad.bitDepths?.bd16).toBe(true);
    });

    it('round-trips a maximum-length 31-byte data block payload', () => {
      const original = ceaWith([videoBlock(31)]);
      const bytes = ExtensionBlockParser.encode(original);
      // Header (1) + 31 payload = 32 bytes, starting at byte 4 → ends at byte 35.
      expect(bytes[4] & 0x1f).toBe(31);

      const decoded = ExtensionBlockParser.decode(bytes) as CEAExtensionBlock;
      const video = decoded.dataBlocks[0] as VideoDataBlock;
      expect(video.vics.length).toBe(31);
    });
  });

  describe('malformed input handling', () => {
    it('stops gracefully when a data-block length runs past dtdOffset', () => {
      // dtdOffset = 10 (byte 2). At byte 4, a data block header claims 20 bytes
      // of payload, but only bytes 4..9 are inside the data-block area.
      const bytes = new Uint8Array(128);
      bytes[0] = 0x02;
      bytes[1] = 3;
      bytes[2] = 10; // dtdOffset
      bytes[3] = 0;
      bytes[4] = (0x01 << 5) | 20; // audio block, length 20 (overruns)
      bytes[127] = checksum8(bytes, 127);

      const decoded = ExtensionBlockParser.decode(bytes) as CEAExtensionBlock;
      // The overrun block is dropped; decode must not throw and must report none.
      expect(decoded.dataBlocks.length).toBe(0);
    });
  });

  describe('unsupported extended-tag preservation', () => {
    it('round-trips an unknown extended tag (0x02) as raw bytes', () => {
      // Extended tag 0x02 (VESA Display Device Info) has no dedicated decoder;
      // the base path must preserve the full block payload verbatim.
      const raw = new Uint8Array([0x02, 0xaa, 0xbb, 0xcc]);
      const unsupported: ExtendedDataBlock = {
        tag: 0x07,
        extendedTag: 0x02,
        data: raw,
      };

      const original = ceaWith([unsupported]);
      const bytes = ExtensionBlockParser.encode(original);
      const decoded = ExtensionBlockParser.decode(bytes) as CEAExtensionBlock;

      expect(decoded.dataBlocks.length).toBe(1);
      const out = decoded.dataBlocks[0] as ExtendedDataBlock;
      expect(out.tag).toBe(0x07);
      expect(out.extendedTag).toBe(0x02);
      expect(Array.from(out.data)).toEqual([0x02, 0xaa, 0xbb, 0xcc]);
    });
  });

  describe('audio format code 15 (Audio Format Extension)', () => {
    it('captures and round-trips the extended format code in byte 3 bits 7:3', () => {
      // CTA-861-G Table 53: when format code = 15, byte 3 bits 7:3 carry the
      // extended audio format code (e.g. 12 = AC-4). The decoder must surface
      // it and the encoder must write it back.
      const audio: AudioDataBlock = {
        tag: 0x01,
        data: new Uint8Array(0),
        descriptors: [
          {
            format: 15,
            channels: 8,
            samplingRates: {
              sr32kHz: false, sr44_1kHz: false, sr48kHz: true, sr88_2kHz: false,
              sr96kHz: false, sr176_4kHz: false, sr192kHz: false,
            },
            extendedFormat: 12, // AC-4
          },
        ],
      };

      const bytes = ExtensionBlockParser.encode(ceaWith([audio]));
      // Data-block header sits at byte 4; the 3-byte SAD payload occupies bytes
      // 5..7. SAD byte 3 (extendedFormat in bits 7:3) is therefore at byte 7,
      // and equals (12 << 3) = 0x60.
      expect(bytes[7]).toBe(12 << 3);

      const decoded = ExtensionBlockParser.decode(bytes) as CEAExtensionBlock;
      const out = decoded.dataBlocks[0] as AudioDataBlock;
      expect(out.descriptors[0].format).toBe(15);
      expect(out.descriptors[0].extendedFormat).toBe(12);
    });
  });
});