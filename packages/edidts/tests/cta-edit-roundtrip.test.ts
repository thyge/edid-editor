/**
 * Edit correctness of the CTA-861 data-block codecs.
 *
 * Open-and-save is byte-exact through the source-bytes safety net
 * (common/source-bytes.ts), but once the user edits a block it is re-encoded
 * from its model. These tests bypass the safety net — `{ ...block }` drops the
 * remembered source bytes — so every block below goes through its codec:
 *
 *   - encode(decode(bytes)) must give back exactly `bytes` (reserved bits,
 *     optional bytes and malformed lengths included), and
 *   - editing one field must change only that field's bits.
 *
 * Layouts follow edid-decode (parse-cta-block.cpp).
 */
import { describe, it, expect } from 'vitest';
import {
  ExtensionBlockParser,
  decodeSvd,
  encodeSvd,
  type AudioDataBlock,
  type CEADataBlock,
  type ColorimetryDataBlock,
  type HDRStaticMetadataDataBlock,
  type InfoFrameDataBlock,
  type RoomConfigurationDataBlock,
  type SpeakerAllocationBlock,
  type SpeakerLocationDataBlock,
  type VESAVideoDisplayDeviceDataBlock,
  type VideoCapabilityDataBlock,
  type VideoDataBlock,
  type VideoFormatPreferenceDataBlock,
  type VendorSpecificDataBlock,
  type VendorSpecificVideoDataBlock,
  type VendorSpecificAudioDataBlock,
  type YCbCr420VideoDataBlock,
  type DolbyVSDB,
  type HDR10PlusVSDB,
  type MicrosoftHMDVSDB,
  type AMDFreeSyncVSDB,
  type MHLVSDB,
} from '../src/cta';
import { decodeSvr, encodeSvr } from '../src/cta/vcdb/video-format-preference';
import { decodeShortAudioDescriptor, encodeShortAudioDescriptor } from '../src/cta/audio-format-codes';
import {
  hdrLuminanceFromCode,
  hdrMinLuminanceFromCode,
  hdrLuminanceToCode,
  hdrMinLuminanceToCode,
} from '../src/cta/vcdb/hdr-static';
import { setDolbyVsvdbVersion } from '../src/cta/vcdb/vsvdb/dolby';
import { createDefaultCEADataBlock } from '../src/cta/default-blocks';

/** "e3 05 c0 41" → [0xe3, 0x05, 0xc0, 0x41] */
function hex(s: string): number[] {
  return s.trim().split(/\s+/).filter(Boolean).map((b) => parseInt(b, 16));
}

/** Decode one wire-format data block (header byte + body). */
function decodeBlock<T = CEADataBlock>(wire: string | number[]): T {
  const bytes = new Uint8Array(typeof wire === 'string' ? hex(wire) : wire);
  const { dataBlocks, trailing } = ExtensionBlockParser.decodeCtaDataBlockStream(bytes);
  expect(trailing.length).toBe(0);
  expect(dataBlocks.length).toBe(1);
  return dataBlocks[0] as T;
}

/**
 * Re-encode a block through its codec. The spread copy has no remembered
 * source bytes, so the safety net cannot hand back the original bytes.
 */
function encodeBlock(block: object): number[] {
  return Array.from(ExtensionBlockParser.encodeCtaDataBlockStream([{ ...block } as CEADataBlock]));
}

/** Decode, then re-encode through the codec. */
function roundTrip(wire: string | number[]): number[] {
  return encodeBlock(decodeBlock(wire));
}

function expectRoundTrip(wire: string): void {
  expect(roundTrip(wire)).toEqual(hex(wire));
}

/** Apply `edit` to a fresh decode of `wire` and re-encode it. */
function edited<T extends object>(wire: string, edit: (block: T) => void): number[] {
  const block = decodeBlock<T>(wire);
  edit(block);
  return encodeBlock(block);
}

