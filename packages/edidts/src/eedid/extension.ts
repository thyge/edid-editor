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
import {
  decodeDisplayIdSections,
  encodeDisplayIdSection,
  getDisplayIdSectionFillLength,
  getDisplayIdSectionFixedLength,
  isDisplayIdSectionFillElastic,
} from '../displayid/section';
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
   * checksum and is not part of this). Normally all zero padding; real-world
   * fixtures sometimes carry non-zero bytes here (stray padding, an un-walked
   * tail). Non-zero bytes are written back verbatim after the sections; zero
   * padding is free space that grown sections may use (see
   * {@link getDisplayIdFreePayloadBytes}). Empty when the sections fill the
   * payload exactly.
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
  const sections = displayIdSectionsOf(ext);
  const layout = layoutDisplayIdPayload(ext);
  if (layout.freeBytes < 0) {
    throw new Error(
      `DisplayID data does not fit: it needs ${DISPLAY_ID_PAYLOAD_CAPACITY_BYTES - layout.freeBytes} bytes `
      + `but a DisplayID extension block holds ${DISPLAY_ID_PAYLOAD_CAPACITY_BYTES}. Remove a data block or timing.`,
    );
  }

  const out = new Uint8Array(128);
  // byte 0 is the EDID tag (0x70); section content starts at byte 1
  out[0] = 0x70;
  let offset = 1;
  sections.forEach((section, index) => {
    const encoded = encodeDisplayIdSection(section, layout.fillLengths[index]);
    out.set(encoded, offset);
    offset += encoded.length;
  });
  // Non-zero trailing bytes follow the sections verbatim; zero padding is
  // already there (the buffer starts zeroed).
  out.set(layout.trailing, offset);
  out[127] = checksum8(out, 127);
  return out;
}

/** Every section a 0x70 block carries (`sections`, or the legacy `section`). */
function displayIdSectionsOf(ext: DisplayIdExtension): DisplayIdSection[] {
  return ext.sections && ext.sections.length > 0 ? ext.sections : [ext.section];
}

/** `bytes` without its run of trailing 0x00 bytes. */
function trimTrailingZeros(bytes: Uint8Array | undefined): Uint8Array {
  if (!bytes) return new Uint8Array(0);
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end--;
  return bytes.subarray(0, end);
}

interface DisplayIdPayloadLayout {
  /** Fill length to write for each section (zero fill possibly shrunk). */
  fillLengths: number[];
  /** Trailing bytes to write after the sections (zero padding trimmed off). */
  trailing: Uint8Array;
  /** Payload bytes left once every section and the trailing bytes are placed; negative when they do not fit. */
  freeBytes: number;
}

/**
 * Plan how the sections fill the 126-byte payload. Zero fill inside a section
 * and zero padding after the last section are free space: when the content
 * grows, the padding after the sections absorbs it first, then sections give
 * up zero fill (last section first) — so a full-length section (length byte
 * 0x79) keeps its length and stays valid when a block is added. Unedited
 * content keeps every fill byte, so open-and-save stays byte-exact.
 */
