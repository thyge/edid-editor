/**
 * InfoFrame Data Block (CTA-861-G §7.5.9, Extended Tag 32)
 *
 * VCDB-family block (see `cta/vcdb/`). The payload begins with an InfoFrame
 * Processing Descriptor (a header byte carrying Length Lb in bits 7:5 plus
 * reserved bits 4:0, followed by a byte giving the number of additional
 * VSIFs that can be received simultaneously, followed by Lb extension
 * bytes), then optional Short InfoFrame / Short Vendor-Specific InfoFrame
 * Descriptors listed in priority order. Each descriptor header carries a
 * 3-bit Payload Length (bits 7:5) and a 5-bit InfoFrame Type Code (bits 4:0);
 * type 0x01 is the vendor-specific form (3-byte IEEE OUI + payload).
 * Cross-checked against edid-decode `cta_ifdb` (parse-cta-block.cpp).
 */

import type { ExtendedDataBlock } from '../cta-extended-blocks';
import { pushIeeeOuiLE, readIeeeOuiLE } from '../../common/bintools';
import { clampByte, clampInt, keepShortLength } from '../byte-utils';

/** Longest payload a 3-bit length field can describe. */
const MAX_PAYLOAD_LENGTH = 7;

export interface InfoFrameDataBlock extends ExtendedDataBlock {
  tag: 0x07;
  extendedTag: 0x20;
  /** Number of additional VSIFs that can be received simultaneously (byte 2, 0–255). */
  additionalVsifs: number;
  /** Lb extension bytes of the Processing Descriptor (normally empty, at most 7). */
  processingPayload: Uint8Array;
  /**
   * Processing Descriptor header bits 4:0 (F14-F10, reserved), kept so they
   * survive a re-encode. Optional; absent means 0.
   */
  processingReserved?: number;
  /**
   * Lb as declared in the header, set only when it claims more bytes than the
   * block holds (malformed). Encode writes it back so the header survives.
   */
  declaredProcessingLength?: number;
  /** Body length when the block was shorter than the 2-byte Processing Descriptor. */
  shortLength?: number;
  /** Descriptor payloads hold at most 7 bytes (3-bit length); encode clamps longer ones. */
  descriptors: Array<
    | { kind: 'short'; infoFrameType: number; payload: Uint8Array }
    | { kind: 'vendor'; ieeeOui: number; payload: Uint8Array }
  >;
  /** Bytes after the last complete descriptor (preserved for byte-exact round-trip). */
  trailing: Uint8Array;
}

export function decodeInfoFrameBlock(base: ExtendedDataBlock, payload: Uint8Array): InfoFrameDataBlock {
  // CTA-861-G Tables 77-80. The payload begins with an InfoFrame Processing
  // Descriptor: header byte 0 (Length Lb in bits 7:5, reserved bits 4:0),
  // byte 1 = number of additional VSIFs, then Lb extension bytes. Then
  // optional Short InfoFrame / Short Vendor-Specific InfoFrame Descriptors,
  // each with a 3-bit Payload Length (bits 7:5) and 5-bit Type Code (bits 4:0).
  const header = payload[0] ?? 0;
  const lb = (header >> 5) & 0x07;
  const block: InfoFrameDataBlock = {
    ...base,
    extendedTag: 0x20,
    additionalVsifs: payload[1] ?? 0,
    processingPayload: payload.slice(2, 2 + lb),
    descriptors: [],
    trailing: new Uint8Array(),
  };
  if (header & 0x1f) block.processingReserved = header & 0x1f;
  if (payload.length < 2) {
    block.shortLength = payload.length;
    if (lb > 0) block.declaredProcessingLength = lb;
    return block;
  }
  if (2 + lb > payload.length) {
    // The header promises more extension bytes than the block holds.
    block.declaredProcessingLength = lb;
    return block;
  }

  const descriptors: InfoFrameDataBlock['descriptors'] = block.descriptors;
  let i = 2 + lb;
  while (i < payload.length) {
    const descHeader = payload[i];
    const payloadLen = (descHeader >> 5) & 0x07;
    const typeCode = descHeader & 0x1f;
    if (typeCode === 0x01) {
      // Short Vendor-Specific InfoFrame Descriptor (Table 80): 3-byte OUI + payload.
      if (i + 1 + 3 + payloadLen > payload.length) break;
      const ieeeOui = readIeeeOuiLE(payload, i + 1);
      const descPayload = payload.slice(i + 4, i + 4 + payloadLen);
      descriptors.push({ kind: 'vendor', ieeeOui, payload: descPayload });
      i += 4 + payloadLen;
    } else if (typeCode === 0x00) {
      // 0x00 is reserved as a descriptor type code; stop parsing.
      break;
    } else {
      // Short InfoFrame Descriptor (Table 79): payloadLen bytes of payload.
      if (i + 1 + payloadLen > payload.length) break;
      const descPayload = payload.slice(i + 1, i + 1 + payloadLen);
      descriptors.push({ kind: 'short', infoFrameType: typeCode, payload: descPayload });
      i += 1 + payloadLen;
    }
  }
  block.trailing = payload.slice(i);
  return block;
}

export function encodeInfoFrameBlock(block: InfoFrameDataBlock): Uint8Array {
  const bytes = [0x20];
  // InfoFrame Processing Descriptor: header (Lb in bits 7:5, reserved 4:0) +
  // additionalVsifs + Lb bytes. A 3-bit Lb holds at most 7 bytes, so a longer
  // processing payload is cut to 7 rather than letting the length wrap.
  const processing = (block.processingPayload ?? new Uint8Array()).slice(0, MAX_PAYLOAD_LENGTH);
  const lb = block.declaredProcessingLength !== undefined
    ? clampInt(block.declaredProcessingLength, 0, MAX_PAYLOAD_LENGTH)
    : processing.length;
  bytes.push((lb << 5) | clampInt(block.processingReserved ?? 0, 0, 0x1f), clampByte(block.additionalVsifs));
  for (const b of processing) bytes.push(b);
  for (const desc of block.descriptors ?? []) {
    // Same 3-bit length limit for each descriptor payload.
    const payload = desc.payload.slice(0, MAX_PAYLOAD_LENGTH);
    if (desc.kind === 'vendor') {
      bytes.push((payload.length << 5) | 0x01);
      pushIeeeOuiLE(bytes, desc.ieeeOui);
    } else {
      bytes.push((payload.length << 5) | clampInt(desc.infoFrameType, 0, 0x1f));
    }
    for (const b of payload) bytes.push(b);
  }
  for (const b of block.trailing ?? []) bytes.push(b);
  // shortLength counts body bytes; the output also carries the ext-tag byte.
  return keepShortLength(
    new Uint8Array(bytes),
    block.shortLength === undefined ? undefined : block.shortLength + 1,
  );
}
