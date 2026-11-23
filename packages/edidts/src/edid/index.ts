import { DetailedTimingDescriptor, decodeEdidCtaDetailedTimingFlags } from "../common/detailed-timing-descriptor";
import { generateCVTDetailedTiming } from "../common/cvt-timing-generator";
import { checksum8, isChecksum8Valid } from "../common/checksum";
import {
  encodePreservingSource,
  rememberSource,
  sameModel,
  sourceBytesOf,
} from "../common/source-bytes";
import { ColorCharacteristics } from "./color-characteristics";
import { EDIDHeader } from "./edid-header";
import { EstablishedTiming } from "./established-timing";
import { StandardTiming } from "./standard-timing";
import { VideoInputDefinition } from "./video-input";
import { FeatureSupportFlags } from "./feature-support";
import {
  DisplayDescriptor,
  DisplayDescriptorParser,
} from "./display-descriptor";
import { ScreenSize, decodeScreenSize, encodeScreenSize } from "./screen-size";

export {
  decodeScreenSize,
  encodeScreenSize,
  decodeScreenAspectRatioLandscape,
  encodeScreenAspectRatioLandscape,
  decodeScreenAspectRatioPortrait,
  encodeScreenAspectRatioPortrait,
} from "./screen-size";
export type { ScreenSize } from "./screen-size";

/**
 * The 128-byte base EDID block (VESA EDID 1.4). The full EEDID container,
 * including extension blocks, is the `EEDID` class — this is only the base
 * block. Mirrors the rest of the library: data fields are public, no
 * setters, no reactivity scaffolding. Constructed via `new EDID()` (blank),
 * populated from bytes via `EDID.decode(bytes)`, and serialized via
 * `EDID.encode(edid)`.
 */
export class EDID {
  public header: EDIDHeader;
  public videoInput: VideoInputDefinition;
  public screenSize: ScreenSize;
  public gamma: number;
  public featureSupport: FeatureSupportFlags;
  public colorCharacteristics: ColorCharacteristics;
  public establishedTimings: EstablishedTiming[];
  public standardTimings: StandardTiming[];
  public detailedTimings: DetailedTimingDescriptor[];
  public displayDescriptors: DisplayDescriptor[];
  /**
   * True if the base block parses without errors AND has a populated first
   * descriptor slot. Per VESA E-EDID A2 §3.10.1, the first 18-byte descriptor
   * slot must contain either a Detailed Timing Descriptor or a non-dummy
   * display descriptor; a dummy (tag 0x10) in slot 0 marks the EDID as
   * structurally incomplete. Defaults to true so callers that construct an
   * EDID directly are unaffected.
   */
  public isBaseValid: boolean;
  /**
   * True iff the 128-byte base block's byte-127 8-bit checksum is valid (sum of
   * all 128 bytes ≡ 0 mod 256). Populated by `EDID.decode`; defaults to true so
   * programmatically constructed/blank EDIDs are unaffected.
   */
  public checksumValid: boolean;
  /**
   * Human-readable base-block structural warnings. Currently covers the
   * VESA E-EDID A2 §3.10.1 first-descriptor requirement: the first 18-byte
   * descriptor slot must be populated (a Detailed Timing Descriptor or a
   * non-dummy display descriptor); a dummy (tag 0x10) or all-zero slot 0 marks
   * the EDID structurally incomplete. Empty when slot 0 is populated.
   * Populated by `EDID.decode`; defaults to `[]` for constructed instances.
   */
  public baseDiagnostics: string[];

  constructor(init?: Partial<EDID>) {
    this.header = init?.header ?? new EDIDHeader();
    this.videoInput = init?.videoInput ?? new VideoInputDefinition();
    this.screenSize = init?.screenSize ?? { type: 'absolute', horizontalCm: 16, verticalCm: 9 };
    this.gamma = init?.gamma ?? 2.2;
    this.featureSupport = init?.featureSupport ?? new FeatureSupportFlags();
    this.colorCharacteristics = init?.colorCharacteristics ?? new ColorCharacteristics();
    this.establishedTimings = init?.establishedTimings ?? [];
    this.standardTimings = init?.standardTimings ?? [];
    this.detailedTimings = init?.detailedTimings ?? [
      generateCVTDetailedTiming({
        horizontalActive: 1920,
        verticalActive: 1080,
        refreshRate: 60,
        blankingMode: 'cvt',
      }),
    ];
    this.displayDescriptors = init?.displayDescriptors ?? [];
    this.isBaseValid = init?.isBaseValid ?? true;
    this.checksumValid = init?.checksumValid ?? true;
    this.baseDiagnostics = init?.baseDiagnostics ?? [];
  }

