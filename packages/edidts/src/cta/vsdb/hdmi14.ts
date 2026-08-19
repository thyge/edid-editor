// packages/edidts/src/cta/vsdb/hdmi14.ts

import type { VendorDecoder, VendorEncoder } from './registry';
import { VENDOR_DECODERS, VENDOR_ENCODERS } from './registry';
import { OUI } from './types';
import type {
  HDMI14VSDB,
  Hdmi3DMode,
  Hdmi3DStructure,
  HdmiImageSize,
  HdmiLatency,
} from './types';

export const HDMI14_DEFAULT: HDMI14VSDB = {
  sourcePhysicalAddress: [0, 0, 0, 0],
  supportsAI: false,
  dcY444: false,
  dc30bit: false,
  dc36bit: false,
  dc48bit: false,
  maxTmdsClockMHz: 0,
  trailing: new Uint8Array(),
};

/** Decode the post-OUI payload of an HDMI 1.4 VSDB. */
export class HDMI14Decoder implements VendorDecoder<'hdmi14'> {
  readonly kind = 'hdmi14' as const;
  readonly minLength = 2;

  decode(payload: Uint8Array): HDMI14VSDB {
    if (payload.length < 2) return { ...HDMI14_DEFAULT, trailing: sliceFrom(payload, 0) };

    const physAddr = (payload[0] << 8) | payload[1];
    const flags = payload.length >= 3 ? payload[2] : 0;
    const out: HDMI14VSDB = {
      sourcePhysicalAddress: [
        (physAddr >> 12) & 0x0f,
        (physAddr >> 8) & 0x0f,
        (physAddr >> 4) & 0x0f,
        physAddr & 0x0f,
      ],
      supportsAI: (flags & 0x80) !== 0,
      dcY444: (flags & 0x08) !== 0,
      dc30bit: (flags & 0x10) !== 0,
      dc36bit: (flags & 0x20) !== 0,
      dc48bit: (flags & 0x40) !== 0,
      maxTmdsClockMHz: payload.length >= 4 ? payload[3] * 5 : 0,
      trailing: new Uint8Array(),
    };

    // Bytes 4+ are optional (Video/Latency byte + extended details).
    if (payload.length < 5) {
      out.trailing = sliceFrom(payload, 4);
      return out;
    }

    let i = 4;
    const b4 = payload[i];
    out.contentTypes = b4 & 0x0f;
    i++;

    // Latency (byte 4 bit 7; interlaced latency bit 6).
    if (b4 & 0x80) {
      const progressive = readLatency(payload, i);
      i += 2;
      let interlaced: HdmiLatency | undefined;
      if (b4 & 0x40) {
        interlaced = readLatency(payload, i);
        i += 2;
      }
      out.latency = { progressive, interlaced };
    }

    // Extended HDMI video details (byte 4 bit 5).
    if (!(b4 & 0x20)) {
      out.trailing = sliceFrom(payload, i);
      return out;
    }
    if (i >= payload.length) {
      out.trailing = sliceFrom(payload, i);
      return out;
    }

    const eb = payload[i];
    i++;
    const threeDPresent = (eb & 0x80) !== 0;
    const threeDMode: Hdmi3DMode =
      (eb & 0x60) === 0x20 ? 'all-vics-3d' : (eb & 0x60) === 0x40 ? 'vic-mask' : 'none';
    const imgBits = eb & 0x18;
    const imageSize: HdmiImageSize =
      imgBits === 0x08 ? 'aspect-ratio' : imgBits === 0x10 ? 'cm' : imgBits === 0x18 ? '5cm' : 'none';

    const extended: HDMI14VSDB['extended'] = {
      threeDPresent,
      threeDMode,
      imageSize,
      hdmiVics: [],
      structures: [],
    };

    if (i >= payload.length) {
      out.extended = extended;
      out.trailing = sliceFrom(payload, i);
      return out;
    }

    const lb = payload[i];
    i++;
    const lenVic = (lb & 0xe0) >>> 5;
    const len3d = lb & 0x1f;

    // HDMI VIC list (4K × 2K VICs).
    for (let k = 0; k < lenVic; k++) {
      extended.hdmiVics.push(i + k < payload.length ? payload[i + k] : 0);
    }
    i += lenVic;

    if (len3d > 0) {
      const threeDStart = i;
      const end3d = threeDStart + len3d;
      const formats = threeDMode !== 'none';

      if (formats) {
        // 3D_Structure_ALL: first byte = bits 15:8, second byte = bits 7:0.
        extended.structureAll =
          (byteAt(payload, i) << 8) | byteAt(payload, i + 1);
        i += 2;
        if (threeDMode === 'vic-mask') {
          // 3D-capable-VIC mask: high byte = x[b], low byte = x[b+1] (edid-decode
          // bit ordering: x[b+1] covers indices 0–7, x[b] covers indices 8–15).
          extended.vicMask = (byteAt(payload, i) << 8) | byteAt(payload, i + 1);
          i += 2;
        }
      }

      // Per-VIC 3D_Structure_X list (stride 2 when structure >= 8, else 1).
      extended.structures = read3DStructures(payload, i, end3d);
      i = Math.min(end3d, payload.length);
    }

    out.extended = extended;
    out.trailing = sliceFrom(payload, i);
    return out;
  }
}

