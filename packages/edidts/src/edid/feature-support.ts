import { SignalInterface, type VideoSignalInterface } from "./video-input.ts";

export const EdidVersion = {
  Pre13: "Pre13",
  V13: "1.3",
  V14: "1.4",
  Other: "Other",
} as const;

export type EdidVersion = typeof EdidVersion[keyof typeof EdidVersion];

export class DigitalColourEncoding implements VideoSignalInterface {
  SignalInterface: SignalInterface;
  RGB444: boolean;
  YUV444: boolean;
  YUV422: boolean;
  static decode(mbyte: number): DigitalColourEncoding {
    return new DigitalColourEncoding(mbyte);
  }
  constructor(mbyte: number) {
    this.SignalInterface = SignalInterface.Digital;
    this.RGB444 = mbyte & 0x8 ? true : false;
    this.YUV444 = mbyte & 0x10 ? true : false;
    this.YUV422 = mbyte & 0x20 ? true : false;
  }
  Encode(): number {
    let mbyte = 0;
    mbyte |= this.RGB444 ? 0x8 : 0;
    mbyte |= this.YUV444 ? 0x10 : 0;
    mbyte |= this.YUV422 ? 0x20 : 0;
    return mbyte;
  }
}

const AnalogDisplayColorType = {
  Monochrome: 0,
  RGB: 1,
  NonRGB: 2,
  Undefined: 3,
} as const;

type AnalogDisplayColorType = typeof AnalogDisplayColorType[keyof typeof AnalogDisplayColorType];

export class AnalogueColourEncoding implements VideoSignalInterface {
  SignalInterface: SignalInterface;
  AnalogColour: AnalogDisplayColorType;
  static decode(mbyte: number): AnalogueColourEncoding {
    return new AnalogueColourEncoding(mbyte);
  }
  constructor(mbyte: number) {
    this.SignalInterface = SignalInterface.Analog;
    this.AnalogColour = (mbyte & 0x3) as AnalogDisplayColorType;
  }

  Encode(): number {
    return this.AnalogColour;
  }
}

export class FeatureSupport {
  DPMSstandby: boolean = false;
  DPMSsuspend: boolean = false;
  DPMSactiveOff: boolean = false;
  ColourEncoding: VideoSignalInterface = {
    SignalInterface: SignalInterface.NotDefined,
    Encode: () => 0,
  };
  sRGB: boolean = false;
  PreferredTiming: boolean = false;
  GTFSupport: boolean = false; // 1.3
  ContiniousFrequency: boolean = false; // 1.4
  Version: EdidVersion = EdidVersion.V14;

  static decode(mbyte: number, digital_analog: SignalInterface, version?: EdidVersion): FeatureSupport {
    return new FeatureSupport(mbyte, digital_analog, version);
  }

  constructor(mbyte: number, digital_analog: SignalInterface, version?: EdidVersion) {
    this.Version = version ?? EdidVersion.V14;
    this.DPMSstandby = mbyte & 0x80 ? true : false;
    this.DPMSsuspend = mbyte & 0x40 ? true : false;
    this.DPMSactiveOff = mbyte & 0x20 ? true : false;
    switch (digital_analog) {
      case SignalInterface.Digital:
        this.ColourEncoding = new DigitalColourEncoding(mbyte);
        break;
      case SignalInterface.Analog:
        this.ColourEncoding = new AnalogueColourEncoding(mbyte);
        break;
    }
    this.sRGB = mbyte & 0x4 ? true : false;
    this.PreferredTiming = mbyte & 0x2 ? true : false;
    if (this.Version === EdidVersion.V13) {
      this.GTFSupport = mbyte & 0x1 ? true : false;
    } else {
      this.ContiniousFrequency = mbyte & 0x1 ? true : false;
    }
  }
  Encode(): number {
    let mbyte = 0;
    mbyte |= this.DPMSstandby ? 0x80 : 0;
    mbyte |= this.DPMSsuspend ? 0x40 : 0;
    mbyte |= this.DPMSactiveOff ? 0x20 : 0;
    mbyte |= this.ColourEncoding.Encode();
    mbyte |= this.sRGB ? 0x4 : 0;
    mbyte |= this.PreferredTiming ? 0x2 : 0;
    if (this.Version === EdidVersion.V13) {
      mbyte |= this.GTFSupport ? 0x1 : 0;
    } else {
      mbyte |= this.ContiniousFrequency ? 0x1 : 0;
    }
    return mbyte;
  }
}
