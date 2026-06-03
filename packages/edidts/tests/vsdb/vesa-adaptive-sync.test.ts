// packages/edidts/tests/vsdb/vesa-adaptive-sync.test.ts

import { describe, it, expect } from 'vitest';
import { VESAAdaptiveSyncDecoder, VESAAdaptiveSyncEncoder } from '../../src/cta/vsdb/vesa-adaptive-sync';

describe('VESAAdaptiveSyncDecoder', () => {
  it('decodes min/max refresh and backlight frequency', () => {
    // fixedRateLink=0, min=60Hz, max=120Hz, backlight=50Hz, caps=0x02 (ADAPTIVE_SYNC_CAP bit)
    const payload = new Uint8Array([0x00, 60, 120, 50, 0x02]);
    const result = new VESAAdaptiveSyncDecoder().decode(payload);
    expect(result.fixedRateLink).toBe(false);
    expect(result.minRefreshHz).toBe(60);
    expect(result.maxRefreshHz).toBe(120);
    expect(result.minBacklightHz).toBe(50);
    expect(result.adaptiveSyncCapable).toBe(true);
  });

  it('decodes fixedRateLink flag', () => {
    const payload = new Uint8Array([0x80, 60, 120, 50, 0x00]);
    const result = new VESAAdaptiveSyncDecoder().decode(payload);
    expect(result.fixedRateLink).toBe(true);
  });

  it('returns defaults for truncated payload', () => {
    const result = new VESAAdaptiveSyncDecoder().decode(new Uint8Array([0x00, 60]));
    expect(result.minRefreshHz).toBe(0);
    expect(result.maxRefreshHz).toBe(0);
  });

  it('round-trips a well-formed fields object', () => {
    const fields = {
      fixedRateLink: false,
      minRefreshHz: 60,
      maxRefreshHz: 120,
      minBacklightHz: 50,
      adaptiveSyncCapable: true,
      bcap30: false,
      dsc8bpc: false,
      dsc10bpc: false,
      dsc12bpc: false,
      selFl: false,
      vfrInactive: false,
    };
    const encoded = new VESAAdaptiveSyncEncoder().encode(fields);
    const decoded = new VESAAdaptiveSyncDecoder().decode(encoded);
    expect(decoded).toEqual(fields);
  });
});
