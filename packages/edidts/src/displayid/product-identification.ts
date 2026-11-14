import { DisplayIdDataBlockTag, type DisplayIdDataBlock, type DisplayIdProductIdentificationBlock } from './types';
import { readIeeeOui, writeIeeeOui } from '../common/bintools';
import { clampBits, clampInt } from './clamp';

const MIN_PRODUCT_IDENTIFICATION_PAYLOAD_LENGTH = 12;
const PRODUCT_NAME_LENGTH_OFFSET = 11;

/**
 * DisplayID 2.0 §4.1 Product Identification Data Block (tag 0x20).
 *
 * Payload layout (edid-decode parse_displayid_product_id, x = block start):
 *   payload[0..2]   IEEE OUI, big-endian (data_block_oui(..., big_endian=true))
 *   payload[3..4]   product code (LE)
 *   payload[5..8]   serial number (LE, 0 = not given)
 *   payload[9]      week (0xff = model year)
 *   payload[10]     year - 2000
 *   payload[11]     product name length N
 *   payload[12..]   product name (N ASCII bytes)
 * Bytes after the name are not part of the layout; they are kept verbatim.
 */
export function decodeProductIdentificationBlock(block: DisplayIdDataBlock): DisplayIdProductIdentificationBlock {
  const payload = block.payload;
  const productNameLength = payload[PRODUCT_NAME_LENGTH_OFFSET] ?? 0;
  const productNameBytes = payload.slice(12, 12 + productNameLength);
  const serialNumber = readUint32LE(payload, 5);
  const weekByte = payload[9] ?? 0;
  const yearByte = payload[10] ?? 0;

  return {
    ...block,
    tag: DisplayIdDataBlockTag.ProductIdentification,
    ieeeOui: readIeeeOui(payload, 0),
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
  const productNameBytes = productNameBytesOf(block);
  const trailing = bytesAfterProductName(block.payload);
  const payload = new Uint8Array(MIN_PRODUCT_IDENTIFICATION_PAYLOAD_LENGTH + productNameBytes.length + trailing.length);

  writeIeeeOui(payload, 0, clampBits(block.ieeeOui, 24));
  const productId = clampBits(block.productId, 16);
  payload[3] = productId & 0xff;
  payload[4] = (productId >> 8) & 0xff;
  writeUint32LE(payload, 5, clampBits(block.serialNumber ?? 0, 32));
  payload[9] = block.isModelYear ? 0xff : clampInt(block.manufactureWeek ?? 0, 0, 0xfe);
  payload[10] = block.year === undefined ? 0 : clampInt(block.year - 2000, 0, 0xff);
  payload[PRODUCT_NAME_LENGTH_OFFSET] = productNameBytes.length;
  payload.set(productNameBytes, 12);
  payload.set(trailing, 12 + productNameBytes.length);

  return payload;
}

export function isProductIdentificationPayloadLengthValid(payloadLength: number): boolean {
  return payloadLength >= MIN_PRODUCT_IDENTIFICATION_PAYLOAD_LENGTH;
}

/**
 * Structured decode gate: the fixed 12 bytes must be present and the declared
 * name must fit the payload. edid-decode rejects a longer name ("Product name
 * length exceeds the available payload"), and the name length could not be
 * re-encoded faithfully, so such a block stays raw.
 */
export function isProductIdentificationPayloadValid(payload: Uint8Array): boolean {
  return (
    isProductIdentificationPayloadLengthValid(payload.length) &&
    payload[PRODUCT_NAME_LENGTH_OFFSET] <= payload.length - MIN_PRODUCT_IDENTIFICATION_PAYLOAD_LENGTH
  );
}

/**
 * The name bytes to write. `productName` (what the editor shows) wins when it
 * no longer matches `productNameBytes`, so setting either field works; the
 * name byte length is capped so the block payload stays within 255 bytes.
 */
function productNameBytesOf(block: DisplayIdProductIdentificationBlock): Uint8Array {
  const bytes = decodeAscii(block.productNameBytes) === block.productName
    ? block.productNameBytes
    : encodeAscii(block.productName);
  return bytes.length > 0xff - MIN_PRODUCT_IDENTIFICATION_PAYLOAD_LENGTH
    ? bytes.slice(0, 0xff - MIN_PRODUCT_IDENTIFICATION_PAYLOAD_LENGTH)
    : bytes;
}

/**
 * Bytes the original payload carried after its product name (outside the
 * layout, kept verbatim). Located through the payload's own name-length
 * byte, so renaming the product moves them instead of leaving stale name
 * letters behind.
 */
function bytesAfterProductName(payload: Uint8Array): Uint8Array {
  if (payload.length < MIN_PRODUCT_IDENTIFICATION_PAYLOAD_LENGTH) return new Uint8Array(0);
  const nameEnd = MIN_PRODUCT_IDENTIFICATION_PAYLOAD_LENGTH + payload[PRODUCT_NAME_LENGTH_OFFSET];
  return nameEnd < payload.length ? payload.slice(nameEnd) : new Uint8Array(0);
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
  data[offset + 1] = (value >>> 8) & 0xff;
  data[offset + 2] = (value >>> 16) & 0xff;
  data[offset + 3] = (value >>> 24) & 0xff;
}

function decodeAscii(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
}

function encodeAscii(value: string): Uint8Array {
  return new Uint8Array(Array.from(value, (character) => clampBits(character.charCodeAt(0), 8)));
}
