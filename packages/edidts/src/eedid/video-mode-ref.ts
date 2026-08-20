/**
 * Cross-format video-mode reference collection.
 *
 * Walks an `EEDID` and emits a `VideoModeRef` for every video-mode-bearing
 * entry across the base EDID, the CTA-861 extension, and the DisplayID 2.0
 * extension(s). This is the consumer-facing view adopted from the per-block
 * adapter builders in `common/video-mode-ref.ts`.
 *
 * Sources, in collection order:
 *   1. base EDID Detailed Timings (slot 0 = Preferred Timing Mode → native)
 *   2. base EDID Standard Timings + the 0xFA Standard Timing ID descriptor
 *   3. base EDID CVT codes (0xF8 display descriptor)
 *   4. CTA-861 Video Data Block VICs, then CTA Detailed Timings
 *   5. DisplayID 2.0 Type VIII enumerated codes, then Type VII / Type IX DTDs
 *
 * The collection is a flat index for inspection/UI; ordering follows the
 * structure walk (base → CEA → DisplayID). It is *not* the VESA E-EDID §5
 * timing-priority order — see `eedid/timing-priority.ts` for that.
 */
import type { EEDID } from './eedid';
import { getCEAExtension, getDisplayIdExtension } from './extension';
import type { VideoDataBlock } from '../cta/extension-block';
import {
  DisplayIdDataBlockTag,
  type DisplayIdTypeVIIIEnumeratedTimingCodeBlock,
  type DisplayIdTypeVIIDetailedTimingBlock,
  type DisplayIdTypeIXFormulaBasedTimingBlock,
} from '../displayid/types';
import type {
  CVTTimingDescriptor,
  StandardTimingIdDescriptor,
} from '../edid/display-descriptor';
import { standardTimingAspectCodeFor } from '../common/aspect-ratios';
import {
  ctaVicRef,
  displayIdEnumeratedRef,
  dtdRef,
  standardRef,
  cvtRef,
  type VideoModeRef,
} from '../common/video-mode-ref';

function isVideoDataBlock(b: { tag: number }): b is VideoDataBlock {
  return b.tag === 0x02;
}

function isTypeVII(b: { tag: number }): b is DisplayIdTypeVIIDetailedTimingBlock {
  return b.tag === DisplayIdDataBlockTag.TypeVIIDetailedTiming;
}

function isTypeVIII(b: { tag: number }): b is DisplayIdTypeVIIIEnumeratedTimingCodeBlock {
  return b.tag === DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode;
}

function isTypeIX(b: { tag: number }): b is DisplayIdTypeIXFormulaBasedTimingBlock {
  return b.tag === DisplayIdDataBlockTag.TypeIXFormulaBasedTiming;
}

function isCVTDescriptor(d: { tag: number }): d is CVTTimingDescriptor {
  return d.tag === 0xF8;
}

function isStandardTimingIdDescriptor(d: { tag: number }): d is StandardTimingIdDescriptor {
  return d.tag === 0xFA;
}

/**
 * Compute the EDID 1.4 Standard Timing 2-byte code (byte0 = (width/8 − 31),
 * byte1 = (aspectCode << 6) | (refresh − 60)) packed big-endian, mirroring
 * `StandardTiming.encode`. Returns `undefined` for invalid/placeholder timings.
 */
function standardTimingCode(width: number, height: number, refreshRate: number): number | undefined {
  if (width <= 0 || height <= 0 || refreshRate <= 0) return undefined;
  const t1 = Math.round(width / 8) - 31;
  if (t1 < 0 || t1 > 255) return undefined;
  const aspectCode = standardTimingAspectCodeFor(width, height);
  const t2 = ((aspectCode & 0x03) << 6) | ((refreshRate - 60) & 0x3f);
  return ((t1 & 0xff) << 8) | (t2 & 0xff);
}

/**
 * Collect every video-mode reference advertised by an EEDID, across the base
 * block, the CTA-861 extension, and the DisplayID 2.0 extension(s).
 *
 * @param eedid the decoded EEDID container (base block + extensions).
 */
export function collectVideoModeRefs(eedid: EEDID): VideoModeRef[] {
  const refs: VideoModeRef[] = [];

  // 1. Base EDID Detailed Timings. Slot 0 is the Preferred Timing Mode
  // (VESA E-EDID A2 §3.10.1) — surfaced as `native: true`.
  const baseDtds = eedid.base.detailedTimings;
  for (let i = 0; i < baseDtds.length; i++) {
    refs.push(dtdRef(i, i === 0 ? true : undefined));
  }

  // 2. Base EDID Standard Timings (2-byte codes) + the 0xFA descriptor.
  for (const s of eedid.base.standardTimings) {
    const code = standardTimingCode(s.width, s.height, s.refreshRate);
    if (code === undefined) continue;
    refs.push(standardRef(code));
  }
  for (const desc of eedid.base.displayDescriptors) {
    if (!isStandardTimingIdDescriptor(desc)) continue;
    for (const s of desc.timings) {
      const code = standardTimingCode(s.width, s.height, s.refreshRate);
      if (code === undefined) continue;
      refs.push(standardRef(code));
    }
  }

  // 3. Base EDID CVT codes (0xF8 display descriptor).
  for (const desc of eedid.base.displayDescriptors) {
    if (!isCVTDescriptor(desc)) continue;
    for (const c of desc.timings) {
      refs.push(cvtRef(c.addressableLines));
    }
  }

  // 4. CTA-861 extension: Video Data Block VICs, then Detailed Timings.
  const cea = getCEAExtension(eedid);
  if (cea) {
    for (const block of cea.dataBlocks) {
      if (!isVideoDataBlock(block)) continue;
      for (const v of block.vics) {
        refs.push(ctaVicRef(v.vic, v.native ? true : undefined));
      }
    }
    cea.detailedTimings.forEach((t, i) => {
      refs.push(dtdRef(i, t.isNative ? true : undefined));
    });
  }

  // 5. DisplayID 2.0 extension(s): Type VIII enumerated codes, then
  // Type VII / Type IX detailed timings.
  const displayId = getDisplayIdExtension(eedid);
  if (displayId) {
    const sections = displayId.sections ?? [displayId.section];
    for (const section of sections) {
      let dtdIndex = 0;
      for (const block of section.blocks) {
        if (isTypeVIII(block)) {
          for (const code of block.timingCodes) {
            refs.push(displayIdEnumeratedRef(code, block.codeType));
          }
        } else if (isTypeVII(block)) {
          for (const t of block.timings) {
            refs.push(dtdRef(dtdIndex++, t.preferred ? true : undefined));
          }
        } else if (isTypeIX(block)) {
          for (const _t of block.timings) {
            refs.push(dtdRef(dtdIndex++));
          }
        }
      }
    }
  }

  return refs;
}