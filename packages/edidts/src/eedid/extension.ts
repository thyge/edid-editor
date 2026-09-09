/**
 * EEDID extension-block dispatch.
 *
 * The EEDID container doesn't itself know the format of each extension block —
 * it routes by the leading tag byte to a per-spec codec. Only two specs have
 * first-class names: CTA-861 (`tag === 0x02`) and DisplayID 2.0 (`tag === 0x70`).
 * VTB and Block Map (both consumed by `ExtensionBlockParser`) and any other tag
 * fall through to `OpaqueExtension`, which preserves the raw 128 bytes.
 *
 * The VTB (0x10) and Block Map (0xF0) arms still pass through the CTA parser —
 * they just don't earn a named slot in the EEDID-level `Extension` union. The
 * CTA parser returns its own typed shape for those; here we collapse them to
 * opaque so EEDID consumers see a stable, narrow union.
 */

import {
  ExtensionBlockParser,
  type CEAExtensionBlock,
  type ExtensionBlock,
} from '../cta/extension-block';
import { decodeDisplayIdSections, encodeDisplayIdSection } from '../displayid/section';
import type { DisplayIdSection } from '../displayid/types';
import { checksum8, isChecksum8Valid } from '../common/checksum';

export type CEAExtension = CEAExtensionBlock;

export interface DisplayIdExtension {
  kind: 'displayid';
  tag: 0x70;
  revision: number;
  /**
   * The FIRST DisplayID section in this extension block. Kept for backward
   * compatibility — the Vue UI reads `displayId.section` extensively. New
   * consumers should prefer `sections` (which holds every chained section).
   */
  section: DisplayIdSection;
  /**
   * ALL concatenated DisplayID sections carried by this `0x70` extension
   * block. A single-block payload has exactly one section; when the base
   * section's `extensionCount > 0` additional sections follow it and are
   * preserved here so multi-section payloads round-trip. Optional only so
   * legacy callers that construct an extension literal with just `section`
   * keep type-checking — `encodeDisplayId` falls back to `[ext.section]`
   * when this is absent; `decodeDisplayId` always populates it.
   */
  sections?: DisplayIdSection[];
  /**
   * Verbatim bytes occupying the `0x70` block payload AFTER the last decoded
   * section (bytes `1 + sectionsTotalLength .. 126`; byte 127 is the EDID block
   * checksum and is not part of this). Real-world fixtures sometimes carry
   * non-zero trailing bytes here (stray padding, an un-walked second section
   * the version-byte walk stopped before, etc.). The structured decode path
   * preserves them verbatim so the block round-trips byte-exactly — matching
   * the opaque fallback's byte preservation and avoiding a regression when a
   * v1.x/v2.0 section does not fill the whole 126-byte payload. Empty when the
   * sections fill the payload exactly.
   */
  trailingBytes?: Uint8Array;
  checksum: number;
  /**
   * True iff this 0x70 extension block's byte-127 EDID block checksum is valid.
   * Each carried section's own section-level checksum validity is exposed on
   * `sections[].isChecksumValid`. Always populated by `decodeDisplayId`;
   * optional so programmatic literals type-check without it.
   */
  checksumValid?: boolean;
}

export interface OpaqueExtension {
  kind: 'opaque';
  tag: number;
  revision: number;
  bytes: Uint8Array;
  checksum: number;
  /**
   * True iff the 128-byte block's byte-127 8-bit checksum is valid. Always
   * populated by `decodeOpaque`; optional so programmatic literals type-check.
   */
  checksumValid?: boolean;
}

export type Extension = CEAExtension | DisplayIdExtension | OpaqueExtension;

export interface ExtensionDispatch {
  tag: number;
  decode(bytes: Uint8Array): Extension;
  encode(ext: Extension): Uint8Array;
}

export function isCEAExtension(ext: Extension): ext is CEAExtension {
  return ext.tag === 0x02;
}

export function isDisplayIdExtension(ext: Extension): ext is DisplayIdExtension {
  return (ext as { kind?: string }).kind === 'displayid';
}

export function isOpaqueExtension(ext: Extension): ext is OpaqueExtension {
  return (ext as { kind?: string }).kind === 'opaque';
}

