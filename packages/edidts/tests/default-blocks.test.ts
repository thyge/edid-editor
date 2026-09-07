/**
 * Tests for the CEA data-block default-value factory (`default-blocks.ts`):
 * the VSDB addable-block factories (TASK-109) and the payload-area capacity
 * accounting used by the editor's "+ Add" guards (TASK-110).
 */
import { describe, it, expect } from 'vitest';
import { createDefaultCEADataBlock } from '../src/cta/default-blocks';
import { ExtensionBlockParser, type CEAExtensionBlock, type VendorSpecificDataBlock } from '../src/cta';
import { OUI, type VendorSpecificDecoded } from '../src/cta/vsdb/types';
import { HDMI14_DEFAULT } from '../src/cta/vsdb/hdmi14';
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

describe('createDefaultCEADataBlock VSDB factories (TASK-109)', () => {
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

describe('CEA payload-area capacity accounting (TASK-110)', () => {
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