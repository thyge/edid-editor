import { DisplayIdDataBlockTag, type DisplayIdDataBlock, type DisplayIdProductIdentificationBlock } from './types';

const MIN_PRODUCT_IDENTIFICATION_PAYLOAD_LENGTH = 12;

export function decodeProductIdentificationBlock(block: DisplayIdDataBlock): DisplayIdProductIdentificationBlock {
  const payload = block.payload;
  const productNameLength = payload[11] ?? 0;
  const productNameBytes = payload.slice(12, 12 + productNameLength);
  const serialNumber = readUint32LE(payload, 5);
  const weekByte = payload[9] ?? 0;
  const yearByte = payload[10] ?? 0;

  return {
    ...block,
    tag: DisplayIdDataBlockTag.ProductIdentification,
    ieeeOui: payload[0] | (payload[1] << 8) | (payload[2] << 16),
    productId: readUint16LE(payload, 3),
    serialNumber: serialNumber === 0 ? undefined : serialNumber,
    manufactureWeek: weekByte === 0 || weekByte === 0xff ? undefined : weekByte,
    year: yearByte === 0 ? undefined : 2000 + yearByte,
    isModelYear: weekByte === 0xff,
    productNameLength,
    productNameBytes,
    productName: decodeAscii(productNameBytes),
  };
}

export function encodeProductIdentificationBlock(block: DisplayIdProductIdentificationBlock): Uint8Array {
  const productNameBytes = block.productNameBytes.length > 0
    ? block.productNameBytes
    : encodeAscii(block.productName);
  const payload = new Uint8Array(MIN_PRODUCT_IDENTIFICATION_PAYLOAD_LENGTH + productNameBytes.length);

  payload[0] = block.ieeeOui & 0xff;
  payload[1] = (block.ieeeOui >> 8) & 0xff;
  payload[2] = (block.ieeeOui >> 16) & 0xff;
  payload[3] = block.productId & 0xff;
  payload[4] = (block.productId >> 8) & 0xff;
  writeUint32LE(payload, 5, block.serialNumber ?? 0);
  payload[9] = block.isModelYear ? 0xff : block.manufactureWeek ?? 0;
  payload[10] = block.year === undefined ? 0 : Math.max(0, block.year - 2000) & 0xff;
  payload[11] = productNameBytes.length & 0xff;
  payload.set(productNameBytes, 12);

  return payload;
}

export function isProductIdentificationPayloadLengthValid(payloadLength: number): boolean {
  return payloadLength >= MIN_PRODUCT_IDENTIFICATION_PAYLOAD_LENGTH;
}

function readUint16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

function readUint32LE(data: Uint8Array, offset: number): number {
  return (
    data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24)
  ) >>> 0;
}

function writeUint32LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
  data[offset + 2] = (value >> 16) & 0xff;
  data[offset + 3] = (value >> 24) & 0xff;
}

function decodeAscii(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
}

function encodeAscii(value: string): Uint8Array {
  return new Uint8Array(Array.from(value, (character) => character.charCodeAt(0) & 0xff));
}