// ---------------------------------------------------------------------------
// 1. Short Video Descriptors (Video Data Block + YCbCr 4:2:0 Video Data Block)
// ---------------------------------------------------------------------------
describe('1. Short Video Descriptors', () => {
  it('decodeSvd / encodeSvd are inverse for all 256 byte values', () => {
    for (let b = 0; b < 256; b++) {
      const { vic, native } = decodeSvd(b);
      expect(encodeSvd(vic, native)).toBe(b);
    }
  });

  it('reads bytes 193–253 as VICs 193–253 without the native flag', () => {
    expect(decodeSvd(0xc7)).toEqual({ vic: 199, native: false });
    expect(decodeSvd(0x81)).toEqual({ vic: 1, native: true });
    expect(decodeSvd(0xc0)).toEqual({ vic: 64, native: true });
    expect(decodeSvd(0x47)).toEqual({ vic: 71, native: false });
  });

  it('round-trips every SVD byte through the Video Data Block codec', () => {
    for (let start = 0; start < 256; start += 31) {
      const body = Array.from({ length: Math.min(31, 256 - start) }, (_, i) => start + i);
      const wire = [(0x02 << 5) | body.length, ...body];
      expect(roundTrip(wire)).toEqual(wire);
    }
  });

  it('decodes an 8K VIC 199 as VIC 199 and re-adds it as 0xC7', () => {
    const vdb = decodeBlock<VideoDataBlock>('43 90 c7 10');
    expect(vdb.vics.map((v) => [v.vic, v.native])).toEqual([[16, true], [199, false], [16, false]]);
    expect(vdb.vics[1].known).toBe(true);

    const out = edited<VideoDataBlock>('42 90 10', (b) => {
      b.vics = [...b.vics, { vic: 199, native: false }];
    });
    expect(out).toEqual(hex('43 90 10 c7'));
  });

  it('only VICs 1–64 take the native flag', () => {
    const out = edited<VideoDataBlock>('42 10 c7', (b) => {
      b.vics = b.vics.map((v) => ({ ...v, native: true }));
    });
    expect(out).toEqual(hex('42 90 c7'));
  });

  it('applies the same SVD rule in the YCbCr 4:2:0 Video Data Block', () => {
    const wire = 'e5 0e c7 c8 61 81';
    const block = decodeBlock<YCbCr420VideoDataBlock>(wire);
    expect(block.vics.map((v) => [v.vic, v.native])).toEqual([[199, false], [200, false], [97, false], [1, true]]);
    expectRoundTrip(wire);
    for (let start = 0; start < 256; start += 30) {
      const body = Array.from({ length: Math.min(30, 256 - start) }, (_, i) => start + i);
      const w = [0xe0 | (body.length + 1), 0x0e, ...body];
      expect(roundTrip(w)).toEqual(w);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Video Format Preference Data Block SVRs
// ---------------------------------------------------------------------------
describe('2. Video Format Preference SVRs', () => {
  it('decodeSvr / encodeSvr are inverse for all 256 byte values', () => {
    for (let b = 0; b < 256; b++) expect(encodeSvr(decodeSvr(b))).toBe(b);
  });

  it('classifies SVRs per edid-decode cta_print_svr', () => {
    expect(decodeSvr(199)).toEqual({ vic: 199 });
    expect(decodeSvr(16)).toEqual({ vic: 16 });
    expect(decodeSvr(129)).toEqual({ dtdIndex: 1 });
    expect(decodeSvr(144)).toEqual({ dtdIndex: 16 });
    expect(decodeSvr(145)).toEqual({ vtdbIndex: 1 });
    expect(decodeSvr(160)).toEqual({ vtdbIndex: 16 });
    expect(decodeSvr(161)).toEqual({ ridRateIndex: 1 });
    expect(decodeSvr(254)).toEqual({ t8vtdb: true });
    expect(decodeSvr(0)).toEqual({ reserved: 0 });
    expect(decodeSvr(128)).toEqual({ reserved: 128 });
    expect(decodeSvr(180)).toEqual({ reserved: 180 });
    expect(decodeSvr(255)).toEqual({ reserved: 255 });
  });

  it('keeps VIC 199 and reserved SVRs 0/128 in the block', () => {
    const wire = 'e5 0d c7 00 81 80';
    const block = decodeBlock<VideoFormatPreferenceDataBlock>(wire);
    expect(block.svrs).toEqual([{ vic: 199 }, { reserved: 0 }, { dtdIndex: 1 }, { reserved: 128 }]);
    expectRoundTrip(wire);
  });

  it('round-trips every SVR byte through the block codec', () => {
    for (let start = 0; start < 256; start += 30) {
      const body = Array.from({ length: Math.min(30, 256 - start) }, (_, i) => start + i);
      const w = [0xe0 | (body.length + 1), 0x0d, ...body];
      expect(roundTrip(w)).toEqual(w);
    }
  });

  it('editing one SVR rewrites only its byte, and VICs clamp instead of wrapping', () => {
    const out = edited<VideoFormatPreferenceDataBlock>('e4 0d c7 92 81', (b) => {
      b.svrs = b.svrs.map((s, i) => (i === 2 ? { dtdIndex: 2 } : s));
    });
    expect(out).toEqual(hex('e4 0d c7 92 82'));
    expect(encodeSvr({ vic: 300 })).toBe(253);
    expect(encodeSvr({ vic: 140 })).toBe(127);
    expect(encodeSvr({ dtdIndex: 40 })).toBe(144);
  });
});

// ---------------------------------------------------------------------------
// 5. Colorimetry Data Block
// ---------------------------------------------------------------------------
describe('5. Colorimetry Data Block', () => {
  it('models every bit of byte 2 (ICtCp, sRGB, Default, MD0, reserved)', () => {
    const block = decodeBlock<ColorimetryDataBlock>('e3 05 c0 41');
    expect(block.bt2020YCC && block.bt2020RGB).toBe(true);
    expect(block.ictcp).toBe(true);
    expect(block.gamutMetadataP0).toBe(true);
    expect(block.dciP3).toBe(false);
    expectRoundTrip('e3 05 c0 41');
    expectRoundTrip('e3 05 ff ff');
    expectRoundTrip('e3 05 00 0e');
    expectRoundTrip('e3 05 00 30');
  });

  it('keeps a 1-byte body 1 byte long until a byte-2 flag is set', () => {
    expectRoundTrip('e2 05 c0');
    expect(edited<ColorimetryDataBlock>('e2 05 c0', (b) => { b.xvYCC601 = true; })).toEqual(hex('e2 05 c1'));
    expect(edited<ColorimetryDataBlock>('e2 05 c0', (b) => { b.sRGB = true; })).toEqual(hex('e3 05 c0 20'));
  });

  it('editing one flag changes only its bit', () => {
    expect(edited<ColorimetryDataBlock>('e3 05 c0 41', (b) => { b.dciP3 = true; })).toEqual(hex('e3 05 c0 c1'));
    expect(edited<ColorimetryDataBlock>('e3 05 c0 4f', (b) => { b.ictcp = false; })).toEqual(hex('e3 05 c0 0f'));
  });
});

// ---------------------------------------------------------------------------
// 6. HDR Static Metadata Data Block
// ---------------------------------------------------------------------------
describe('6. HDR Static Metadata Data Block', () => {
  it('round-trips every min-luminance code (incl. 1–5) and keeps raw codes', () => {
    for (const min of [0, 1, 2, 3, 4, 5, 0x40, 0xff]) {
      const wire = `e6 06 05 01 64 4b ${min.toString(16).padStart(2, '0')}`;
      expectRoundTrip(wire);
      const block = decodeBlock<HDRStaticMetadataDataBlock>(wire);
      expect(block.maxLuminanceCode).toBe(0x64);
      expect(block.maxFrameAvgLuminanceCode).toBe(0x4b);
      expect(block.minLuminanceCode).toBe(min);
    }
  });

  it('keeps reserved EOTF bits and metadata types 2–8', () => {
    expectRoundTrip('e3 06 35 01');
    expectRoundTrip('e3 06 f0 fe');
    const block = decodeBlock<HDRStaticMetadataDataBlock>('e3 06 35 01');
    expect(block.eotf.smpte2084).toBe(true);
    expect(block.eotf.traditionalGammaSDR).toBe(true);
  });

  it('keeps optional-byte presence and short bodies', () => {
    expectRoundTrip('e3 06 05 01');
    expectRoundTrip('e4 06 05 01 64');
    expectRoundTrip('e5 06 05 01 64 4b');
    expectRoundTrip('e2 06 05');
    expectRoundTrip('e8 06 05 01 64 4b 01 aa 55');
  });

  it('editing one field changes only its bits', () => {
    expect(edited<HDRStaticMetadataDataBlock>('e6 06 35 01 64 4b 03', (b) => { b.eotf.hlg = true; }))
      .toEqual(hex('e6 06 3d 01 64 4b 03'));
    expect(edited<HDRStaticMetadataDataBlock>('e6 06 05 01 64 4b 03', (b) => { b.maxLuminanceCode = 0x70; }))
      .toEqual(hex('e6 06 05 01 70 4b 03'));
  });

  it('derives cd/m² from the codes (edid-decode formulas)', () => {
    expect(hdrLuminanceFromCode(0x64)).toBeCloseTo(50 * Math.pow(2, 100 / 32), 6);
    expect(hdrMinLuminanceFromCode(0x64, 3)).toBeCloseTo(hdrLuminanceFromCode(0x64) * (3 / 255) ** 2 / 100, 9);
    expect(hdrLuminanceToCode(hdrLuminanceFromCode(0x64))).toBe(0x64);
    expect(hdrMinLuminanceToCode(0x64, hdrMinLuminanceFromCode(0x64, 3))).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 7. Room Configuration Data Block
// ---------------------------------------------------------------------------
describe('7. Room Configuration Data Block', () => {
  it('decodes the edid-decode cta_rcdb layout', () => {
    const block = decodeBlock<RoomConfigurationDataBlock>('eb 13 e5 0f 00 00 20 1e 0a 00 40 c0');
    expect(block.display).toBe(true);
    expect(block.speaker).toBe(true);
    expect(block.sld).toBe(true);
    expect(block.speakerCount).toBe(6);
    expect(block.speakerPresenceMask).toBe(0x0f);
    expect(block.max).toEqual({ x: 0x20, y: 0x1e, z: 0x0a });
    expect(block.displayPosition).toEqual({ x: 0, y: 1, z: -1 });
  });

  it('round-trips the 4-, 7- and 10-byte forms and malformed lengths', () => {
    expectRoundTrip('eb 13 e5 0f 00 00 20 1e 0a 00 40 c0');
    expectRoundTrip('e8 13 65 0f 02 00 20 1e 0a');
    expectRoundTrip('e5 13 41 01 00 00');
    expectRoundTrip('e6 13 41 01 00 00 05');
    expectRoundTrip('e3 13 41 01');
  });

  it('editing one field changes only its bits', () => {
    expect(edited<RoomConfigurationDataBlock>('eb 13 e5 0f 00 00 20 1e 0a 00 40 c0', (b) => { b.speakerCount = 8; }))
      .toEqual(hex('eb 13 e7 0f 00 00 20 1e 0a 00 40 c0'));
    expect(edited<RoomConfigurationDataBlock>('e5 13 41 01 00 00', (b) => { b.speakerPresenceMask = 0x020001; }))
      .toEqual(hex('e5 13 41 01 00 02'));
  });

  it('creates a well-formed default block', () => {
    expect(encodeBlock(createDefaultCEADataBlock('room-config')!)).toEqual(hex('e5 13 41 01 00 00'));
  });
});

// ---------------------------------------------------------------------------
// 8. Reserved bits: Speaker Location, InfoFrame, VESA Display Device, SADB
// ---------------------------------------------------------------------------
describe('8. Reserved bits survive a re-encode', () => {
  it('Speaker Location keeps byte 0 bit 7 and byte 1 bits 7:5', () => {
    expectRoundTrip('e3 14 80 e0');
    expectRoundTrip('e6 14 ff ff 40 c0 01');
    expect(edited<SpeakerLocationDataBlock>('e3 14 80 e0', (b) => { b.descriptors[0].active = true; }))
      .toEqual(hex('e3 14 a0 e0'));
    // Out-of-range values clamp instead of wrapping into another channel.
    expect(edited<SpeakerLocationDataBlock>('e3 14 00 00', (b) => { b.descriptors[0].channelIndex = 40; }))
      .toEqual(hex('e3 14 1f 00'));
  });

  it('InfoFrame keeps header bits 4:0 and an over-long Lb', () => {
    expectRoundTrip('e3 20 1f 00');
    expectRoundTrip('e3 20 e0 01');
    expectRoundTrip('e4 20 e0 01 aa');
    expectRoundTrip('e2 20 1f');
    expectRoundTrip('e9 20 20 00 aa 01 03 0c 00 02');
    expect(edited<InfoFrameDataBlock>('e3 20 1f 00', (b) => { b.additionalVsifs = 2; })).toEqual(hex('e3 20 1f 02'));
  });

  it('InfoFrame clamps descriptor payloads to the 3-bit length instead of wrapping', () => {
    const out = edited<InfoFrameDataBlock>('e3 20 00 00', (b) => {
      b.descriptors = [{ kind: 'short', infoFrameType: 2, payload: new Uint8Array(9).fill(0x11) }];
    });
    expect(out).toEqual([0xeb, 0x20, 0x00, 0x00, 0xe2, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11]);
  });

  const vddb = (b0e: number, b0f: number, b15: number, b03 = 0xfd) => {
    const body = [
      0x9f, 0x12, 0x01, b03, 0x2c, 0x80, 0x07, 0x38, 0x04, 0x4e, 0x00, 0x00, 0x1b, 0x1b,
      b0e, b0f, 0x82, 0x0a, 0x3c, 0x77, 0xe4, b15, 0x99, 0x55, 0x44, 0x33, 0x22, 0x11, 0x85, 0x55,
    ];
    return [0xff, 0x02, ...body];
  };

  it('VESA Display Device keeps bytes 0x0e/0x0f/0x15 reserved bits', () => {
    const wire = vddb(0xff, 0xff, 0xff);
    expect(roundTrip(wire)).toEqual(wire);
    const block = decodeBlock<VESAVideoDisplayDeviceDataBlock>(wire);
    block.deinterlacing = false;
    expect(encodeBlock(block)).toEqual(vddb(0xf7, 0xff, 0xff));
  });

  it('VESA Display Device clamps a min clock above 63 MHz', () => {
    const block = decodeBlock<VESAVideoDisplayDeviceDataBlock>(vddb(0, 0, 0, 0x01));
    block.minClockMHz = 64;
    expect(encodeBlock(block)).toEqual(vddb(0, 0, 0, 0xfd));
  });

  it('Speaker Allocation keeps byte 3 bits 7:4 and a short body', () => {
    expectRoundTrip('83 4f 00 f3');
    expectRoundTrip('82 01 00');
    expect(edited<SpeakerAllocationBlock>('83 4f 00 f3', (b) => { b.speakers.lfe2 = true; }))
      .toEqual(hex('83 4f 10 f3'));
  });
});

// ---------------------------------------------------------------------------
// 9. Microsoft HMD VSDB
// ---------------------------------------------------------------------------
describe('9. Microsoft HMD VSDB', () => {
  const containerId = '11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff 00';
  const wire = (flags: string) => `75 5c 12 ca 03 ${flags} ${containerId}`;

  it('reads Desktop (bit 6), Third-Party (bit 5) and a 5-bit use case', () => {
    const block = decodeBlock<VendorSpecificDataBlock>(wire('52'));
    const fields = block.vendor!.kind === 'microsoftHmd' ? block.vendor!.fields : undefined;
    expect(fields).toMatchObject({ version: 3, desktopUsage: true, nonMicrosoftUsage: false, primaryUseCase: 0x12 });
    expectRoundTrip(wire('52'));
    expectRoundTrip(wire('ff'));
  });

  it('encodes use case 0x10 (Video Wall) without throwing and keeps unknown codes', () => {
    expectRoundTrip(wire('10'));
    expectRoundTrip(wire('1f'));
    const out = edited<VendorSpecificDataBlock>(wire('12'), (b) => {
      (b.vendor as { fields: MicrosoftHMDVSDB }).fields.primaryUseCase = 0x99;
    });
    expect(out).toEqual(hex(wire('1f')));
  });

  it('editing one flag changes only its bit', () => {
    const out = edited<VendorSpecificDataBlock>(wire('52'), (b) => {
      (b.vendor as { fields: MicrosoftHMDVSDB }).fields.nonMicrosoftUsage = true;
    });
    expect(out).toEqual(hex(wire('72')));
  });

  it('keeps short and long bodies at their length', () => {
    expectRoundTrip('65 5c 12 ca 03 52');
    expectRoundTrip('64 5c 12 ca 03');
    expectRoundTrip(`77 5c 12 ca 03 52 ${containerId} 01 02`);
  });
});

// ---------------------------------------------------------------------------
// 10. Dolby Vision VSVDB (per-version layout)
// ---------------------------------------------------------------------------
describe('10. Dolby Vision VSVDB', () => {
  const fieldsOf = (b: VendorSpecificVideoDataBlock) => (b.vendor as { fields: DolbyVSDB }).fields;
  const v1 = 'eb 01 46 d0 00 2b 4f 6a 01 8e 56 c8';
  const v2 = 'eb 01 46 d0 00 46 9c 62 a3 07 48 51';

  it('v1: bits 4:2 are the DM version and global dimming is byte 1 bit 0', () => {
    const f = fieldsOf(decodeBlock<VendorSpecificVideoDataBlock>(v1));
    expect(f).toMatchObject({ version: 1, supportsYUV422_12bit: true, supports2160p60: true, dmVersion: 2, supportsGlobalDimming: true });
    expectRoundTrip(v1);
    const out = edited<VendorSpecificVideoDataBlock>(v1, (b) => { fieldsOf(b).supportsGlobalDimming = false; });
    expect(out).toEqual(hex('eb 01 46 d0 00 2b 4e 6a 01 8e 56 c8'));
  });

  it('v2: bit 1 is backlight control and global dimming is byte 1 bit 2', () => {
    const f = fieldsOf(decodeBlock<VendorSpecificVideoDataBlock>(v2));
    expect(f).toMatchObject({ version: 2, supportsBacklightControl: true, supports2160p60: false, dmVersion: 1, supportsGlobalDimming: true });
    expectRoundTrip(v2);
    const out = edited<VendorSpecificVideoDataBlock>(v2, (b) => { fieldsOf(b).supportsGlobalDimming = false; });
    expect(out).toEqual(hex('eb 01 46 d0 00 46 98 62 a3 07 48 51'));
  });

  it('v0: global dimming stays byte 0 bit 2; reserved bits round-trip', () => {
    const v0 = 'f6 01 46 d0 00 1f 8a 48 a3 9e 1e 4f 06 51 a8 b3 26 0b 50 54 4a 9d 20';
    const f = fieldsOf(decodeBlock<VendorSpecificVideoDataBlock>(v0));
    expect(f).toMatchObject({ version: 0, supportsGlobalDimming: true, supports2160p60: true, byte0Reserved: 3 });
    expectRoundTrip(v0);
  });

  it('round-trips every byte-0 value for every version', () => {
    for (let b0 = 0; b0 < 256; b0++) {
      const w = [0xe0 | 7, 0x01, 0x46, 0xd0, 0x00, b0, 0xff, 0x5a];
      expect(roundTrip(w)).toEqual(w);
      const short = [0xe0 | 5, 0x01, 0x46, 0xd0, 0x00, b0];
      expect(roundTrip(short)).toEqual(short);
    }
  });

  it('changing the version only touches the version bits', () => {
    const f = fieldsOf(decodeBlock<VendorSpecificVideoDataBlock>(v1));
    const next = setDolbyVsvdbVersion(f, 2);
    expect(next.version).toBe(2);
    expect(next.supportsBacklightControl).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 11. HDR10+ VSVDB
// ---------------------------------------------------------------------------
describe('11. HDR10+ VSVDB', () => {
  it('splits byte 0 into application version and luminance indexes', () => {
    const block = decodeBlock<VendorSpecificVideoDataBlock>('e5 01 8b 84 90 4d');
    expect((block.vendor as { fields: HDR10PlusVSDB }).fields).toMatchObject({
      applicationVersion: 1,
      fullFramePeakLuminanceIndex: 3,
      peakLuminanceIndex: 4,
    });
    expectRoundTrip('e5 01 8b 84 90 4d');
    expectRoundTrip('e7 01 8b 84 90 ff 12 34');
  });

  it('editing the application version changes only bits 1:0', () => {
    const out = edited<VendorSpecificVideoDataBlock>('e5 01 8b 84 90 4d', (b) => {
      (b.vendor as { fields: HDR10PlusVSDB }).fields.applicationVersion = 2;
    });
    expect(out).toEqual(hex('e5 01 8b 84 90 4e'));
  });
});

// ---------------------------------------------------------------------------
// 12. Short / malformed blocks keep their length
// ---------------------------------------------------------------------------
describe('12. Short blocks keep their length', () => {
  it('VSVDB / VSADB with a body shorter than the OUI', () => {
    expectRoundTrip('e3 01 46 d0');
    expectRoundTrip('e1 01');
    expectRoundTrip('e3 11 46 d0');
    const vsadb = decodeBlock<VendorSpecificAudioDataBlock>('e3 11 46 d0');
    expect(vsadb.truncatedBody).toEqual(new Uint8Array([0x46, 0xd0]));
  });

  it('AMD VSDB with a body shorter than 5 bytes is decoded, not zeroed', () => {
    const wire = '66 1a 00 00 02 03 30';
    const block = decodeBlock<VendorSpecificDataBlock>(wire);
    expect((block.vendor as { fields: AMDFreeSyncVSDB }).fields).toMatchObject({ version: 2, flags1: 3, minRefreshHz: 0x30 });
    expectRoundTrip(wire);
    expect(edited<VendorSpecificDataBlock>(wire, (b) => {
      (b.vendor as { fields: AMDFreeSyncVSDB }).fields.minRefreshHz = 0x28;
    })).toEqual(hex('66 1a 00 00 02 03 28'));
  });

  it('AMD VSDB decodes the edid-decode cta_amd layout', () => {
    const wire = '6e 1a 00 00 02 0b 30 90 00 a6 98 59 4b 1e 3a';
    const block = decodeBlock<VendorSpecificDataBlock>(wire);
    expect((block.vendor as { fields: AMDFreeSyncVSDB }).fields).toMatchObject({
      version: 2, flags1: 0x0b, minRefreshHz: 0x30, maxRefreshHz: 0x90, mccsVcpCode: 0,
    });
    expectRoundTrip(wire);
  });

  it('MHL VSDB with a 1-byte body stays 1 byte', () => {
    expectRoundTrip('64 80 d8 7c 20');
    expectRoundTrip('63 80 d8 7c');
    expect(edited<VendorSpecificDataBlock>('64 80 d8 7c 20', (b) => {
      (b.vendor as { fields: MHLVSDB }).fields.revision = 1;
    })).toEqual(hex('64 80 d8 7c 21'));
  });

  it('an empty Video Capability block stays empty until a field is set', () => {
    expectRoundTrip('e1 00');
    expectRoundTrip('e2 00 4a');
    expectRoundTrip('e4 00 4a 01 02');
    expect(edited<VideoCapabilityDataBlock>('e1 00', (b) => { b.quantizationRangeSelectable = true; }))
      .toEqual(hex('e2 00 40'));
  });
});

// ---------------------------------------------------------------------------
// 13. Audio Data Block — every format code
// ---------------------------------------------------------------------------
describe('13. Short Audio Descriptors', () => {
  it('decode → encode is exact for every byte 1 / byte 3 value', () => {
    for (let b0 = 0; b0 < 256; b0++) {
      for (const b1 of [0x00, 0x7f, 0x80, 0xff, 0x29]) {
        for (let b2 = 0; b2 < 256; b2++) {
          expect(encodeShortAudioDescriptor(decodeShortAudioDescriptor(b0, b1, b2))).toEqual([b0, b1, b2]);
        }
      }
    }
  });

  it('keeps AC-4, MPEG-H 3D and WMA Pro byte 3', () => {
    const wire = '2c 78 06 61 7b 14 59 71 07 03 ff ff 6f';
    expectRoundTrip(wire);
    const adb = decodeBlock<AudioDataBlock>(wire);
    expect(adb.descriptors[0]).toMatchObject({ format: 15, extendedFormat: 12, extendedFormatValue: 1 });
    expect(adb.descriptors[1]).toMatchObject({ format: 15, extendedFormat: 11, extendedFormatValue: 1 });
    expect(adb.descriptors[2]).toMatchObject({ format: 14, profile: 3 });
    // L-PCM 3D Audio: 5-bit channel count using F17/F27.
    expect(adb.descriptors[3]).toMatchObject({ format: 15, extendedFormat: 13, channels: 32 });
  });

  it('editing one field changes only its bits', () => {
    const out = edited<AudioDataBlock>('23 78 06 61', (b) => {
      b.descriptors = b.descriptors.map((d) => ({ ...d, samplingRates: { ...d.samplingRates, sr96kHz: true } }));
    });
    expect(out).toEqual(hex('23 78 16 61'));
  });

  it('keeps LPCM reserved bits, F17/F27 and a malformed tail', () => {
    expectRoundTrip('23 89 87 ff');
    expectRoundTrip('25 09 07 07 15 07');
  });

  it('clamps an out-of-range bit rate instead of wrapping', () => {
    const out = edited<AudioDataBlock>('23 15 07 50', (b) => {
      b.descriptors = b.descriptors.map((d) => ({ ...d, maxBitrate: 4000 }));
    });
    expect(out).toEqual(hex('23 15 07 ff'));
  });
});