  static decode(data: ArrayBuffer | Uint8Array): EDID {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (bytes.length < 128) {
      throw new Error(`Invalid EDID: minimum 128 bytes required - current length: ${bytes.length}`);
    }

    const header = EDIDHeader.decode(bytes);

    // EDID 2.0 is a deprecated 256-byte base block with a completely different
    // layout from EDID 1.x (VESA EDID Standard v3, 1997). Its byte-level
    // structure is not covered by the local VESA-EEDID-A2 spec and is not
    // freely available, so we do not attempt to parse it — a wrong parse would
    // be worse than an honest refusal. This matches libdisplay-info, which
    // rejects EDID version 2 with ENOTSUP. A true 2.0 block also carries a
    // different 8-byte signature and is caught earlier by EDIDHeader.decode;
    // this check covers the malformed case where a 1.x-magic block declares
    // version 2, which would otherwise be silently misread as a 128-byte 1.x
    // block. Full 2.0 support is tracked as a follow-up.
    if (header.edidVersion === 2) {
      throw new Error(
        'EDID 2.0 (256-byte) base blocks are not supported: version 2 is a deprecated format with a different layout that is not implemented. See the EDID 2.0 follow-up task.',
      );
    }

    const { detailedTimings, displayDescriptors } = decodeDescriptorBlocks(
      bytes,
      header.edidVersion,
      header.edidRevision,
      detectSPWG(bytes),
    );

    const videoInput = VideoInputDefinition.decode(bytes[20]);
    const featureSupport = FeatureSupportFlags.decode(bytes[24], videoInput.isDigital);

    // Section 3.10.1: slot 0 must be populated. A dummy descriptor (tag 0x10)
    // in slot 0 marks the EDID as structurally incomplete, even if other
    // slots contain DTDs.
    const slot0Bytes = bytes.slice(54, 72);
    const slot0IsDummy =
      slot0Bytes[0] === 0x00 &&
      slot0Bytes[1] === 0x00 &&
      slot0Bytes[2] === 0x00 &&
      slot0Bytes[3] === 0x10;
    const slot0IsEmpty = slot0Bytes.every((b) => b === 0x00);
    const isBaseValid = !(slot0IsDummy || slot0IsEmpty);
    const checksumValid = isChecksum8Valid(bytes);

    // VESA E-EDID A2 §3.10.1: the first 18-byte descriptor slot must be
    // populated (a DTD or a non-dummy display descriptor). Surface a
    // human-readable diagnostic so the UI can explain a structurally
    // incomplete base block, not just flag it invalid.
    const baseDiagnostics: string[] = [];
    if (slot0IsDummy) {
      baseDiagnostics.push(
        'First descriptor slot is a dummy (tag 0x10); the preferred-timing descriptor must be populated per VESA E-EDID A2 §3.10.1',
      );
    } else if (slot0IsEmpty) {
      baseDiagnostics.push(
        'First descriptor slot is empty; the preferred-timing descriptor must be populated per VESA E-EDID A2 §3.10.1',
      );
    }

    const edid = new EDID({
      header,
      videoInput,
      screenSize: decodeScreenSize(bytes[21], bytes[22]),
      gamma: decodeGamma(bytes[23]),
      featureSupport,
      colorCharacteristics: ColorCharacteristics.decode(bytes.subarray(25, 35)),
      establishedTimings: EstablishedTiming.decode(bytes.slice(35, 38)),
      standardTimings: StandardTiming.decode(bytes, header.edidVersion, header.edidRevision),
      detailedTimings,
      displayDescriptors,
      isBaseValid,
      checksumValid,
      baseDiagnostics,
    });
    // Remember the block so unedited regions re-encode byte-for-byte.
    return rememberSource(edid, bytes.subarray(0, 128));
  }

