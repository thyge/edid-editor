export class EstablishedTimings {
  ET720_400_70: boolean;
  ET720_400_88: boolean;
  ET640_480_60: boolean;
  ET640_480_67: boolean;
  ET640_480_72: boolean;
  ET640_480_75: boolean;
  ET800_600_56: boolean;
  ET800_600_60: boolean;
  ET800_600_72: boolean;
  ET800_600_75: boolean;
  ET832_624_75: boolean;
  ET1024_768_87: boolean;
  ET1024_768_60: boolean;
  ET1024_768_70: boolean;
  ET1024_768_75: boolean;
  ET1280_1024_75: boolean;
  ET1152_870_75: boolean;

  static decode(etBytes: Uint8Array): EstablishedTimings {
    return new EstablishedTimings(etBytes);
  }

  constructor(etBytes: Uint8Array) {
    this.ET720_400_70 = (etBytes[0] ?? 0) & 0x80 ? true : false;
    this.ET720_400_88 = (etBytes[0] ?? 0) & 0x40 ? true : false;
    this.ET640_480_60 = (etBytes[0] ?? 0) & 0x20 ? true : false;
    this.ET640_480_67 = (etBytes[0] ?? 0) & 0x10 ? true : false;
    this.ET640_480_72 = (etBytes[0] ?? 0) & 0x08 ? true : false;
    this.ET640_480_75 = (etBytes[0] ?? 0) & 0x04 ? true : false;
    this.ET800_600_56 = (etBytes[0] ?? 0) & 0x02 ? true : false;
    this.ET800_600_60 = (etBytes[0] ?? 0) & 0x01 ? true : false;

    this.ET800_600_72 = (etBytes[1] ?? 0) & 0x80 ? true : false;
    this.ET800_600_75 = (etBytes[1] ?? 0) & 0x40 ? true : false;
    this.ET832_624_75 = (etBytes[1] ?? 0) & 0x20 ? true : false;
    this.ET1024_768_87 = (etBytes[1] ?? 0) & 0x10 ? true : false;
    this.ET1024_768_60 = (etBytes[1] ?? 0) & 0x08 ? true : false;
    this.ET1024_768_70 = (etBytes[1] ?? 0) & 0x04 ? true : false;
    this.ET1024_768_75 = (etBytes[1] ?? 0) & 0x02 ? true : false;
    this.ET1280_1024_75 = (etBytes[1] ?? 0) & 0x01 ? true : false;

    this.ET1152_870_75 = (etBytes[2] ?? 0) & 0x80 ? true : false;
  }
  Encode(): Uint8Array {
    let etBytes = new Uint8Array(3);
    etBytes[0] = 0;
    etBytes[0] |= this.ET720_400_70 ? 0x80 : 0;
    etBytes[0] |= this.ET720_400_88 ? 0x40 : 0;
    etBytes[0] |= this.ET640_480_60 ? 0x20 : 0;
    etBytes[0] |= this.ET640_480_67 ? 0x10 : 0;
    etBytes[0] |= this.ET640_480_72 ? 0x08 : 0;
    etBytes[0] |= this.ET640_480_75 ? 0x04 : 0;
    etBytes[0] |= this.ET800_600_56 ? 0x02 : 0;
    etBytes[0] |= this.ET800_600_60 ? 0x01 : 0;

    etBytes[1] = 0;
    etBytes[1] |= this.ET800_600_72 ? 0x80 : 0;
    etBytes[1] |= this.ET800_600_75 ? 0x40 : 0;
    etBytes[1] |= this.ET832_624_75 ? 0x20 : 0;
    etBytes[1] |= this.ET1024_768_87 ? 0x10 : 0;
    etBytes[1] |= this.ET1024_768_60 ? 0x08 : 0;
    etBytes[1] |= this.ET1024_768_70 ? 0x04 : 0;
    etBytes[1] |= this.ET1024_768_75 ? 0x02 : 0;
    etBytes[1] |= this.ET1280_1024_75 ? 0x01 : 0;

    etBytes[2] = 0;
    etBytes[2] |= this.ET1152_870_75 ? 0x80 : 0;
    return etBytes;
  }
}
