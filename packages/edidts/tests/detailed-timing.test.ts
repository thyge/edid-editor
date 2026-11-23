import { describe, expect, it } from 'vitest';
import {
  DetailedTimingDescriptor,
  computePixelClockForTargetRate,
  computeRefreshRate,
  isDetailedTimingEncodable,
  decodeEdidCtaDetailedTiming,
  decodeEdidCtaDetailedTimingFlags,
  encodeEdidCtaDetailedTiming,
  type DetailedTiming,
  type DetailedTimingBase,
  type DetailedTimingInput,
  type StereoMode,
  type TimingFlags,
} from '../src/common/detailed-timing-descriptor';
import type { DisplayIdTypeVIIDetailedTiming } from '../src/displayid';

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

  it('round-trips every stereo mode and never emits the reserved 111 code', () => {
    const baseFlags = {
      interlaced: false,
      syncType: 'digital-separate' as const,
      hSyncPolarity: 'positive' as const,
      vSyncPolarity: 'positive' as const,
    };
    const modes = [
      'none',
      'field-sequential-right',
      '2-way-interleaved-right',
      'field-sequential-left',
      '2-way-interleaved-left',
      '4-way-interleaved',
      'side-by-side-interleaved',
    ] as const;

    for (const stereoMode of modes) {
      const encoded = encodeEdidCtaDetailedTiming({
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
        flags: { ...baseFlags, stereoMode },
      });
      // byte 17 carries the flags; bits 6, 5 and 0 hold the stereo mode
      const expectedBits = {
        'none': 0x00,
        'field-sequential-right': 0x20,
        'field-sequential-left': 0x40,
        '2-way-interleaved-right': 0x21,
        '2-way-interleaved-left': 0x41,
        '4-way-interleaved': 0x60,
        'side-by-side-interleaved': 0x61,
      }[stereoMode];
      expect(encoded[17] & 0x61, `stereo bits for ${stereoMode}`).toBe(expectedBits);

      const decoded = decodeEdidCtaDetailedTiming(encoded);
      expect(decoded?.flags.stereoMode, `round-trip ${stereoMode}`).toBe(stereoMode);
    }
  });

  it('decodes stereo bits per EDID 1.4 Table 3.22 (bit 0 alone means no stereo)', () => {
    const cases: Array<[number, string]> = [
      [0x18, 'none'],
      [0x19, 'none'], // bits 6:5 = 00 → bit 0 is "don't care"
      [0x38, 'field-sequential-right'],
      [0x58, 'field-sequential-left'],
      [0x39, '2-way-interleaved-right'],
      [0x59, '2-way-interleaved-left'],
      [0x78, '4-way-interleaved'],
      [0x79, 'side-by-side-interleaved'],
    ];
    for (const [byte, mode] of cases) {
      expect(decodeEdidCtaDetailedTimingFlags(byte).stereoMode, `0x${byte.toString(16)}`).toBe(mode);
    }
  });

  // ---- Combinatorial stereo / sync / border coverage ----
  //
  // byte[17] packs four independent fields: interlaced (bit 7), stereo mode
  // (bits 6,5,0), and sync type + sub-flags (bits 4:1). Because the bit groups
  // do not overlap, every stereo mode combines with every sync configuration
  // losslessly. Borders (bytes 15-16) are independent 8-bit fields.

  const baseTimingFields = {
    pixelClock: 148.5,
    horizontalActive: 1920,
    horizontalBlanking: 280,
    verticalActive: 1080,
    verticalBlanking: 45,
    horizontalSyncOffset: 88,
    horizontalSyncWidth: 44,
    verticalSyncOffset: 4,
    verticalSyncWidth: 5,
    horizontalImageSize: 530,
    verticalImageSize: 300,
  } as const;

  function buildTiming(flags: TimingFlags, horizontalBorder = 0, verticalBorder = 0): DetailedTimingInput {
    return { ...baseTimingFields, horizontalBorder, verticalBorder, flags };
  }

  // Every sync type with each of its encode-relevant sub-flag combinations.
  // syncOnGreen is decode-derived (inverse of syncOnAllChannels) for analog
  // composite types and is not read by encode, so it is not a "source" field.
  const syncConfigs: TimingFlags[] = [
    // analog-composite: serrationOnVSync × syncOnAllChannels
    { interlaced: false, stereoMode: 'none', syncType: 'analog-composite', serrationOnVSync: false, syncOnAllChannels: false },
    { interlaced: false, stereoMode: 'none', syncType: 'analog-composite', serrationOnVSync: false, syncOnAllChannels: true },
    { interlaced: false, stereoMode: 'none', syncType: 'analog-composite', serrationOnVSync: true, syncOnAllChannels: false },
    { interlaced: false, stereoMode: 'none', syncType: 'analog-composite', serrationOnVSync: true, syncOnAllChannels: true },
    // bipolar-analog-composite: serrationOnVSync × syncOnAllChannels
    { interlaced: false, stereoMode: 'none', syncType: 'bipolar-analog-composite', serrationOnVSync: false, syncOnAllChannels: false },
    { interlaced: false, stereoMode: 'none', syncType: 'bipolar-analog-composite', serrationOnVSync: false, syncOnAllChannels: true },
    { interlaced: false, stereoMode: 'none', syncType: 'bipolar-analog-composite', serrationOnVSync: true, syncOnAllChannels: false },
    { interlaced: false, stereoMode: 'none', syncType: 'bipolar-analog-composite', serrationOnVSync: true, syncOnAllChannels: true },
    // digital-composite: serrationOnVSync × hSyncPolarity
    { interlaced: false, stereoMode: 'none', syncType: 'digital-composite', serrationOnVSync: false, hSyncPolarity: 'negative' },
    { interlaced: false, stereoMode: 'none', syncType: 'digital-composite', serrationOnVSync: false, hSyncPolarity: 'positive' },
    { interlaced: false, stereoMode: 'none', syncType: 'digital-composite', serrationOnVSync: true, hSyncPolarity: 'negative' },
    { interlaced: false, stereoMode: 'none', syncType: 'digital-composite', serrationOnVSync: true, hSyncPolarity: 'positive' },
    // digital-separate: vSyncPolarity × hSyncPolarity
    { interlaced: false, stereoMode: 'none', syncType: 'digital-separate', vSyncPolarity: 'negative', hSyncPolarity: 'negative' },
    { interlaced: false, stereoMode: 'none', syncType: 'digital-separate', vSyncPolarity: 'positive', hSyncPolarity: 'negative' },
    { interlaced: false, stereoMode: 'none', syncType: 'digital-separate', vSyncPolarity: 'negative', hSyncPolarity: 'positive' },
    { interlaced: false, stereoMode: 'none', syncType: 'digital-separate', vSyncPolarity: 'positive', hSyncPolarity: 'positive' },
  ];

  function expectFlagsRoundTrip(input: TimingFlags, label: string) {
    const decoded = decodeEdidCtaDetailedTiming(encodeEdidCtaDetailedTiming(buildTiming(input)))!;
    expect(decoded.flags.syncType, label).toBe(input.syncType);
    expect(decoded.flags.interlaced, label).toBe(input.interlaced);
    expect(decoded.flags.stereoMode, label).toBe(input.stereoMode);
    switch (input.syncType) {
      case 'analog-composite':
      case 'bipolar-analog-composite':
        expect(decoded.flags.serrationOnVSync, label).toBe(input.serrationOnVSync);
        expect(decoded.flags.syncOnAllChannels, label).toBe(input.syncOnAllChannels);
        // syncOnGreen is decode-derived (inverse of syncOnAllChannels), not stored.
        expect(decoded.flags.syncOnGreen, label).toBe(!input.syncOnAllChannels);
        break;
      case 'digital-composite':
        expect(decoded.flags.serrationOnVSync, label).toBe(input.serrationOnVSync);
        expect(decoded.flags.hSyncPolarity, label).toBe(input.hSyncPolarity);
        break;
      case 'digital-separate':
        expect(decoded.flags.vSyncPolarity, label).toBe(input.vSyncPolarity);
        expect(decoded.flags.hSyncPolarity, label).toBe(input.hSyncPolarity);
        break;
    }
  }

  it('round-trips every sync type with each of its sub-flag combinations', () => {
    for (const config of syncConfigs) {
      expectFlagsRoundTrip(config, `sync=${config.syncType} serr=${config.serrationOnVSync} all=${config.syncOnAllChannels} vpol=${config.vSyncPolarity} hpol=${config.hSyncPolarity}`);
    }
  });

  it('round-trips interlaced true and false for each sync type', () => {
    for (const syncType of ['analog-composite', 'bipolar-analog-composite', 'digital-composite', 'digital-separate'] as const) {
      for (const interlaced of [false, true]) {
        const base = syncConfigs.find((c) => c.syncType === syncType)!;
        expectFlagsRoundTrip({ ...base, interlaced }, `sync=${syncType} interlaced=${interlaced}`);
      }
    }
  });

  it('round-trips border combinations (including zero, asymmetric, and max 255)', () => {
    const borderPairs: [number, number][] = [
      [0, 0],
      [8, 4],
      [0, 12],
      [200, 0],
      [255, 255],
    ];
    const flags: TimingFlags = {
      interlaced: false,
      stereoMode: 'none',
      syncType: 'digital-separate',
      vSyncPolarity: 'positive',
      hSyncPolarity: 'positive',
    };
    for (const [hBorder, vBorder] of borderPairs) {
      const decoded = decodeEdidCtaDetailedTiming(encodeEdidCtaDetailedTiming(buildTiming(flags, hBorder, vBorder)))!;
      expect(decoded.horizontalBorder, `hBorder=${hBorder}`).toBe(hBorder);
      expect(decoded.verticalBorder, `vBorder=${vBorder}`).toBe(vBorder);
    }
  });

  it('round-trips every stereo × sync × interlaced × border combination', () => {
    const stereoModes: StereoMode[] = [
      'none',
      'field-sequential-right',
      '2-way-interleaved-right',
      'field-sequential-left',
      '2-way-interleaved-left',
      '4-way-interleaved',
      'side-by-side-interleaved',
    ];
    const borderPairs: [number, number][] = [[0, 0], [8, 4], [255, 255]];
    for (const stereoMode of stereoModes) {
      for (const sync of syncConfigs) {
        for (const interlaced of [false, true]) {
          for (const [hBorder, vBorder] of borderPairs) {
            const flags: TimingFlags = { ...sync, stereoMode, interlaced };
            const label = `stereo=${stereoMode} sync=${sync.syncType} interlaced=${interlaced} border=${hBorder}x${vBorder}`;
            const decoded = decodeEdidCtaDetailedTiming(encodeEdidCtaDetailedTiming(buildTiming(flags, hBorder, vBorder)))!;
            // Base timing fields are constant; pin a few to catch packing regressions.
            expect(decoded.pixelClock, label).toBe(148.5);
            expect(decoded.horizontalActive, label).toBe(1920);
            expect(decoded.verticalActive, label).toBe(1080);
            expect(decoded.horizontalBorder, label).toBe(hBorder);
            expect(decoded.verticalBorder, label).toBe(vBorder);
            expectFlagsRoundTrip(flags, label);
          }
        }
      }
    }
  });

  it('decodes stereo bits 6,5,0 = 111 as side-by-side and re-encodes them unchanged', () => {
    // Bits 6, 5 and 0 all set is side-by-side interleaved stereo per EDID 1.4
    // Table 3.22 (edid-decode: flags & 0x61 == 0x61), not a reserved code.
    // 0x7B = 0b0111_1011: stereo bits 6,5,0 set; bit4=1,bit3=1 ->
    // digital-separate; bit2=0 -> vSync negative; bit1=1 -> hSync positive.
    const flagByte = 0x7b;
    const encoded = encodeEdidCtaDetailedTiming(buildTiming({
      interlaced: false,
      stereoMode: 'none',
      syncType: 'digital-separate',
      vSyncPolarity: 'negative',
      hSyncPolarity: 'positive',
    }));
    encoded[17] = flagByte;
    const decoded = decodeEdidCtaDetailedTiming(encoded)!;
    expect(decoded.flags.stereoMode).toBe('side-by-side-interleaved');
    expect(decoded.flags.syncType).toBe('digital-separate');
    expect(decoded.flags.vSyncPolarity).toBe('negative');
    expect(decoded.flags.hSyncPolarity).toBe('positive');
    const reencoded = encodeEdidCtaDetailedTiming(buildTiming(decoded.flags));
    expect(reencoded[17]).toBe(flagByte);
  });
});