  static encode(edid: EDID, options?: { extensionCount?: number }): Uint8Array {
    const out = new Uint8Array(128);

    out.set(edid.header.encode(), 0);
    out[20] = edid.videoInput.encode();
    {
      const [h, v] = encodeScreenSize(edid.screenSize);
      out[21] = h;
      out[22] = v;
    }
    out[23] = edid.gamma === 0 ? 0xFF : Math.round(edid.gamma * 100 - 100);
    out[24] = edid.featureSupport.encode(edid.videoInput.isDigital);
    out.set(edid.colorCharacteristics.encode(), 25);
    out.set(EstablishedTiming.encode(edid.establishedTimings), 35);
    out.set(
      StandardTiming.encode(edid.standardTimings, edid.header.edidVersion, edid.header.edidRevision),
      38,
    );

    out.set(encodeDescriptorSlots(edid), 54);

    // Write the decoded block's own bytes back for every region the user has
    // not changed, so fields the model does not fully capture (reserved bits,
    // padding, SPWG panel data, non-canonical encodings) survive a re-save.
    const source = sourceBytesOf(edid);
    if (source && source.length >= 128) {
      preserveUnchangedRegions(out, source, edid);
    }

    const rawCount = options?.extensionCount ?? 0;
    out[126] = rawCount < 0 ? 0 : rawCount > 0xff ? 0xff : rawCount;
    out[127] = checksum8(out, 127);

    return out;
  }

  static blank(): EDID {
    return new EDID();
  }
}

function decodeDescriptorBlocks(
  bytes: Uint8Array,
  edidVersion?: number,
  edidRevision?: number,
  isSpwg = false,
): {
  detailedTimings: DetailedTimingDescriptor[];
  displayDescriptors: DisplayDescriptor[];
} {
  const detailedTimings: DetailedTimingDescriptor[] = [];
  const displayDescriptors: DisplayDescriptor[] = [];

  for (let i = 0; i < 4; i++) {
    const offset = 54 + i * 18;
    const blockData = bytes.slice(offset, offset + 18);

    if (DisplayDescriptorParser.isDisplayDescriptor(blockData)) {
      const descriptor = DisplayDescriptorParser.decode(blockData, edidVersion, edidRevision);
      if (descriptor) displayDescriptors.push(rememberSource(descriptor, blockData));
    } else {
      const timing = DetailedTimingDescriptor.decode(blockData);
      if (timing) {
        // SPWG Notebook Panel EDID relocates DTD 2's sync-flags byte to the byte
        // immediately preceding its descriptor slot (0x47, shared with DTD 1),
        // and repurposes DTD 2's own byte 17 (0x59) as the SPWG module revision.
        // edid-decode parse-base-block.cpp:973:
        //   if (base.has_spwg && base.detailed_block_cnt == 2) flags = *(x - 1);
        // detailed_block_cnt is 1-based over all four slots, so cnt==2 is the
        // second slot (i===1, offset 0x48). Without this, byte 17 (the module
        // revision, typically 0x00) is read as analog-composite with no
        // polarity — the dominant base.dtds mismatch in the cross-parser oracle.
        //
        // Decode-only fix: encode is intentionally NOT SPWG-aware. Re-encoding
        // overwrites 0x59 with the flags value (losing the module revision) and
        // does not preserve the SPWG Descriptor #4 fields, so re-encoded SPWG
        // bytes are not guaranteed to re-trigger detectSPWG. The decoded DTD
        // sync-flags FIELD stays stable across decode→encode→re-decode because
        // both 0x47 and 0x59 hold the flags value after encode. No test asserts
        // byte-identical SPWG base-block round-trip; full SPWG encode fidelity
        // is a follow-up.
        if (isSpwg && i === 1 && offset >= 1) {
          timing.flags = decodeEdidCtaDetailedTimingFlags(bytes[offset - 1]);
        }
        detailedTimings.push(rememberSource(timing, blockData));
      }
    }
  }

  return { detailedTimings, displayDescriptors };
}

/** Byte 23: 0xFF means gamma is defined elsewhere (modelled as 0). */
function decodeGamma(byte: number): number {
  return byte === 0xFF ? 0 : (byte + 100) / 100;
}

type DescriptorSlotKind = 'dtd' | 'descriptor';

/**
 * The kind of each of the four 18-byte slots in a decoded base block, or null
 * when a slot was dropped on decode (so the model no longer maps 1:1 onto
 * the slots).
 */
function descriptorSlotLayout(source: Uint8Array): DescriptorSlotKind[] | null {
  const layout: DescriptorSlotKind[] = [];
  for (let i = 0; i < 4; i++) {
    const slot = source.subarray(54 + i * 18, 72 + i * 18);
    if (DisplayDescriptorParser.isDisplayDescriptor(slot)) {
      layout.push('descriptor');
    } else if (slot[0] !== 0 || slot[1] !== 0) {
      layout.push('dtd');
    } else {
      return null;
    }
  }
  return layout;
}

