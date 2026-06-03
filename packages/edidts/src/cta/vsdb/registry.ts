// packages/edidts/src/cta/vsdb/registry.ts

import type { VendorSpecificDecoded, VendorSpecificDataBlock } from './types';
import type { CEAExtensionBlock } from '../extension-block';

// 'unknown' is the fallback case and is never paired with a decoder/encoder.
type DecoderKind = Exclude<VendorSpecificDecoded['kind'], 'unknown'>;

type FieldsFor<K extends DecoderKind> =
  Extract<VendorSpecificDecoded, { kind: K }> extends { fields: infer F } ? F : never;

export interface VendorDecoder<K extends DecoderKind> {
  readonly kind: K;
  readonly minLength: number;
  decode(payload: Uint8Array): FieldsFor<K>;
}

export interface VendorEncoder<K extends DecoderKind> {
  readonly kind: K;
  encode(fields: FieldsFor<K>): Uint8Array;
}

export const VENDOR_DECODERS: Record<number, VendorDecoder<DecoderKind>> = {};
export const VENDOR_ENCODERS: Record<string, VendorEncoder<DecoderKind>> = {};

/** Build the full block bytes from an OUI and a payload (post-OUI).
 *  The OUI is written in little-endian wire order, matching the
 *  CTA-861-G VSDB convention. See `docs/planning/vsdb/README.md`. */
export function reassembleVsdbBlock(ieeeOui: number, payload: Uint8Array): Uint8Array {
  const length = 3 + payload.length;
  const header = (3 << 5) | (length & 0x1F);
  const out = new Uint8Array(1 + length);
  out[0] = header;
  out[1] = ieeeOui & 0xff;
  out[2] = (ieeeOui >>> 8) & 0xff;
  out[3] = (ieeeOui >>> 16) & 0xff;
  out.set(payload, 4);
  return out;
}

export function decodeVendorSpecificBlock(data: Uint8Array): VendorSpecificDataBlock {
  // data[0] is the header byte: high 3 bits = tag (3), low 5 bits = length of bytes after header
  const ieeeOui = data.length >= 4 ? (data[1] | (data[2] << 8) | (data[3] << 16)) >>> 0 : 0;
  const declaredLength = data[0] & 0x1F;
  // The payload (post-OUI) starts at data[4] and is 3 bytes shorter than declaredLength
  const payloadLen = Math.max(0, Math.min(declaredLength - 3, data.length - 4));
  const payload = data.slice(4, 4 + payloadLen);
  const block: VendorSpecificDataBlock = {
    tag: 0x03,
    data,
    ieeeOui,
    payload,
  };

  const decoder = VENDOR_DECODERS[ieeeOui];
  if (decoder) {
    block.vendor = { kind: decoder.kind, fields: decoder.decode(payload) } as VendorSpecificDecoded;
  } else {
    block.vendor = { kind: 'unknown', ieeeOui, raw: payload };
  }
  return block;
}

export function findVSDBs(cea: CEAExtensionBlock): VendorSpecificDataBlock[] {
  return cea.dataBlocks.filter(
    (b): b is VendorSpecificDataBlock => b.tag === 0x03
  );
}

export function findVSDBByKind(
  cea: CEAExtensionBlock,
  kind: VendorSpecificDecoded['kind']
): VendorSpecificDataBlock | null {
  return findVSDBs(cea).find(b => b.vendor?.kind === kind) ?? null;
}
