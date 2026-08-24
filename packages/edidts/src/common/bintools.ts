/**
 * Utility functions for reading and writing binary data at specific positions.
 */

/** Read a little-endian 16-bit unsigned integer starting at `offset`. */
export function readUint16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

/** Read a big-endian 16-bit unsigned integer starting at `offset`. */
export function readUint16BE(data: Uint8Array, offset: number): number {
  return (data[offset] << 8) | data[offset + 1];
}

/** Read a little-endian 32-bit unsigned integer starting at `offset`. */
export function readUint32LE(data: Uint8Array, offset: number): number {
  return (
    data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24)
  ) >>> 0;
}

/**
 * Read a 24-bit IEEE OUI in big-endian order starting at `offset`.
 *
 * Returns the OUI as a 24-bit unsigned integer — e.g. bytes `[0x00, 0x0C, 0x03]`
 * yield `0x000C03` (HDMI 1.4b). DisplayID §4.9 stores OUIs big-endian.
 */
export function readIeeeOui(data: Uint8Array, offset = 0): number {
  return (
    (data[offset] << 16) |
    (data[offset + 1] << 8) |
    data[offset + 2]
  ) >>> 0;
}

/**
 * Write a 24-bit IEEE OUI in big-endian order starting at `offset`.
 * The value is masked to 24 bits.
 */
export function writeIeeeOui(target: Uint8Array, offset: number, oui: number): void {
  target[offset] = (oui >>> 16) & 0xff;
  target[offset + 1] = (oui >>> 8) & 0xff;
  target[offset + 2] = oui & 0xff;
}

/**
 * Read a 24-bit IEEE OUI in little-endian order starting at `offset`.
 *
 * CTA-861 stores OUIs little-endian on the wire — e.g. bytes `[0x03, 0x0C, 0x00]`
 * yield `0x000C03`.
 */
export function readIeeeOuiLE(data: Uint8Array, offset = 0): number {
  return (
    data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16)
  ) >>> 0;
}

/**
 * Write a 24-bit IEEE OUI in little-endian order starting at `offset` (CTA-861
 * wire order). The value is masked to 24 bits.
 */
export function writeIeeeOuiLE(target: Uint8Array, offset: number, oui: number): void {
  target[offset] = oui & 0xff;
  target[offset + 1] = (oui >>> 8) & 0xff;
  target[offset + 2] = (oui >>> 16) & 0xff;
}
