import { describe, it, expect } from 'vitest';
import {
  EEDID,
  collectTimingsByPriority,
  TIMING_PRIORITY_RANK,
  type TimingEntry,
} from '../src/eedid';
import { EDID, EstablishedTiming, StandardTiming, DetailedTimingDescriptor } from '../src/edid';
import { normalizeDetailedTiming } from '../src/common';
import type { CEAExtensionBlock, CEADetailedTiming, VideoDataBlock } from '../src/cta';

/**
 * Build a minimal CEA extension block carrying the given DTDs and video
 * data block. Mirrors the `ceaWith` helper in cea-extension-block.test.ts.
 */
function ceaWith(
  detailedTimings: CEADetailedTiming[],
  vdb?: VideoDataBlock,
): CEAExtensionBlock {
  return {
    tag: 0x02,
    revision: 3,
    checksum: 0,
    data: new Uint8Array(0),
    dtdOffset: 0,
    underscan: false,
    basicAudio: false,
    ycbcr444: false,
    ycbcr422: false,
    nativeFormats: 0,
    dataBlocks: vdb ? [vdb] : [],
    detailedTimings,
  };
}

/** A Video Data Block with the given VICs (data is unused by the priority helper). */
function vdb(vics: Array<{ vic: number; native: boolean }>): VideoDataBlock {
  return { tag: 0x02, vics } as VideoDataBlock;
}

/** A base DTD with enough fields to compute a refresh rate. */
function dtd(horizontalActive: number, verticalActive: number, pixelClock: number): DetailedTimingDescriptor {
  return new DetailedTimingDescriptor({
    pixelClock,
    horizontalActive,
    horizontalBlanking: 280,
    verticalActive,
    verticalBlanking: 45,
  });
}

