import { EdidVersion } from "./feature-support.ts";

export const AspectRatio = {
  OneOne: "1:1",
  FourThree: "4:3",
  FiveFour: "5:4",
  FifteenNine: "15:9", // CVT Support Definition
  SixteenNine: "16:9",
  SixteenTen: "16:10",
} as const;

export type AspectRatio = typeof AspectRatio[keyof typeof AspectRatio];

export class StandardTiming {
  id: number = 0;
  Enabled: boolean = false;
  HorizontalActive: number = 0;
  AspectRatio: AspectRatio = AspectRatio.FourThree;
  RefreshRate: number = 60;

  static decode(bytes: Uint8Array, version?: EdidVersion): StandardTiming {
    return new StandardTiming().Decode(bytes, version);
  }

  Decode(bytes: Uint8Array, version?: EdidVersion): StandardTiming {
    this.Enabled = false;
    if (bytes[0] === 0x1 && bytes[1] === 0x1) {
      this.Enabled = false;
    } else {
      this.Enabled = true;
    }
    switch ((bytes[1] ?? 0) >> 6) {
      case 0:
        this.AspectRatio =
          version === EdidVersion.Pre13
            ? AspectRatio.OneOne
            : AspectRatio.SixteenTen;
        break;
      case 1:
        this.AspectRatio = AspectRatio.FourThree;
        break;
      case 2:
        this.AspectRatio = AspectRatio.FiveFour;
        break;
      case 3:
        this.AspectRatio = AspectRatio.SixteenNine;
        break;
      default:
        break;
    }
    this.HorizontalActive = ((bytes[0] ?? 0) + 31) * 8;
    this.RefreshRate = ((bytes[1] ?? 0) & 0x3f) + 60;
    return this;
  }
  Encode(): Uint8Array {
    let bytes = new Uint8Array(2);
    if (this.Enabled) {
      bytes[0] = this.HorizontalActive / 8 - 31;
      bytes[1] = (this.RefreshRate - 60) & 0x3f;
      switch (this.AspectRatio) {
        case AspectRatio.SixteenTen:
        case AspectRatio.OneOne:
          bytes[1] |= 0 << 6;
          break;
        case AspectRatio.FourThree:
          bytes[1] |= 1 << 6;
          break;
        case AspectRatio.FiveFour:
          bytes[1] |= 2 << 6;
          break;
        case AspectRatio.SixteenNine:
          bytes[1] |= 3 << 6;
          break;
        default:
          break;
      }
    } else {
      bytes[0] = 1;
      bytes[1] = 1;
    }
    return bytes;
  }
}
