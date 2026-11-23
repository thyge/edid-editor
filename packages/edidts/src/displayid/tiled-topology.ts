// packages/edidts/src/displayid/tiled-topology.ts

import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdTiledDisplayTopologyBlock,
} from './types';
import { readIeeeOui, writeIeeeOui } from '../common/bintools';
import { clampBits } from './clamp';

/**
 * DisplayID 2.0 §4.7 Tiled Display Topology Data Block (tag 0x28).
 *
 * Fixed 22-byte payload (Table 4-37). Field bit layouts per Tables 4-38
 * (capabilities), 4-39 (topology & location, 6-bit packed across payload[1..3]),
 * 4-40 (tile size), 4-41 (pixel multiplier & bezel), and 4-42 (topology ID).
 *
 * The four topology/location fields are 6-bit values (0-63). Tile counts are
 * exposed as human 1-based values (1-64, stored value-1); tile locations are
 * 0-based indices (0-63, stored as-is). Tile sizes are 16-bit values exposed as
 * human pixel counts (1-65536), storing value-1. This matches edid-decode,
 * which prints counts/sizes as stored+1 but the tile location as stored.
 *
 * Cross-checked against edid-decode parse_displayid_tiled_display_topology
 * (parse-displayid-block.cpp:961), including its 6-bit unpacking:
 *   num_v_tile  = (x[4] & 0xf) | (x[6] & 0x30)
 *   num_h_tile  = (x[4] >> 4) | ((x[6] & 0xc0) >> 2)
 *   tile_v_loc  = (x[5] & 0xf) | ((x[6] & 0x03) << 4)
 *   tile_h_loc  = (x[5] >> 4) | ((x[6] & 0x0c) << 2)
 * (x[4..6] = payload[1..3]).
 */

const TILED_TOPOLOGY_PAYLOAD_LENGTH = 22;

/**
 * DisplayID 2.0 §4.7 Table 4-38 single-tile behavior (capabilities byte
 * bits 2:0). Index = on-the-wire code.
 */
export const SINGLE_TILE_BEHAVIOR_LABELS: readonly string[] = [
  'Behavior cannot be described',
  'Image displayed at Tile Location',
  'Image scaled to fit entire tiled display',
  'Image cloned to all other tiles',
];

/**
 * DisplayID 2.0 §4.7 Table 4-38 subset-tile behavior (capabilities byte
 * bits 4:3). Index = on-the-wire code.
 */
export const SUBSET_TILE_BEHAVIOR_LABELS: readonly string[] = [
  'Behavior cannot be described',
  'Image displayed at Tile Location',
];

export function isTiledDisplayTopologyPayloadLengthValid(length: number): boolean {
  return length === TILED_TOPOLOGY_PAYLOAD_LENGTH;
}

function clamp6(value: number): number {
  return Math.max(0, Math.min(0x3f, value | 0));
}

function clamp16(value: number): number {
  return Math.max(0, Math.min(0xffff, value | 0));
}

function readUint16LE(data: Uint8Array, offset: number): number {
  return (data[offset] | (data[offset + 1] << 8)) >>> 0;
}

function writeUint16LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
}