/**
 * Encode the four descriptor slots (bytes 54..125).
 *
 * When the timings/descriptors still fit the slot layout the block was decoded
 * with (same number of each), they go back into their original slots — so a
 * block laid out as [DTD, Name, DTD, Serial] isn't reshuffled — and unedited
 * entries keep their exact bytes. Otherwise detailed timings come first, then
 * the non-dummy display descriptors, padded with dummies.
 */
function encodeDescriptorSlots(edid: EDID): Uint8Array {
  const version = edid.header.edidVersion;
  const revision = edid.header.edidRevision;
  const area = new Uint8Array(72);

  const encodeTiming = (timing: DetailedTimingDescriptor) =>
    encodePreservingSource(
      timing,
      (src) => DetailedTimingDescriptor.decode(src),
      (t) => t.encode(),
    );
  const encodeDescriptor = (descriptor: DisplayDescriptor) =>
    encodePreservingSource(
      descriptor,
      (src) => DisplayDescriptorParser.decode(src, version, revision),
      (d) => DisplayDescriptorParser.encode(d, version, revision),
    );

  const source = sourceBytesOf(edid);
  const layout = source && source.length >= 128 ? descriptorSlotLayout(source) : null;
  if (
    layout &&
    layout.filter((kind) => kind === 'dtd').length === edid.detailedTimings.length &&
    layout.filter((kind) => kind === 'descriptor').length === edid.displayDescriptors.length
  ) {
    let timingIndex = 0;
    let descriptorIndex = 0;
    layout.forEach((kind, slot) => {
      area.set(
        kind === 'dtd'
          ? encodeTiming(edid.detailedTimings[timingIndex++])
          : encodeDescriptor(edid.displayDescriptors[descriptorIndex++]),
        slot * 18,
      );
    });
    return area;
  }

  let slot = 0;
  for (const timing of edid.detailedTimings) {
    if (slot >= 4) break;
    area.set(encodeTiming(timing), slot * 18);
    slot++;
  }
  for (const descriptor of edid.displayDescriptors) {
    if (slot >= 4) break;
    if (descriptor.tag === 0x10) continue;
    area.set(encodeDescriptor(descriptor), slot * 18);
    slot++;
  }
  while (slot < 4) {
    area.set(DisplayDescriptorParser.encode({ tag: 0x10 }), slot * 18);
    slot++;
  }
  return area;
}

/**
 * Copy the decoded block's original bytes over each region of `out` whose
 * model is unchanged (it still decodes from `source` to the same value).
 * Bytes 126 (extension count) and 127 (checksum) are always recomputed by the
 * caller.
 */
function preserveUnchangedRegions(out: Uint8Array, source: Uint8Array, edid: EDID): void {
  const version = edid.header.edidVersion;
  const revision = edid.header.edidRevision;
  const keep = (start: number, end: number, unchanged: () => boolean) => {
    let same = false;
    try {
      same = unchanged();
    } catch {
      same = false;
    }
    if (same) out.set(source.subarray(start, end), start);
  };

  keep(0, 20, () => sameModel(EDIDHeader.decode(source), edid.header));
  keep(20, 21, () => sameModel(VideoInputDefinition.decode(source[20]), edid.videoInput));
  keep(21, 23, () => sameModel(decodeScreenSize(source[21], source[22]), edid.screenSize));
  keep(23, 24, () => sameModel(decodeGamma(source[23]), edid.gamma));
  keep(24, 25, () => {
    const sourceIsDigital = VideoInputDefinition.decode(source[20]).isDigital;
    return (
      sourceIsDigital === edid.videoInput.isDigital &&
      sameModel(FeatureSupportFlags.decode(source[24], sourceIsDigital), edid.featureSupport)
    );
  });
  keep(25, 35, () =>
    sameModel(ColorCharacteristics.decode(source.subarray(25, 35)), edid.colorCharacteristics),
  );
  keep(35, 38, () =>
    sameModel(EstablishedTiming.decode(source.slice(35, 38)), edid.establishedTimings),
  );
  keep(38, 54, () =>
    sameModel(StandardTiming.decode(source, version, revision), edid.standardTimings),
  );
  keep(54, 126, () =>
    sameModel(decodeDescriptorBlocks(source, version, revision, detectSPWG(source)), {
      detailedTimings: edid.detailedTimings,
      displayDescriptors: edid.displayDescriptors,
    }),
  );
}

