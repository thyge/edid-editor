import { describe, expect, it } from 'vitest';
import {
  DetailedTimingDescriptor,
  decodeEdidCtaDetailedTiming,
  encodeEdidCtaDetailedTiming,
} from '../src/common/detailed-timing-descriptor';

describe('common detailed timing model and EDID/CTA codec', () => {
  it('decodes EDID/CTA 18-byte DTDs into the canonical timing model', () => {
    const descriptor = new DetailedTimingDescriptor({
      pixelClock: 148.5,
      horizontalActive: 1920,
      horizontalBlanking: 280,
      verticalActive: 1080,
      verticalBlanking: 45,
      horizontalSyncOffset: 88,
      horizontalSyncWidth: 44,
      verticalSyncOffset: 4,
      verticalSyncWidth: 5,
      horizontalImageSize: 600,
      verticalImageSize: 340,
      horizontalBorder: 1,
      verticalBorder: 2,
      flags: {
        interlaced: true,
        syncType: 'digital-separate',
        hSyncPolarity: 'positive',
        vSyncPolarity: 'negative',
      },
    });

    const timing = decodeEdidCtaDetailedTiming(descriptor.encode());

    expect(timing).not.toBeInstanceOf(DetailedTimingDescriptor);
    expect(timing?.pixelClock).toBe(148.5);
    expect(timing?.horizontalImageSize).toBe(600);
    expect(timing?.verticalBorder).toBe(2);
    expect(timing?.flags.interlaced).toBe(true);
    expect(timing?.flags.syncType).toBe('digital-separate');
  });

  it('encodes the canonical timing model as an EDID/CTA 18-byte DTD', () => {
    const timing = {
      pixelClock: 74.25,
      horizontalActive: 1280,
      horizontalBlanking: 370,
      verticalActive: 720,
      verticalBlanking: 30,
      horizontalSyncOffset: 110,
      horizontalSyncWidth: 40,
      verticalSyncOffset: 5,
      verticalSyncWidth: 5,
      horizontalImageSize: 520,
      verticalImageSize: 290,
      horizontalBorder: 0,
      verticalBorder: 0,
      flags: {
        interlaced: false,
        stereoMode: 'none' as const,
        syncType: 'digital-separate' as const,
        hSyncPolarity: 'positive' as const,
        vSyncPolarity: 'positive' as const,
      },
    };

    const encoded = encodeEdidCtaDetailedTiming(timing);
    const decoded = DetailedTimingDescriptor.decode(encoded);

    expect(decoded?.horizontalActive).toBe(1280);
    expect(decoded?.horizontalSyncOffset).toBe(110);
    expect(decoded?.horizontalImageSize).toBe(520);
    expect(decoded?.verticalImageSize).toBe(290);
  });
});
