import { ManufacturerID } from "./edid-header.ts";
import {
  DigitalVideoInput,
  AnalogVideoInput,
  SignalInterface,
  type VideoSignalInterface,
} from "./video-input.ts";
import {
  FeatureSupport,
  DigitalColourEncoding,
  AnalogueColourEncoding,
  EdidVersion,
} from "./feature-support.ts";
import { Chromaticity } from "./color-characteristics.ts";
import { EstablishedTimings } from "./established-timing.ts";
import { StandardTiming, AspectRatio } from "./standard-timing.ts";
import { DetailedTimingDescriptor } from "../common/DetailedTimingDescriptor.ts";
import { calcEDIDChecksum, readUint16LE, readUint32LE } from "../common/utils.ts";
import {
  DecodeDesciptor,
  DescriptorType,
  DummyDesciptor,
  DisplayProductName,
  type DisplayDescriptorUnion,
} from "./display-descriptor.ts";

export {
  ManufacturerID,
} from "./edid-header.ts";
export {
  DigitalVideoInput,
  AnalogVideoInput,
  SignalInterface,
} from "./video-input.ts";
export {
  FeatureSupport,
  DigitalColourEncoding,
  AnalogueColourEncoding,
  EdidVersion,
} from "./feature-support.ts";
export { Chromaticity } from "./color-characteristics.ts";
export { EstablishedTimings } from "./established-timing.ts";
export { StandardTiming, AspectRatio } from "./standard-timing.ts";
export {
  DecodeDesciptor,
  DescriptorType,
  DummyDesciptor,
  DisplayProductName,
  type DisplayDescriptorUnion,
} from "./display-descriptor.ts";

export class EDID {
  raw: Uint8Array = new Uint8Array();
  Extension: number = 0;
  Version: number = 0;
  Revision: number = 0;
  SerialNumber: number = 0;
  ManufacturerID: ManufacturerID = new ManufacturerID();
  ManufacturerPC: number = 0;
  WeekOfManufacture: number = 0;
  YearOfManufacture: number = 0;
  // Basic Display Parameters and Features
  VideoInputDefinition: VideoSignalInterface = new DigitalVideoInput(0);
  HorizontalSizeCM: number = 0;
  VerticalSizeCM: number = 0;
  Gamma: number = 0;
  FeatureSupport: FeatureSupport = new FeatureSupport(0, SignalInterface.Digital);
  //
  Chromaticity: Chromaticity = new Chromaticity(new Uint8Array(10));
  EstablishedTimings: EstablishedTimings = new EstablishedTimings(new Uint8Array(3));
  StandardTimings: Array<StandardTiming> = [];
  DisplayDescriptors: DisplayDescriptorUnion[] = [];
  Errors: string[] = [];
  DummyIdentifiers: number = 0;

  static decode(bytes: Uint8Array): EDID {
    const e = new EDID();
    e.Decode(bytes);
    return e;
  }

  get EdidVersion(): EdidVersion {
    if (this.Version !== 1) return EdidVersion.Other;
    const rev = this.Revision;
    if (rev <= 2) return EdidVersion.Pre13;
    if (rev === 3) return EdidVersion.V13;
    if (rev >= 4) return EdidVersion.V14;
    return EdidVersion.Other;
  }

  get displayProductName(): string {
    const dpm = this.DisplayDescriptors.find(
      (d) => d.Type === DescriptorType.DisplayProductName
    ) as DisplayProductName | undefined;
    return dpm?.text ?? "";
  }

  Decode(bytes: Uint8Array) {
    this.raw = bytes;
    // Header validation
    const header = [0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00];
    for (let i = 0; i < 8; i++) {
      if (this.raw[i] !== header[i]) {
        this.Errors.push(`Invalid header byte at offset ${i}`);
      }
    }
    // Checksum verification
    let sum = 0;
    for (let i = 0; i < 128; i++) sum += this.raw[i] ?? 0;
    if ((sum & 0xff) !== 0) {
      this.Errors.push("Checksum invalid");
    }
    // Manufacturer ID. This is a legacy Plug and Play ID assigned by UEFI forum
    this.ManufacturerID = ManufacturerID.decode(this.raw.slice(8, 10));

    // Manufacturer product code.
    this.ManufacturerPC = readUint16LE(this.raw, 10);

    // Serial number
    this.SerialNumber = readUint32LE(this.raw, 12);

    // Week of manufacture
    this.WeekOfManufacture = this.raw[16] ?? 0;
    // Year of manufacture or Model Year
    this.YearOfManufacture = (this.raw[17] ?? 0) + 1990;
    // Version
    this.Version = this.raw[18] ?? 0;
    // Revision
    this.Revision = this.raw[19] ?? 0;

    // Basic display parameters
    if ((this.raw[20] ?? 0) & 0x80) {
      this.VideoInputDefinition = DigitalVideoInput.decode(this.raw[20] ?? 0);
    } else {
      this.VideoInputDefinition = AnalogVideoInput.decode(this.raw[20] ?? 0);
    }
    // Horizontal screen size
    // Vertical screen size
    // EDID 1.4 H & V Screen Size and Aspect Ratio
    this.HorizontalSizeCM = this.raw[21] ?? 0;
    this.VerticalSizeCM = this.raw[22] ?? 0;
    // Display gamma
    if ((this.raw[23] ?? 0) === 0xff) {
      console.log("gamma is defined by DI-EXT block.");
    }
    this.Gamma = (this.raw[23] ?? 0) / 100 + 1;
    // DPMS
    this.FeatureSupport = FeatureSupport.decode(
      this.raw[24] ?? 0,
      this.VideoInputDefinition.SignalInterface,
      this.EdidVersion
    );

    // Chromaticity coordinates.
    this.Chromaticity = Chromaticity.decode(this.raw.slice(25, 35));

    // Established timing bitmap. Supported bitmap for (formerly) very common timing modes.
    this.EstablishedTimings = EstablishedTimings.decode(this.raw.slice(35, 38));

    // Standard timing information
    for (let i = 38; i < 54; i += 2) {
      // Unused fields are filled with 01 01
      let stdTiming = StandardTiming.decode(this.raw.slice(i, i + 2), this.EdidVersion);
      this.StandardTimings.push(stdTiming);
    }
    // Detailed timing descriptors
    // Preferred Timing Mode (PTM)
    for (let i = 54; i < 126; i += 18) {
      // if first 2 bytes / pixel clock is 0 then parse as Display Descriptor
      // first descriptor has to be DTD Preferred timing
      let descriptorBytes = this.raw.slice(i, i + 18);
      if (
        descriptorBytes[0] === 0 &&
        descriptorBytes[1] === 0 &&
        descriptorBytes[2] === 0
      ) {
        let mDesc = DecodeDesciptor(descriptorBytes);
        if (mDesc && mDesc.Type === DescriptorType.Dummy) {
          break;
        }
        if (mDesc) {
          this.DisplayDescriptors.push(mDesc);
        }
      } else {
        let decodedDtd = DetailedTimingDescriptor.decode(descriptorBytes);
        if (decodedDtd) {
          this.DisplayDescriptors.push(decodedDtd);
        }
      }
    }
    if (this.DisplayDescriptors.length < 4) {
      // Each of the four data blocks shall contain a detailed timing descriptor, a display descriptor or a dummy descriptor (Tag 10h)
      // using definitions described in Sections 3.10.2 and 3.10.3. Use of a data fill pattern is not permitted -
      // the Dummy Descriptor (Tag 10h) is the only exception."
      this.Errors.push("too few Display Descriptiors, should always be 4");
    }
  }