/**
 * Detect the SPWG (Standard Panel Working Group) Notebook Panel EDID sub-format.
 *
 * Matches edid-decode parse-base-block.cpp:1589 exactly: the base block is SPWG
 * when the first two 18-byte descriptor slots (0x36, 0x48) are non-zero DTDs and
 * the last two slots (0x5a, 0x6c) carry SPWG display descriptors (tag 0xfe at
 * byte 3), with the SPWG Descriptor #4 sanity checks at 0x79/0x7a. SPWG relocates
 * DTD 2's sync-flags byte to 0x47 (see decodeDescriptorBlocks).
 */
export function detectSPWG(bytes: Uint8Array): boolean {
  return (
    (bytes[0x36] !== 0 || bytes[0x37] !== 0) &&
    (bytes[0x48] !== 0 || bytes[0x49] !== 0) &&
    bytes[0x5a] === 0 && bytes[0x5b] === 0 && bytes[0x5d] === 0xfe &&
    bytes[0x6c] === 0 && bytes[0x6d] === 0 && bytes[0x6f] === 0xfe &&
    (bytes[0x79] === 1 || bytes[0x79] === 2) && bytes[0x7a] <= 1
  );
}

export {
  DetailedTimingDescriptor,
  decodeEdidCtaDetailedTiming,
  decodeEdidCtaDetailedTimingFlags,
  encodeEdidCtaDetailedTiming,
  encodeEdidCtaDetailedTimingFlags,
  normalizeDetailedTiming,
  normalizeTimingFlags,
} from "../common/detailed-timing-descriptor";
export type { DetailedTiming, DetailedTimingInput, StereoMode, SyncType, TimingFlags } from "../common/detailed-timing-descriptor";
export { ColorCharacteristics } from "./color-characteristics";
export { EDIDHeader, EDID_VERSIONS, EDID_REVISIONS } from "./edid-header";
export type { EDIDVersion } from "./edid-header";
export { EstablishedTiming } from "./established-timing";
export { StandardTiming } from "./standard-timing";
export { VideoInputDefinition, ANALOG_SIGNAL_LEVELS, DIGITAL_BIT_DEPTHS, DIGITAL_INTERFACES, DIGITAL_BIT_DEPTH_LABELS, DIGITAL_INTERFACE_LABELS } from "./video-input";
export type { VideoInput, AnalogVideoInput, DigitalVideoInput, DigitalBitDepth, DigitalInterface, AnalogSignalLevel } from "./video-input";
export { FeatureSupportFlags, ANALOG_DISPLAY_TYPES, DIGITAL_COLOR_ENCODINGS, DIGITAL_COLOR_ENCODING_LABELS, ANALOG_DISPLAY_TYPE_LABELS } from "./feature-support";
export type { FeatureSupport, AnalogDisplayType, DigitalColorEncoding } from "./feature-support";
export {
  DisplayDescriptorParser,
  getProductName,
  getProductSerial,
  getRangeLimits,
  DISPLAY_DESCRIPTOR_LABELS,
  DISPLAY_DESCRIPTOR_OPTIONS,
  getDisplayDescriptorLabel,
  createDefaultDescriptor,
  RANGE_LIMITS_TIMING_SUPPORT_OPTIONS,
  RANGE_CVT_ASPECT_RATIO_FLAGS,
  RANGE_CVT_PREFERRED_ASPECT_OPTIONS,
  CVT_TIMING_ASPECT_RATIO_OPTIONS,
  CVT_PREFERRED_REFRESH_OPTIONS,
  CVT_REFRESH_RATE_FLAGS,
  DCM_COEFFICIENT_FIELDS,
} from "./display-descriptor";
export type {
  DisplayDescriptor,
  DisplayDescriptorTag,
  ProductSerialDescriptor,
  AlphanumericDataDescriptor,
  DisplayRangeLimitsDescriptor,
  ProductNameDescriptor,
  ColorPointDescriptor,
  StandardTimingIdDescriptor,
  DCMDescriptor,
  CVTTimingDescriptor,
  EstablishedTimingsIIIDescriptor,
  DummyDescriptor,
  ManufacturerDescriptor,
  DCMCoefficientField,
} from "./display-descriptor";
