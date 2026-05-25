import pnpLookup from "../common/pnp.ts";

export class ManufacturerID {
  ID: string;

  constructor() {
    this.ID = "";
  }

  static decode(bytes: Uint8Array): ManufacturerID {
    return new ManufacturerID().Decode(bytes);
  }

  Decode(bytes: Uint8Array): ManufacturerID {
    this.ID = String.fromCharCode((((bytes[0] ?? 0) & 0x7c) >> 2) + 0x40);
    this.ID += String.fromCharCode(
      (((bytes[0] ?? 0) & 0x03) << 3) + (((bytes[1] ?? 0) & 0xe0) >> 5) + 0x40
    );
    this.ID += String.fromCharCode(((bytes[1] ?? 0) & 0x1f) + 0x40);
    return this;
  }

  Encode(): Uint8Array {
    // reset bytes
    let raw = new Uint8Array(2);
    // ASCII to bytes
    var bytes = [];
    bytes.push(this.ID.charCodeAt(0));
    bytes.push(this.ID.charCodeAt(1));
    bytes.push(this.ID.charCodeAt(2));
    // Compressed ascii = -0x40
    raw[0] = raw[0] || 0;
    raw[1] = raw[1] || 0;
    raw[0] |= ((bytes[0] ?? 0) - 0x40) << 2;
    raw[0] |= ((bytes[1] ?? 0) - 0x40) >> 3;
    raw[1] |= ((bytes[1] ?? 0) - 0x40) << 5;
    raw[1] |= (bytes[2] ?? 0) - 0x40;
    return raw;
  }

  GetPNPCompanyName(): string {
    let obj = pnpLookup.find((o) => o.ID === this.ID);
    if (obj) {
      return obj.Company;
    } else {
      return "Unknown";
    }
  }
}
