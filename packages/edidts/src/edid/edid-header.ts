import { readUint16BE, readUint16LE, readUint32LE } from "../common/bintools";
import { getManufacturerName } from "../common/pnp-registry";

/** Supported EDID versions */
export const EDID_VERSIONS = [1, 2] as const;
export type EDIDVersion = typeof EDID_VERSIONS[number];

/** Supported EDID revisions by version */
export const EDID_REVISIONS: Record<EDIDVersion, readonly number[]> = {
  1: [0, 1, 2, 3, 4] as const,
  2: [0] as const,
};

/**
 * EDID Header class for handling EDID header information
 * Handles signature, manufacturer ID, product code, serial number, and version info
 */
export class EDIDHeader {
  public signature: Uint8Array;
  public manufacturerId: string;
  public productCode: number;
  public serialNumber: number;
  public weekOfManufacture: number;
  public yearOfManufacture: number;
  public edidVersion: number;
  public edidRevision: number;

  constructor(data?: {
    signature?: Uint8Array;
    manufacturerId?: string;
    productCode?: number;
    serialNumber?: number;
    weekOfManufacture?: number;
    yearOfManufacture?: number;
    edidVersion?: number;
    edidRevision?: number;
  }) {
    this.signature = data?.signature ?? new Uint8Array([
      0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00,
    ]);
    this.manufacturerId = data?.manufacturerId ?? "UNK";
    this.productCode = data?.productCode ?? 0x0000;
    this.serialNumber = data?.serialNumber ?? 0x00000000;
    this.weekOfManufacture = data?.weekOfManufacture ?? 1;
    this.yearOfManufacture = data?.yearOfManufacture ?? 2024;
    this.edidVersion = data?.edidVersion ?? 1;
    this.edidRevision = data?.edidRevision ?? 4;
  }

  /**
   * Decode EDID header from binary data
   * @param data - EDID binary data (full 128 bytes)
   * @returns New EDIDHeader instance
   */
  static decode(data: Uint8Array): EDIDHeader {
    // EDID signature at offset 0-7: 00 FF FF FF FF FF FF 00
    const signature = data.slice(0, 8);
    const expectedSignature = new Uint8Array([
      0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00,
    ]);

    // Verify signature
    if (
      !signature.every(
        (byte: number, index: number) => byte === expectedSignature[index]
      )
    ) {
      throw new Error("Invalid EDID signature");
    }

    // Manufacturer ID at offset 8-9 (2 bytes, big endian)
    const manufacturerBytes = readUint16BE(data, 8);
    const manufacturerId = EDIDHeader.decodeManufacturerId(manufacturerBytes);

    // Product code at offset 10-11 (2 bytes, little endian)
    const productCode = readUint16LE(data, 10);

    // Serial number at offset 12-15 (4 bytes, little endian)
    const serialNumber = readUint32LE(data, 12);

    // Week of manufacture at offset 16 (1 byte)
    const weekOfManufacture = data[16];

    // Year of manufacture at offset 17 (1 byte, offset from 1990)
    const yearOfManufacture = 1990 + data[17];

    // EDID version at offset 18 (1 byte)
    const edidVersion = data[18];

    // EDID revision at offset 19 (1 byte)
    const edidRevision = data[19];

    return new EDIDHeader({
      signature,
      manufacturerId,
      productCode,
      serialNumber,
      weekOfManufacture,
      yearOfManufacture,
      edidVersion,
      edidRevision,
    });
  }

  /**
   * Encode header to binary format
   * @returns 20-byte array containing the encoded header
   */
  encode(): Uint8Array {
    const result = new Uint8Array(20);

    // EDID signature at offset 0-7
    result.set(this.signature, 0);

    // Manufacturer ID at offset 8-9 (big endian: high byte first, low byte second)
    const manufacturerValue = EDIDHeader.encodeManufacturerId(this.manufacturerId);
    result[8] = (manufacturerValue >> 8) & 0xff;
    result[9] = manufacturerValue & 0xff;

    // Product code at offset 10-11 (little endian)
    result[10] = this.productCode & 0xff;
    result[11] = (this.productCode >> 8) & 0xff;

    // Serial number at offset 12-15 (little endian)
    result[12] = this.serialNumber & 0xff;
    result[13] = (this.serialNumber >> 8) & 0xff;
    result[14] = (this.serialNumber >> 16) & 0xff;
    result[15] = (this.serialNumber >> 24) & 0xff;

    // Week and year at offset 16-17
    result[16] = this.weekOfManufacture;
    result[17] = Math.max(0, this.yearOfManufacture - 1990);

    // EDID version/revision at offset 18-19
    result[18] = this.edidVersion;
    result[19] = this.edidRevision;

    return result;
  }

  /**
   * Get full version string (e.g., "1.4")
   */
  get versionString(): string {
    return `${this.edidVersion}.${this.edidRevision}`;
  }

  /**
   * Check if signature is valid
   */
  get isValidSignature(): boolean {
    const expectedSignature = new Uint8Array([
      0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00,
    ]);
    return this.signature.every(
      (byte: number, index: number) => byte === expectedSignature[index]
    );
  }

  /** Human-friendly company name derived from the PNP registry when available */
  get manufacturerName(): string | null {
    return getManufacturerName(this.manufacturerId);
  }

  // Manufacturer ID encode/decode helpers
  private static decodeManufacturerId(value: number): string {
    // Manufacturer ID is encoded as 3 × 5-bit characters, big endian
    const char1 = String.fromCharCode(((value >> 10) & 0x1f) + 64);
    const char2 = String.fromCharCode(((value >> 5) & 0x1f) + 64);
    const char3 = String.fromCharCode((value & 0x1f) + 64);
    return char1 + char2 + char3;
  }

  private static encodeManufacturerId(manufacturerId: string): number {
    // Encode 3 characters as 5-bit values, big endian
    const char1 = ((manufacturerId.charCodeAt(0) - 64) & 0x1f) << 10;
    const char2 = ((manufacturerId.charCodeAt(1) - 64) & 0x1f) << 5;
    const char3 = (manufacturerId.charCodeAt(2) - 64) & 0x1f;
    return char1 | char2 | char3;
  }
}