describe('DetailedTimingBase shared supertype', () => {
  // Compile-time assignability checks: the cast-assignment below only type-
  // checks if each detailed-timing interface is assignable to DetailedTimingBase.
  // Both interfaces `extends DetailedTimingBase`, so the common 8 geometry
  // fields are guaranteed; the semantic fields (clock/interlace/stereo/polarity)
  // are optional and family-specific. No codec is involved — type contract only.

  it('EDID DetailedTiming is assignable to DetailedTimingBase', () => {
    const edid: DetailedTimingBase = {} as DetailedTiming;
    expect(edid).toBeDefined();
  });

  it('DisplayID Type VII detailed timing is assignable to DetailedTimingBase', () => {
    const displayId: DetailedTimingBase = {} as DisplayIdTypeVIIDetailedTiming;
    expect(displayId).toBeDefined();
  });

  it('DisplayIdTypeVIIDetailedTiming narrows the optional base fields to required', () => {
    // DisplayID declares pixelClockKHz/interlaced/stereo/polarity as required,
    // narrowing the base's optional declarations — so they are `number`/`boolean`
    // (not `| undefined`) on the DisplayID interface.
    const t = {} as DisplayIdTypeVIIDetailedTiming;
    const clock: number = t.pixelClockKHz;
    const interlaced: boolean = t.interlaced;
    const stereo: number = t.stereo;
    expect(clock).toBeUndefined();
    expect(interlaced).toBeUndefined();
    expect(stereo).toBeUndefined();
  });
});

