// packages/edidts/src/displayid/vendor-specific.ts

import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdVendorSpecificBlock,
  type DisplayIdVesaDisplayPortData,
} from './types';
import { readIeeeOui, writeIeeeOui } from '../common/bintools';
import { clampBits, clampInt } from './clamp';

/**
 * DisplayID 2.0 §4.9 Vendor-specific Data Block (tag 0x7e).
 *
 * Layout (payload-relative): payload[0..2] = 24-bit IEEE OUI (big-endian,
 * MSB first — per §4.9 and the §4.7 Tiled Topology ID convention),
 * payload[3..] = vendor-specific body.
 *
 * Dispatch is two-level (tag 0x7e -> OUI -> codec), mirroring the CTA VSDB /
 * VSVDB vendor registries and mp4box's nested BoxRegistry.sampleEntry. A
 * per-vendor decoder/encoder pair is keyed by the integer OUI; the carrier
 * reads the OUI, looks up the codec, and attaches the decoded fields. OUIs
 * with no registered codec fall through to a single raw fallback that
 * preserves the payload byte-identically.
 *
 * The VESA DisplayPort-specific subtype (Appendix B) is the one registered
 * vendor today, exposed on the block as `vesaDisplayPort`.
 *
 * Cross-checked against edid-decode parse_displayid_vendor_specific +
 * parse_displayid_vesa (parse-displayid-block.cpp:1427, 1654, 1832): the OUI
 * is read big-endian `(x[3]<<16)|(x[4]<<8)|x[5]`, and oui_name(0x3a0292)="VESA".
 */

/** VESA OUI (bytes 3A-02-92, big-endian). */
export const VESA_OUI = 0x3a0292;

// ---------------------------------------------------------------------------
// Vendor registry: tag 0x7e -> OUI -> {decode, encode}.
//
// `unknown` (no registered codec) is never paired with a decoder/encoder; it
// is the raw fallback the carrier uses directly. Mirrors the
// VENDOR_DECODERS/VENDOR_ENCODERS maps in cta/vsdb/registry.ts and
// cta/vsvdb/registry.ts. The decoders/encoders live in this file so that
// importing the module registers them as a side effect without a separate
// registration import in blocks.ts (same shape as the HDR10+ VSVDB codec).

export interface DisplayIdVendorDecoder<K extends string> {
  readonly kind: K;
  /** Minimum post-OUI body length required to recognise this vendor's block. */
  readonly minLength: number;
  decode(body: Uint8Array): unknown;
}

export interface DisplayIdVendorEncoder<K extends string> {
  readonly kind: K;
  /**
   * Build the post-OUI body from the typed fields. `previousBody` is the body
   * the block was decoded from (empty for a new block); encoders take the
   * bits their model does not hold (reserved bits) from it, so a re-encode
   * changes only what was edited.
   */
  encode(fields: unknown, previousBody: Uint8Array): Uint8Array;
}

export const DISPLAY_ID_VENDOR_DECODERS: Record<number, DisplayIdVendorDecoder<string>> = {};
export const DISPLAY_ID_VENDOR_ENCODERS: Record<string, DisplayIdVendorEncoder<string>> = {};

export function decodeVendorSpecificBlock(block: DisplayIdDataBlock): DisplayIdVendorSpecificBlock {
  const p = block.payload;
  const ieeeOui = p.length >= 3 ? readIeeeOui(p, 0) : 0;
  const typedBlock: DisplayIdVendorSpecificBlock = {
    ...block,
    tag: DisplayIdDataBlockTag.VendorSpecific,
    ieeeOui,
  };

  const decoder = DISPLAY_ID_VENDOR_DECODERS[ieeeOui];
  const body = p.slice(3);
  // Only attach the structured vendor shape when the post-OUI body is long
  // enough for the vendor's format (decoder.minLength). A shorter body is not a
  // valid instance of that vendor's block, so it falls through to the raw
  // (vesaDisplayPort undefined) shape and round-trips byte-identically via the
  // raw encode fallback rather than being expanded by a default-valued encode.
  if (decoder && body.length >= decoder.minLength) {
    typedBlock.vesaDisplayPort = decoder.decode(body) as DisplayIdVesaDisplayPortData;
  }

  return typedBlock;
}

export function encodeVendorSpecificBlock(block: DisplayIdVendorSpecificBlock): Uint8Array {
  // The payload is always the 3-byte big-endian OUI (DisplayID §4.9) taken
  // from `ieeeOui`, followed by the vendor body. Even a new block whose
  // payload is still empty gets its OUI written.
  const previousBody = block.payload.length > 3 ? block.payload.slice(3) : new Uint8Array(0);
  let body: Uint8Array = previousBody;

  // Registered vendor subtype: rebuild the body from the typed fields.
  if (block.vesaDisplayPort) {
    const encoder = DISPLAY_ID_VENDOR_ENCODERS['vesaDisplayPort'];
    if (encoder) {
      body = encoder.encode(block.vesaDisplayPort, previousBody);
    }
  }

  // Unknown OUI / raw fallback: the body is payload[3..] as-is. The editor's
  // hex field edits the whole payload and sets `ieeeOui` from its first three
  // bytes, so both stay in step; `ieeeOui` is the source of truth here.
  const payload = new Uint8Array(3 + body.length);
  writeIeeeOui(payload, 0, clampBits(block.ieeeOui, 24));
  payload.set(body, 3);
  return payload;
}

