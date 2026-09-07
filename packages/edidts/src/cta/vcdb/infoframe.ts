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
 */

import type { ExtendedDataBlock } from '../cta-extended-blocks';
import { pushIeeeOuiLE, readIeeeOuiLE } from '../../common/bintools';

export interface InfoFrameDataBlock extends ExtendedDataBlock {
  tag: 0x07;
  extendedTag: 0x20;
  /** Number of additional VSIFs that can be received simultaneously (byte 2). */
  additionalVsifs: number;
  /** Lb extension bytes of the Processing Descriptor (normally empty). */
  processingPayload: Uint8Array;
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
  if (payload.length < 2) {
    return {
      ...base,
      extendedTag: 0x20,
      additionalVsifs: 0,
      processingPayload: new Uint8Array(),
      descriptors: [],
      trailing: payload.slice(),
    };
  }

  const header = payload[0];
  const lb = (header >> 5) & 0x07;
  const additionalVsifs = payload[1];
  const processingPayload = payload.slice(2, 2 + lb);

  const descriptors: InfoFrameDataBlock['descriptors'] = [];
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

  return {
    ...base,
    extendedTag: 0x20,
    additionalVsifs,
    processingPayload,
    descriptors,
    trailing: payload.slice(i),
  };
}

export function encodeInfoFrameBlock(block: InfoFrameDataBlock): Uint8Array {
  const bytes = [0x20];
  // InfoFrame Processing Descriptor: header (Lb in bits 7:5) + additionalVsifs + Lb bytes.
  const lb = (block.processingPayload?.length ?? 0) & 0x07;
  bytes.push((lb << 5) & 0xff, block.additionalVsifs & 0xff);
  for (const b of block.processingPayload ?? []) bytes.push(b);
  for (const desc of block.descriptors ?? []) {
    const payloadLen = (desc.payload.length) & 0x07;
    if (desc.kind === 'vendor') {
      bytes.push((payloadLen << 5) | 0x01);
      pushIeeeOuiLE(bytes, desc.ieeeOui);
      for (const b of desc.payload) bytes.push(b);
    } else {
      bytes.push((payloadLen << 5) | (desc.infoFrameType & 0x1f));
      for (const b of desc.payload) bytes.push(b);
    }
  }
  for (const b of block.trailing ?? []) bytes.push(b);
  return new Uint8Array(bytes);
}