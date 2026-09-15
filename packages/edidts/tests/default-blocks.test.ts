/**
 * Tests for the CEA data-block default-value factory (`default-blocks.ts`):
 * the VSDB addable-block factories and the payload-area capacity
 * accounting used by the editor's "+ Add" guards.
 */
import { describe, it, expect } from 'vitest';
import { createDefaultCEADataBlock } from '../src/cta/default-blocks';
import {
  ExtensionBlockParser,
  type CEAExtensionBlock,
  type VendorSpecificDataBlock,
  type VendorSpecificVideoDataBlock,
  type VendorSpecificAudioDataBlock,
} from '../src/cta';
import { OUI, type VendorSpecificDecoded } from '../src/cta/vsdb/types';
import { HDMI14_DEFAULT } from '../src/cta/vsdb/hdmi14';
import { DOLBY_VSDB_DEFAULT } from '../src/cta/vcdb/vsvdb/dolby';
import { DOLBY_VSADB_DEFAULT } from '../src/cta/vcdb/vsadb/dolby';
import { buildCeaExtension, videoBlock, makeDtd } from './cea-utils';

type VsdbType = 'vsdb-hdmi14' | 'vsdb-hdmi-forum' | 'vsdb-microsoft-hmd' | 'vsdb-amd' | 'vsdb-mhl';

const VSDB_OUIS: Record<VsdbType, number> = {
  'vsdb-hdmi14': OUI.HDMI_1_4,
  'vsdb-hdmi-forum': OUI.HDMI_FORUM,
  'vsdb-microsoft-hmd': OUI.MICROSOFT_HMD,
  'vsdb-amd': OUI.AMD,
  'vsdb-mhl': OUI.MHL,
};

const VSDB_KINDS: Record<VsdbType, Exclude<VendorSpecificDecoded['kind'], 'unknown'>> = {
  'vsdb-hdmi14': 'hdmi14',
  'vsdb-hdmi-forum': 'hdmiForum',
  'vsdb-microsoft-hmd': 'microsoftHmd',
  'vsdb-amd': 'amdFreeSync',
  'vsdb-mhl': 'mhl',
};

