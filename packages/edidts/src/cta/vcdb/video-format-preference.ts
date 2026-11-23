/**
 * Video Format Preference Data Block (CTA-861-G §7.5.8, Extended Tag 13)
 *
 * VCDB-family block (see `cta/vcdb/`): indicates preferred video formats in order.
 *
 * Each body byte is a Short Video Reference (SVR). Value ranges follow
 * edid-decode `cta_print_svr` (parse-cta-block.cpp), which tracks CTA-861-H:
 *
 *   1–127, 193–253  VIC
 *   129–144         DTD 1–16 (the Nth detailed timing in the EDID)
 *   145–160         VTDB 1–16 (the Nth DisplayID Type VII/VIII/X timing)
 *   161–175         RID of the first Video Format Data Block entry, at
 *                   frame-rate index 1–15
 *   254             the Type VIII (DMT) timing of the T8VTDB
 *   0, 128, 176–192, 255  reserved
 *
 * Every byte value decodes to exactly one SVR shape and encodes back to the
 * same byte, reserved values included.
 */

import type { ExtendedDataBlock } from '../cta-extended-blocks';
import { clampByte, clampInt } from '../byte-utils';

/** One Short Video Reference; exactly one of the fields is set. */
export interface VideoFormatPreferenceSvr {
  /** SVR 1–127 or 193–253: a VIC. */
  vic?: number;
  /** SVR 129–144: DTD index 1–16 (SVR − 128). */
  dtdIndex?: number;
  /** SVR 145–160: DisplayID Type VII/VIII/X timing index 1–16 (SVR − 144). */
  vtdbIndex?: number;
  /** SVR 161–175: frame-rate index 1–15 (SVR − 160) applied to the first VFDB RID. */
  ridRateIndex?: number;
  /** SVR 254: the T8VTDB timing. */
  t8vtdb?: boolean;
  /** A reserved SVR value (0, 128, 176–192, 255), kept as the raw byte. */
  reserved?: number;
}

export interface VideoFormatPreferenceDataBlock extends ExtendedDataBlock {
  tag: 0x07;
  extendedTag: 0x0D;
  svrs: VideoFormatPreferenceSvr[];
}

/** Decode one SVR byte (see the table at the top of this file). */
export function decodeSvr(svr: number): VideoFormatPreferenceSvr {
  if ((svr >= 1 && svr <= 127) || (svr >= 193 && svr <= 253)) return { vic: svr };
  if (svr >= 129 && svr <= 144) return { dtdIndex: svr - 128 };
  if (svr >= 145 && svr <= 160) return { vtdbIndex: svr - 144 };
  if (svr >= 161 && svr <= 175) return { ridRateIndex: svr - 160 };
  if (svr === 254) return { t8vtdb: true };
  return { reserved: svr };
}

/**
 * Pin a VIC to one an SVR can carry (1–127 or 193–253). A value in the
 * 128–192 gap goes to the nearer end instead of turning into a DTD/VTDB/RID
 * reference.
 */
function clampSvrVic(vic: number): number {
  const v = clampInt(vic, 1, 253);
  if (v >= 128 && v <= 192) return v <= 160 ? 127 : 193;
  return v;
}

/** Encode one SVR (inverse of {@link decodeSvr}); indexes are clamped to their ranges. */
export function encodeSvr(svr: VideoFormatPreferenceSvr): number {
  if (svr.vic !== undefined) return clampSvrVic(svr.vic);
  if (svr.dtdIndex !== undefined) return 128 + clampInt(svr.dtdIndex, 1, 16);
  if (svr.vtdbIndex !== undefined) return 144 + clampInt(svr.vtdbIndex, 1, 16);
  if (svr.ridRateIndex !== undefined) return 160 + clampInt(svr.ridRateIndex, 1, 15);
  if (svr.t8vtdb) return 254;
  return clampByte(svr.reserved ?? 0);
}

export function decodeVideoFormatPreferenceBlock(base: ExtendedDataBlock, payload: Uint8Array): VideoFormatPreferenceDataBlock {
  return {
    ...base,
    extendedTag: 0x0D,
    svrs: Array.from(payload, decodeSvr),
  };
}

export function encodeVideoFormatPreferenceBlock(block: VideoFormatPreferenceDataBlock): Uint8Array {
  return new Uint8Array([0x0d, ...block.svrs.map(encodeSvr)]);
}
