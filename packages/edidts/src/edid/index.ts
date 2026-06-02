import { DetailedTimingDescriptor } from "../common/detailed-timing-descriptor";
import { generateCVTDetailedTiming } from "../common/cvt-timing-generator";
import { checksum8 } from "../common/checksum";
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

export { decodeScreenSize, encodeScreenSize } from "./screen-size";
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
  }

  static decode(data: ArrayBuffer | Uint8Array): EDID {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (bytes.length < 128) {
      throw new Error(`Invalid EDID: minimum 128 bytes required - current length: ${bytes.length}`);
    }

    const { detailedTimings, displayDescriptors } = decodeDescriptorBlocks(bytes);

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

    return new EDID({
      header: EDIDHeader.decode(bytes),
      videoInput,
      screenSize: decodeScreenSize(bytes[21], bytes[22]),
      gamma: bytes[23] === 0xFF ? 0 : (bytes[23] + 100) / 100,
      featureSupport,
      colorCharacteristics: ColorCharacteristics.decode(bytes.subarray(25, 35)),
      establishedTimings: EstablishedTiming.decode(bytes.slice(35, 38)),
      standardTimings: StandardTiming.decode(bytes),
      detailedTimings,
      displayDescriptors,
      isBaseValid,
    });
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
    out.set(StandardTiming.encode(edid.standardTimings), 38);

    let blockIndex = 0;
    for (const timing of edid.detailedTimings) {
      if (blockIndex >= 4) break;
      out.set(timing.encode(), 54 + blockIndex * 18);
      blockIndex++;
    }
    for (const descriptor of edid.displayDescriptors) {
      if (blockIndex >= 4) break;
      if (descriptor.tag === 0x10) continue;
      out.set(DisplayDescriptorParser.encode(descriptor), 54 + blockIndex * 18);
      blockIndex++;
    }
    while (blockIndex < 4) {
      out.set(DisplayDescriptorParser.encode({ tag: 0x10 }), 54 + blockIndex * 18);
      blockIndex++;
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

function decodeDescriptorBlocks(bytes: Uint8Array): {
  detailedTimings: DetailedTimingDescriptor[];
  displayDescriptors: DisplayDescriptor[];
} {
  const detailedTimings: DetailedTimingDescriptor[] = [];
  const displayDescriptors: DisplayDescriptor[] = [];

  for (let i = 0; i < 4; i++) {
    const offset = 54 + i * 18;
    const blockData = bytes.slice(offset, offset + 18);

    if (DisplayDescriptorParser.isDisplayDescriptor(blockData)) {
      const descriptor = DisplayDescriptorParser.decode(blockData);
      if (descriptor) displayDescriptors.push(descriptor);
    } else {
      const timing = DetailedTimingDescriptor.decode(blockData);
      if (timing) detailedTimings.push(timing);
    }
  }

  return { detailedTimings, displayDescriptors };
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
export { VideoInputDefinition, ANALOG_SIGNAL_LEVELS, DIGITAL_BIT_DEPTHS, DIGITAL_INTERFACES } from "./video-input";
export type { VideoInput, AnalogVideoInput, DigitalVideoInput, DigitalBitDepth, DigitalInterface, AnalogSignalLevel } from "./video-input";
export { FeatureSupportFlags, ANALOG_DISPLAY_TYPES, DIGITAL_COLOR_ENCODINGS } from "./feature-support";
export type { FeatureSupport, AnalogDisplayType, DigitalColorEncoding } from "./feature-support";
export { DisplayDescriptorParser, getProductName, getProductSerial, getRangeLimits } from "./display-descriptor";
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
} from "./display-descriptor";
