/**
 * A cross-format reference to a single video mode.
 *
 * EDID, CTA-861, and DisplayID each have their own way of pointing at a video
 * mode: CTA-861 Video Data Blocks carry VIC/SVD numbers, DisplayID 2.0 Type
 * VIII blocks carry DMT/CTA/HDMI enumerated codes, and the base EDID advertises
 * Detailed Timings, Standard Timings, and CVT codes. `VideoModeRef` is the
 * shared shape that lets a consumer treat all of those uniformly — "this entry
 * refers to video mode X, identified by code Y in namespace Z".
 *
 * The on-wire block structures are unchanged; `VideoModeRef` is a derived view
 * produced by adapters (`ctaVicRef`, `displayIdEnumeratedRef`, …) and the
 * `collectVideoModeRefs` walker in `eedid/video-mode-ref.ts`.
 */

/**
 * The namespace a `VideoModeRef` points into.
 *
 * - `cta-vic` — CTA-861 Video Data Block VIC/SVD number.
 * - `displayid-enumerated` — DisplayID 2.0 Type VIII enumerated timing code
 *   (DMT / CTA VIC / HDMI VIC, distinguished by `codeType`).
 * - `dtd` — a Detailed Timing Descriptor (base EDID, CTA-861, or DisplayID
 *   Type VII/IX). `code` is the 0-based slot/index when known.
 * - `standard` — an EDID 1.4 Standard Timing (2-byte code).
 * - `cvt` — a CVT 3-byte code from a Display Descriptor (tag 0xF8).
 */
export type VideoModeSource =
  | 'cta-vic'
  | 'displayid-enumerated'
  | 'dtd'
  | 'standard'
  | 'cvt';

/**
 * A single video-mode reference.
 *
 * Optional fields are omitted entirely (not set to `undefined`) when the
 * source does not carry them, so adapters produce clean objects.
 */
export interface VideoModeRef {
  /** Which namespace this reference points into. */
  source: VideoModeSource;
  /**
   * Source-specific mode code: CTA VIC, DisplayID DMT/CTA/HDMI code, DTD slot
   * index, EDID Standard Timing 2-byte code, or CVT addressable-line count.
   * Omitted when the source carries no single numeric code.
   */
  code?: number;
  /**
   * DisplayID enumerated code namespace (only for `source: 'displayid-enumerated'`):
   * 0 = DMT, 1 = CTA VIC, 2 = HDMI VIC, 3 = reserved.
   */
  codeType?: number;
  /** True when the source marks this mode as native / preferred. */
  native?: boolean;
}

/** Reference a CTA-861 Video Data Block VIC (SVD). */
export function ctaVicRef(vic: number, native?: boolean): VideoModeRef {
  return { source: 'cta-vic', code: vic, ...(native ? { native } : {}) };
}

/** Reference a DisplayID 2.0 Type VIII enumerated timing code. */
export function displayIdEnumeratedRef(
  code: number,
  codeType: number,
  native?: boolean,
): VideoModeRef {
  return {
    source: 'displayid-enumerated',
    code,
    codeType,
    ...(native ? { native } : {}),
  };
}

/** Reference a Detailed Timing Descriptor by its 0-based slot/index. */
export function dtdRef(code?: number, native?: boolean): VideoModeRef {
  return {
    source: 'dtd',
    ...(code !== undefined ? { code } : {}),
    ...(native ? { native } : {}),
  };
}

/** Reference an EDID 1.4 Standard Timing by its 2-byte code. */
export function standardRef(code: number): VideoModeRef {
  return { source: 'standard', code };
}

/** Reference a CVT 3-byte code (identified by its addressable-line count). */
export function cvtRef(code?: number): VideoModeRef {
  return { source: 'cvt', ...(code !== undefined ? { code } : {}) };
}