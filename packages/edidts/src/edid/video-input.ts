export interface VideoSignalInterface {
  SignalInterface: SignalInterface;
  Encode(): number;
}

export const SignalInterface = {
  NotDefined: "NotDefined",
  Digital: "Digital",
  Analog: "Analog",
} as const;

export type SignalInterface = typeof SignalInterface[keyof typeof SignalInterface];

const VideoInterface = {
  Undefined: "undefined",
  DVI: "DVI",
  HDMIa: "HDMIa",
  HDMIb: "HDMIb",
  MDDI: "MDDI",
  DisplayPort: "DisplayPort",
} as const;

type VideoInterface = typeof VideoInterface[keyof typeof VideoInterface];

const BitDepth = {
  Undefined: "undefined",
  Six: "6",
  Eight: "8",
  Ten: "10",
  Twelve: "12",
  Sixteen: "16",
} as const;

type BitDepth = typeof BitDepth[keyof typeof BitDepth];

export class DigitalVideoInput implements VideoSignalInterface {
  SignalInterface: SignalInterface;

  BitDepth: BitDepth;
  Interface: VideoInterface;
  static decode(mbyte: number): DigitalVideoInput {
    return new DigitalVideoInput(mbyte);
  }
  constructor(mbyte: number) {
    this.SignalInterface = SignalInterface.Digital;
    switch ((mbyte & 0x70) >> 4) {
      case 0:
        this.BitDepth = BitDepth.Undefined;
        break;
      case 1:
        this.BitDepth = BitDepth.Six;
        break;
      case 2:
        this.BitDepth = BitDepth.Eight;
        break;
      case 3:
        this.BitDepth = BitDepth.Ten;
        break;
      case 4:
        this.BitDepth = BitDepth.Twelve;
        break;
      case 6:
        this.BitDepth = BitDepth.Sixteen;
        break;
      default:
        this.BitDepth = BitDepth.Undefined;
        break;
    }
    switch (mbyte & 0x7) {
      case 1:
        this.Interface = VideoInterface.DVI;
        break;
      case 2:
        this.Interface = VideoInterface.HDMIa;
        break;
      case 3:
        this.Interface = VideoInterface.HDMIb;
        break;
      case 4:
        this.Interface = VideoInterface.MDDI;
        break;
      case 5:
        this.Interface = VideoInterface.DisplayPort;
        break;
      default:
        this.Interface = VideoInterface.Undefined;
        break;
    }
  }
  Encode(): number {
    let mbyte = 0x80;
    switch (this.BitDepth) {
      case BitDepth.Six:
        mbyte |= 16;
        break;
      case BitDepth.Eight:
        mbyte |= 32;
        break;
      case BitDepth.Ten:
        mbyte |= 48;
        break;
      case BitDepth.Twelve:
        mbyte |= 64;
        break;
      case BitDepth.Sixteen:
        mbyte |= 96;
        break;
      default:
        break;
    }
    switch (this.Interface) {
      case VideoInterface.DVI:
        mbyte |= 1;
        break;
      case VideoInterface.HDMIa:
        mbyte |= 2;
        break;
      case VideoInterface.HDMIb:
        mbyte |= 3;
        break;
      case VideoInterface.MDDI:
        mbyte |= 4;
        break;
      case VideoInterface.DisplayPort:
        mbyte |= 5;
        break;
      default:
        break;
    }
    return mbyte;
  }
}

const SignalLevelStandard = {
  NotDefined: -1,
  V700_300_1000: 0,
  V714_286_1000: 0x20,
  V1000_400_1400: 0x40,
  V700_000_700: 0x60,
} as const;

type SignalLevelStandard = typeof SignalLevelStandard[keyof typeof SignalLevelStandard];

const VideoSetup = {
  BlankLevel: "Blank Level = Black Level",
  BlankToBlack: "Blank-to-Black setup or pedestal",
} as const;

type VideoSetup = typeof VideoSetup[keyof typeof VideoSetup];

export class AnalogVideoInput implements VideoSignalInterface {
  SignalInterface: SignalInterface;
  SignalLevelStandard: SignalLevelStandard;
  VideoSetup: VideoSetup;
  SeparateSyncHVSignals: boolean;
  CompositeSyncSignalonHorizontal: boolean;
  CompositeSyncSignalonGreenVideo: boolean;
  SerrationsOnVSync: boolean;

  static decode(mbyte: number): AnalogVideoInput {
    return new AnalogVideoInput(mbyte);
  }

  constructor(mbyte: number) {
    this.SignalInterface = SignalInterface.Analog;
    this.SignalLevelStandard = (mbyte & 0x60) as SignalLevelStandard;
    this.VideoSetup =
      mbyte & 0x10 ? VideoSetup.BlankToBlack : VideoSetup.BlankLevel;
    this.SeparateSyncHVSignals = mbyte & 0x8 ? false : true;
    this.CompositeSyncSignalonHorizontal = mbyte & 0x4 ? false : true;
    this.CompositeSyncSignalonGreenVideo = mbyte & 0x2 ? false : true;
    this.SerrationsOnVSync = mbyte & 0x1 ? true : false;
  }

  Encode(): number {
    let mbyte = 0;
    mbyte |= this.SignalLevelStandard;
    mbyte |= this.VideoSetup === VideoSetup.BlankToBlack ? 0x10 : 0;
    mbyte |= this.SeparateSyncHVSignals ? 0 : 0x8;
    mbyte |= this.CompositeSyncSignalonHorizontal ? 0 : 0x4;
    mbyte |= this.CompositeSyncSignalonGreenVideo ? 0 : 0x2;
    mbyte |= this.SerrationsOnVSync ? 0x1 : 0;
    return mbyte;
  }
}
