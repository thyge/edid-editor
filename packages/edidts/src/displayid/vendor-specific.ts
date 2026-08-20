// packages/edidts/src/displayid/vendor-specific.ts

import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdVendorSpecificBlock,
  type DisplayIdVesaDisplayPortData,
} from './types';

/**
 * DisplayID 2.0 §4.9 Vendor-specific Data Block (tag 0x7e).
 *
 * Layout (payload-relative): payload[0..2] = 24-bit IEEE OUI (big-endian,
 * MSB first — per §4.9 and the §4.7 Tiled Topology ID convention),
 * payload[3..] = vendor-specific data.
 *
 * The VESA DisplayPort-specific subtype (Appendix B) is parsed when the OUI
 * is the VESA OUI 0x3a0292. Unknown OUIs preserve their raw vendor payload.
 *
 * Cross-checked against edid-decode parse_displayid_vendor_specific +
 * parse_displayid_vesa (parse-displayid-block.cpp:1427, 1654, 1832): the OUI
 * is read big-endian `(x[3]<<16)|(x[4]<<8)|x[5]`, and oui_name(0x3a0292)="VESA".
 */

/** VESA OUI (bytes 3A-02-92, big-endian). */
export const VESA_OUI = 0x3a0292;

export function decodeVendorSpecificBlock(block: DisplayIdDataBlock): DisplayIdVendorSpecificBlock {
  const p = block.payload;
  const typedBlock: DisplayIdVendorSpecificBlock = {
    ...block,
    tag: DisplayIdDataBlockTag.VendorSpecific,
    ieeeOui: p.length >= 3 ? ((p[0] << 16) | (p[1] << 8) | p[2]) >>> 0 : 0,
  };

  // VESA DisplayPort-specific subtype (Appendix B). Vendor data is 2..4 bytes
  // after the 3-byte OUI; the two mandatory bytes are always present when the
  // OUI matches and there is room for them (payload length >= 5).
  if (typedBlock.ieeeOui === VESA_OUI && p.length >= 5) {
    const v0 = p[3];
    const v1 = p[4];
    const vendorDataLen = p.length - 3;
    const vesa: DisplayIdVesaDisplayPortData = {
      structureType: v0 & 0x07,
      nativeColorspaceEotf: (v0 & 0x80) !== 0,
      horizontalOverlapPixels: v1 & 0x0f,
      multiSstOperation: (v1 >> 5) & 0x03,
    };
    // DSC bits-per-pixel is present when the payload is long enough
    // (3 OUI + 4 vendor bytes = payload length 7). bpp = integer (v2 bits 5:0)
    // + fraction (v3 bits 3:0) / 16.
    let modeled = 2; // mandatory vendor bytes consumed
    if (p.length >= 7) {
      const v2 = p[5];
      const v3 = p[6];
      vesa.dscBitsPerPixel = (v2 & 0x3f) + (v3 & 0x0f) / 16;
      modeled = 4;
    }
    // Preserve any vendor bytes beyond the modeled fields (e.g. an unusual
    // 3-vendor-byte payload) for a lossless round-trip.
    if (vendorDataLen > modeled) {
      vesa.trailing = p.slice(3 + modeled);
    }
    typedBlock.vesaDisplayPort = vesa;
  }

  return typedBlock;
}

export function encodeVendorSpecificBlock(block: DisplayIdVendorSpecificBlock): Uint8Array {
  // VESA DisplayPort subtype: rebuild the vendor bytes from the typed fields.
  if (block.vesaDisplayPort) {
    const v = block.vesaDisplayPort;
    const hasDsc = typeof v.dscBitsPerPixel === 'number';
    const trailing = v.trailing ?? new Uint8Array(0);
    const payload = new Uint8Array(3 + 2 + (hasDsc ? 2 : 0) + trailing.length);
    // OUI, big-endian.
    payload[0] = (block.ieeeOui >> 16) & 0xff;
    payload[1] = (block.ieeeOui >> 8) & 0xff;
    payload[2] = block.ieeeOui & 0xff;
    // vendor[0]: structureType (bits 2:0) | nativeColorspaceEotf (bit 7).
    payload[3] = (v.structureType & 0x07) | (v.nativeColorspaceEotf ? 0x80 : 0);
    // vendor[1]: horizontalOverlapPixels (bits 3:0) | multiSstOperation (bits 6:5).
    payload[4] = (v.horizontalOverlapPixels & 0x0f) | ((v.multiSstOperation & 0x03) << 5);
    let offset = 5;
    if (hasDsc) {
      // bpp = integer + fraction/16. Integer in bits 5:0 of vendor[2],
      // fraction (0..15) in bits 3:0 of vendor[3].
      const bpp = v.dscBitsPerPixel as number;
      const integer = Math.max(0, Math.min(0x3f, Math.floor(bpp)));
      const fraction = Math.max(0, Math.min(0x0f, Math.round((bpp - integer) * 16)));
      payload[5] = integer & 0x3f;
      payload[6] = fraction & 0x0f;
      offset = 7;
    }
    payload.set(trailing, offset);
    return payload;
  }

  // Unknown OUI / raw fallback: preserve the existing payload bytes and
  // overwrite the 3-byte OUI (big-endian) when there is room for it.
  const payload = block.payload.slice();
  if (payload.length >= 3) {
    payload[0] = (block.ieeeOui >> 16) & 0xff;
    payload[1] = (block.ieeeOui >> 8) & 0xff;
    payload[2] = block.ieeeOui & 0xff;
  }
  return payload;
}