/** Encode the post-OUI payload of an HDMI 1.4 VSDB. */
export class HDMI14Encoder implements VendorEncoder<'hdmi14'> {
  readonly kind = 'hdmi14' as const;

  encode(fields: HDMI14VSDB): Uint8Array {
    const [a, b, c, d] = fields.sourcePhysicalAddress;
    const physAddr =
      ((a & 0x0f) << 12) | ((b & 0x0f) << 8) | ((c & 0x0f) << 4) | (d & 0x0f);
    const flags =
      (fields.supportsAI ? 0x80 : 0) |
      (fields.dcY444 ? 0x08 : 0) |
      (fields.dc30bit ? 0x10 : 0) |
      (fields.dc36bit ? 0x20 : 0) |
      (fields.dc48bit ? 0x40 : 0);

    const head = [
      (physAddr >> 8) & 0xff,
      physAddr & 0xff,
      flags,
      fields.maxTmdsClockMHz === 0 ? 0 : Math.round(fields.maxTmdsClockMHz / 5),
    ];

    // Minimal 4-byte block when no optional sections are present.
    if (
      fields.contentTypes === undefined &&
      !fields.latency &&
      !fields.extended
    ) {
      return concat(head, fields.trailing);
    }

    // Byte 4: Content Types + latency-present + interlaced-latency + extended-present.
    const b4 =
      (fields.contentTypes ?? 0) & 0x0f |
      (fields.latency ? 0x80 : 0) |
      (fields.latency?.interlaced ? 0x40 : 0) |
      (fields.extended ? 0x20 : 0);
    const bytes: number[] = [...head, b4];

    if (fields.latency) {
      bytes.push(fields.latency.progressive.video & 0xff, fields.latency.progressive.audio & 0xff);
      if (fields.latency.interlaced) {
        bytes.push(fields.latency.interlaced.video & 0xff, fields.latency.interlaced.audio & 0xff);
      }
    }

    if (fields.extended) {
      const e = fields.extended;
      const modeBits =
        e.threeDMode === 'all-vics-3d' ? 0x20 : e.threeDMode === 'vic-mask' ? 0x40 : 0x00;
      const imgBits =
        e.imageSize === 'aspect-ratio'
          ? 0x08
          : e.imageSize === 'cm'
            ? 0x10
            : e.imageSize === '5cm'
              ? 0x18
              : 0x00;
      const eb = (e.threeDPresent ? 0x80 : 0) | modeBits | imgBits;
      bytes.push(eb);

      const lenVic = e.hdmiVics.length & 0x07;
      const formats = e.threeDMode !== 'none';
      let len3d = 0;
      if (formats) len3d += 2; // 3D_Structure_ALL
      if (e.threeDMode === 'vic-mask') len3d += 2; // VIC mask
      for (const s of e.structures) len3d += s.structure >= 8 ? 2 : 1;
      bytes.push((lenVic << 5) | (len3d & 0x1f));

      for (const v of e.hdmiVics) bytes.push(v & 0xff);

      if (formats) {
        const sa = e.structureAll ?? 0;
        bytes.push((sa >> 8) & 0xff, sa & 0xff);
        if (e.threeDMode === 'vic-mask') {
          const vm = e.vicMask ?? 0;
          bytes.push((vm >> 8) & 0xff, vm & 0xff);
        }
      }
      for (const s of e.structures) {
        bytes.push(((s.vicIndex & 0x0f) << 4) | (s.structure & 0x0f));
        if (s.structure >= 8) bytes.push(((s.detail ?? 0) & 0x0f) << 4);
      }
    }

    return concat(bytes, fields.trailing);
  }
}

VENDOR_DECODERS[OUI.HDMI_1_4] = new HDMI14Decoder();
VENDOR_ENCODERS['hdmi14'] = new HDMI14Encoder();

// --- helpers ---------------------------------------------------------------

function readLatency(payload: Uint8Array, i: number): HdmiLatency {
  return { video: byteAt(payload, i), audio: byteAt(payload, i + 1) };
}

/** Read the per-VIC 3D_Structure_X list over [i, end). Stride is 2 when the structure code >= 8. */
function read3DStructures(payload: Uint8Array, i: number, end: number): Hdmi3DStructure[] {
  const out: Hdmi3DStructure[] = [];
  while (i < end && i < payload.length) {
    const byte0 = payload[i];
    const structure = byte0 & 0x0f;
    if (structure >= 8) {
      if (i + 1 < payload.length) {
        out.push({ vicIndex: byte0 >> 4, structure, detail: payload[i + 1] >> 4 });
        i += 2;
      } else {
        break; // incomplete trailing entry — left for `trailing`
      }
    } else {
      out.push({ vicIndex: byte0 >> 4, structure });
      i += 1;
    }
  }
  return out;
}

function byteAt(payload: Uint8Array, i: number): number {
  return i >= 0 && i < payload.length ? payload[i] : 0;
}

function sliceFrom(payload: Uint8Array, i: number): Uint8Array {
  return i >= payload.length ? new Uint8Array() : payload.slice(i);
}

function concat(head: number[] | Uint8Array, trailing: Uint8Array): Uint8Array {
  const h = head instanceof Uint8Array ? head : new Uint8Array(head);
  const out = new Uint8Array(h.length + trailing.length);
  out.set(h, 0);
  out.set(trailing, h.length);
  return out;
}