// ---------------------------------------------------------------------------
// Tag → {decode, encode} registry — the single dispatch site for EEDID
// extension blocks. Only CTA-861 (0x02) and DisplayID (0x70)
// have first-class dispatch entries; every other tag, plus any 0x02/0x70
// block whose structured parse failed or was refused, falls through to the
// opaque default entry. Mirrors mp4box BoxRegistry: the per-spec codecs stay
// free-standing, the registry is just the dispatch table plus an opaque
// default. The same three dispatch objects serve encode — routed by kind,
// not tag, so an OpaqueExtension carrying tag 0x02/0x70 still encodes as
// verbatim opaque bytes rather than being re-dispatched as structured.
// ---------------------------------------------------------------------------

const OPAQUE_EXTENSION_DISPATCH: ExtensionDispatch = {
  // Sentinel tag — the opaque entry is never keyed in the registry; it is the
  // default returned by the `?? OPAQUE_EXTENSION_DISPATCH` fallback for any
  // tag without a structured entry.
  tag: 0xff,
  decode: (bytes) => decodeOpaque(bytes),
  encode: (ext) => encodeOpaque(ext as OpaqueExtension),
};

const CTA_DISPATCH: ExtensionDispatch = {
  tag: 0x02,
  decode: (bytes) => {
    // Parse as CTA-861; on any parse error (or a non-0x02 result) fall back
    // to opaque, mirroring the DisplayID arm's try/catch → opaque pattern so
    // a single malformed CTA block never crashes the whole EEDID decode.
    try {
      const cta = ExtensionBlockParser.decode(bytes);
      if (cta && cta.tag === 0x02) {
        return cta as CEAExtension;
      }
    } catch {
      // fall through to opaque
    }
    return decodeOpaque(bytes);
  },
  encode: (ext) => ExtensionBlockParser.encode(ext as CEAExtension),
};

const DISPLAYID_DISPATCH: ExtensionDispatch = {
  tag: 0x70,
  decode: (bytes) => decodeDisplayId(bytes),
  encode: (ext) => encodeDisplayId(ext as DisplayIdExtension),
};

const EXTENSION_DISPATCHERS: Partial<Record<number, ExtensionDispatch>> = {
  0x02: CTA_DISPATCH,
  0x70: DISPLAYID_DISPATCH,
};

export function decodeExtension(bytes: Uint8Array): Extension {
  if (bytes.length < 128) {
    throw new Error(`Extension block must be at least 128 bytes; got ${bytes.length}`);
  }

  const tag = bytes[0];
  return (EXTENSION_DISPATCHERS[tag] ?? OPAQUE_EXTENSION_DISPATCH).decode(bytes);
}

export function encodeExtension(ext: Extension): Uint8Array {
  // Encode is kind-based, not tag-based: an OpaqueExtension that carries tag
  // 0x02 or 0x70 (decoded opaque because the structured parse failed or was
  // never attempted) must encode as verbatim opaque bytes, not be re-dispatched
  // as CTA/DisplayID. So route by kind into the same dispatch objects rather
  // than by tag — decode is tag-based, encode is kind-based (asymmetric).
  if (isCEAExtension(ext)) {
    return CTA_DISPATCH.encode(ext);
  }
  if (isDisplayIdExtension(ext)) {
    return DISPLAYID_DISPATCH.encode(ext);
  }
  return OPAQUE_EXTENSION_DISPATCH.encode(ext);
}

function decodeOpaque(bytes: Uint8Array): OpaqueExtension {
  return {
    kind: 'opaque',
    tag: bytes[0],
    revision: bytes[1],
    bytes: bytes.slice(),
    checksum: bytes[127],
    checksumValid: isChecksum8Valid(bytes),
  };
}

function encodeOpaque(ext: OpaqueExtension): Uint8Array {
  const out = ext.bytes.length >= 128
    ? ext.bytes.slice(0, 128)
    : new Uint8Array(128).map((_, i) => ext.bytes[i] ?? 0);
  out[127] = checksum8(out, 127);
  return out;
}

function decodeDisplayId(bytes: Uint8Array): DisplayIdExtension | OpaqueExtension {
  try {
    // DisplayID sections embedded in EDID extension blocks start at byte 1
    // (byte 0 is the EDID tag = 0x70). The DisplayID payload occupies bytes
    // 1..126; byte 127 is the EDID block checksum and is NOT part of any
    // section. Walk every concatenated section in that payload so multi-
    // section chains (base section extensionCount > 0) are preserved.
    const payload = bytes.subarray(1, 127);
    const sections = decodeDisplayIdSections(payload);
    if (sections.length === 0) {
      return decodeOpaque(bytes);
    }
    const section = sections[0];
    // Capture any bytes after the last decoded section verbatim. The version-
    // byte walk stops when the next byte is not a section version, so whatever
    // remains here (zero padding, stray non-zero bytes, an un-walked tail) is
    // outside the structured section model. Preserve it so the block round-
    // trips byte-exactly, matching the opaque fallback.
    const sectionsTotalLength = sections.reduce((sum, s) => sum + s.totalLength, 0);
    const trailingBytes = sectionsTotalLength < payload.length
      ? payload.slice(sectionsTotalLength)
      : new Uint8Array();
    return {
      kind: 'displayid',
      tag: 0x70,
      revision: section.revision,
      section,
      sections,
      trailingBytes,
      checksum: bytes[127],
      checksumValid: isChecksum8Valid(bytes),
    };
  } catch {
    return decodeOpaque(bytes);
  }
}

