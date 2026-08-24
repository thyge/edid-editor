// packages/edidts/src/cta/vsdb/registry.ts

import type { VendorSpecificDecoded, VendorSpecificDataBlock, MHLVSDB } from './types';
import { OUI } from './types';
import type { CEAExtensionBlock } from '../extension-block';
import { readIeeeOuiLE, writeIeeeOuiLE } from '../../common/bintools';

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
  writeIeeeOuiLE(out, 1, ieeeOui);
  out.set(payload, 4);
  return out;
}

export function decodeVendorSpecificBlock(data: Uint8Array): VendorSpecificDataBlock {
  // `data` is the full on-wire block: data[0] is the header byte (high 3 bits =
  // tag 3, low 5 bits = length of the post-header body), data[1..3] the LE OUI,
  // data[4..] the post-OUI vendor body.
  const ieeeOui = data.length >= 4 ? readIeeeOuiLE(data, 1) : 0;
  const declaredLength = data[0] & 0x1F;
  // Carrier `payload` = post-header body (OUI + vendor body), header-stripped.
  const payload = data.slice(1);
  // `vendorPayload` = post-OUI vendor body (the codec input / raw-fallback
  // source for unknown OUIs), 3 bytes shorter than the declared body length.
  const vendorPayloadLen = Math.max(0, Math.min(declaredLength - 3, data.length - 4));
  const vendorPayload = data.slice(4, 4 + vendorPayloadLen);
  const block: VendorSpecificDataBlock = {
    tag: 0x03,
    payload,
    ieeeOui,
    vendorPayload,
  };

  const decoder = VENDOR_DECODERS[ieeeOui];
  if (decoder) {
    block.vendor = { kind: decoder.kind, fields: decoder.decode(vendorPayload) } as VendorSpecificDecoded;
  } else {
    block.vendor = { kind: 'unknown', ieeeOui, raw: vendorPayload };
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

/**
 * MHL VSDB per the MHL specification (Silicon Image / MHL Consortium);
 * OUI 0x7CD880; layout not in CTA-861-G — EXPERIMENTAL, byte-identical
 * round-trip is the correctness gate.
 *
 * Post-OUI payload:
 *   byte 0: bits 7:4 = MHL major version, bits 3:0 = MHL minor revision
 *           (e.g. 0x10=v1.0, 0x20=v2.0, 0x30=v3.0).
 *   byte 1: Device Capability — capability bit flags per MHL spec; per-bit
 *           semantics not publicly verified, kept as a RAW byte.
 *   bytes 2..: reserved / vendor-specific — preserved verbatim as `trailing`.
 */
export class MHLDecoder implements VendorDecoder<'mhl'> {
  readonly kind = 'mhl' as const;
  readonly minLength = 1;

  decode(payload: Uint8Array): MHLVSDB {
    if (payload.length < 1) return { version: 0, revision: 0, deviceCapability: 0, trailing: new Uint8Array() };
    return {
      version: (payload[0] >> 4) & 0x0F,
      revision: payload[0] & 0x0F,
      deviceCapability: payload.length >= 2 ? payload[1] : 0,
      trailing: payload.slice(2),
    };
  }
}

export class MHLEncoder implements VendorEncoder<'mhl'> {
  readonly kind = 'mhl' as const;

  encode(fields: MHLVSDB): Uint8Array {
    const out = new Uint8Array(2 + fields.trailing.length);
    out[0] = ((fields.version & 0x0F) << 4) | (fields.revision & 0x0F);
    out[1] = fields.deviceCapability & 0xFF;
    out.set(fields.trailing, 2);
    return out;
  }
}

VENDOR_DECODERS[OUI.MHL] = new MHLDecoder();
VENDOR_ENCODERS['mhl'] = new MHLEncoder();