  Encode(): Uint8Array {
    console.log("Encoding EDID");
    const raw = new Uint8Array(128);
    raw.set(this.raw.slice(0, 128));
    // Header
    raw.set([0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00], 0);
    // Manufacturer ID
    let mid_bytes = this.ManufacturerID.Encode();
    raw[8] = mid_bytes[0] ?? 0;
    raw[9] = mid_bytes[1] ?? 0;
    // ID Product Code
    raw[10] = this.ManufacturerPC & 0xff;
    raw[11] = (this.ManufacturerPC >> 8) & 0xff;
    // ID Serial Number
    if (this.SerialNumber <= 4294967295 && this.SerialNumber >= 0) {
      raw[12] = this.SerialNumber & 0xff;
      raw[13] = (this.SerialNumber >> 8) & 0xff;
      raw[14] = (this.SerialNumber >> 16) & 0xff;
      raw[15] = (this.SerialNumber >> 24) & 0xff;
    } else {
      raw[12] = 0;
      raw[13] = 0;
      raw[14] = 0;
      raw[15] = 0;
    }

    // Week of Manufacture: clamp to 0–52, 0 means not specified
    if (this.WeekOfManufacture > 52) {
      raw[16] = 52;
    } else if (this.WeekOfManufacture < 0) {
      raw[16] = 0;
    } else {
      raw[16] = this.WeekOfManufacture;
    }
    // Year of Manufacture or Model Year
    if (this.YearOfManufacture >= 1990) {
      raw[17] = this.YearOfManufacture - 1990;
    } else {
      raw[17] = 0;
    }
    // EDID Version
    raw[18] = this.Version;
    // EDID Revision
    raw[19] = this.Revision;
    // Video Input Definition
    raw[20] = this.VideoInputDefinition.Encode();
    // Horizontal Screen Size or Aspect Ratio
    raw[21] = this.HorizontalSizeCM & 0xff;
    // Vertical Screen Size or Aspect Ratio
    raw[22] = this.VerticalSizeCM & 0xff;
    // Display Gamma
    if (this.Gamma >= 1.0 && this.Gamma <= 3.54) {
      raw[23] = this.Gamma * 100 - 100;
    }
    // Features Support
    raw[24] = this.FeatureSupport.Encode();
    // Chromaticity
    let chromaticity = this.Chromaticity.Encode();
    for (let i = 0; i < 9; i++) {
      raw[25 + i] = chromaticity[i] ?? 0;
    }
    // Established Timings
    let etBytes = this.EstablishedTimings.Encode();
    raw[35] = etBytes[0] ?? 0;
    raw[36] = etBytes[1] ?? 0;
    raw[37] = etBytes[2] ?? 0;
    // Standard Timings
    for (let i = 0; i < 8; i++) {
      let stdTiming = this.StandardTimings[i]?.Encode();
      raw[38 + i * 2] = stdTiming?.[0] ?? 0;
      raw[39 + i * 2] = stdTiming?.[1] ?? 0;
    }

    // Display Descriptors
    for (let i = 0; i < 4; i++) {
      let dd = this.DisplayDescriptors[i];
      // Add dummy descriptors if less than 4
      if (dd === undefined) {
        dd = new DummyDesciptor();
      }
      let bytes = dd.Encode();
      for (let j = 0; j < 18; j++) {
        raw[54 + i * 18 + j] = bytes[j] ?? 0;
      }
    }
    // Checksum
    raw[127] = calcEDIDChecksum(raw);
    return raw;
  }
}