function layoutDisplayIdPayload(ext: DisplayIdExtension): DisplayIdPayloadLayout {
  const sections = displayIdSectionsOf(ext);
  const trailing = trimTrailingZeros(ext.trailingBytes);
  const fixedLength = sections.reduce((sum, section) => sum + getDisplayIdSectionFixedLength(section), 0)
    + trailing.length;
  const freeBytes = DISPLAY_ID_PAYLOAD_CAPACITY_BYTES - fixedLength;

  const fillLengths = sections.map((section) =>
    isDisplayIdSectionFillElastic(section) ? getDisplayIdSectionFillLength(section) : 0,
  );
  let excess = fillLengths.reduce((sum, length) => sum + length, 0) - Math.max(0, freeBytes);
  for (let index = fillLengths.length - 1; index >= 0 && excess > 0; index--) {
    const cut = Math.min(fillLengths[index], excess);
    fillLengths[index] -= cut;
    excess -= cut;
  }
  return {
    // Non-zero fill is always written verbatim (the section encoder ignores
    // the override for it); report its real length for clarity.
    fillLengths: sections.map((section, index) =>
      isDisplayIdSectionFillElastic(section) ? fillLengths[index] : getDisplayIdSectionFillLength(section),
    ),
    trailing,
    freeBytes,
  };
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
 *  `encodeDisplayId` throws when the content does not fit, so the editor
 *  gates every Add Block / in-block add on {@link getDisplayIdFreePayloadBytes}. */
export const DISPLAY_ID_PAYLOAD_CAPACITY_BYTES = 126;

/** Bytes still free in this 0x70 block's payload for more section content:
 *  capacity minus every section's header, data blocks, checksum and any
 *  non-zero fill/trailing bytes. Zero fill inside a section and zero padding
 *  after the last one count as free — the encoder gives them up when content
 *  grows. Adding a data block (or growing one) in any section of this block
 *  draws from this one budget; the DisplayID counterpart of
 *  `ExtensionBlockParser.getCeaFreePayloadBytes`. Negative when the content
 *  already does not fit (encoding then throws). */
export function getDisplayIdFreePayloadBytes(ext: DisplayIdExtension): number {
  return layoutDisplayIdPayload(ext).freeBytes;
}

/** The length each section of this 0x70 block encodes to, in `sections`
 *  order — including the zero fill that is left once grown content has used
 *  what it needs (see `layoutDisplayIdPayload`). */
export function getDisplayIdSectionEncodedLengths(ext: DisplayIdExtension): number[] {
  const { fillLengths } = layoutDisplayIdPayload(ext);
  return displayIdSectionsOf(ext).map((section, index) =>
    getDisplayIdSectionFixedLength(section) + (isDisplayIdSectionFillElastic(section) ? fillLengths[index] : 0),
  );
}

// ---------------------------------------------------------------------------
// The DisplayID section chain across 0x70 extension blocks.
//
// Inside an EDID each DisplayID section travels in its own 0x70 extension
// block: edid-decode parses exactly one section per block (bytes 1..126,
// parse_displayid_block), treats the first 0x70 block as the base section and
// every later one as an extension section, and checks the base section's
// extension count against the number of further 0x70 blocks ("Expected N
// DisplayID Extension Blocks, but got M"). Older files that packed several
// sections into one block still decode (`DisplayIdExtension.sections`) and
// round-trip; new sections always get a block of their own.
// ---------------------------------------------------------------------------

/** One section of the EDID's DisplayID structure and the block carrying it. */
export interface DisplayIdChainEntry {
  /** The 0x70 extension block that carries the section. */
  extension: DisplayIdExtension;
  /** Index of that block in the EDID's `extensions` list. */
  extensionIndex: number;
  /** Index of the section inside the block's `sections`. */
  indexInExtension: number;
  section: DisplayIdSection;
}

/** Every DisplayID section of the EDID in wire order — the base section
 *  first, then each extension section — with the 0x70 block it lives in. */
export function getDisplayIdSectionChain(eedid: { extensions: Extension[] }): DisplayIdChainEntry[] {
  const chain: DisplayIdChainEntry[] = [];
  eedid.extensions.forEach((extension, extensionIndex) => {
    if (!isDisplayIdExtension(extension)) return;
    displayIdSectionsOf(extension).forEach((section, indexInExtension) => {
      chain.push({ extension, extensionIndex, indexInExtension, section });
    });
  });
  return chain;
}

/**
 * Add an empty extension section to the EDID's DisplayID structure, in a new
 * 0x70 block placed right after the last DisplayID block, and set the base
 * section's extension count to the new number of extension sections. The new
 * section copies the base section's version (edid-decode requires extension
 * sections to match it) and carries no product type and no extension count,
 * as extension sections must. Returns the new extensions list; throws when the
 * EDID has no DisplayID extension.
 */
export function addDisplayIdExtensionSection(extensions: Extension[]): Extension[] {
  const chain = getDisplayIdSectionChain({ extensions });
  if (chain.length === 0) {
    throw new Error('There is no DisplayID extension to add a section to.');
  }
  const base = chain[0].section;
  const section: DisplayIdSection = {
    version: base.version,
    revision: base.revision,
    versionByte: base.versionByte,
    bytesInSection: 0,
    totalLength: 5,
    primaryUseCase: 0,
    extensionCount: 0,
    blocks: [],
    fillBytes: 0,
    checksum: 0,
    isChecksumValid: true,
  };
  const block: DisplayIdExtension = {
    kind: 'displayid',
    tag: 0x70,
    revision: section.revision,
    section,
    sections: [section],
    checksum: 0,
    checksumValid: true,
  };
  const insertAt = chain[chain.length - 1].extensionIndex + 1;
  base.extensionCount = chain.length;
  return [...extensions.slice(0, insertAt), block, ...extensions.slice(insertAt)];
}

/**
 * Remove the extension section at `chainIndex` (the base section, index 0,
 * cannot be removed). A section that has a 0x70 block to itself takes the
 * block with it; one packed with other sections in a legacy multi-section
 * block is dropped from that block. The base section's extension count is
 * updated. Returns the new extensions list (unchanged for a bad index).
 */
export function removeDisplayIdExtensionSection(extensions: Extension[], chainIndex: number): Extension[] {
  const chain = getDisplayIdSectionChain({ extensions });
  const entry = chain[chainIndex];
  if (chainIndex <= 0 || !entry) return extensions;
  const sections = displayIdSectionsOf(entry.extension);
  let next: Extension[];
  if (sections.length === 1) {
    next = extensions.filter((_, index) => index !== entry.extensionIndex);
  } else {
    const remaining = sections.filter((_, index) => index !== entry.indexInExtension);
    entry.extension.sections = remaining;
    entry.extension.section = remaining[0];
    next = [...extensions];
  }
  chain[0].section.extensionCount = chain.length - 2;
  return next;
}

/**
 * Remove the EDID's DisplayID structure: every decoded 0x70 DisplayID block
 * (the base section's block and its extension-section blocks — exactly the
 * blocks `getDisplayIdSectionChain` covers). Other extensions, including 0x70
 * blocks that failed to decode and are kept as opaque bytes, stay.
 */
export function removeDisplayIdStructure(extensions: Extension[]): Extension[] {
  return extensions.filter((extension) => !isDisplayIdExtension(extension));
}

/**
 * Find the first DisplayID extension in an EEDID's extension list, or null.
 */
export function getDisplayIdExtension(eedid: { extensions: Extension[] }): DisplayIdExtension | null {
  return eedid.extensions.find((ext) => isDisplayIdExtension(ext)) ?? null;
}