function encodeDisplayId(ext: DisplayIdExtension): Uint8Array {
  // Encode every chained section. Fall back to the single `section` field for
  // any extension built the old way (no `sections` array) so the common
  // single-section path stays byte-identical.
  const sections = ext.sections && ext.sections.length > 0
    ? ext.sections
    : [ext.section];
  const encodedSections = sections.map(encodeDisplayIdSection);
  const totalLength = encodedSections.reduce((sum, s) => sum + s.length, 0);

  const out = new Uint8Array(128);
  // byte 0 is the EDID tag (0x70); section content starts at byte 1
  out[0] = 0x70;
  const available = Math.min(totalLength, 127);
  let offset = 1;
  let remaining = available;
  for (const encoded of encodedSections) {
    if (remaining <= 0) break;
    const take = Math.min(encoded.length, remaining);
    out.set(encoded.subarray(0, take), offset);
    offset += take;
    remaining -= take;
  }
  // Re-write any verbatim trailing bytes that followed the last decoded section
  // (bytes after the section content, up to byte 126) so a block that does not
  // fill the 126-byte payload round-trips byte-exactly.
  if (ext.trailingBytes && ext.trailingBytes.length > 0) {
    const trailingStart = 1 + Math.min(totalLength, 127);
    const capacity = 127 - trailingStart;
    if (capacity > 0) {
      const take = Math.min(ext.trailingBytes.length, capacity);
      out.set(ext.trailingBytes.subarray(0, take), trailingStart);
    }
  }
  out[127] = checksum8(out, 127);
  return out;
}

/**
 * For CTA-parser-only arm detection (used by tests that want to assert the
 * "named" EEDID arm matches the underlying CTA-arm). Returns the raw CTA
 * parser result for tag 0x02/0x10/0xF0; returns null for any other tag.
 */
export function decodeCtaExtensionBlock(bytes: Uint8Array): ExtensionBlock | null {
  return ExtensionBlockParser.decode(bytes);
}

/**
 * Find the first CEA extension in an EEDID's extension list, or null.
 */
export function getCEAExtension(eedid: { extensions: Extension[] }): CEAExtension | null {
  return eedid.extensions.find((ext) => isCEAExtension(ext)) ?? null;
}

/** Section-content capacity of the 0x70 DisplayID extension payload: bytes
 *  1..126 of the 128-byte EDID extension block (byte 0 is the 0x70 tag,
 *  byte 127 is the EDID block checksum, which is not part of any section).
 *  `encodeDisplayId` silently truncates section content beyond this, so the
 *  editor gates every Add Block / Add Section action on it. */
export const DISPLAY_ID_PAYLOAD_CAPACITY_BYTES = 126;

/** Bytes still free in the 0x70 payload for additional section content:
 *  capacity minus every chained section's encoded length and the verbatim
 *  trailing bytes. Adding a data block (or a whole section) consumes from
 *  this one shared budget regardless of which section it lands in — the
 *  DisplayID counterpart of `ExtensionBlockParser.getCeaFreePayloadBytes`. */
export function getDisplayIdFreePayloadBytes(ext: DisplayIdExtension): number {
  const sections = ext.sections && ext.sections.length > 0 ? ext.sections : [ext.section];
  const used = sections.reduce(
    (sum, section) => sum + encodeDisplayIdSection(section).length,
    0,
  ) + (ext.trailingBytes?.length ?? 0);
  return DISPLAY_ID_PAYLOAD_CAPACITY_BYTES - used;
}

/**
 * Find the first DisplayID extension in an EEDID's extension list, or null.
 */
export function getDisplayIdExtension(eedid: { extensions: Extension[] }): DisplayIdExtension | null {
  return eedid.extensions.find((ext) => isDisplayIdExtension(ext)) ?? null;
}
