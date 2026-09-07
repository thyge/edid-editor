/**
 * Video Capability Data Block (CTA-861-G §7.5.1, Extended Tag 0)
 *
 * VCDB-family block (see `cta/vcdb/`): defines video scan behavior and
 * quantization range support.
 */

import type { ExtendedDataBlock } from '../cta-extended-blocks';

export interface VideoCapabilityDataBlock extends ExtendedDataBlock {
  tag: 0x07;
  extendedTag: 0x00;
  ceVideoScanBehavior: 'not_supported' | 'always_overscanned' | 'always_underscanned' | 'both';
  itVideoScanBehavior: 'not_supported' | 'always_overscanned' | 'always_underscanned' | 'both';
  ptVideoScanBehavior: 'not_supported' | 'always_overscanned' | 'always_underscanned' | 'both';
  quantizationRangeSelectable: boolean;  // QS bit - RGB quantization range
  quantizationRangeYCC: boolean;         // QY bit - YCC quantization range
}

/**
 * Video Capability scan-behavior 2-bit code (CTA-861-G §7.5.1, Video Capability
 * Data Block). The on-the-wire value is the array index.
 */
export type ScanBehavior = VideoCapabilityDataBlock['ceVideoScanBehavior'];

/** Display-label options for each Video Capability scan-behavior field. */
export const SCAN_BEHAVIOR_OPTIONS: ReadonlyArray<{ value: ScanBehavior; label: string }> = [
  { value: 'not_supported', label: 'Not Supported' },
  { value: 'always_overscanned', label: 'Always Overscanned' },
  { value: 'always_underscanned', label: 'Always Underscanned' },
  { value: 'both', label: 'Both (Over & Under)' },
];

export function decodeVideoCapabilityBlock(base: ExtendedDataBlock, payload: Uint8Array): VideoCapabilityDataBlock {
  const byte = payload[0] || 0;

  const scanBehaviorMap: Record<number, 'not_supported' | 'always_overscanned' | 'always_underscanned' | 'both'> = {
    0: 'not_supported',
    1: 'always_overscanned',
    2: 'always_underscanned',
    3: 'both',
  };

  return {
    ...base,
    extendedTag: 0x00,
    ceVideoScanBehavior: scanBehaviorMap[byte & 0x03] ?? 'not_supported',
    itVideoScanBehavior: scanBehaviorMap[(byte >> 2) & 0x03] ?? 'not_supported',
    ptVideoScanBehavior: scanBehaviorMap[(byte >> 4) & 0x03] ?? 'not_supported',
    quantizationRangeSelectable: (byte & 0x40) !== 0,
    quantizationRangeYCC: (byte & 0x80) !== 0,
  };
}

export function encodeVideoCapabilityBlock(block: VideoCapabilityDataBlock): Uint8Array {
  const scanMap: Record<string, number> = {
    'not_supported': 0,
    'always_overscanned': 1,
    'always_underscanned': 2,
    'both': 3,
  };

  let byte = 0;
  byte |= scanMap[block.ceVideoScanBehavior] ?? 0;
  byte |= (scanMap[block.itVideoScanBehavior] ?? 0) << 2;
  byte |= (scanMap[block.ptVideoScanBehavior] ?? 0) << 4;
  if (block.quantizationRangeSelectable) byte |= 0x40;
  if (block.quantizationRangeYCC) byte |= 0x80;

  return new Uint8Array([0x00, byte]);
}