describe('isDetailedTimingEncodable', () => {
  const encodable = {
    pixelClock: 148.5,
    horizontalActive: 1920,
    horizontalBlanking: 280,
    verticalActive: 1080,
    verticalBlanking: 45,
    horizontalSyncOffset: 88,
    horizontalSyncWidth: 44,
    verticalSyncOffset: 4,
    verticalSyncWidth: 5,
    horizontalImageSize: 530,
    verticalImageSize: 300,
    horizontalBorder: 0,
    verticalBorder: 0,
    flags: {
      interlaced: false,
      stereoMode: 'none' as const,
      syncType: 'digital-separate' as const,
      hSyncPolarity: 'positive' as const,
      vSyncPolarity: 'positive' as const,
    },
  } as DetailedTiming;

  it('accepts a timing whose every field fits its DTD width', () => {
    expect(isDetailedTimingEncodable(encodable)).toBe(true);
    // The field maxima themselves (12-bit active/blanking, 10-bit H sync,
    // 6-bit V sync, 8-bit border, 16-bit clock) must all pass.
    expect(isDetailedTimingEncodable({
      ...encodable,
      pixelClock: 655.35,
      horizontalActive: 4095,
      horizontalBlanking: 4095,
      verticalActive: 4095,
      verticalBlanking: 4095,
      horizontalSyncOffset: 1023,
      horizontalSyncWidth: 1023,
      verticalSyncOffset: 63,
      verticalSyncWidth: 63,
      horizontalImageSize: 4095,
      verticalImageSize: 4095,
      horizontalBorder: 255,
      verticalBorder: 255,
    } as DetailedTiming)).toBe(true);
  });

  it('rejects each field at one unit past its DTD width', () => {
    const over = (overrides: Partial<DetailedTiming>): DetailedTiming =>
      ({ ...encodable, ...overrides } as DetailedTiming);
    expect(isDetailedTimingEncodable(over({ pixelClock: 655.36 }))).toBe(false);
    expect(isDetailedTimingEncodable(over({ horizontalActive: 4096 }))).toBe(false);
    expect(isDetailedTimingEncodable(over({ horizontalBlanking: 4096 }))).toBe(false);
    expect(isDetailedTimingEncodable(over({ verticalActive: 4096 }))).toBe(false);
    expect(isDetailedTimingEncodable(over({ verticalBlanking: 4096 }))).toBe(false);
    expect(isDetailedTimingEncodable(over({ horizontalSyncOffset: 1024 }))).toBe(false);
    expect(isDetailedTimingEncodable(over({ horizontalSyncWidth: 1024 }))).toBe(false);
    expect(isDetailedTimingEncodable(over({ verticalSyncOffset: 64 }))).toBe(false);
    expect(isDetailedTimingEncodable(over({ verticalSyncWidth: 64 }))).toBe(false);
    expect(isDetailedTimingEncodable(over({ horizontalImageSize: 4096 }))).toBe(false);
    expect(isDetailedTimingEncodable(over({ verticalImageSize: 4096 }))).toBe(false);
    expect(isDetailedTimingEncodable(over({ horizontalBorder: 256 }))).toBe(false);
    expect(isDetailedTimingEncodable(over({ verticalBorder: 256 }))).toBe(false);
  });

  it('rejects negative fields', () => {
    expect(isDetailedTimingEncodable({ ...encodable, horizontalActive: -1 } as DetailedTiming)).toBe(false);
  });
});

