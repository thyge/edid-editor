import { DisplayDescriptorInterface, DescriptorType } from "./edid_descriptors";
import { CVTGenerator } from "./cvtgenerator";

// TODO: Detect which CVT mode the DTD is in
// Table 3-1: Sync Polarities
// Table3-2: Vertical Sync Duration
export enum CVTMode {
  NONCVT = "non-cvt",
  CRT = "CRT",
  CVT_RB = "cvt_rb",
  CVT_RB2 = "cvt_rb2",
}

enum StereoMode {
  NoStereo = "No Stereo",
  FieldSequentialRight = "Field sequential, right image on sync signal",
  FieldSequentialLeft = "Field sequential, left image on sync signal",
  TwoWayInterleavedRight = "2-way interleaved, right image on even lines",
  TwoWayInterleavedLeft = "2-way interleaved, left image on even lines",
  FourWayInterleaved = "4-way interleaved",
  SideBySideInterleaved = "side-by-side interleaved",
}

export enum SyncType {
  AnalogComposite = "Analog Composite",
  BipolarAnalogComposite = "Bipolar Analog Composite",
  DigitalComposite = "Digital Composite",
  DigitalSeparate = "Digital Separate",
}
interface SyncDefinition {
  SyncType: SyncType;
  Decode(edidBytes: Uint8Array): SyncDefinition;
  Encode(): number;
}
// Analog Composite Sync
class AnalogCompositeSync implements SyncDefinition {
  SyncType: SyncType;
  constructor() {
    this.SyncType = SyncType.AnalogComposite;
  }
  Decode(edidBytes: Uint8Array): AnalogCompositeSync {
    return this;
  }
  Encode(): number {
    return 0;
  }
}
// Bipolar Analog Composite Sync
class BipolarAnalogCompositeSync implements SyncDefinition {
  Serrations: boolean = false;
  SyncOn: string = "Green Only";
  SyncType: SyncType;
  constructor() {
    this.SyncType = SyncType.BipolarAnalogComposite;
  }
  Decode(edidBytes: Uint8Array): BipolarAnalogCompositeSync {
    this.Serrations = (edidBytes[17] & 0x4) > 0 ? true : false;
    this.SyncOn =
      (edidBytes[17] & 0x2) > 0 ? "Green Only" : "On all three (RGB)";
    return this;
  }
  Encode(): number {
    let encoded = 0;
    // analog
    if (this.Serrations) {
      encoded |= 4;
    }
    if (this.SyncOn === "Green Only") {
      encoded |= 2;
    }
    return 0;
  }
}

// Digital Composite Sync
class DigitalCompositeSync implements SyncDefinition {
  Serrations: boolean = false;
  SyncType: SyncType;
  constructor() {
    this.SyncType = SyncType.DigitalComposite;
  }
  Decode(edidBytes: Uint8Array): DigitalCompositeSync {
    this.Serrations = (edidBytes[17] & 0x4) > 0 ? true : false;
    return this;
  }
  Encode(): number {
    let encoded = 0;
    // digital
    encoded |= 16;
    // composite
    if (this.Serrations) {
      encoded |= 4;
    }
    return encoded;
  }
}
class DigitalSeparateSync implements SyncDefinition {
  VerticalSync: string = "";
  HorizontalSync: string = "";
  SyncType: SyncType;
  constructor() {
    this.SyncType = SyncType.DigitalSeparate;
  }
  Decode(edidBytes: Uint8Array): DigitalSeparateSync {
    this.VerticalSync = (edidBytes[17] & 0x4) > 0 ? "Positive" : "Negative";
    this.HorizontalSync = (edidBytes[17] & 0x2) > 0 ? "Positive" : "Negative";
    return this;
  }
  Encode(): number {
    let encoded = 0;
    // digital
    encoded |= 16;
    // separate
    encoded |= 8;
    if (this.VerticalSync === "Positive") {
      encoded |= 4;
    }
    if (this.HorizontalSync === "Positive") {
      encoded |= 2;
    }
    return encoded;
  }
}

export class DetailedTimingDescriptor implements DisplayDescriptorInterface {
  raw: Uint8Array = new Uint8Array();
  Type: DescriptorType;
  // Stored Value = Pixel clock ÷ 10,000
  // Range: 10 kHz to 655.35 MHz in 10 kHz steps
  PixelClockKHz: number = 0;

  HorizontalActive: number = 1920;
  HorizontalBlanking: number = 0;
  HorizontalFrontPorch: number = 0;
  HorizontalSyncPulseWidth: number = 0;
  VerticalActive: number = 1080;
  VerticalBlanking: number = 0;
  VerticalFrontPorch: number = 0;
  VerticalSyncPulseWidth: number = 0;

  HorizontalImageSize: number = 0;
  VerticalImageSize: number = 0;

