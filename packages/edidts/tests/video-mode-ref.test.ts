import { describe, it, expect } from 'vitest';
import {
  EEDID,
  collectVideoModeRefs,
  type DisplayIdExtension,
} from '../src/eedid';
import { EDID, StandardTiming } from '../src/edid';
import {
  ctaVicRef,
  displayIdEnumeratedRef,
  dtdRef,
  standardRef,
  cvtRef,
  type VideoModeRef,
} from '../src/common';
import {
  DisplayIdDataBlockTag,
  type DisplayIdSection,
  type DisplayIdDataBlock,
  type DisplayIdTypeVIIIEnumeratedTimingCodeBlock,
  type DisplayIdTypeVIIDetailedTimingBlock,
  type DisplayIdTypeVIIDetailedTiming,
  type DisplayIdTypeIXFormulaBasedTimingBlock,
  type DisplayIdTypeIXFormulaBasedTiming,
} from '../src/displayid';
import { buildCeaExtension, videoDataBlock, makeDtd } from './cea-utils';

/** Build a DisplayID section shell carrying the given blocks. */
function makeDisplayIdSection(blocks: DisplayIdDataBlock[]): DisplayIdSection {
  return {
    version: 2,
    revision: 0,
    versionByte: 0x20,
    bytesInSection: 0,
    totalLength: 0,
    primaryUseCase: 0,
    extensionCount: 0,
    blocks,
    fillBytes: 0,
    checksum: 0,
    isChecksumValid: true,
  };
}

/** Build a DisplayID 0x70 extension from one or more sections. */
function displayIdExt(sections: DisplayIdSection[]): DisplayIdExtension {
  return {
    kind: 'displayid',
    tag: 0x70,
    revision: 0,
    section: sections[0],
    sections,
    checksum: 0,
  };
}

/** Type VIII enumerated-timing block (codeType: 0=DMT,1=CTA VIC,2=HDMI VIC). */
function typeVIII(codeType: number, timingCodes: number[]): DisplayIdTypeVIIIEnumeratedTimingCodeBlock {
  return {
    tag: DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode,
    revision: 0,
    flags: 0,
    payloadLength: 0,
    payload: new Uint8Array(),
    codeType,
    codeSize: 1,
    timingCodes,
  };
}

/** Type VII detailed-timing block; each timing carries only a `preferred` flag. */
function typeVII(preferred: boolean[]): DisplayIdTypeVIIDetailedTimingBlock {
  return {
    tag: DisplayIdDataBlockTag.TypeVIIDetailedTiming,
    revision: 0,
    flags: 0,
    payloadLength: 0,
    payload: new Uint8Array(),
    timings: preferred.map((p) => ({ preferred: p }) as DisplayIdTypeVIIDetailedTiming),
  };
}

/** Type IX formula-timing block; `count` placeholder timings. */
function typeIX(count: number): DisplayIdTypeIXFormulaBasedTimingBlock {
  return {
    tag: DisplayIdDataBlockTag.TypeIXFormulaBasedTiming,
    revision: 0,
    flags: 0,
    payloadLength: 0,
    payload: new Uint8Array(),
    timings: Array.from({ length: count }, () => ({}) as DisplayIdTypeIXFormulaBasedTiming),
  };
}

describe('VideoModeRef adapters', () => {
  it('ctaVicRef carries the VIC and native flag', () => {
    expect(ctaVicRef(16, true)).toEqual({ source: 'cta-vic', code: 16, native: true });
    expect(ctaVicRef(4)).toEqual({ source: 'cta-vic', code: 4 });
  });

  it('displayIdEnumeratedRef carries the code, codeType, and optional native', () => {
    expect(displayIdEnumeratedRef(5, 1)).toEqual({ source: 'displayid-enumerated', code: 5, codeType: 1 });
    expect(displayIdEnumeratedRef(2, 0, true)).toEqual({
      source: 'displayid-enumerated', code: 2, codeType: 0, native: true,
    });
  });

  it('dtdRef carries an optional slot index and native flag', () => {
    expect(dtdRef(0, true)).toEqual({ source: 'dtd', code: 0, native: true });
    expect(dtdRef(1)).toEqual({ source: 'dtd', code: 1 });
    expect(dtdRef(undefined)).toEqual({ source: 'dtd' });
  });

  it('standardRef and cvtRef carry their codes', () => {
    expect(standardRef(43456)).toEqual({ source: 'standard', code: 43456 });
    expect(cvtRef(1080)).toEqual({ source: 'cvt', code: 1080 });
    expect(cvtRef()).toEqual({ source: 'cvt' });
  });
});