describe('computePixelClockForTargetRate', () => {
  // 1080p60-ish geometry: hTotal 2200, vTotal 1125 -> exact 60 Hz needs 148.50 MHz.
  const progressive = {
    pixelClock: 148.5,
    horizontalActive: 1920,
    horizontalBlanking: 280,
    verticalActive: 1080,
    verticalBlanking: 45,
    flags: { interlaced: false },
  } as unknown as DetailedTiming;

  it('computes the exact clock for an integral rate and quantizes to 10 kHz', () => {
    expect(computePixelClockForTargetRate(progressive, 60, 655.35)).toBe(148.5);
    // 75 Hz needs 185.625 MHz -> quantizes to 185.63 (up; a down-round would
    // be 185.62, both within the 10 kHz grid).
    expect(computePixelClockForTargetRate(progressive, 75, 655.35)).toBe(185.63);
  });

  it('keeps the achieved rate within one quantization step of the target', () => {
    const clock = computePixelClockForTargetRate(progressive, 59.94, 655.35)!;
    expect(clock).toBeGreaterThan(0);
    const achieved = computeRefreshRate({ ...progressive, pixelClock: clock });
    expect(Math.abs(achieved - 59.94)).toBeLessThan(0.01);
  });

  it('solves interlaced timings per field (with the half line), mirroring computeRefreshRate', () => {
    // A real 1080i60 DTD stores 540 active + 22 blanking lines per field;
    // edid-decode's field rate is clock / (2200 × 562.5) = 60 Hz.
    const interlaced = {
      ...progressive,
      verticalActive: 540,
      verticalBlanking: 22,
      flags: { interlaced: true },
    } as unknown as DetailedTiming;
    const clock = computePixelClockForTargetRate(interlaced, 60, 655.35)!;
    expect(clock).toBe(74.25);
    expect(computeRefreshRate({ ...interlaced, pixelClock: 74.25 })).toBeCloseTo(60, 5);
  });

  it('returns null for unusable geometry, non-positive rates, and overflow', () => {
    expect(computePixelClockForTargetRate({ ...progressive, horizontalBlanking: -1920 }, 60, 655.35)).toBeNull();
    expect(computePixelClockForTargetRate(progressive, 0, 655.35)).toBeNull();
    expect(computePixelClockForTargetRate(progressive, -60, 655.35)).toBeNull();
    // 8K120 over 1080p totals blows past the 16-bit clock field.
    expect(computePixelClockForTargetRate(progressive, 600, 655.35)).toBeNull();
  });
});