  HorizontalBorder: number = 0;
  VerticalBorder: number = 0;

  Interlaced: boolean = false;
  StereoMode: StereoMode = StereoMode.NoStereo;
  SyncDefinition: SyncDefinition = new DigitalCompositeSync();

  // Supplemental information
  CVTMode: CVTMode = CVTMode.CRT;
  VerticalRefreshRate: number = 60;
  HorizontalRefreshRate: number = 0;

  constructor() {
    this.Type = DescriptorType.DetailedTimingDescriptor;
  }

  Decode(edidBytes: Uint8Array): DisplayDescriptorInterface {
    this.raw = edidBytes;
    this.PixelClockKHz = ((edidBytes[1] << 8) | edidBytes[0]) * 10000;
    this.HorizontalActive = ((edidBytes[4] & 0xf0) << 4) | edidBytes[2];
    this.HorizontalBlanking = edidBytes[3] | ((edidBytes[4] & 0xf) << 8);
    this.VerticalActive = ((edidBytes[7] & 0xf0) << 4) | edidBytes[5];
    this.VerticalBlanking = ((edidBytes[7] & 0xf) << 8) | edidBytes[6];

    this.HorizontalFrontPorch = ((edidBytes[11] & 0xc0) << 2) | edidBytes[8];
    this.HorizontalSyncPulseWidth =
      ((edidBytes[11] & 0x30) << 4) | edidBytes[9];

    this.VerticalFrontPorch =
      (edidBytes[11] & (0xc << 2)) | ((edidBytes[10] & 0xf0) >> 4);
    this.VerticalSyncPulseWidth =
      ((edidBytes[11] & 0x3) << 4) | (edidBytes[10] & 0xf);

    this.HorizontalImageSize = ((edidBytes[14] & 0xf0) << 4) | edidBytes[12];
    this.VerticalImageSize = ((edidBytes[14] & 0xf) << 8) | edidBytes[13];

    this.HorizontalBorder = edidBytes[15];
    this.VerticalBorder = edidBytes[16];
    this.Interlaced = edidBytes[17] & 0x80 ? true : false;

    if (edidBytes[17] & 0x1) {
      switch (edidBytes[17] & 0x60) {
        case 1:
          this.StereoMode = StereoMode.TwoWayInterleavedRight;
          break;
        case 2:
          this.StereoMode = StereoMode.TwoWayInterleavedLeft;
          break;
        case 3:
          this.StereoMode = StereoMode.SideBySideInterleaved;
          break;
        default:
          this.StereoMode = StereoMode.NoStereo;
          break;
      }
    } else {
      switch (edidBytes[17] & 0x60) {
        case 1:
          this.StereoMode = StereoMode.FieldSequentialRight;
          break;
        case 2:
          this.StereoMode = StereoMode.FieldSequentialLeft;
          break;
        case 3:
          this.StereoMode = StereoMode.FourWayInterleaved;
          break;
        default:
          this.StereoMode = StereoMode.NoStereo;
          break;
      }
    }
    // Sync Signal Definitions
    switch (edidBytes[17] & 0x18) {
      case 0:
        this.SyncDefinition = new AnalogCompositeSync().Decode(edidBytes);
        break;
      case 8:
        this.SyncDefinition = new BipolarAnalogCompositeSync().Decode(
          edidBytes
        );
        break;
      case 16:
        this.SyncDefinition = new DigitalCompositeSync().Decode(edidBytes);
        break;
      case 24:
        this.SyncDefinition = new DigitalSeparateSync().Decode(edidBytes);
        break;
    }
    // Reasoning about the CVT Mode
    // Table 3-1: Sync Polarities
    if (this.SyncDefinition.SyncType === SyncType.DigitalSeparate) {
      let digitalSeparate = this.SyncDefinition as DigitalSeparateSync;
      if (
        digitalSeparate.HorizontalSync === "Negative" &&
        digitalSeparate.VerticalSync === "Positive"
      ) {
        this.CVTMode = CVTMode.CRT;
      } else if (
        digitalSeparate.HorizontalSync === "Positive" &&
        digitalSeparate.VerticalSync === "Negative"
      ) {
        this.CVTMode = CVTMode.CVT_RB;
      } else {
        this.CVTMode = CVTMode.NONCVT;
      }
    }
    // Table3-2: Vertical Sync Duration
    switch (this.VerticalSyncPulseWidth) {
      case 8:
        this.CVTMode = CVTMode.CVT_RB2;
        break;
      default:
        this.CVTMode = CVTMode.NONCVT;
    }
    if (this.HorizontalBlanking === 80) {
      this.CVTMode = CVTMode.CVT_RB2;
    } else if (this.HorizontalBlanking === 160) {
      this.CVTMode = CVTMode.CVT_RB;
    }

    // Supplemental information
    let horTotPix = this.HorizontalActive + this.HorizontalBlanking;
    let verTotPix = this.VerticalActive + this.VerticalBlanking;
    this.VerticalRefreshRate = this.PixelClockKHz / (horTotPix * verTotPix);
    this.HorizontalRefreshRate = this.PixelClockKHz / horTotPix;

    // TODO: remove this
    // this.ComputeTiming();
    return this;
  }
  Encode(): Uint8Array {
    console.log("Encoding DTD");
    // Reset the raw array
    this.raw = new Uint8Array(18);
    // Input the data
    this.raw[0] = (this.PixelClockKHz / 10000) & 0xff;
    this.raw[1] = (this.PixelClockKHz / 10000) >> 8;

    this.raw[2] = this.HorizontalActive & 0xff;
    this.raw[3] = this.HorizontalBlanking & 0xff;
    this.raw[4] |= (this.HorizontalActive & 0xf00) >> 4;
    this.raw[4] |= (this.HorizontalBlanking & 0xf00) >> 8;

    this.raw[5] = this.VerticalActive & 0xff;
    this.raw[6] = this.VerticalBlanking & 0xff;
    this.raw[7] |= (this.VerticalActive & 0xf00) >> 4;
    this.raw[7] |= (this.VerticalBlanking & 0xf00) >> 8;

    this.raw[8] = this.HorizontalFrontPorch & 0xff;
    this.raw[11] |= (this.HorizontalFrontPorch & 0x300) >> 2;

    this.raw[9] = this.HorizontalSyncPulseWidth & 0xff;
    this.raw[11] |= (this.HorizontalSyncPulseWidth & 0x300) >> 4;

    this.raw[10] |= (this.VerticalFrontPorch & 0xf) << 4;
    this.raw[11] |= (this.VerticalFrontPorch & 0x30) >> 2;

    this.raw[10] |= this.VerticalSyncPulseWidth & 0xf;
    this.raw[11] |= (this.VerticalSyncPulseWidth & 0x30) >> 4;

    this.raw[12] = this.HorizontalImageSize & 0xff;
    this.raw[13] = this.VerticalImageSize & 0xff;

    this.raw[14] |= (this.HorizontalImageSize & 0xf00) >> 4;
    this.raw[14] |= (this.VerticalImageSize & 0xf00) >> 8;

    this.raw[15] = this.HorizontalBorder;
    this.raw[16] = this.VerticalBorder;

    this.raw[17] |= this.Interlaced ? 0x80 : 0;
    switch (this.StereoMode) {
      case StereoMode.FieldSequentialRight:
        this.raw[17] |= 32;
        break;
      case StereoMode.FieldSequentialLeft:
        this.raw[17] |= 64;
        break;
      case StereoMode.TwoWayInterleavedRight:
        this.raw[17] |= 33;
        break;
      case StereoMode.TwoWayInterleavedLeft:
        this.raw[17] |= 65;
        break;
      case StereoMode.FourWayInterleaved:
        this.raw[17] |= 96;
        break;
      case StereoMode.SideBySideInterleaved:
        this.raw[17] |= 97;
        break;
      default: // NoStereo normal display
        this.raw[17] |= 0;
        break;
    }
    this.raw[17] |= this.SyncDefinition.Encode();
  }