// ---------------------------------------------------------------------------
// VESA DisplayPort-specific subtype (DisplayID 2.0 Appendix B), OUI 0x3a0292.
//
// Post-OUI body: 2 mandatory vendor bytes, optional 2-byte DSC bits-per-pixel
// (present at body length >= 4, i.e. payload length >= 7), and any further
// vendor bytes preserved verbatim as `trailing` for a lossless round-trip.
//   vendor[0]: structureType (bits 2:0) | nativeColorspaceEotf (bit 7)
//   vendor[1]: horizontalOverlapPixels (bits 3:0) | multiSstOperation (bits 6:5)
//   vendor[2]: DSC bpp integer (bits 5:0)
//   vendor[3]: DSC bpp fraction (bits 3:0), value/16
// Every other bit is reserved (edid-decode parse_displayid_vesa warns about
// vendor[0] bits 6:3 and vendor[1] bits 4 and 7); the encoder keeps them.
const VESA_RESERVED_MASKS = [0x78, 0x90, 0xc0, 0xf0] as const;

class VesaDisplayPortDecoder implements DisplayIdVendorDecoder<'vesaDisplayPort'> {
  readonly kind = 'vesaDisplayPort' as const;
  // 3-byte OUI + 2 mandatory vendor bytes = payload length 5.
  readonly minLength = 2;

  decode(body: Uint8Array): DisplayIdVesaDisplayPortData {
    const v0 = body[0];
    const v1 = body[1];
    const vesa: DisplayIdVesaDisplayPortData = {
      structureType: v0 & 0x07,
      nativeColorspaceEotf: (v0 & 0x80) !== 0,
      horizontalOverlapPixels: v1 & 0x0f,
      multiSstOperation: (v1 >> 5) & 0x03,
    };
    // DSC bits-per-pixel is present when the body is long enough
    // (3 OUI + 4 vendor bytes = payload length 7). bpp = integer (v2 bits 5:0)
    // + fraction (v3 bits 3:0) / 16.
    let modeled = 2; // mandatory vendor bytes consumed
    if (body.length >= 4) {
      const v2 = body[2];
      const v3 = body[3];
      vesa.dscBitsPerPixel = (v2 & 0x3f) + (v3 & 0x0f) / 16;
      modeled = 4;
    }
    // Preserve any vendor bytes beyond the modeled fields (e.g. an unusual
    // 3-vendor-byte payload) for a lossless round-trip.
    if (body.length > modeled) {
      vesa.trailing = body.slice(modeled);
    }
    return vesa;
  }
}

class VesaDisplayPortEncoder implements DisplayIdVendorEncoder<'vesaDisplayPort'> {
  readonly kind = 'vesaDisplayPort' as const;

  encode(fields: unknown, previousBody: Uint8Array): Uint8Array {
    const v = fields as DisplayIdVesaDisplayPortData;
    const hasDsc = typeof v.dscBitsPerPixel === 'number';
    const trailing = v.trailing ?? new Uint8Array(0);
    const body = new Uint8Array(2 + (hasDsc ? 2 : 0) + trailing.length);
    const reserved = (index: number) => (previousBody[index] ?? 0) & VESA_RESERVED_MASKS[index];
    // vendor[0]: structureType (bits 2:0) | nativeColorspaceEotf (bit 7).
    body[0] = reserved(0) | clampBits(v.structureType, 3) | (v.nativeColorspaceEotf ? 0x80 : 0);
    // vendor[1]: horizontalOverlapPixels (bits 3:0) | multiSstOperation (bits 6:5).
    body[1] = reserved(1) | clampBits(v.horizontalOverlapPixels, 4) | (clampBits(v.multiSstOperation, 2) << 5);
    let offset = 2;
    if (hasDsc) {
      // bpp = integer + fraction/16. Integer in bits 5:0 of vendor[2],
      // fraction (0..15) in bits 3:0 of vendor[3].
      const bpp = Number.isFinite(v.dscBitsPerPixel) ? (v.dscBitsPerPixel as number) : 0;
      const sixteenths = clampInt(bpp * 16, 0, 0x3f * 16 + 0x0f);
      body[2] = reserved(2) | (sixteenths >> 4);
      body[3] = reserved(3) | (sixteenths & 0x0f);
      offset = 4;
    }
    body.set(trailing, offset);
    return body;
  }
}

DISPLAY_ID_VENDOR_DECODERS[VESA_OUI] = new VesaDisplayPortDecoder();
DISPLAY_ID_VENDOR_ENCODERS['vesaDisplayPort'] = new VesaDisplayPortEncoder();