describe('createDefaultCEADataBlock VSDB factories', () => {
  it.each(Object.keys(VSDB_OUIS) as VsdbType[])('%s produces a well-formed tag-0x03 block', (type) => {
    const block = createDefaultCEADataBlock(type) as VendorSpecificDataBlock | undefined;
    expect(block).toBeDefined();
    expect(block!.tag).toBe(0x03);
    expect(block!.ieeeOui).toBe(VSDB_OUIS[type]);
    expect(block!.vendor?.kind).toBe(VSDB_KINDS[type]);
    // Carrier payload = OUI (3 bytes, LE wire order) + encoded vendor body.
    expect(block!.payload.length).toBe(3 + block!.vendorPayload.length);
    expect(block!.payload.length).toBeLessThanOrEqual(31); // 5-bit length field
  });

  it('encodes to a valid tag-0x03 data block with a correct length byte', () => {
    const block = createDefaultCEADataBlock('vsdb-hdmi14') as VendorSpecificDataBlock;
    // HDMI 1.4 default fields encode to a 4-byte vendor body (phys addr +
    // flags + TMDS byte), so the on-wire body is 7 bytes.
    expect(block.payload.length).toBe(7);

    const cea = buildCeaExtension({ dataBlocks: [block] });
    const bytes = ExtensionBlockParser.encode(cea);
    // Header at byte 4: tag 0x03 in the high bits, body length in the low 5.
    expect(bytes[4]).toBe((0x03 << 5) | 7);
    // LE OUI 0x000C03 on the wire is 03 0C 00.
    expect(Array.from(bytes.slice(5, 8))).toEqual([0x03, 0x0c, 0x00]);
  });

  it('round-trips all five vendor kinds through encode → decode', () => {
    const types = Object.keys(VSDB_OUIS) as VsdbType[];
    const blocks = types.map(
      (t) => createDefaultCEADataBlock(t) as VendorSpecificDataBlock,
    );
    // Total encoded size must fit the 123-byte payload area.
    const cea = buildCeaExtension({ dataBlocks: blocks });
    expect(
      blocks.reduce((sum, b) => sum + ExtensionBlockParser.getCeaEncodedBlockBytes(b), 0),
    ).toBeLessThanOrEqual(ExtensionBlockParser.CEA_PAYLOAD_CAPACITY);

    const decoded = ExtensionBlockParser.decode(
      ExtensionBlockParser.encode(cea),
    ) as CEAExtensionBlock;
    expect(decoded.dataBlocks.length).toBe(5);
    types.forEach((t, i) => {
      const out = decoded.dataBlocks[i] as VendorSpecificDataBlock;
      expect(out.tag).toBe(0x03);
      expect(out.ieeeOui).toBe(VSDB_OUIS[t]);
      expect(out.vendor?.kind).toBe(VSDB_KINDS[t]);
    });

    const hdmi = decoded.dataBlocks[0] as VendorSpecificDataBlock;
    expect(hdmi.vendor?.kind).toBe('hdmi14');
    if (hdmi.vendor?.kind === 'hdmi14') {
      expect(hdmi.vendor.fields.sourcePhysicalAddress).toEqual([0, 0, 0, 0]);
      expect(hdmi.vendor.fields.maxTmdsClockMHz).toBe(0);
    }
  });

  it('allows multiple VSDBs of the same kind to coexist and round-trip', () => {
    const a = createDefaultCEADataBlock('vsdb-hdmi14') as VendorSpecificDataBlock;
    const b = createDefaultCEADataBlock('vsdb-hdmi14') as VendorSpecificDataBlock;
    const decoded = ExtensionBlockParser.decode(
      ExtensionBlockParser.encode(buildCeaExtension({ dataBlocks: [a, b] })),
    ) as CEAExtensionBlock;
    expect(decoded.dataBlocks.length).toBe(2);
    expect((decoded.dataBlocks[0] as VendorSpecificDataBlock).vendor?.kind).toBe('hdmi14');
    expect((decoded.dataBlocks[1] as VendorSpecificDataBlock).vendor?.kind).toBe('hdmi14');
  });

  it('hands out fresh field objects, never the shared *_DEFAULT literals', () => {
    const block = createDefaultCEADataBlock('vsdb-hdmi14') as VendorSpecificDataBlock;
    if (block.vendor?.kind !== 'hdmi14') throw new Error('expected hdmi14 kind');
    expect(block.vendor.fields).not.toBe(HDMI14_DEFAULT);
    // Mutating one instance's fields must not leak into future defaults.
    block.vendor.fields.maxTmdsClockMHz = 600;
    block.vendor.fields.sourcePhysicalAddress = [1, 2, 3, 4];
    const next = createDefaultCEADataBlock('vsdb-hdmi14') as VendorSpecificDataBlock;
    if (next.vendor?.kind !== 'hdmi14') throw new Error('expected hdmi14 kind');
    expect(next.vendor.fields.maxTmdsClockMHz).toBe(0);
    expect(next.vendor.fields.sourcePhysicalAddress).toEqual([0, 0, 0, 0]);
    expect(HDMI14_DEFAULT.maxTmdsClockMHz).toBe(0);
  });

  it('returns undefined for an unknown discriminator', () => {
    expect(createDefaultCEADataBlock('nonsense' as never)).toBeUndefined();
  });
});