  // Adapted from https://github.com/tomverbeure/tomverbeure.github.io/blob/master/video_timings_calculator.html
  // and VESA Coordinated Video Timings (CVT) Standard Version 1.2
  ComputeTiming(
    hori_active: number,
    vert_active: number,
    refresh_rate: number,
    cvt_mode: CVTMode,
    margins: boolean,
    interlaced: boolean
  ) {
    // map input names to CVT names
    let generator = new CVTGenerator();
    generator.Generate(
      hori_active,
      vert_active,
      refresh_rate,
      cvt_mode,
      margins,
      interlaced
    );
    this.HorizontalActive = generator.HorizontalActive;
    this.VerticalActive = generator.VerticalActive;

    this.HorizontalBlanking = generator.HorizontalBlanking;
    this.VerticalBlanking = generator.VerticalBlanking;

    this.HorizontalFrontPorch = generator.HorizontalFrontPorch;
    this.VerticalFrontPorch = generator.VerticalFrontPorch;

    this.HorizontalSyncPulseWidth = generator.HorizontalSyncPulseWidth;
    this.VerticalSyncPulseWidth = generator.VerticalSyncPulseWidth;

    this.HorizontalBorder = generator.HorizontalBorder;
    this.VerticalBorder = generator.VerticalBorder;

    this.HorizontalRefreshRate = generator.HorizontalRefreshRate;
    this.VerticalRefreshRate = generator.VerticalRefreshRate;

    this.PixelClockKHz = generator.PixelClockKHz;
  }
}
