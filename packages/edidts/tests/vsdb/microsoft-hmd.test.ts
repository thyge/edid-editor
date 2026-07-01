// packages/edidts/tests/vsdb/microsoft-hmd.test.ts

import { describe, it, expect } from 'vitest';
import { MicrosoftHMDDecoder, MicrosoftHMDEncoder, MICROSOFT_HMD_USE_CASES } from '../../src/cta/vsdb/microsoft-hmd';
import { OUI } from '../../src/cta/vsdb/types';
import { reassembleVsdbBlock } from '../../src/cta/vsdb/registry';

describe('MicrosoftHMDDecoder', () => {
  it('decodes a version-3 WMR HMD with VR use case', () => {
    // version=3, flags=0x10 (desktop=0, non-MS=1), useCase=0x07 (VR headset)
    // 16-byte container ID (all zeros for the test)
    const payload = new Uint8Array(18);
    payload[0] = 0x03;  // version
    payload[1] = 0x10 | 0x07;  // non-MS usage + VR headset use case
    const result = new MicrosoftHMDDecoder().decode(payload);
    expect(result.version).toBe(3);
    expect(result.nonMicrosoftUsage).toBe(true);
    expect(result.desktopUsage).toBe(false);
    expect(result.primaryUseCase).toBe(0x07);
    expect(result.containerId.length).toBe(16);
  });

  it('returns defaults for empty payload', () => {
    const result = new MicrosoftHMDDecoder().decode(new Uint8Array(0));
    expect(result.version).toBe(0);
    expect(result.containerId.length).toBe(16);
  });

  it('rejects unknown use cases in encoder', () => {
    expect(() => new MicrosoftHMDEncoder().encode({
      version: 3,
      desktopUsage: false,
      nonMicrosoftUsage: false,
      primaryUseCase: 0x99,  // invalid
      containerId: new Uint8Array(16),
    })).toThrow(RangeError);
  });

  it('round-trips a known-good fields object', () => {
    const fields = {
      version: 1,
      desktopUsage: false,
      nonMicrosoftUsage: false,
      primaryUseCase: 0x07,
      containerId: new Uint8Array(16).fill(0xAB),
    };
    const encoded = new MicrosoftHMDEncoder().encode(fields);
    const decoded = new MicrosoftHMDDecoder().decode(encoded);
    expect(decoded.version).toBe(1);
    expect(decoded.primaryUseCase).toBe(0x07);
    expect(Array.from(decoded.containerId)).toEqual(Array.from(fields.containerId));
  });
});

describe('MICROSOFT_HMD_USE_CASES', () => {
  it('includes VR, AR, and video wall', () => {
    expect(MICROSOFT_HMD_USE_CASES[0x07]).toBe('VR Headset');
    expect(MICROSOFT_HMD_USE_CASES[0x08]).toBe('AR Headset');
    expect(MICROSOFT_HMD_USE_CASES[0x10]).toBe('Video Wall');
  });
});
