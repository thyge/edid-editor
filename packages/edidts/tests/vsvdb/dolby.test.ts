// packages/edidts/tests/vsvdb/dolby.test.ts

import { describe, it, expect } from 'vitest';
import { DolbyVSDBDecoder, DolbyVSDBEncoder } from '../../src/cta/vsvdb/dolby';
import { OUI } from '../../src/cta/vsdb/types';

describe('DolbyVSDBEncoder', () => {
  it('round-trips a well-formed fields object', () => {
    const fields = {
      version: 1,
      supportsYUV422_12bit: true,
      supports2160p60: true,
      supportsGlobalDimming: false,
    };
    const encoded = new DolbyVSDBEncoder().encode(fields);
    const decoded = new DolbyVSDBDecoder().decode(encoded);
    expect(decoded).toEqual(fields);
  });

  it('encodes the version and capability flags into a single payload byte', () => {
    // version=0, all flags off => 0x00
    const encoded = new DolbyVSDBEncoder().encode({
      version: 0, supportsYUV422_12bit: false, supports2160p60: false, supportsGlobalDimming: false,
    });
    expect(encoded).toEqual(new Uint8Array([0x00]));

    // version=2 (010), YUV422=1, 2160p60=0, dimming=1 => 0b01000101 = 0x45
    const encoded2 = new DolbyVSDBEncoder().encode({
      version: 2, supportsYUV422_12bit: true, supports2160p60: false, supportsGlobalDimming: true,
    });
    expect(encoded2).toEqual(new Uint8Array([0x45]));
  });

  it('rejects out-of-range versions', () => {
    expect(() => new DolbyVSDBEncoder().encode({
      version: 8, supportsYUV422_12bit: false, supports2160p60: false, supportsGlobalDimming: false,
    })).toThrow(RangeError);
  });
});

describe('DolbyVSDBDecoder', () => {
  it('decodes the union of the version, supportsYUV422_12bit, supports2160p60, supportsGlobalDimming fields', () => {
    // version=2 (010), supportsYUV422_12bit=1, supports2160p60=0, supportsGlobalDimming=1
    // byte0 = (0b010 << 5) | 0b101 = 0x4D
    const payload = new Uint8Array([0x4D]);
    const result = new DolbyVSDBDecoder().decode(payload);
    expect(result.version).toBe(2);
    expect(result.supportsYUV422_12bit).toBe(true);
    expect(result.supports2160p60).toBe(false);
    expect(result.supportsGlobalDimming).toBe(true);
  });

  it('returns defaults for empty payload', () => {
    const result = new DolbyVSDBDecoder().decode(new Uint8Array(0));
    expect(result.version).toBe(0);
    expect(result.supportsYUV422_12bit).toBe(false);
    expect(result.supports2160p60).toBe(false);
    expect(result.supportsGlobalDimming).toBe(false);
  });
});

describe('VSVDB registry', () => {
  it('registers the Dolby decoder under OUI.DOLBY', async () => {
    const { VENDOR_VSVDB_DECODERS } = await import('../../src/cta/vsvdb/registry');
    expect(VENDOR_VSVDB_DECODERS[OUI.DOLBY]).toBeDefined();
  });
});
