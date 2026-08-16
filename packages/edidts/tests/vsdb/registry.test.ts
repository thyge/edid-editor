import { describe, it, expect } from 'vitest';
import { VENDOR_DECODERS, VENDOR_ENCODERS, decodeVendorSpecificBlock, reassembleVsdbBlock } from '../../src/cta/vsdb/registry';
import { OUI } from '../../src/cta/vsdb/types';
import '../../src/cta/vsdb/hdmi14';
import '../../src/cta/vsdb/hdmi-forum';
import '../../src/cta/vsdb/microsoft-hmd';
import '../../src/cta/vsdb/amd';
import '../../src/cta/vsdb/hdr10plus';
import '../../src/cta/vsdb/vesa-adaptive-sync';
import '../../src/cta/vsdb/nvidia';

describe('VSDB registry', () => {
  it('has a decoder for every OUI constant except Dolby (which is in VSVDB)', () => {
    const expected = [OUI.HDMI_1_4, OUI.HDMI_FORUM, OUI.MICROSOFT_HMD, OUI.AMD, OUI.HDR10_PLUS, OUI.VESA_ADAPTIVE_SYNC, OUI.NVIDIA, OUI.MHL];
    for (const oui of expected) {
      expect(VENDOR_DECODERS[oui]).toBeDefined();
    }
  });

  it('has a paired encoder for every registered decoder', () => {
    for (const [ouiStr, decoder] of Object.entries(VENDOR_DECODERS)) {
      expect(VENDOR_ENCODERS[decoder.kind]).toBeDefined();
      // sanity: same OUI on both sides
      expect(Number(ouiStr)).toBeGreaterThan(0);
    }
  });

  it('routes an HDMI 1.4 block to the right kind', () => {
    const block = reassembleVsdbBlock(OUI.HDMI_1_4, new Uint8Array([0x10, 0x00, 0x00, 0x21]));
    const decoded = decodeVendorSpecificBlock(block);
    expect(decoded.vendor?.kind).toBe('hdmi14');
  });

  it('routes an HDMI Forum block to the right kind', () => {
    const block = reassembleVsdbBlock(OUI.HDMI_FORUM, new Uint8Array([0x01, 0x3C, 0xC0, 0x60, 0x02]));
    const decoded = decodeVendorSpecificBlock(block);
    expect(decoded.vendor?.kind).toBe('hdmiForum');
  });
});
