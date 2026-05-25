export function hexToUint8Array(hex: string): Uint8Array {
  const clean = hex.replaceAll(",", "").replaceAll(" ", "");
  return Uint8Array.from(
    (clean.match(/.{1,2}/g) ?? []).map((byte) => parseInt(byte, 16))
  );
}

export function formatByte(byte: number): string {
  const hex = (byte & 0xff).toString(16).toUpperCase();
  return hex.length === 1 ? "0" + hex : hex;
}

export function readUint16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

export function readUint16BE(data: Uint8Array, offset: number): number {
  return (data[offset] << 8) | data[offset + 1];
}

export function readUint32LE(data: Uint8Array, offset: number): number {
  return (
    data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24)
  );
}

export function calcEDIDChecksum(raw: Uint8Array, offset: number = 0): number {
  let checksum = 0;
  for (let i = 0; i < 127; i++) {
    checksum += raw[offset + i] ?? 0;
  }
  return (256 - (checksum % 256)) & 0xff;
}
