import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdTiledDisplayTopologyBlock,
} from './types';

const MIN_TILED_TOPOLOGY_PAYLOAD_LENGTH = 9;

export function isTiledDisplayTopologyPayloadLengthValid(length: number): boolean {
  return length >= MIN_TILED_TOPOLOGY_PAYLOAD_LENGTH;
}

export function decodeTiledDisplayTopologyBlock(block: DisplayIdDataBlock): DisplayIdTiledDisplayTopologyBlock {
  const payload = block.payload;

  return {
    ...block,
    tag: DisplayIdDataBlockTag.TiledDisplayTopology,
    tileCountHorizontal: payload[0] ?? 0,
    tileCountVertical: payload[1] ?? 0,
    tileLocationHorizontal: payload[2] ?? 0,
    tileLocationVertical: payload[3] ?? 0,
    tileWidthPixels: readUint16LE(payload, 4),
    tileHeightPixels: readUint16LE(payload, 6),
  };
}

export function encodeTiledDisplayTopologyBlock(block: DisplayIdTiledDisplayTopologyBlock): Uint8Array {
  const payload = block.payload.length >= MIN_TILED_TOPOLOGY_PAYLOAD_LENGTH
    ? block.payload.slice()
    : new Uint8Array(MIN_TILED_TOPOLOGY_PAYLOAD_LENGTH);

  payload[0] = block.tileCountHorizontal & 0xff;
  payload[1] = block.tileCountVertical & 0xff;
  payload[2] = block.tileLocationHorizontal & 0xff;
  payload[3] = block.tileLocationVertical & 0xff;
  writeUint16LE(payload, 4, block.tileWidthPixels);
  writeUint16LE(payload, 6, block.tileHeightPixels);

  return payload;
}

function readUint16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

function writeUint16LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
}
