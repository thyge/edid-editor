export class Chromaticity {
  raw: Uint8Array;
  RedX: number;
  RedY: number;
  GreenX: number;
  GreenY: number;
  BlueX: number;
  BlueY: number;
  WhiteX: number;
  WhiteY: number;
  static decode(bytes: Uint8Array): Chromaticity {
    return new Chromaticity(bytes);
  }
  constructor(bytes: Uint8Array) {
    this.raw = bytes;
    this.RedX = (((bytes[2] ?? 0) << 2) | (((bytes[0] ?? 0) >> 6) & 0x3)) / 1024;
    this.RedY = (((bytes[3] ?? 0) << 2) | (((bytes[0] ?? 0) >> 4) & 0x3)) / 1024;
    this.GreenX = (((bytes[4] ?? 0) << 2) | (((bytes[0] ?? 0) >> 2) & 0x3)) / 1024;
    this.GreenY = (((bytes[5] ?? 0) << 2) | ((bytes[0] ?? 0) & 0x3)) / 1024;
    this.BlueX = (((bytes[6] ?? 0) << 2) | (((bytes[1] ?? 0) >> 6) & 0x3)) / 1024;
    this.BlueY = (((bytes[7] ?? 0) << 2) | (((bytes[1] ?? 0) >> 4) & 0x3)) / 1024;
    this.WhiteX = (((bytes[8] ?? 0) << 2) | (((bytes[1] ?? 0) >> 2) & 0x3)) / 1024;
    this.WhiteY = (((bytes[9] ?? 0) << 2) | ((bytes[1] ?? 0) & 0x3)) / 1024;
  }
  Encode(): Uint8Array {
    const bytes = new Uint8Array(10);
    bytes[0] =
      (((this.RedX * 1024) & 0x3) << 6) |
      (((this.RedY * 1024) & 0x3) << 4) |
      (((this.GreenX * 1024) & 0x3) << 2) |
      ((this.GreenY * 1024) & 0x3);
    bytes[1] =
      (((this.BlueX * 1024) & 0x3) << 6) |
      (((this.BlueY * 1024) & 0x3) << 4) |
      (((this.WhiteX * 1024) & 0x3) << 2) |
      ((this.WhiteY * 1024) & 0x3);
    bytes[2] = (this.RedX * 1024) >> 2;
    bytes[3] = (this.RedY * 1024) >> 2;
    bytes[4] = (this.GreenX * 1024) >> 2;
    bytes[5] = (this.GreenY * 1024) >> 2;
    bytes[6] = (this.BlueX * 1024) >> 2;
    bytes[7] = (this.BlueY * 1024) >> 2;
    bytes[8] = (this.WhiteX * 1024) >> 2;
    bytes[9] = (this.WhiteY * 1024) >> 2;
    return bytes;
  }
}
