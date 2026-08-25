// packages/edidts/src/displayid/stereo-interface.ts

import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdStereoDisplayInterfaceBlock,
  type DisplayIdStereoTimingCodeDescriptor,
} from './types';

/**
 * DisplayID 2.0 §4.6 Stereo Display Interface Data Block (tag 0x27).
 *
 * Payload (offsets relative to the payload, i.e. spec offset + 03h):
 *   payload[0]  Number of Bytes in Stereo Interface Method = N+1
 *   payload[1]  Stereo Interface Method Code (Table 4-29)
 *   payload[2..2+N-1]  Interface Method-specific parameters (Table 4-30..4-36)
 *   [3D Timing Descriptor entries]  when header bits 7:6 list timing codes
 *
 * The 3D Stereo Timing Support field lives in the block header byte 01h
 * (bits 7:6). The generic decoder exposes that byte as `flags` (flags = byte
 * >> 3), so timingSupport = (flags >> 3) & 0x03. Values 01b and 11b (bit 6 of
 * the header set) mean timing-code descriptors follow the method region.
 *
 * Cross-checked against edid-decode parse_displayid_stereo_display_intf
 * (parse-displayid-block.cpp:823), which advances past the method region with
 * `x += 4 + x[3]` (x[3] = payload[0]) and parses each 3D Timing Descriptor as a
 * 1-byte header (bits 4:0 = num codes, bits 7:6 = type) + N code bytes while
 * `1 + (x[0] & 0x1f) <= len`.
 */

const MIN_STEREO_INTERFACE_PAYLOAD_LENGTH = 2;

/**
 * DisplayID 2.0 §4.6 Table 4-29 Stereo Interface Method Codes.
 * Key = on-the-wire method code.
 */
export const STEREO_INTERFACE_METHOD_LABELS: Record<number, string> = {
  0x00: 'Frame/Field Sequential',
  0x01: 'Side-by-side',
  0x02: 'Pixel-interleaved',
  0x03: 'Dual Interface (L/R Separate)',
  0x04: 'Multi-view',
  0x05: 'Stacked Frame',
  0xff: 'Proprietary',
};

/** Expected method-specific parameter byte counts per method code (Table 4-29). */
export const STEREO_INTERFACE_METHOD_PARAM_COUNTS: Record<number, number> = {
  0x00: 1, 0x01: 1, 0x02: 8, 0x03: 1, 0x04: 2, 0x05: 1, 0xff: 0,
};

/**
 * DisplayID 2.0 §4.6 Table 4-28 3D Stereo Timing Support (header byte 01h
 * bits 7:6). Index = on-the-wire code.
 */
export const STEREO_TIMING_SUPPORT_LABELS: readonly string[] = [
  'Apply to timings that explicitly report 3D',
  'Explicit 3D timings + Timing Codes listed',
  'Apply to all listed timings',
  'Only Timing Codes listed',
];

export function isStereoDisplayInterfacePayloadLengthValid(length: number): boolean {
  return length >= MIN_STEREO_INTERFACE_PAYLOAD_LENGTH;
}

/** Header bits 7:6 values that list 3D Timing Code descriptors (Table 4-28). */
function hasTimingCodeDescriptors(timingSupport: number): boolean {
  return timingSupport === 0x01 || timingSupport === 0x03;
}

export function decodeStereoDisplayInterfaceBlock(
  block: DisplayIdDataBlock,
): DisplayIdStereoDisplayInterfaceBlock {
  const p = block.payload;
  const methodBytes = p[0] ?? 0;
  const methodCode = p[1] ?? 0;

  // N (method parameter bytes) = payload[0] - 1, clamped to what is present.
  const declaredParamCount = Math.max(0, methodBytes - 1);
  const availableParams = Math.max(0, p.length - MIN_STEREO_INTERFACE_PAYLOAD_LENGTH);
  const paramCount = Math.min(declaredParamCount, availableParams);
  const methodParameters = p.slice(
    MIN_STEREO_INTERFACE_PAYLOAD_LENGTH,
    MIN_STEREO_INTERFACE_PAYLOAD_LENGTH + paramCount,
  );

  const timingSupport = (block.flags >> 3) & 0x03;

  let offset = MIN_STEREO_INTERFACE_PAYLOAD_LENGTH + paramCount;
  const stereoTimingCodeDescriptors: DisplayIdStereoTimingCodeDescriptor[] = [];
  if (hasTimingCodeDescriptors(timingSupport)) {
    while (offset < p.length) {
      const header = p[offset];
      const numCodes = header & 0x1f;
      // Stop if the full descriptor (header + codes) does not fit, mirroring
      // edid-decode's `while (1U + (x[0] & 0x1f) <= len)` guard.
      if (offset + 1 + numCodes > p.length) break;
      const type = (header >> 6) & 0x03;
      const timingCodes: number[] = [];
      for (let i = 1; i <= numCodes; i++) {
        timingCodes.push(p[offset + i] & 0xff);
      }
      stereoTimingCodeDescriptors.push({ type, timingCodes });
      offset += 1 + numCodes;
    }
  }

  const trailing = p.slice(offset);

  return {
    ...block,
    tag: DisplayIdDataBlockTag.StereoDisplayInterface,
    timingSupport,
    methodCode,
    methodParameters,
    stereoTimingCodeDescriptors,
    trailing,
  };
}

export function encodeStereoDisplayInterfaceBlock(
  block: DisplayIdStereoDisplayInterfaceBlock,
): Uint8Array {
  // payload[0] = N+1 where N = method parameter bytes.
  const methodBytes = block.methodParameters.length + 1;

  const descriptorBytes: number[] = [];
  for (const descriptor of block.stereoTimingCodeDescriptors) {
    descriptorBytes.push(
      ((descriptor.type & 0x03) << 6) | (descriptor.timingCodes.length & 0x1f),
    );
    for (const code of descriptor.timingCodes) {
      descriptorBytes.push(code & 0xff);
    }
  }

  const length =
    MIN_STEREO_INTERFACE_PAYLOAD_LENGTH +
    block.methodParameters.length +
    descriptorBytes.length +
    block.trailing.length;
  const payload = new Uint8Array(length);

  payload[0] = methodBytes & 0xff;
  payload[1] = block.methodCode & 0xff;
  payload.set(block.methodParameters, MIN_STEREO_INTERFACE_PAYLOAD_LENGTH);

  let offset = MIN_STEREO_INTERFACE_PAYLOAD_LENGTH + block.methodParameters.length;
  for (let i = 0; i < descriptorBytes.length; i++) {
    payload[offset + i] = descriptorBytes[i];
  }
  offset += descriptorBytes.length;
  payload.set(block.trailing, offset);

  return payload;
}