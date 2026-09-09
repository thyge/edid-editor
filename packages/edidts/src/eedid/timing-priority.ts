/**
 * E-EDID Timing Information Priority Order (VESA E-EDID A2, Section 5).
 *
 * Section 5 / Table 5.1 define the order in which a host shall evaluate and
 * support the timing modes advertised by a display's EDID. This module models
 * that priority as a library-level policy so consumers don't each reinvent it.
 *
 * The ranks below follow Table 5.1's rows verbatim:
 *
 *   1. Preferred Timing Mode — the first 18-byte descriptor in the BASE EDID
 *      (the PTM; VESA E-EDID A2 §5 Note 2 / §3.10.1).
 *   2. Other Detailed Timing Modes in the BASE EDID — the 2nd/3rd/4th 18-byte
 *      descriptors, in address order (§5 Note 3).
 *   3. Additional Detailed Timing Modes in optional EXTENSION Blocks — e.g.
 *      CTA-861 / VTB-EXT DTDs, in the order listed (§5 Note 4).
 *   4. Optional 3-Byte CVT Codes from Display Descriptors (tag 0xF8) in the
 *      BASE EDID or an extension (§5 Note 5).
 *   5. Standard Timings — 2-byte codes in the BASE EDID plus the Standard
 *      Timing Display Descriptor (tag 0xFA) (§5 Note 6).
 *   6. Established Timings I, II & III (§5 Note 7). Established Timings are a
 *      bit set and carry no inherent ordering (§5 Note 7.1).
 *   7. BASE VIDEO MODE — 640×480@60Hz VGA fallback (§5 Note 8).
 *
 * CTA-861 Video Data Block VICs are NOT enumerated in §5 Table 5.1. Per §5
 * Note 4, an extension block's own priority order takes precedence when it
 * conflicts; CTA-861 defines its own preferred-format rule inside the
 * extension. For a single whole-EEDID ordering we surface CTA VICs after the
 * base-EDID timings as the lowest modeled priority, consistent with the repo
 * planning note (docs/planning/eedid-spec-breakdown/05-timing-information-priority.md).
 *
 * The collection is stable: within a rank, timings are emitted in the order
 * they appear in the EDID structure (lowest address first), per §5 Note 1.
 */

import type { EEDID } from './eedid';
import { getCEAExtension } from './extension';
import type { CEAExtensionBlock, VideoDataBlock } from '../cta/extension-block';
import type { DetailedTiming } from '../common/detailed-timing-descriptor';
import { getVICDefinition } from '../cta/vic-table';
import type {
  CVTTimingDescriptor,
  EstablishedTimingsIIIDescriptor,
  StandardTimingIdDescriptor,
} from '../edid/display-descriptor';

/**
 * Spec priority rank (VESA E-EDID A2 §5 Table 5.1). Lower rank = higher
 * priority. `cta-vic` is appended beyond the spec table (see module docs).
 */
export const TIMING_PRIORITY_RANK = {
  preferred: 1,
  detailedBase: 2,
  detailedExtension: 3,
  cvt: 4,
  standard: 5,
  established: 6,
  ctaVic: 7,
} as const;

/**
 * The timing-mode category a `TimingEntry` was sourced from. Maps 1:1 to the
 * §5 Table 5.1 rows (plus `cta-vic` for the CTA Video Data Block).
 */
export type TimingSource = keyof typeof TIMING_PRIORITY_RANK;

/**
 * A single video timing mode resolved from an EEDID, tagged with the §5
 * priority rank it was collected at. Kept local to this policy module; a
 * shared cross-format timing abstraction is tracked separately.
 */
export interface TimingEntry {
  /** §5 priority rank (1 = highest). See `TIMING_PRIORITY_RANK`. */
  rank: number;
  /** Category this timing was sourced from. */
  source: TimingSource;
  /** Active horizontal pixels, 0 if the source does not carry it. */
  width: number;
  /** Active vertical lines, 0 if the source does not carry it. */
  height: number;
  /** Vertical refresh rate in Hz, 0 if the source does not carry it. */
  refreshRate: number;
  /** True for the Preferred Timing Mode (first base DTD). */
  preferred?: boolean;
  /** True for a native CTA detailed timing / native CTA VIC. */
  native?: boolean;
  /** CTA-861 VIC number when `source === 'ctaVic'`. */
  vic?: number;
  /** Human-readable label, e.g. "1920×1080@60Hz". */
  label: string;
}