describe('createDefaultCEADataBlock VSVDB/VSADB defaults', () => {
  it('vsvdb-dolby produces a Dolby Vision carrier (ext 0x01, OUI 00-D0-46)', () => {
    const block = createDefaultCEADataBlock('vsvdb-dolby') as
      VendorSpecificVideoDataBlock | undefined;
    expect(block).toBeDefined();
    expect(block!.tag).toBe(0x07);
    expect(block!.extendedTag).toBe(0x01);
    expect(block!.ieeeOui).toBe(OUI.DOLBY);
    expect(block!.vendor?.kind).toBe('dolbyVsdb');
    // Wire payload: extended-tag byte + LE OUI 46 d0 00 + the 1-byte v0 body
    // (version 0, all capability bits clear).
    expect(Array.from(block!.payload)).toEqual([0x01, 0x46, 0xd0, 0x00, 0x00]);
    expect(block!.vendorPayload.length).toBe(1);
  });

  it('vendor-audio produces a Dolby Atmos VSADB (ext 0x11, OUI 00-D0-46)', () => {
    const block = createDefaultCEADataBlock('vendor-audio') as
      VendorSpecificAudioDataBlock | undefined;
    expect(block).toBeDefined();
    expect(block!.tag).toBe(0x07);
    expect(block!.extendedTag).toBe(0x11);
    expect(block!.ieeeOui).toBe(OUI.DOLBY);
    expect(block!.vendor?.kind).toBe('dolbyVsadb');
    if (block!.vendor?.kind !== 'dolbyVsadb') throw new Error('expected dolbyVsadb kind');
    // Defaults: version 1 (encoded as version − 1 = 0), every speaker zone
    // off, full MAT/TrueHD — a 2-byte body.
    expect(block!.vendor.fields.version).toBe(1);
    expect(block!.vendor.fields.heightZone).toBe(false);
    expect(Array.from(block!.payload)).toEqual([0x11, 0x46, 0xd0, 0x00, 0x00, 0x00]);
  });

  it('round-trips both carriers through encode → decode', () => {
    const vsvdb = createDefaultCEADataBlock('vsvdb-dolby') as VendorSpecificVideoDataBlock;
    const vsadb = createDefaultCEADataBlock('vendor-audio') as VendorSpecificAudioDataBlock;
    const cea = buildCeaExtension({ dataBlocks: [vsvdb, vsadb] });
    const decoded = ExtensionBlockParser.decode(
      ExtensionBlockParser.encode(cea),
    ) as CEAExtensionBlock;
    expect(decoded.dataBlocks.length).toBe(2);

    const outVsvdb = decoded.dataBlocks[0] as VendorSpecificVideoDataBlock;
    expect(outVsvdb.tag).toBe(0x07);
    expect(outVsvdb.extendedTag).toBe(0x01);
    expect(outVsvdb.ieeeOui).toBe(OUI.DOLBY);
    expect(outVsvdb.vendor?.kind).toBe('dolbyVsdb');
    if (outVsvdb.vendor?.kind !== 'dolbyVsdb') throw new Error('expected dolbyVsdb kind');
    expect(outVsvdb.vendor.fields.version).toBe(0);

    const outVsadb = decoded.dataBlocks[1] as VendorSpecificAudioDataBlock;
    expect(outVsadb.tag).toBe(0x07);
    expect(outVsadb.extendedTag).toBe(0x11);
    expect(outVsadb.ieeeOui).toBe(OUI.DOLBY);
    expect(outVsadb.vendor?.kind).toBe('dolbyVsadb');
    if (outVsadb.vendor?.kind !== 'dolbyVsadb') throw new Error('expected dolbyVsadb kind');
    expect(outVsadb.vendor.fields.version).toBe(1);
  });

  it('charges the new defaults their encoded size', () => {
    // VSVDB: 1 header + 1 ext tag + 3 OUI + 1 body = 6.
    const vsvdb = createDefaultCEADataBlock('vsvdb-dolby')!;
    expect(ExtensionBlockParser.getCeaEncodedBlockBytes(vsvdb)).toBe(6);
    // VSADB: 1 header + 1 ext tag + 3 OUI + 2 body = 7.
    const vsadb = createDefaultCEADataBlock('vendor-audio')!;
    expect(ExtensionBlockParser.getCeaEncodedBlockBytes(vsadb)).toBe(7);
  });

  it('hands out fresh field objects, never the shared DOLBY_*_DEFAULT literals', () => {
    const vsvdb = createDefaultCEADataBlock('vsvdb-dolby') as VendorSpecificVideoDataBlock;
    if (vsvdb.vendor?.kind !== 'dolbyVsdb') throw new Error('expected dolbyVsdb kind');
    expect(vsvdb.vendor.fields).not.toBe(DOLBY_VSDB_DEFAULT);

    const vsadb = createDefaultCEADataBlock('vendor-audio') as VendorSpecificAudioDataBlock;
    if (vsadb.vendor?.kind !== 'dolbyVsadb') throw new Error('expected dolbyVsadb kind');
    expect(vsadb.vendor.fields).not.toBe(DOLBY_VSADB_DEFAULT);

    // Mutating one instance's fields (or its trailing bytes) must not leak
    // into future defaults or the shared literals.
    vsvdb.vendor.fields.version = 7;
    vsadb.vendor.fields.version = 8;
    vsadb.vendor.fields.trailing = new Uint8Array([0xde, 0xad]);

    const nextVsvdb = createDefaultCEADataBlock('vsvdb-dolby') as VendorSpecificVideoDataBlock;
    const nextVsadb = createDefaultCEADataBlock('vendor-audio') as VendorSpecificAudioDataBlock;
    if (nextVsvdb.vendor?.kind !== 'dolbyVsdb') throw new Error('expected dolbyVsdb kind');
    if (nextVsadb.vendor?.kind !== 'dolbyVsadb') throw new Error('expected dolbyVsadb kind');
    expect(nextVsvdb.vendor.fields.version).toBe(0);
    expect(nextVsadb.vendor.fields.version).toBe(1);
    expect(Array.from(nextVsadb.vendor.fields.trailing)).toEqual([]);
    expect(DOLBY_VSDB_DEFAULT.version).toBe(0);
    expect(DOLBY_VSADB_DEFAULT.version).toBe(1);
    expect(Array.from(DOLBY_VSADB_DEFAULT.trailing)).toEqual([]);
  });
});

