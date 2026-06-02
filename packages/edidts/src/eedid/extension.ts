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
import { decodeDisplayIdSection, encodeDisplayIdSection } from '../displayid/section';
import type { DisplayIdSection } from '../displayid/types';
import { checksum8 } from '../common/checksum';

export type CEAExtension = CEAExtensionBlock;

export interface DisplayIdExtension {
  kind: 'displayid';
  tag: 0x70;
  revision: number;
  section: DisplayIdSection;
  checksum: number;
}

export interface OpaqueExtension {
  kind: 'opaque';
  tag: number;
  revision: number;
  bytes: Uint8Array;
  checksum: number;
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

export function decodeExtension(bytes: Uint8Array): Extension {
  if (bytes.length < 128) {
    throw new Error(`Extension block must be at least 128 bytes; got ${bytes.length}`);
  }

  const tag = bytes[0];

  switch (tag) {
    case 0x02: {
      const cta = ExtensionBlockParser.decode(bytes);
      if (cta && cta.tag === 0x02) {
        return cta as CEAExtension;
      }
      return decodeOpaque(bytes);
    }
    case 0x70: return decodeDisplayId(bytes);
    default: return decodeOpaque(bytes);
  }
}

export function encodeExtension(ext: Extension): Uint8Array {
  if (isCEAExtension(ext)) {
    return ExtensionBlockParser.encode(ext);
  }
  if (isDisplayIdExtension(ext)) {
    return encodeDisplayId(ext);
  }
  return encodeOpaque(ext);
}

function decodeOpaque(bytes: Uint8Array): OpaqueExtension {
  return {
    kind: 'opaque',
    tag: bytes[0],
    revision: bytes[1],
    bytes: bytes.slice(),
    checksum: bytes[127],
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
    // (byte 0 is the EDID tag = 0x70). The section's own version byte, etc.,
    // live at bytes[1..]. Slice past the tag before handing to the section parser.
    const section = decodeDisplayIdSection(bytes.subarray(1));
    return {
      kind: 'displayid',
      tag: 0x70,
      revision: section.revision,
      section,
      checksum: bytes[127],
    };
  } catch {
    return decodeOpaque(bytes);
  }
}

function encodeDisplayId(ext: DisplayIdExtension): Uint8Array {
  const encoded = encodeDisplayIdSection(ext.section);
  const out = new Uint8Array(128);
  // byte 0 is the EDID tag (0x70); section content starts at byte 1
  out[0] = 0x70;
  const available = Math.min(encoded.length, 127);
  out.set(encoded.subarray(0, available), 1);
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

/**
 * Find the first DisplayID extension in an EEDID's extension list, or null.
 */
export function getDisplayIdExtension(eedid: { extensions: Extension[] }): DisplayIdExtension | null {
  return eedid.extensions.find((ext) => isDisplayIdExtension(ext)) ?? null;
}