/** Build the human-readable "WxH@RHz" label, tolerating unknown (0) fields. */
function labelOf(width: number, height: number, refreshRate: number): string {
  const res = width > 0 && height > 0 ? `${width}×${height}` : '?';
  const rate = refreshRate > 0 ? `@${Math.round(refreshRate)}Hz` : '';
  return `${res}${rate}`;
}

/** Derive pixel width from a CVT 3-byte code's addressable lines + aspect. */
function cvtWidth(lines: number, aspect: '4:3' | '16:9' | '16:10' | '5:4' | '15:9'): number {
  const factor: Record<typeof aspect, number> = {
    '4:3': 4 / 3,
    '16:9': 16 / 9,
    '16:10': 16 / 10,
    '5:4': 5 / 4,
    '15:9': 15 / 9,
  };
  return Math.round(lines * factor[aspect]);
}

/** Round to the nearest standard horizontal pixel grid (8-pixel aligned). */
function round8(n: number): number {
  return Math.round(n / 8) * 8;
}

/**
 * Compute the vertical refresh rate (Hz) from a raw `DetailedTiming` interface.
 * The `DetailedTimingDescriptor` class exposes this as a getter, but CTA DTDs
 * are decoded as the plain interface (no class), so the rate is derived here:
 * pixelClock (MHz) × 1e6 ÷ (hTotal × vTotal), doubled for interlaced fields.
 */
function detailedRefreshRate(t: DetailedTiming): number {
  const hTotal = t.horizontalActive + t.horizontalBlanking;
  const vTotal = t.verticalActive + t.verticalBlanking;
  if (hTotal === 0 || vTotal === 0 || t.pixelClock === 0) return 0;
  let rate = (t.pixelClock * 1_000_000) / (hTotal * vTotal);
  if (t.flags.interlaced) rate *= 2;
  return rate;
}

function isCVTDescriptor(d: { tag: number }): d is CVTTimingDescriptor {
  return d.tag === 0xF8;
}

function isStandardTimingIdDescriptor(d: { tag: number }): d is StandardTimingIdDescriptor {
  return d.tag === 0xFA;
}

function isEstablishedTimingsIIIDescriptor(d: { tag: number }): d is EstablishedTimingsIIIDescriptor {
  return d.tag === 0xF7;
}

function isVideoDataBlock(b: { tag: number }): b is VideoDataBlock {
  return b.tag === 0x02;
}

/**
 * Collect every timing mode advertised by an EEDID, ordered by the VESA E-EDID
 * A2 §5 Table 5.1 priority policy.
 *
 * The returned array is in highest-to-lowest priority order. Within a single
 * rank, timings appear in EDID address/listed order (stable). Entries with
 * `width === 0` originate from a source that does not encode an explicit
 * resolution (e.g. Established Timings III bit indices); their `rank` and
 * `source` still place them correctly in the policy order.
 *
 * @param eedid the decoded EEDID container (base block + extensions).
 */