describe('CEA payload-area capacity accounting', () => {
  it('reports the full 123-byte budget for an empty extension', () => {
    expect(ExtensionBlockParser.CEA_PAYLOAD_CAPACITY).toBe(123);
    expect(ExtensionBlockParser.getCeaFreePayloadBytes(buildCeaExtension())).toBe(123);
  });

  it('charges each data block its header + body bytes', () => {
    // videoBlock(4) encodes to 1 header + 4 VIC bytes.
    expect(ExtensionBlockParser.getCeaEncodedBlockBytes(videoBlock(4))).toBe(5);
    expect(
      ExtensionBlockParser.getCeaFreePayloadBytes(buildCeaExtension({ dataBlocks: [videoBlock(4)] })),
    ).toBe(118);
    // 31-VIC video block = 32 bytes.
    expect(ExtensionBlockParser.getCeaEncodedBlockBytes(videoBlock(31))).toBe(32);
  });

  it('charges DTDs 18 bytes each', () => {
    const sixDtds = Array.from({ length: 6 }, () => makeDtd(1920, 1080, 148500));
    expect(
      ExtensionBlockParser.getCeaFreePayloadBytes(buildCeaExtension({ detailedTimings: sixDtds })),
    ).toBe(123 - 6 * 18);
  });

  it('accounts data blocks and DTDs against the shared budget', () => {
    // 32-byte video block + 5 DTDs (90 bytes) → 1 byte free.
    const cea = buildCeaExtension({
      dataBlocks: [videoBlock(31)],
      detailedTimings: Array.from({ length: 5 }, () => makeDtd(1920, 1080, 148500)),
    });
    expect(ExtensionBlockParser.getCeaFreePayloadBytes(cea)).toBe(1);
  });

  it('flags over-full states so the editor can block further adds', () => {
    // 7 DTDs = 126 bytes > 123 — the exact state whose excess DTD the encoder
    // silently dropped before; free goes negative and every add is gated.
    const sevenDtds = Array.from({ length: 7 }, () => makeDtd(1920, 1080, 148500));
    const free = ExtensionBlockParser.getCeaFreePayloadBytes(
      buildCeaExtension({ detailedTimings: sevenDtds }),
    );
    expect(free).toBeLessThan(ExtensionBlockParser.CEA_DTD_SIZE);
  });

  it('matches the encoder boundary: 6 DTDs with no data blocks encode in full', () => {
    const sixDtds = Array.from({ length: 6 }, () => makeDtd(1920, 1080, 148500));
    const bytes = ExtensionBlockParser.encode(buildCeaExtension({ detailedTimings: sixDtds }));
    // dtdOffset points at byte 4; the last DTD ends at byte 4 + 108 - 1 = 111.
    expect(bytes[2]).toBe(4);
    expect(bytes[111]).not.toBe(0);
    expect(bytes[112]).toBe(0);
  });

  it('charges a default VSDB its encoded size', () => {
    // HDMI 1.4 default: 1 header + 3 OUI + 4 body = 8 bytes.
    const hdmi = createDefaultCEADataBlock('vsdb-hdmi14')!;
    expect(ExtensionBlockParser.getCeaEncodedBlockBytes(hdmi)).toBe(8);
    // Microsoft HMD default: 1 + 3 + (1 version + 1 use case + 16 UUID) = 22.
    const hmd = createDefaultCEADataBlock('vsdb-microsoft-hmd')!;
    expect(ExtensionBlockParser.getCeaEncodedBlockBytes(hmd)).toBe(22);
  });
});