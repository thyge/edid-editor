import { describe, it, expect } from 'vitest';
import {
  ExtensionBlockParser,
  decodeExtendedDataBlock,
  encodeExtendedDataBlock,
  type CEAExtensionBlock,
  type CEADetailedTiming,
  type VideoDataBlock,
  type AudioDataBlock,
  type ExtendedDataBlock,
  type HDRDynamicMetadataDataBlock,
  type VideoFormatPreferenceDataBlock,
  type VendorSpecificAudioDataBlock,
  type RoomConfigurationDataBlock,
  type VendorSpecificVideoDataBlock,
  type SpeakerLocationDataBlock,
  type InfoFrameDataBlock,
  type SpeakerAllocationBlock,
  unifySpeakerLayout,
} from '../src/cta';
import { isChecksum8Valid, checksum8 } from '../src/common';
import { decodeExtension, isCEAExtension, isOpaqueExtension } from '../src/eedid';

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

  describe('DTD offset edge cases (TASK-3)', () => {
    // Encode rule (extension-block.ts): dtdOffset = (detailedTimings.length > 0
    // || offset > 4) ? offset : 0 — i.e. 0 only when there are no data blocks and
    // no DTDs; otherwise it points at the end of the data-block collection (the
    // start of the DTD region). These boundary cases must round-trip.

    it('dtdOffset=0x00 when there are no data blocks and no DTDs', () => {
      const bytes = ExtensionBlockParser.encode(ceaWith([]));
      expect(bytes[2]).toBe(0x00);

      const decoded = ExtensionBlockParser.decode(bytes) as CEAExtensionBlock;
      expect(decoded.dtdOffset).toBe(0);
      expect(decoded.dataBlocks.length).toBe(0);
      expect(decoded.detailedTimings.length).toBe(0);

      // Re-encode is stable.
      const reencoded = ExtensionBlockParser.encode(decoded);
      expect(reencoded[2]).toBe(0x00);
    });

    it('dtdOffset points at the end of data blocks with no DTDs', () => {
      // One 4-VIC video block: header(1) + 4 payload = 5 bytes starting at byte 4
      // → ends at byte 9, which becomes dtdOffset.
      const bytes = ExtensionBlockParser.encode(ceaWith([videoBlock(4)]));
      expect(bytes[2]).toBe(9);

      const decoded = ExtensionBlockParser.decode(bytes) as CEAExtensionBlock;
      expect(decoded.dtdOffset).toBe(9);
      expect(decoded.dataBlocks.length).toBe(1);
      // No DTDs: the DTD loop reads pixelClock at byte 9 (= 0) and breaks.
      expect(decoded.detailedTimings.length).toBe(0);

      const reencoded = ExtensionBlockParser.encode(decoded);
      expect(reencoded[2]).toBe(9);
      const redecoded = ExtensionBlockParser.decode(reencoded) as CEAExtensionBlock;
      expect(redecoded.dataBlocks.length).toBe(1);
      expect(redecoded.detailedTimings.length).toBe(0);
    });

    it('dtdOffset points past the data block collection into the DTD region', () => {
      // Data blocks end at byte 9; a DTD follows, so dtdOffset = 9 points past
      // the data-block collection into the DTD region.
      const dtd: CEADetailedTiming = {
        pixelClock: 148.5,
        horizontalActive: 1920,
        horizontalBlanking: 280,
        verticalActive: 1080,
        verticalBlanking: 45,
        horizontalSyncOffset: 88,
        horizontalSyncWidth: 44,
        verticalSyncOffset: 4,
        verticalSyncWidth: 5,
        interlaced: true,
        horizontalImageSize: 600,
        verticalImageSize: 340,
        horizontalBorder: 0,
        verticalBorder: 0,
      };

      const bytes = ExtensionBlockParser.encode(ceaWith([videoBlock(4)], { detailedTimings: [dtd] }));
      expect(bytes[2]).toBe(9); // end of data blocks = start of DTDs

      const decoded = ExtensionBlockParser.decode(bytes) as CEAExtensionBlock;
      expect(decoded.dtdOffset).toBe(9);
      expect(decoded.dataBlocks.length).toBe(1);
      expect(decoded.detailedTimings.length).toBe(1);
      expect(decoded.detailedTimings[0].pixelClock).toBe(148.5);
      expect(decoded.detailedTimings[0].horizontalActive).toBe(1920);

      // Full round-trip preserves dtdOffset, block count, and the DTD.
      const reencoded = ExtensionBlockParser.encode(decoded);
      expect(reencoded[2]).toBe(9);
      const redecoded = ExtensionBlockParser.decode(reencoded) as CEAExtensionBlock;
      expect(redecoded.dtdOffset).toBe(9);
      expect(redecoded.dataBlocks.length).toBe(1);
      expect(redecoded.detailedTimings.length).toBe(1);
      expect(redecoded.detailedTimings[0].pixelClock).toBe(148.5);
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

  describe('structured encoders for decode-only extended blocks', () => {
    // These blocks decoded to structured fields but encoded by returning the
    // original raw `data`, so edits to the structured fields never serialized.
    // Each encoder now rebuilds from the structured fields (matching the
    // existing Video Capability / Colorimetry / HDR Static encoders).

    it('0x07 HDR Dynamic Metadata encodes entries (Table 87: [len][typeLSB][typeMSB][flags][opt])', () => {
      const block: HDRDynamicMetadataDataBlock = {
        tag: 0x07,
        extendedTag: 0x07,
        data: new Uint8Array([0x07, 0xff]), // sentinel: must not survive
        entries: [{ type: 0x0001, supportFlags: 0x01, optionalFields: new Uint8Array() }],
        trailing: new Uint8Array(),
      };
      expect(Array.from(encodeExtendedDataBlock(block))).toEqual([0x07, 0x03, 0x01, 0x00, 0x01]);
    });

    it('0x07 HDR Dynamic Metadata round-trips multi-entry payload with optional fields', () => {
      // type 0x0001 (flags 1, no optional) + type 0x0004 (flags 2, 1 optional byte 0xAB)
      const original = new Uint8Array([0x07, 0x03, 0x01, 0x00, 0x01, 0x04, 0x04, 0x00, 0x02, 0xab]);
      const decoded = decodeExtendedDataBlock(original) as HDRDynamicMetadataDataBlock;
      expect(decoded.entries.length).toBe(2);
      expect(decoded.entries[0]).toEqual({
        type: 1, supportFlags: 1, optionalFields: new Uint8Array(),
      });
      expect(decoded.entries[1].type).toBe(4);
      expect(decoded.entries[1].supportFlags).toBe(2);
      expect(Array.from(decoded.entries[1].optionalFields)).toEqual([0xab]);
      expect(Array.from(encodeExtendedDataBlock(decoded))).toEqual(Array.from(original));
    });

    it('0x07 HDR Dynamic Metadata preserves malformed trailing bytes', () => {
      // len=0x01 is malformed (< 3 minimum); decode stops and keeps the rest as
      // trailing so the block round-trips byte-identically.
      const original = new Uint8Array([0x07, 0x01, 0xff]);
      const decoded = decodeExtendedDataBlock(original) as HDRDynamicMetadataDataBlock;
      expect(decoded.entries.length).toBe(0);
      expect(Array.from(decoded.trailing)).toEqual([0x01, 0xff]);
      expect(Array.from(encodeExtendedDataBlock(decoded))).toEqual(Array.from(original));
    });

    it('0x0D Video Format Preference encodes from svrs (VICs and DTD indices)', () => {
      const block: VideoFormatPreferenceDataBlock = {
        tag: 0x07,
        extendedTag: 0x0d,
        data: new Uint8Array([0x0d, 0xff]), // sentinel
        svrs: [{ vic: 16 }, { dtdIndex: 3 }],
      };
      // VIC 16 → 0x10; DTD index 3 → 128 + 3 = 0x83.
      expect(Array.from(encodeExtendedDataBlock(block))).toEqual([0x0d, 0x10, 0x83]);
    });

    it('0x0D Video Format Preference round-trips a decoded payload', () => {
      const original = new Uint8Array([0x0d, 0x10, 0x83, 0x00]); // trailing 0 ignored on decode
      expect(Array.from(encodeExtendedDataBlock(decodeExtendedDataBlock(original)))).toEqual(
        [0x0d, 0x10, 0x83],
      );
    });

    it('0x11 Vendor-Specific Audio encodes OUI (little-endian) + payload', () => {
      const block: VendorSpecificAudioDataBlock = {
        tag: 0x07,
        extendedTag: 0x11,
        data: new Uint8Array([0x11, 0xff]), // sentinel
        ieeeOui: 0x1a0b,
        payload: new Uint8Array([0xaa, 0xbb]),
      };
      expect(Array.from(encodeExtendedDataBlock(block))).toEqual([0x11, 0x0b, 0x1a, 0x00, 0xaa, 0xbb]);
    });

    it('0x11 Vendor-Specific Audio round-trips a decoded payload', () => {
      const original = new Uint8Array([0x11, 0x0b, 0x1a, 0x00, 0xaa, 0xbb]);
      expect(Array.from(encodeExtendedDataBlock(decodeExtendedDataBlock(original)))).toEqual(
        Array.from(original),
      );
    });

    it('0x13 Room Configuration encodes speaker count + presence descriptor', () => {
      const block: RoomConfigurationDataBlock = {
        tag: 0x07,
        extendedTag: 0x13,
        data: new Uint8Array([0x13, 0xff]), // sentinel
        speakerCount: 5,
        speakerPresenceDescriptor: 0x03,
      };
      expect(Array.from(encodeExtendedDataBlock(block))).toEqual([0x13, 0x05, 0x03]);
    });

    it('0x13 Room Configuration round-trips a decoded payload', () => {
      const original = new Uint8Array([0x13, 0x05, 0x03]);
      expect(Array.from(encodeExtendedDataBlock(decodeExtendedDataBlock(original)))).toEqual(
        Array.from(original),
      );
    });

    it('0x01 Vendor-Specific Video encodes OUI (little-endian) + payload', () => {
      const block: VendorSpecificVideoDataBlock = {
        tag: 0x07,
        extendedTag: 0x01,
        data: new Uint8Array([0x01, 0xff]), // sentinel
        ieeeOui: 0x1a0b,
        payload: new Uint8Array([0xaa, 0xbb]),
      };
      expect(Array.from(encodeExtendedDataBlock(block))).toEqual([0x01, 0x0b, 0x1a, 0x00, 0xaa, 0xbb]);
    });

    it('0x01 Vendor-Specific Video round-trips a decoded payload', () => {
      const original = new Uint8Array([0x01, 0x0b, 0x1a, 0x00, 0xaa, 0xbb]);
      expect(Array.from(encodeExtendedDataBlock(decodeExtendedDataBlock(original)))).toEqual(
        Array.from(original),
      );
    });

    it('0x14 Speaker Location encodes 2-byte and 5-byte (COORD) descriptors', () => {
      const block: SpeakerLocationDataBlock = {
        tag: 0x07,
        extendedTag: 0x14,
        data: new Uint8Array([0x14, 0xff]), // sentinel
        descriptors: [
          { channelIndex: 1, speakerId: 2, active: true }, // 2 bytes, no coords
          { channelIndex: 0, speakerId: 3, active: true, coordinates: { x: 0.5, y: -0.25, z: 0 } },
        ],
        trailing: new Uint8Array(),
      };
      // desc1: byte0 = 0x20(active) | 0x01 = 0x21, byte1 = 0x02
      // desc2: byte0 = 0x40(COORD) | 0x20(active) | 0x00 = 0x60, byte1 = 0x03
      //   x=0.5 → 32/64 → 0x20; y=-0.25 → -16 → 0xF0; z=0 → 0x00
      expect(Array.from(encodeExtendedDataBlock(block))).toEqual([
        0x14, 0x21, 0x02, 0x60, 0x03, 0x20, 0xf0, 0x00,
      ]);
    });

    it('0x14 Speaker Location round-trips a mixed-stride decoded payload', () => {
      const original = new Uint8Array([0x14, 0x21, 0x02, 0x60, 0x03, 0x20, 0xf0, 0x00]);
      const decoded = decodeExtendedDataBlock(original) as SpeakerLocationDataBlock;
      expect(decoded.descriptors.length).toBe(2);
      expect(decoded.descriptors[0]).toEqual({ channelIndex: 1, speakerId: 2, active: true });
      expect(decoded.descriptors[1].channelIndex).toBe(0);
      expect(decoded.descriptors[1].speakerId).toBe(3);
      expect(decoded.descriptors[1].active).toBe(true);
      expect(decoded.descriptors[1].coordinates).toEqual({ x: 0.5, y: -0.25, z: 0 });
      expect(Array.from(encodeExtendedDataBlock(decoded))).toEqual(Array.from(original));
    });

    it('0x14 Speaker Location preserves a trailing partial descriptor', () => {
      // A lone byte after a complete 2-byte descriptor is not a full
      // descriptor; decode keeps it as trailing for byte-exact round-trip.
      const original = new Uint8Array([0x14, 0x21, 0x02, 0xff]);
      const decoded = decodeExtendedDataBlock(original) as SpeakerLocationDataBlock;
      expect(decoded.descriptors.length).toBe(1);
      expect(Array.from(decoded.trailing)).toEqual([0xff]);
      expect(Array.from(encodeExtendedDataBlock(decoded))).toEqual(Array.from(original));
    });

    it('0x20 InfoFrame encodes processing descriptor + short descriptor', () => {
      const block: InfoFrameDataBlock = {
        tag: 0x07,
        extendedTag: 0x20,
        data: new Uint8Array([0x20, 0xff]), // sentinel
        additionalVsifs: 2,
        processingPayload: new Uint8Array(),
        descriptors: [{ kind: 'short', infoFrameType: 4, payload: new Uint8Array() }],
        trailing: new Uint8Array(),
      };
      // header = (Lb=0 << 5) | reserved = 0x00; additionalVsifs = 0x02;
      // short desc type 4, payloadLen 0 → 0x04
      expect(Array.from(encodeExtendedDataBlock(block))).toEqual([0x20, 0x00, 0x02, 0x04]);
    });

    it('0x20 InfoFrame round-trips short + vendor-specific descriptors', () => {
      // processing: Lb=0, additionalVsifs=0. Short desc type 4 (payloadLen 2,
      // payload 01 02). Vendor desc type 1, OUI 0x1a0b (LE: 0b 1a 00), no payload.
      const original = new Uint8Array([
        0x20, 0x00, 0x00, 0x44, 0x01, 0x02, 0x01, 0x0b, 0x1a, 0x00,
      ]);
      const decoded = decodeExtendedDataBlock(original) as InfoFrameDataBlock;
      expect(decoded.additionalVsifs).toBe(0);
      expect(decoded.descriptors.length).toBe(2);
      expect(decoded.descriptors[0]).toEqual({
        kind: 'short', infoFrameType: 4, payload: new Uint8Array([0x01, 0x02]),
      });
      expect(decoded.descriptors[1]).toEqual({
        kind: 'vendor', ieeeOui: 0x1a0b, payload: new Uint8Array(),
      });
      expect(Array.from(encodeExtendedDataBlock(decoded))).toEqual(Array.from(original));
    });
  });
});

describe('Audio SAD maxBitrate and format-extension round-trip (TASK-5)', () => {
  /** All 7 sampling-rate bits set, for a stable byte 2 across cases. */
  const allRates = {
    sr32kHz: true, sr44_1kHz: true, sr48kHz: true, sr88_2kHz: true,
    sr96kHz: true, sr176_4kHz: true, sr192kHz: true,
  };

  it.each([2, 3, 4, 5, 6, 7, 8])(
    'compressed format code %i round-trips maxBitrate (Table 61: byte3 = maxBitrate/8)',
    (format) => {
      const maxBitrate = format * 64; // multiple of 8 → exact round-trip
      const audio: AudioDataBlock = {
        tag: 0x01,
        data: new Uint8Array(0),
        descriptors: [{ format, channels: 8, samplingRates: allRates, maxBitrate }],
      };
      const bytes = ExtensionBlockParser.encode(ceaWith([audio]));
      // SAD lives at bytes 4..6 (header at 4, payload 5..7). byte3 of the SAD is byte 7.
      expect(bytes[7]).toBe(maxBitrate / 8);

      const decoded = ExtensionBlockParser.decode(bytes) as CEAExtensionBlock;
      const out = decoded.dataBlocks[0] as AudioDataBlock;
      expect(out.descriptors[0].format).toBe(format);
      expect(out.descriptors[0].maxBitrate).toBe(maxBitrate);

      // Re-encode reproduces the same payload bytes.
      const reencoded = ExtensionBlockParser.encode(decoded);
      expect(reencoded[7]).toBe(maxBitrate / 8);
    },
  );

  it.each([4, 6, 11, 12, 13])(
    'format code 15 round-trips extended format %i (byte3 bits 7:3)',
    (extendedFormat) => {
      const audio: AudioDataBlock = {
        tag: 0x01,
        data: new Uint8Array(0),
        descriptors: [{ format: 15, channels: 8, samplingRates: allRates, extendedFormat }],
      };
      const bytes = ExtensionBlockParser.encode(ceaWith([audio]));
      expect(bytes[7]).toBe(extendedFormat << 3);

      const decoded = ExtensionBlockParser.decode(bytes) as CEAExtensionBlock;
      const out = decoded.dataBlocks[0] as AudioDataBlock;
      expect(out.descriptors[0].format).toBe(15);
      expect(out.descriptors[0].extendedFormat).toBe(extendedFormat);

      const reencoded = ExtensionBlockParser.encode(decoded);
      expect(reencoded[7]).toBe(extendedFormat << 3);
    },
  );
});

describe('CEA tag-0x02 validation (TASK-2)', () => {
  /** Minimal valid 128-byte CEA block: tag 0x02, rev 3, dtdOffset 4, no blocks. */
  function validCeaBytes(): Uint8Array {
    const bytes = new Uint8Array(128);
    bytes[0] = 0x02;
    bytes[1] = 3;
    bytes[2] = 4; // dtdOffset — no data blocks, no DTDs
    bytes[3] = 0;
    bytes[127] = checksum8(bytes, 127);
    return bytes;
  }

  it('decodeCEA throws a clear error when the tag is not 0x02 (misrouted input)', () => {
    const bad = new Uint8Array(128);
    bad[0] = 0x10; // wrong tag
    bad[127] = checksum8(bad, 127);
    const base = {
      tag: 0x10 as const,
      revision: bad[1],
      checksum: bad[127],
      checksumValid: isChecksum8Valid(bad),
      data: bad.slice(2, 127),
    };
    expect(() => ExtensionBlockParser.decodeCEA(bad, base)).toThrow(
      /CEA extension block tag must be 0x02; got 0x10/,
    );
  });

  it('decodeExtension returns a CEA extension for a valid 0x02 block', () => {
    const ext = decodeExtension(validCeaBytes());
    expect(isCEAExtension(ext)).toBe(true);
    if (isCEAExtension(ext)) {
      expect(ext.tag).toBe(0x02);
      expect(ext.revision).toBe(3);
    }
  });

  it('decodeExtension falls back to opaque for a non-0x02 tag', () => {
    const bytes = new Uint8Array(128);
    bytes[0] = 0x10; // VTB-style tag — not a CTA block
    bytes[1] = 1;
    bytes[127] = checksum8(bytes, 127);
    const ext = decodeExtension(bytes);
    expect(isOpaqueExtension(ext)).toBe(true);
    if (isOpaqueExtension(ext)) {
      expect(ext.tag).toBe(0x10);
    }
  });
});

describe('Video Data Block VIC validation (TASK-4)', () => {
  /** CEA block carrying one Video Data Block (tag 0x02) with the given VIC bytes. */
  function ceaWithVideoDataBlock(vicBytes: number[]): Uint8Array {
    const bytes = new Uint8Array(128);
    bytes[0] = 0x02;
    bytes[1] = 3;
    // Video Data Block at byte 4: header = (tag 0x02 << 5) | length
    bytes[4] = (0x02 << 5) | vicBytes.length;
    for (let i = 0; i < vicBytes.length; i++) bytes[5 + i] = vicBytes[i];
    bytes[2] = 5 + vicBytes.length; // dtdOffset = end of data blocks
    bytes[3] = 0;
    bytes[127] = checksum8(bytes, 127);
    return bytes;
  }

  it('flags in-range VICs as known and reserved VIC 0 as unknown', () => {
    // VIC 16 (1080p60, known) + VIC 0 (reserved, unknown) + VIC 4 native (known)
    const decoded = ExtensionBlockParser.decode(ceaWithVideoDataBlock([0x10, 0x00, 0x84])) as CEAExtensionBlock;
    const video = decoded.dataBlocks[0] as VideoDataBlock;
    expect(video.tag).toBe(0x02);
    expect(video.vics.length).toBe(3);
    expect(video.vics[0]).toEqual({ vic: 16, native: false, known: true });
    expect(video.vics[1]).toEqual({ vic: 0, native: false, known: false });
    expect(video.vics[2]).toEqual({ vic: 4, native: true, known: true });
  });

  it('round-trips unknown/reserved VIC values verbatim (known is decode-derived)', () => {
    const original = ceaWithVideoDataBlock([0x10, 0x00, 0x84]);
    const decoded = ExtensionBlockParser.decode(original) as CEAExtensionBlock;
    const reencoded = ExtensionBlockParser.encode(decoded);
    // The data-block area (header + 3 VIC bytes) must be unchanged.
    expect(Array.from(reencoded.subarray(4, 8))).toEqual([0x43, 0x10, 0x00, 0x84]);
    // Re-decode preserves the numeric VICs and known flags.
    const redecoded = ExtensionBlockParser.decode(reencoded) as CEAExtensionBlock;
    const video = redecoded.dataBlocks[0] as VideoDataBlock;
    expect(video.vics.map((v) => v.vic)).toEqual([16, 0, 4]);
    expect(video.vics[1].known).toBe(false);
  });
});

describe('CEA speaker allocation full bit model (TASK-6)', () => {
  /** Speaker Allocation Data Block with every spec-defined bit off. */
  function speakerBlock(overrides: Partial<SpeakerAllocationBlock['speakers']> = {}): SpeakerAllocationBlock {
    const speakers: SpeakerAllocationBlock['speakers'] = {
      frontLeftRight: false, lfe: false, frontCenter: false,
      rearLeftRight: false, rearCenter: false, frontLeftRightCenter: false,
      rearLeftRightCenter: false, frontLeftRightWide: false,
      frontLeftRightHigh: false, topCenter: false, frontCenterHigh: false,
      surroundLeftRight: false, lfe2: false, topBackCenter: false,
      sideLeftRight: false, topSideLeftRight: false,
      topBackLeftRight: false, bottomFrontCenter: false,
      bottomFrontLeftRight: false, topLeftRightSurround: false,
      ...overrides,
    };
    return { tag: 0x04, data: new Uint8Array(), speakers, trailing: new Uint8Array() };
  }

  it('round-trips all 20 SADB speaker bits set (byte1=0xff, byte2=0xff, byte3=0x0f)', () => {
    const all = speakerBlock({
      frontLeftRight: true, lfe: true, frontCenter: true, rearLeftRight: true,
      rearCenter: true, frontLeftRightCenter: true, rearLeftRightCenter: true,
      frontLeftRightWide: true, frontLeftRightHigh: true, topCenter: true,
      frontCenterHigh: true, surroundLeftRight: true, lfe2: true, topBackCenter: true,
      sideLeftRight: true, topSideLeftRight: true, topBackLeftRight: true,
      bottomFrontCenter: true, bottomFrontLeftRight: true, topLeftRightSurround: true,
    });
    const original = ceaWith([all]);
    const bytes = ExtensionBlockParser.encode(original);
    const decoded = ExtensionBlockParser.decode(bytes) as CEAExtensionBlock;
    const s = decoded.dataBlocks[0] as SpeakerAllocationBlock;

    // Every modelled bit survives the round trip.
    for (const key of Object.keys(all.speakers) as (keyof SpeakerAllocationBlock['speakers'])[]) {
      expect(s.speakers[key], `bit ${key}`).toBe(true);
    }
    // byte3 reserved bits 7:4 stay 0 → 0x0f, not 0xff.
    expect(s.data[0]).toBe(0xff);
    expect(s.data[1]).toBe(0xff);
    expect(s.data[2]).toBe(0x0f);

    // Re-encoding is byte-identical.
    const reencoded = ExtensionBlockParser.encode(decoded);
    expect(Array.from(reencoded)).toEqual(Array.from(bytes));
  });

  it('preserves trailing payload bytes beyond the 3-byte SADB mask', () => {
    const block = speakerBlock({ frontLeftRight: true });
    block.trailing = new Uint8Array([0xab, 0xcd]);
    const original = ceaWith([block]);
    const bytes = ExtensionBlockParser.encode(original);
    const decoded = ExtensionBlockParser.decode(bytes) as CEAExtensionBlock;
    const s = decoded.dataBlocks[0] as SpeakerAllocationBlock;
    expect(Array.from(s.trailing)).toEqual([0xab, 0xcd]);
    expect(ExtensionBlockParser.encode(decoded)).toEqual(bytes);
  });
});

describe('unifySpeakerLayout: SADB + Speaker Location (TASK-6)', () => {
  function locationBlock(descriptors: SpeakerLocationDataBlock['descriptors']): SpeakerLocationDataBlock {
    return {
      tag: 0x07,
      extendedTag: 0x14,
      data: new Uint8Array(),
      descriptors,
      trailing: new Uint8Array(),
    };
  }

  function sadb(set: Partial<SpeakerAllocationBlock['speakers']> = {}): SpeakerAllocationBlock {
    const speakers: SpeakerAllocationBlock['speakers'] = {
      frontLeftRight: false, lfe: false, frontCenter: false,
      rearLeftRight: false, rearCenter: false, frontLeftRightCenter: false,
      rearLeftRightCenter: false, frontLeftRightWide: false,
      frontLeftRightHigh: false, topCenter: false, frontCenterHigh: false,
      surroundLeftRight: false, lfe2: false, topBackCenter: false,
      sideLeftRight: false, topSideLeftRight: false,
      topBackLeftRight: false, bottomFrontCenter: false,
      bottomFrontLeftRight: false, topLeftRightSurround: false,
      ...set,
    };
    return { tag: 0x04, data: new Uint8Array(), speakers, trailing: new Uint8Array() };
  }

  it('returns 20 SADB entries with present flags when only a SADB is given', () => {
    const u = unifySpeakerLayout(sadb({ frontLeftRight: true, lfe: true }));
    expect(u).toHaveLength(20);
    const flfr = u.find((e) => e.allocationKey === 'frontLeftRight');
    const lfe = u.find((e) => e.allocationKey === 'lfe');
    expect(flfr?.present).toBe(true);
    expect(lfe?.present).toBe(true);
    expect(flfr?.speakerIds).toEqual([0x00, 0x01]);
    // No Location block → no location data on any entry.
    expect(u.every((e) => e.location === undefined)).toBe(true);
  });

  it('joins a Speaker Location descriptor to its matching SADB bit', () => {
    // FC = speakerId 0x02, covered by the `frontCenter` SADB bit.
    const loc = locationBlock([{ channelIndex: 3, speakerId: 0x02, active: true }]);
    const u = unifySpeakerLayout(sadb({ frontCenter: true }), loc);
    const fc = u.find((e) => e.allocationKey === 'frontCenter');
    expect(fc?.present).toBe(true);
    expect(fc?.location).toEqual({ channelIndex: 3, active: true, coordinates: undefined });
  });

  it('reports a Location descriptor even when the SADB bit is absent', () => {
    // LFE2 = 0x09 is covered by the `lfe2` SADB bit; leave that bit off.
    const loc = locationBlock([{ channelIndex: 7, speakerId: 0x09, active: false }]);
    const u = unifySpeakerLayout(sadb(), loc);
    const lfe2 = u.find((e) => e.allocationKey === 'lfe2');
    expect(lfe2?.present).toBe(false);
    expect(lfe2?.location?.channelIndex).toBe(7);
  });

  it('appends reserved-speakerId Location descriptors not covered by any SADB bit', () => {
    // 0x1f is a reserved Table 34 code with no SADB bit.
    const loc = locationBlock([{ channelIndex: 9, speakerId: 0x1f, active: true }]);
    const u = unifySpeakerLayout(sadb(), loc);
    expect(u).toHaveLength(21);
    const extra = u[20];
    expect(extra.allocationKey).toBeUndefined();
    expect(extra.present).toBe(false);
    expect(extra.speakerIds).toEqual([0x1f]);
    expect(extra.location?.channelIndex).toBe(9);
  });

  it('never attaches a Location to the RLC/RRC or TpLS/TpRS bits (no Table 34 code)', () => {
    const loc = locationBlock([
      { channelIndex: 0, speakerId: 0x00, active: true }, // FL — matches frontLeftRight, not RLC/RRC
    ]);
    const u = unifySpeakerLayout(
      sadb({ rearLeftRightCenter: true, topLeftRightSurround: true }),
      loc,
    );
    const rlc = u.find((e) => e.allocationKey === 'rearLeftRightCenter');
    const tls = u.find((e) => e.allocationKey === 'topLeftRightSurround');
    expect(rlc?.present).toBe(true);
    expect(rlc?.speakerIds).toEqual([]);
    expect(rlc?.location).toBeUndefined();
    expect(tls?.present).toBe(true);
    expect(tls?.speakerIds).toEqual([]);
    expect(tls?.location).toBeUndefined();
  });
});