export function collectTimingsByPriority(eedid: EEDID): TimingEntry[] {
  const entries: TimingEntry[] = [];

  // Rank 1 — Preferred Timing Mode (first base DTD, §5 Note 2).
  // Rank 2 — other base DTDs, in slot order (§5 Note 3).
  const baseDtds = eedid.base.detailedTimings;
  for (let i = 0; i < baseDtds.length; i++) {
    const t = baseDtds[i];
    const isFirst = i === 0;
    entries.push({
      rank: isFirst ? TIMING_PRIORITY_RANK.preferred : TIMING_PRIORITY_RANK.detailedBase,
      source: isFirst ? 'preferred' : 'detailedBase',
      width: t.horizontalActive,
      height: t.verticalActive,
      refreshRate: t.refreshRate,
      preferred: isFirst || undefined,
      label: labelOf(t.horizontalActive, t.verticalActive, t.refreshRate),
    });
  }

  // Rank 3 — additional DTDs in extension blocks (CTA-861, §5 Note 4).
  const cea: CEAExtensionBlock | null = getCEAExtension(eedid);
  if (cea) {
    for (const t of cea.detailedTimings) {
      const refreshRate = detailedRefreshRate(t);
      entries.push({
        rank: TIMING_PRIORITY_RANK.detailedExtension,
        source: 'detailedExtension',
        width: t.horizontalActive,
        height: t.verticalActive,
        refreshRate,
        native: t.isNative || undefined,
        label: labelOf(t.horizontalActive, t.verticalActive, refreshRate),
      });
    }
  }

  // Rank 4 — 3-byte CVT codes from Display Descriptors (§5 Note 5).
  for (const desc of eedid.base.displayDescriptors) {
    if (!isCVTDescriptor(desc)) continue;
    for (const c of desc.timings) {
      const width = round8(cvtWidth(c.addressableLines, c.aspectRatio));
      entries.push({
        rank: TIMING_PRIORITY_RANK.cvt,
        source: 'cvt',
        width,
        height: c.addressableLines,
        refreshRate: c.preferredRefreshRate,
        label: labelOf(width, c.addressableLines, c.preferredRefreshRate),
      });
    }
  }

  // Rank 5 — Standard Timings (base 2-byte codes, §5 Note 6) + the Standard
  // Timing Display Descriptor (tag 0xFA).
  for (const s of eedid.base.standardTimings) {
    if (!s.isValid) continue;
    entries.push({
      rank: TIMING_PRIORITY_RANK.standard,
      source: 'standard',
      width: s.width,
      height: s.height,
      refreshRate: s.refreshRate,
      label: labelOf(s.width, s.height, s.refreshRate),
    });
  }
  for (const desc of eedid.base.displayDescriptors) {
    if (!isStandardTimingIdDescriptor(desc)) continue;
    for (const s of desc.timings) {
      entries.push({
        rank: TIMING_PRIORITY_RANK.standard,
        source: 'standard',
        width: s.width,
        height: s.height,
        refreshRate: s.refreshRate,
        label: labelOf(s.width, s.height, s.refreshRate),
      });
    }
  }

  // Rank 6 — Established Timings I & II (base bit set) and Established
  // Timings III (tag 0xF7). Established Timings carry no inherent order
  // (§5 Note 7.1); we emit them in bit/declaration order. ET III bit indices
  // have no modeled DMT mapping, so width/height are left 0.
  for (const e of eedid.base.establishedTimings) {
    if (e.isReserved) continue;
    entries.push({
      rank: TIMING_PRIORITY_RANK.established,
      source: 'established',
      width: e.width,
      height: e.height,
      refreshRate: e.refreshRate,
      label: labelOf(e.width, e.height, e.refreshRate),
    });
  }
  for (const desc of eedid.base.displayDescriptors) {
    if (!isEstablishedTimingsIIIDescriptor(desc)) continue;
    for (const bit of desc.timings) {
      entries.push({
        rank: TIMING_PRIORITY_RANK.established,
        source: 'established',
        width: 0,
        height: 0,
        refreshRate: 0,
        label: `Established Timing III bit ${bit}`,
      });
    }
  }

  // Rank 7 — CTA-861 Video Data Block VICs (appended; see module docs).
  if (cea) {
    for (const block of cea.dataBlocks) {
      if (!isVideoDataBlock(block)) continue;
      for (const v of block.vics) {
        const def = getVICDefinition(v.vic);
        entries.push({
          rank: TIMING_PRIORITY_RANK.ctaVic,
          source: 'ctaVic',
          width: def?.width ?? 0,
          height: def?.height ?? 0,
          refreshRate: def?.refreshRate ?? 0,
          native: v.native || undefined,
          vic: v.vic,
          label: def?.name ?? `VIC ${v.vic}`,
        });
      }
    }
  }

  return entries;
}