export function decodeTiledDisplayTopologyBlock(
  block: DisplayIdDataBlock,
): DisplayIdTiledDisplayTopologyBlock {
  const p = block.payload;
  const caps = p[0] ?? 0;
  const b1 = p[1] ?? 0;
  const b2 = p[2] ?? 0;
  const b3 = p[3] ?? 0;

  // 6-bit packed topology & location (payload[1..3]). Counts: human = stored
  // + 1. Locations: 0-based, as stored (edid-decode prints them unchanged).
  const tileCountVertical = ((b1 & 0x0f) | (b3 & 0x30)) + 1;
  const tileCountHorizontal = ((b1 >> 4) | ((b3 & 0xc0) >> 2)) + 1;
  const tileLocationVertical = (b2 & 0x0f) | ((b3 & 0x03) << 4);
  const tileLocationHorizontal = (b2 >> 4) | ((b3 & 0x0c) << 2);

  return {
    ...block,
    tag: DisplayIdDataBlockTag.TiledDisplayTopology,
    // Capabilities (Table 4-38). Bit 5 reserved.
    singleTileBehavior: caps & 0x07,
    subsetTileBehavior: (caps >> 3) & 0x03,
    bezelInfoPresent: (caps & 0x40) !== 0,
    singleEnclosure: (caps & 0x80) !== 0,
    // Topology & location (Table 4-39): counts 1-64, locations 0-63.
    tileCountHorizontal,
    tileCountVertical,
    tileLocationHorizontal,
    tileLocationVertical,
    // Tile size (Table 4-40), human 1-65536.
    tileWidthPixels: readUint16LE(p, 4) + 1,
    tileHeightPixels: readUint16LE(p, 6) + 1,
    // Pixel multiplier & bezel (Table 4-41).
    pixelMultiplier: p[8] ?? 0,
    topBezelSize: p[9] ?? 0,
    bottomBezelSize: p[10] ?? 0,
    rightBezelSize: p[11] ?? 0,
    leftBezelSize: p[12] ?? 0,
    // Topology ID (Table 4-42).
    // Topology ID is an optional trailing group; read the OUI only when all
    // three bytes are present, else 0 (matches the prior per-byte ?? 0 fallback).
    vendorOui: p.length >= 16 ? readIeeeOui(p, 13) : 0,
    productId: readUint16LE(p, 16),
    serialNumber: ((p[18] ?? 0) | ((p[19] ?? 0) << 8) | ((p[20] ?? 0) << 16) | ((p[21] ?? 0) << 24)) >>> 0,
  };
}

export function encodeTiledDisplayTopologyBlock(
  block: DisplayIdTiledDisplayTopologyBlock,
): Uint8Array {
  const payload = new Uint8Array(TILED_TOPOLOGY_PAYLOAD_LENGTH);
  // Preserve reserved bit 5 of the capabilities byte from the incoming payload.
  const reservedBit5 = (block.payload[0] ?? 0) & 0x20;

  payload[0] =
    reservedBit5 |
    clampBits(block.singleTileBehavior, 3) |
    (clampBits(block.subsetTileBehavior, 2) << 3) |
    (block.bezelInfoPresent ? 0x40 : 0) |
    (block.singleEnclosure ? 0x80 : 0);

  // Pack 6-bit topology & location (counts stored as human - 1, locations as-is).
  const vCount = clamp6(block.tileCountVertical - 1);
  const hCount = clamp6(block.tileCountHorizontal - 1);
  const vLoc = clamp6(block.tileLocationVertical);
  const hLoc = clamp6(block.tileLocationHorizontal);
  payload[1] = ((hCount & 0x0f) << 4) | (vCount & 0x0f);
  payload[2] = ((hLoc & 0x0f) << 4) | (vLoc & 0x0f);
  payload[3] =
    ((hCount & 0x30) << 2) |
    (vCount & 0x30) |
    ((hLoc & 0x30) >> 2) |
    ((vLoc & 0x30) >> 4);

  // Tile size (stored = human - 1).
  writeUint16LE(payload, 4, clamp16(block.tileWidthPixels - 1));
  writeUint16LE(payload, 6, clamp16(block.tileHeightPixels - 1));

  // Pixel multiplier & bezel.
  payload[8] = clampBits(block.pixelMultiplier, 8);
  payload[9] = clampBits(block.topBezelSize, 8);
  payload[10] = clampBits(block.bottomBezelSize, 8);
  payload[11] = clampBits(block.rightBezelSize, 8);
  payload[12] = clampBits(block.leftBezelSize, 8);

  // Topology ID: 3-byte OUI (big-endian), 16-bit product ID (LE), 32-bit serial (LE).
  writeIeeeOui(payload, 13, clampBits(block.vendorOui, 24));
  writeUint16LE(payload, 16, clamp16(block.productId));
  const serialNumber = clampBits(block.serialNumber, 32);
  payload[18] = serialNumber & 0xff;
  payload[19] = (serialNumber >>> 8) & 0xff;
  payload[20] = (serialNumber >>> 16) & 0xff;
  payload[21] = (serialNumber >>> 24) & 0xff;

  return payload;
}