describe('collectTimingsByPriority (VESA E-EDID A2 §5)', () => {
  it('returns an empty array for an EEDID with no timings', () => {
    const empty = new EEDID({
      base: new EDID({ detailedTimings: [], standardTimings: [], establishedTimings: [], displayDescriptors: [] }),
      extensions: [],
    });
    expect(collectTimingsByPriority(empty)).toEqual([]);
  });

  it('orders every timing source by §5 Table 5.1 priority', () => {
    // One entry from each modeled source, with distinct resolutions so the
    // global order is unambiguous.
    const base = new EDID({
      detailedTimings: [
        dtd(1920, 1080, 148.5), // rank 1 — Preferred Timing Mode (PTM)
        dtd(1680, 1050, 119.0), // rank 2 — other base DTD
      ],
      standardTimings: [
        new StandardTiming({ width: 1600, height: 900, refreshRate: 60 }), // rank 5
      ],
      establishedTimings: [
        new EstablishedTiming({ id: 2, name: '640×480@60Hz', width: 640, height: 480, refreshRate: 60 }), // rank 6
      ],
      displayDescriptors: [
        // rank 4 — 3-byte CVT code (tag 0xF8): 1080 lines, 16:9 → 1920 wide.
        {
          tag: 0xF8,
          timings: [
            {
              addressableLines: 1080,
              aspectRatio: '16:9',
              preferredRefreshRate: 60,
              refreshRates: { r50Hz: false, r60Hz: true, r75Hz: false, r85Hz: false, r60HzRB: false },
            },
          ],
        },
        // rank 6 — Established Timings III (tag 0xF7), bit index only.
        { tag: 0xF7, timings: [5] },
      ],
    });

    const cea = ceaWith(
      [
        // rank 3 — extension DTD (native).
        { ...normalizeDetailedTiming({ pixelClock: 74.25, horizontalActive: 1280, horizontalBlanking: 370, verticalActive: 720, verticalBlanking: 30 }), isNative: true },
      ],
      // rank 7 — CTA Video Data Block VIC 16 (1920×1080p@60).
      vdb([{ vic: 16, native: true }]),
    );

    const eedid = new EEDID({ base, extensions: [cea] });
    const entries = collectTimingsByPriority(eedid);

    // Expected full order: preferred → detailedBase → detailedExtension →
    // cvt → standard → established(ET I/II) → established(ET III) → ctaVic.
    const sources = entries.map((e) => e.source);
    expect(sources).toEqual([
      'preferred',
      'detailedBase',
      'detailedExtension',
      'cvt',
      'standard',
      'established',
      'established',
      'ctaVic',
    ]);

    const ranks = entries.map((e) => e.rank);
    // Ranks are monotonically non-decreasing (priority order).
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]);
    }
  });

  it('marks the first base DTD as preferred and only that one', () => {
    const base = new EDID({
      detailedTimings: [dtd(1920, 1080, 148.5), dtd(1680, 1050, 119.0)],
    });
    const entries = collectTimingsByPriority(new EEDID({ base, extensions: [] }));
    expect(entries[0].source).toBe('preferred');
    expect(entries[0].preferred).toBe(true);
    expect(entries[1].source).toBe('detailedBase');
    expect(entries[1].preferred).toBeUndefined();
  });

  it('ranks CTA extension DTDs above CVT codes (§5 Note 4 before Note 5)', () => {
    const base = new EDID({
      displayDescriptors: [
        {
          tag: 0xF8,
          timings: [
            {
              addressableLines: 1080,
              aspectRatio: '16:9',
              preferredRefreshRate: 60,
              refreshRates: { r50Hz: false, r60Hz: true, r75Hz: false, r85Hz: false, r60HzRB: false },
            },
          ],
        },
      ],
    });
    const cea = ceaWith([
      { ...normalizeDetailedTiming({ pixelClock: 74.25, horizontalActive: 1280, horizontalBlanking: 370, verticalActive: 720, verticalBlanking: 30 }), isNative: false },
    ]);
    const entries = collectTimingsByPriority(new EEDID({ base, extensions: [cea] }));
    const extIdx = entries.findIndex((e) => e.source === 'detailedExtension');
    const cvtIdx = entries.findIndex((e) => e.source === 'cvt');
    expect(extIdx).toBeLessThan(cvtIdx);
    expect(entries[extIdx].rank).toBe(TIMING_PRIORITY_RANK.detailedExtension);
    expect(entries[cvtIdx].rank).toBe(TIMING_PRIORITY_RANK.cvt);
  });

  it('places standard timings above established timings (§5 Note 6 before Note 7)', () => {
    const base = new EDID({
      standardTimings: [new StandardTiming({ width: 1600, height: 900, refreshRate: 60 })],
      establishedTimings: [
        new EstablishedTiming({ id: 2, name: '640×480@60Hz', width: 640, height: 480, refreshRate: 60 }),
      ],
    });
    const entries = collectTimingsByPriority(new EEDID({ base, extensions: [] }));
    const stdIdx = entries.findIndex((e) => e.source === 'standard');
    const estIdx = entries.findIndex((e) => e.source === 'established');
    expect(stdIdx).toBeLessThan(estIdx);
  });

  it('ranks CTA VICs last (appended beyond §5 Table 5.1)', () => {
    const base = new EDID({
      establishedTimings: [
        new EstablishedTiming({ id: 2, name: '640×480@60Hz', width: 640, height: 480, refreshRate: 60 }),
      ],
    });
    const cea = ceaWith([], vdb([{ vic: 16, native: true }]));
    const entries = collectTimingsByPriority(new EEDID({ base, extensions: [cea] }));
    const last = entries[entries.length - 1];
    expect(last.source).toBe('ctaVic');
    expect(last.vic).toBe(16);
    expect(last.rank).toBe(TIMING_PRIORITY_RANK.ctaVic);
  });

  it('resolves CTA VIC resolution/refresh from the VIC table', () => {
    const cea = ceaWith([], vdb([{ vic: 16, native: true }]));
    const entries = collectTimingsByPriority(new EEDID({ base: EDID.blank(), extensions: [cea] }));
    const vic = entries.find((e) => e.source === 'ctaVic') as TimingEntry | undefined;
    expect(vic).toBeDefined();
    expect(vic!.width).toBe(1920);
    expect(vic!.height).toBe(1080);
    expect(vic!.refreshRate).toBe(60);
    expect(vic!.native).toBe(true);
  });

  it('preserves in-order listing within a rank (§5 Note 1, stable)', () => {
    const base = new EDID({
      detailedTimings: [dtd(1920, 1080, 148.5), dtd(1680, 1050, 119.0), dtd(1280, 720, 74.25)],
    });
    const entries = collectTimingsByPriority(new EEDID({ base, extensions: [] }));
    // rank 1 = first DTD; ranks 2,3 = remaining base DTDs in slot order.
    expect(entries.map((e) => [e.source, e.width] as const)).toEqual([
      ['preferred', 1920],
      ['detailedBase', 1680],
      ['detailedBase', 1280],
    ]);
  });

  it('derives CVT width from addressable lines and aspect ratio', () => {
    const base = new EDID({
      displayDescriptors: [
        {
          tag: 0xF8,
          timings: [
            {
              addressableLines: 1200,
              aspectRatio: '16:10',
              preferredRefreshRate: 60,
              refreshRates: { r50Hz: false, r60Hz: true, r75Hz: false, r85Hz: false, r60HzRB: false },
            },
          ],
        },
      ],
    });
    const cvt = collectTimingsByPriority(new EEDID({ base, extensions: [] })).find((e) => e.source === 'cvt')!;
    // 1200 lines × 16/10 = 1920, 8-pixel aligned.
    expect(cvt.width).toBe(1920);
    expect(cvt.height).toBe(1200);
    expect(cvt.refreshRate).toBe(60);
  });

  it('includes Established Timings III bit indices with a zero resolution placeholder', () => {
    const base = new EDID({
      displayDescriptors: [{ tag: 0xF7, timings: [5, 12] }],
    });
    const et3 = collectTimingsByPriority(new EEDID({ base, extensions: [] })).filter((e) => e.source === 'established');
    expect(et3.map((e) => e.label)).toEqual(['Established Timing III bit 5', 'Established Timing III bit 12']);
    expect(et3.every((e) => e.width === 0 && e.height === 0)).toBe(true);
  });

  it('skips reserved/empty established timings and invalid standard timings', () => {
    const base = new EDID({
      establishedTimings: [
        new EstablishedTiming({ id: 17, name: 'Reserved 17', width: 0, height: 0, refreshRate: 0 }),
        new EstablishedTiming({ id: 2, name: '640×480@60Hz', width: 640, height: 480, refreshRate: 60 }),
      ],
      standardTimings: [new StandardTiming({ width: 0, height: 0, refreshRate: 0 })], // invalid, skipped
    });
    const entries = collectTimingsByPriority(new EEDID({ base, extensions: [] }));
    const est = entries.filter((e) => e.source === 'established');
    expect(est.length).toBe(1);
    expect(est[0].width).toBe(640);
    const std = entries.filter((e) => e.source === 'standard');
    expect(std.length).toBe(0);
  });

  it('also collects standard timings from the 0xFA Standard Timing Display Descriptor', () => {
    const base = new EDID({
      displayDescriptors: [
        { tag: 0xFA, timings: [{ width: 1440, height: 900, refreshRate: 60 }] },
      ],
    });
    const std = collectTimingsByPriority(new EEDID({ base, extensions: [] })).filter((e) => e.source === 'standard');
    expect(std.length).toBe(1);
    expect(std[0].width).toBe(1440);
    expect(std[0].rank).toBe(TIMING_PRIORITY_RANK.standard);
  });
});