describe('collectVideoModeRefs', () => {
  it('returns nothing for an EEDID with no video modes', () => {
    const empty = new EEDID({
      base: new EDID({
        detailedTimings: [],
        standardTimings: [],
        establishedTimings: [],
        displayDescriptors: [],
      }),
      extensions: [],
    });
    expect(collectVideoModeRefs(empty)).toEqual([]);
  });

  it('marks base DTD slot 0 as native (Preferred Timing Mode) and leaves others plain', () => {
    const base = new EDID({
      detailedTimings: [makeDtd(1920, 1080, 148.5), makeDtd(1680, 1050, 119)],
      standardTimings: [],
      establishedTimings: [],
      displayDescriptors: [],
    });
    const refs = collectVideoModeRefs(new EEDID({ base, extensions: [] }));
    expect(refs).toEqual([
      { source: 'dtd', code: 0, native: true },
      { source: 'dtd', code: 1 },
    ]);
  });

  it('derives the 2-byte standard-timing code (1600×900@60 → 0xA9C0)', () => {
    const base = new EDID({
      detailedTimings: [],
      standardTimings: [new StandardTiming({ width: 1600, height: 900, refreshRate: 60 })],
      establishedTimings: [],
      displayDescriptors: [],
    });
    const refs = collectVideoModeRefs(new EEDID({ base, extensions: [] }));
    // t1 = 1600/8 - 31 = 169 (0xA9); aspect 16:9 = code 3 → (3<<6)=0xC0; refresh 60 → +0.
    expect(refs).toEqual([{ source: 'standard', code: 0xA9C0 }]);
  });

  it('collects standard timings from the 0xFA descriptor too', () => {
    const base = new EDID({
      detailedTimings: [],
      standardTimings: [],
      establishedTimings: [],
      displayDescriptors: [
        { tag: 0xFA, timings: [{ width: 1440, height: 900, refreshRate: 60 }] },
      ],
    });
    const refs = collectVideoModeRefs(new EEDID({ base, extensions: [] }));
    expect(refs.length).toBe(1);
    expect(refs[0].source).toBe('standard');
  });

  it('collects CVT codes keyed by addressable lines', () => {
    const base = new EDID({
      detailedTimings: [],
      standardTimings: [],
      establishedTimings: [],
      displayDescriptors: [
        {
          tag: 0xF8,
          timings: [{
            addressableLines: 1080,
            aspectRatio: '16:9',
            preferredRefreshRate: 60,
            refreshRates: { r50Hz: false, r60Hz: true, r75Hz: false, r85Hz: false, r60HzRB: false },
          }],
        },
      ],
    });
    expect(collectVideoModeRefs(new EEDID({ base, extensions: [] }))).toEqual([
      { source: 'cvt', code: 1080 },
    ]);
  });

  it('collects CTA VICs (with native flag) and CTA detailed timings', () => {
    const base = new EDID({
      detailedTimings: [],
      standardTimings: [],
      establishedTimings: [],
      displayDescriptors: [],
    });
    const cea = buildCeaExtension({
      dataBlocks: [videoDataBlock([
        { vic: 16, native: true },
        { vic: 4, native: false },
      ])],
      detailedTimings: [
        { ...({ pixelClock: 74.25, horizontalActive: 1280, horizontalBlanking: 370, verticalActive: 720, verticalBlanking: 30, flags: { interlaced: false } }), isNative: true } as never,
      ],
    });
    const refs = collectVideoModeRefs(new EEDID({ base, extensions: [cea] }));
    expect(refs).toEqual([
      { source: 'cta-vic', code: 16, native: true },
      { source: 'cta-vic', code: 4 },
      { source: 'dtd', code: 0, native: true },
    ]);
  });

  it('collects DisplayID Type VIII enumerated codes with codeType', () => {
    const base = new EDID({ detailedTimings: [], standardTimings: [], establishedTimings: [], displayDescriptors: [] });
    const ext = displayIdExt([makeDisplayIdSection([typeVIII(1, [16, 5])])]);
    const refs = collectVideoModeRefs(new EEDID({ base, extensions: [ext] }));
    expect(refs).toEqual([
      { source: 'displayid-enumerated', code: 16, codeType: 1 },
      { source: 'displayid-enumerated', code: 5, codeType: 1 },
    ]);
  });

  it('collects DisplayID Type VII (preferred→native) and Type IX DTDs with a shared per-section index', () => {
    const base = new EDID({ detailedTimings: [], standardTimings: [], establishedTimings: [], displayDescriptors: [] });
    const ext = displayIdExt([makeDisplayIdSection([
      typeVII([true, false]),
      typeIX(2),
    ])]);
    const refs = collectVideoModeRefs(new EEDID({ base, extensions: [ext] }));
    expect(refs).toEqual([
      { source: 'dtd', code: 0, native: true },
      { source: 'dtd', code: 1 },
      { source: 'dtd', code: 2 },
      { source: 'dtd', code: 3 },
    ]);
  });

  it('walks every DisplayID section (multi-section payload)', () => {
    const base = new EDID({ detailedTimings: [], standardTimings: [], establishedTimings: [], displayDescriptors: [] });
    const ext = displayIdExt([
      makeDisplayIdSection([typeVIII(0, [1])]),
      makeDisplayIdSection([typeVIII(2, [2, 3])]),
    ]);
    const refs = collectVideoModeRefs(new EEDID({ base, extensions: [ext] }));
    expect(refs.map((r) => (r as { code?: number }).code)).toEqual([1, 2, 3]);
  });

  it('emits refs across all sources in base → CEA → DisplayID order', () => {
    const base = new EDID({
      detailedTimings: [makeDtd(1920, 1080, 148.5)],
      standardTimings: [new StandardTiming({ width: 1600, height: 900, refreshRate: 60 })],
      establishedTimings: [],
      displayDescriptors: [
        {
          tag: 0xF8,
          timings: [{
            addressableLines: 1080, aspectRatio: '16:9', preferredRefreshRate: 60,
            refreshRates: { r50Hz: false, r60Hz: true, r75Hz: false, r85Hz: false, r60HzRB: false },
          }],
        },
      ],
    });
    const cea = buildCeaExtension({ dataBlocks: [videoDataBlock([{ vic: 16, native: true }])] });
    const ext = displayIdExt([makeDisplayIdSection([typeVIII(1, [16])])]);
    const refs = collectVideoModeRefs(new EEDID({ base, extensions: [cea, ext] })) as VideoModeRef[];
    expect(refs.map((r) => r.source)).toEqual([
      'dtd',        // base DTD slot 0
      'standard',   // base standard timing
      'cvt',        // base CVT descriptor
      'cta-vic',    // CTA Video Data Block
      'displayid-enumerated', // DisplayID Type VIII
    ]);
  });
});