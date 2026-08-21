// packages/edidts/tests/vsvdb/registry.test.ts

import { describe, it, expect } from 'vitest';
import { VENDOR_VSVDB_DECODERS, VENDOR_VSVDB_ENCODERS, decodeVSVDB, findVSVDBs } from '../../src/cta/vsvdb/registry';
import { DolbyVSDBDecoder, DolbyVSDBEncoder } from '../../src/cta/vsvdb/dolby';
import { OUI } from '../../src/cta/vsdb/types';
import type { ExtendedDataBlock } from '../../src/cta/cta-extended-blocks';
import type { CEAExtensionBlock } from '../../src/cta/extension-block';

const base: ExtendedDataBlock = {
  tag: 0x07,
  extendedTag: 0x01,
  data: new Uint8Array(0),
};

describe('VSVDB registry', () => {
  it('has a decoder for the Dolby OUI', () => {
    expect(VENDOR_VSVDB_DECODERS[OUI.DOLBY]).toBeDefined();
  });

  it('has a paired encoder for every registered decoder', () => {
    for (const decoder of Object.values(VENDOR_VSVDB_DECODERS)) {
      expect(VENDOR_VSVDB_ENCODERS[decoder.kind]).toBeDefined();
    }
  });

  it('routes a Dolby block through the registered decoder', () => {
    // Use the decoder directly through the registry
    const decoder = VENDOR_VSVDB_DECODERS[OUI.DOLBY];
    expect(decoder).toBeDefined();
    const decoded = decoder!.decode(new Uint8Array([0x4D]));
    expect(decoded.version).toBe(2);
    expect(decoded.supportsYUV422_12bit).toBe(true);
    expect(decoded.supportsGlobalDimming).toBe(true);
  });

  it('decodeVSVDB extracts the OUI and post-OUI payload', () => {
    // 3 OUI bytes LE + 1 Dolby payload byte (version=1, YUV422=1, p60=0, dim=1 => 0x25)
    const payload = new Uint8Array([0x46, 0xD0, 0x00, 0x25]);
    const decoded = decodeVSVDB(base, payload);
    expect(decoded.ieeeOui).toBe(OUI.DOLBY);
    expect(decoded.payload).toEqual(new Uint8Array([0x25]));
  });

  it('decodeVSVDB leaves unknown OUIs with raw post-OUI payload', () => {
    // OUI 0x11 0x22 0x33 (LE) + arbitrary payload
    const payload = new Uint8Array([0x11, 0x22, 0x33, 0xAA, 0xBB]);
    const decoded = decodeVSVDB(base, payload);
    expect(decoded.ieeeOui).toBe(0x332211);
    expect(decoded.payload).toEqual(new Uint8Array([0xAA, 0xBB]));
    // Unknown OUIs get an opaque `vendor` so the carrier still round-trips via
    // the raw-payload encode fallback (AC #4).
    expect(decoded.vendor?.kind).toBe('unknown');
    expect(decoded.vendor?.kind === 'unknown' && Array.from(decoded.vendor.raw)).toEqual([0xAA, 0xBB]);
  });

  it('decodeVSVDB returns a stub when payload is shorter than 3 bytes', () => {
    const decoded = decodeVSVDB(base, new Uint8Array([0x01, 0x02]));
    expect(decoded.ieeeOui).toBe(0);
    expect(decoded.payload.length).toBe(0);
  });
});

describe('findVSVDBs', () => {
  it('returns an empty array when there are no VSVDBs', () => {
    const cea: CEAExtensionBlock = {
      tag: 0x02,
      revision: 0x03,
      dtdOffset: 0,
      underscan: false,
      basicAudio: false,
      ycbcr444: false,
      ycbcr422: false,
      nativeFormats: 0,
      dataBlocks: [],
      detailedTimings: [],
    };
    expect(findVSVDBs(cea)).toEqual([]);
  });

  it('returns only blocks with tag 0x07 and extendedTag 0x01', () => {
    const dolbyBlock = decodeVSVDB(
      { tag: 0x07, extendedTag: 0x01, data: new Uint8Array(0) },
      new Uint8Array([0x46, 0xD0, 0x00, 0x25]),
    );
    const cea: CEAExtensionBlock = {
      tag: 0x02,
      revision: 0x03,
      dtdOffset: 0,
      underscan: false,
      basicAudio: false,
      ycbcr444: false,
      ycbcr422: false,
      nativeFormats: 0,
      dataBlocks: [
        // A regular VSDB (tag 0x03) — should NOT match
        {
          tag: 0x03,
          ieeeOui: OUI.HDMI_1_4,
          payload: new Uint8Array(0),
          data: new Uint8Array(0),
        },
        // An extended tag block with a different extended tag (0x05 colorimetry)
        {
          tag: 0x07,
          extendedTag: 0x05,
          data: new Uint8Array(0),
        },
        // The Dolby VSVDB we want
        dolbyBlock,
      ],
      detailedTimings: [],
    };
    const result = findVSVDBs(cea);
    expect(result).toHaveLength(1);
    expect(result[0].extendedTag).toBe(0x01);
    expect(result[0].ieeeOui).toBe(OUI.DOLBY);
  });
});

describe('DolbyVSDBEncoder paired with the registry', () => {
  it('round-trips Dolby fields through encode/decode', () => {
    const fields = {
      version: 1,
      supportsYUV422_12bit: true,
      supports2160p60: true,
      supportsGlobalDimming: false,
      byte0Reserved: 0,
      payload: new Uint8Array(),
    };
    const decoder = VENDOR_VSVDB_DECODERS[OUI.DOLBY]!;
    const encoder = VENDOR_VSVDB_ENCODERS['dolbyVsdb']!;
    const encoded = encoder.encode(fields);
    const decoded = decoder.decode(encoded);
    expect(decoded).toEqual(fields);
    // Verify the type cast works (encoder is the right concrete type)
    expect(encoder).toBeInstanceOf(DolbyVSDBEncoder);
    expect(decoder).toBeInstanceOf(DolbyVSDBDecoder);
  });
});
