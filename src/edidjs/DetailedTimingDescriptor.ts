import { DisplayDescriptorInterface, DescriptorType} from "./edid_descriptors";

export class DetailedTimingDescriptor implements DisplayDescriptorInterface {
  raw: Uint8Array = new Uint8Array();
  Type: DescriptorType;
  // Stored Value = Pixel clock ÷ 10,000
  // Range: 10 kHz to 655.35 MHz in 10 kHz steps
  PixelClockKHz: number = 0;

  HorizontalActive: number = 0;
  HorizontalBlanking: number = 0;
  HorizontalFrontPorch: number = 0;
  HorizontalSyncPulseWidth: number = 0;
  VerticalActive: number = 0;
  VerticalBlanking: number = 0;
  VerticalFrontPorch: number = 0;
  VerticalSyncPulseWidth: number = 0;

  HorizontalImageSize: number = 0;
  VerticalImageSize: number = 0;

  HorizontalBorder: number = 0;
  VerticalBorder: number = 0;

  Interlaced: boolean = false;
  StereoMode: string = "";
  Digital: boolean = false;
  Sync: string = "";
  VerticalSyncPolarity: string = "";
  HorizontalSyncPolarity: string = "";
  SyncMode: {
    BipolarCompositeSync: boolean;
    Serrations: boolean;
    SyncOn: string;
  } = { BipolarCompositeSync: false, Serrations: false, SyncOn: "" };

  // Supplemental information
  horTotPix: number = 0;
  verTotPix: number = 0;
  VerticalRefreshRate: number = 0;
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

    switch (edidBytes[17] & 0x61) {
      case 0:
        this.StereoMode = "No Stereo";
        break;
      case 1:
        if (edidBytes[17] & 0x1) {
          this.StereoMode = "2-way interleaved, right image on even lines";
        } else {
          this.StereoMode = "Field sequential, right image on sync signal";
        }
        break;
      case 2:
        if (edidBytes[17] & 0x1) {
          this.StereoMode = "2-way interleaved, left image on even lines";
        } else {
          this.StereoMode = "Field sequential, left image on sync signal";
        }
        break;
      case 3:
        if (edidBytes[17] & 0x1) {
          this.StereoMode = "side-by-side interleaved";
        } else {
          this.StereoMode = "4-way interleaved";
        }
        break;
    }
    if ((edidBytes[17] & 0x10) > 0) {
      // Digital
      this.Digital = true;
      if ((edidBytes[17] & 0x8) > 0) {
        // Digital Separate Sync:
        this.Sync = "Separate";
        this.VerticalSyncPolarity =
          (edidBytes[17] & 0x4) > 0 ? "Positive" : "Negative";
        this.HorizontalSyncPolarity =
          (edidBytes[17] & 0x2) > 0 ? "Positive" : "Negative";
      } else {
        // Digital Composite Sync:
        this.SyncMode = "Composite";
        this.SyncMode.Serrations = (edidBytes[17] & 0x4) > 0 ? true : false;
      }
    } else {
      // Analog
      this.Digital = false;
      this.SyncMode.BipolarCompositeSync =
        (edidBytes[17] & 0x8) > 0 ? true : false;
      this.SyncMode.Serrations = (edidBytes[17] & 0x4) > 0 ? true : false;
      this.SyncMode.SyncOn =
        (edidBytes[17] & 0x2) > 0
          ? "Green Signal only"
          : "all three (RGB) video signals";
    }

    // Supplemental information
    this.horTotPix = this.HorizontalActive + this.HorizontalBlanking;
    this.verTotPix = this.VerticalActive + this.VerticalBlanking;
    this.VerticalRefreshRate =
      this.PixelClockKHz / (this.horTotPix * this.verTotPix);
    this.HorizontalRefreshRate = this.PixelClockKHz / this.horTotPix;
    return this;
  }
  Encode(): Uint8Array {
    // Reset the raw array
    for (let i = 0; i < this.raw.length; i++) {
      this.raw[i] = 0;
    }
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
      case "No Stereo":
        this.raw[17] |= 0;
        break;
      case "Field sequential, right image on sync signal":
        this.raw[17] |= 0x20;
        break;
      case "Field sequential, left image on sync signal":
        this.raw[17] |= 0x40;
        break;
      case "2-way interleaved, right image on even lines":
        this.raw[17] |= 0x21;
        break;
      case "2-way interleaved, left image on even lines":
        this.raw[17] |= 0x41;
        break;
      case "4-way interleaved":
        this.raw[17] |= 0x60;
        break;
      case "side-by-side interleaved":
        this.raw[17] |= 0x61;
        break;
    }
    this.raw[17] |= this.Interlaced ? 0x80 : 0;
    this.raw[17] |= this.Digital ? 0x10 : 0;
    if (this.Sync === "Separate") {
      this.raw[17] |= 0x8;
      this.raw[17] |= this.VerticalSyncPolarity === "Positive" ? 0x4 : 0;
      this.raw[17] |= this.HorizontalSyncPolarity === "Positive" ? 0x2 : 0;
    } else {
      this.raw[17] |= this.Serrations ? 0x4 : 0;
    }
    return this.raw;
  }
}

export const DD_SerialNumber = 0xff;
export const DD_UnspecifiedText = 0xfe;
export const DD_DisplayRangeLimits = 0xfd;
export const DD_DisplayProductName = 0xfc;
export const DD_ColorPointData = 0xfb;
export const DD_StandardTimingDefinitions = 0xfa;
export const DD_DCM = 0xf9;
export const DD_CVT3_ByteCodes = 0xf8;
export const DD_EstablishedTimingsIII = 0xf7;
export const DD_DummyIdentifier = 0x10;
export const DD_ManufacturerStart = 0x00;
export const DD_ManufacturerEnd = 0x0f;

export class DisplayDescriptor {
  id = uuidv4();
  raw = [];
  Type;
  Content = "";
}

DisplayDescriptor.prototype.Encode = function () {
  // console.log("Encoding... current raw:")
  // console.log(this.raw);
};

export function MakeDummyDescriptor() {
  let dummyBytes = new Uint8Array(18);
  dummyBytes[3] = DD_DummyIdentifier;
  return DecodeDisplayDescriptor(dummyBytes, 0);
}

export class ASCIIDescriptor {
  id = uuidv4();
  raw = [];
  Type = "";
  Content = "";
  mType;
}

ASCIIDescriptor.prototype.Encode = function () {
  this.raw[3] = this.mType;
  for (let d = 5; d < 19; d++) {
    this.raw[d] = 0;
  }
  for (let d = 0; d < this.Content.length; d++) {
    if (d > 14) {
      break;
    }
    this.raw[d + 5] = this.Content.charCodeAt(d);
  }
};
