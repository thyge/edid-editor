import { describe, expect, it } from 'vitest';
import {
  DetailedTimingDescriptor,
  decodeVideoTimingBlock,
  encodeVideoTimingBlock,
} from '../src/common';

describe('common Video Timing Block codec', () => {
  it('decodes VTB detailed, CVT, and standard timings outside CTA', () => {
    const detailedTiming = new DetailedTimingDescriptor({
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
    });
    const bytes = new Uint8Array(128);
    bytes[0] = 0x10;
    bytes[1] = 0x01;
    bytes[2] = 1;
    bytes[3] = 1;
    bytes[4] = 1;
    bytes.set(detailedTiming.encode(), 5);
    bytes[23] = 0x67;
    bytes[24] = 0x14;
    bytes[25] = 0x2d;
    bytes[26] = 0xd1;
    bytes[27] = 0xc0;

    const block = decodeVideoTimingBlock(bytes, {
      revision: 1,
      checksum: 0,
      data: bytes.slice(2, 127),
    });

    expect(block.tag).toBe(0x10);
    expect(block.detailedTimings[0].horizontalSyncOffset).toBe(110);
    expect(block.detailedTimings[0].horizontalImageSize).toBe(520);
    expect(block.cvtTimings[0]).toEqual({
      lines: 720,
      aspectRatio: '16:9',
      preferredRefreshRate: 60,
      refreshRates: {
        r50Hz: false,
        r60Hz: true,
        r75Hz: true,
        r85Hz: false,
        r60HzRB: true,
      },
    });
    expect(block.standardTimings[0]).toEqual({
      width: 1920,
      height: 1080,
      refreshRate: 60,
    });
  });

  it('encodes VTB payload bytes from the common model', () => {
    const detailedTiming = new DetailedTimingDescriptor({
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
    });

    const bytes = encodeVideoTimingBlock({
      tag: 0x10,
      revision: 1,
      checksum: 0,
      data: new Uint8Array(),
      detailedTimings: [detailedTiming],
      cvtTimings: [{
        lines: 720,
        aspectRatio: '16:9',
        preferredRefreshRate: 60,
        refreshRates: {
          r50Hz: false,
          r60Hz: true,
          r75Hz: true,
          r85Hz: false,
          r60HzRB: true,
        },
      }],
      standardTimings: [{ width: 1920, height: 1080, refreshRate: 60 }],
    });

    expect(bytes[2]).toBe(1);
    expect(bytes[3]).toBe(1);
    expect(bytes[4]).toBe(1);
    expect(bytes.slice(5, 23)).toEqual(detailedTiming.encode());
    expect(bytes.slice(23, 26)).toEqual(new Uint8Array([0x67, 0x14, 0x2d]));
    expect(bytes.slice(26, 28)).toEqual(new Uint8Array([0xd1, 0xc0]));
    expect(bytes.reduce((sum, byte) => sum + byte, 0) & 0xff).toBe(0);
  });

  it('keeps VTB descriptor counts aligned with bytes that fit', () => {
    const cvtTimings = Array.from({ length: 45 }, (_, index) => ({
      lines: 480 + index * 2,
      aspectRatio: '16:9' as const,
      preferredRefreshRate: 60,
    }));
    const standardTimings = Array.from({ length: 10 }, () => ({
      width: 1920,
      height: 1080,
      refreshRate: 60,
    }));

    const bytes = encodeVideoTimingBlock({
      tag: 0x10,
      revision: 1,
      checksum: 0,
      data: new Uint8Array(),
      detailedTimings: [],
      cvtTimings,
      standardTimings,
    });

    expect(bytes[2]).toBe(0);
    expect(bytes[3]).toBe(40);
    expect(bytes[4]).toBe(1);

    const decoded = decodeVideoTimingBlock(bytes, {
      revision: 1,
      checksum: bytes[127],
      data: bytes.slice(2, 127),
    });
    expect(decoded.cvtTimings).toHaveLength(40);
    expect(decoded.standardTimings).toHaveLength(1);
  });
});
