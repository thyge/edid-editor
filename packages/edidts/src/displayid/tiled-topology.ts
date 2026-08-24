// packages/edidts/src/displayid/tiled-topology.ts

import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdTiledDisplayTopologyBlock,
} from './types';
import { readIeeeOui, writeIeeeOui } from '../common/bintools';

/**
 * DisplayID 2.0 §4.7 Tiled Display Topology Data Block (tag 0x28).
 *
 * Fixed 22-byte payload (Table 4-37). Field bit layouts per Tables 4-38
 * (capabilities), 4-39 (topology & location, 6-bit packed across payload[1..3]),
 * 4-40 (tile size), 4-41 (pixel multiplier & bezel), and 4-42 (topology ID).
 *
 * The four topology/location fields are 6-bit values (0-63); the model exposes
 * them as human 1-based values (1-64), storing value-1 on encode. Tile sizes
 * are 16-bit values exposed as human pixel counts (1-65536), storing value-1.
 * edid-decode prints counts/sizes as stored+1, matching this convention.
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

  // 6-bit packed topology & location (payload[1..3]); human value = stored + 1.
  const tileCountVertical = ((b1 & 0x0f) | (b3 & 0x30)) + 1;
  const tileCountHorizontal = ((b1 >> 4) | ((b3 & 0xc0) >> 2)) + 1;
  const tileLocationVertical = ((b2 & 0x0f) | ((b3 & 0x03) << 4)) + 1;
  const tileLocationHorizontal = ((b2 >> 4) | ((b3 & 0x0c) << 2)) + 1;

  return {
    ...block,
    tag: DisplayIdDataBlockTag.TiledDisplayTopology,
    // Capabilities (Table 4-38). Bit 5 reserved.
    singleTileBehavior: caps & 0x07,
    subsetTileBehavior: (caps >> 3) & 0x03,
    bezelInfoPresent: (caps & 0x40) !== 0,
    singleEnclosure: (caps & 0x80) !== 0,
    // Topology & location (Table 4-39), human 1-64.
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
    (block.singleTileBehavior & 0x07) |
    ((block.subsetTileBehavior & 0x03) << 3) |
    (block.bezelInfoPresent ? 0x40 : 0) |
    (block.singleEnclosure ? 0x80 : 0);

  // Pack 6-bit topology & location (stored = human - 1).
  const vCount = clamp6(block.tileCountVertical - 1);
  const hCount = clamp6(block.tileCountHorizontal - 1);
  const vLoc = clamp6(block.tileLocationVertical - 1);
  const hLoc = clamp6(block.tileLocationHorizontal - 1);
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
  payload[8] = block.pixelMultiplier & 0xff;
  payload[9] = block.topBezelSize & 0xff;
  payload[10] = block.bottomBezelSize & 0xff;
  payload[11] = block.rightBezelSize & 0xff;
  payload[12] = block.leftBezelSize & 0xff;

  // Topology ID: 3-byte OUI (big-endian), 16-bit product ID (LE), 32-bit serial (LE).
  writeIeeeOui(payload, 13, block.vendorOui);
  writeUint16LE(payload, 16, clamp16(block.productId));
  payload[18] = block.serialNumber & 0xff;
  payload[19] = (block.serialNumber >> 8) & 0xff;
  payload[20] = (block.serialNumber >> 16) & 0xff;
  payload[21] = (block.serialNumber >> 24) & 0xff;

  return payload;
}