/**
 * Canonical CTA-861 data-block ordering shared by the left nav (display,
 * add-menu order) and App.vue (add-insertion position).
 *
 * CTA-861-G Section 7.1.2 states "The order of the Data Blocks is not
 * constrained", so this order is an editor convention only: the nav displays
 * blocks in their encoded (dataBlocks) order verbatim, and the Add Block flow
 * *inserts* new blocks at the position this ranking dictates relative to the
 * blocks already present. Detailed Timings are not ranked — per Table 53 the
 * 18-byte DTDs begin at byte d after the entire Data Block Collection, so they
 * are displayed and appended last regardless of data-block order.
 */
import type { CEADataBlock } from 'edidts'
import { isVendorBlock, vendorBlockLabel } from '@/components/cta/vendorLabels'

/** Block families rendered as collapsible sub-group callouts in the nav. */
export type CtaBlockFamily = 'vsdb' | 'vcdb'

/** Extended tags of the Video Capability Data Block family (user-defined
 *  grouping): VCDB itself, Vendor-Specific Video/Audio carriers,
 *  InfoFrame, the YCbCr 4:2:0 pair, Video Format Preference, and HDR Static
 *  Metadata. */
const VCDB_FAMILY_EXT_TAGS: ReadonlySet<number> = new Set([0x00, 0x01, 0x11, 0x20, 0x0e, 0x0f, 0x0d, 0x06])

/** Sub-group membership of a decoded block: tag 0x03 VSDBs form the vendor
 *  group; the VCDB-family extended blocks form the video-capability group;
 *  everything else renders flat. */
export function ctaBlockFamily(block: CEADataBlock): CtaBlockFamily | null {
  if (block.tag === 0x03) return 'vsdb'
  if (block.tag === 0x07 && VCDB_FAMILY_EXT_TAGS.has((block as { extendedTag?: number }).extendedTag ?? -1)) {
    return 'vcdb'
  }
  return null
}

/**
 * Position in the canonical add order. Lower = earlier. VSDBs share
 * rank 5: a newly added VSDB lands after existing VSDBs but before higher-
 * ranked blocks. Unlisted types (VESA Display Device 0x05, VESA VTB ext 0x03,
 * HDMI Video ext 0x04, CTA Misc Audio ext 0x10, HDMI Audio ext 0x12,
 * unknown/opaque) rank last so an add appends them after the canonical list.
 */
export function ctaBlockRank(block: CEADataBlock): number {
  if (block.tag === 0x03) return 5
  if (block.tag === 0x02) return 2 // Video
  if (block.tag === 0x01) return 3 // Audio
  if (block.tag === 0x04) return 4 // Speaker Allocation
  if (block.tag === 0x05) return 18 // VESA Display Device (unlisted)
  switch ((block as { extendedTag?: number }).extendedTag) {
    case 0x05: return 6 // Colorimetry
    case 0x00: return 7 // Video Capability
    case 0x01: return 8 // Vendor-Specific Video (VSVDB)
    case 0x11: return 9 // Vendor-Specific Audio
    case 0x20: return 10 // InfoFrame
    case 0x0e: return 11 // YCbCr 4:2:0 Video
    case 0x0f: return 12 // YCbCr 4:2:0 Capability Map
    case 0x0d: return 13 // Video Format Preference
    case 0x06: return 14 // HDR Static Metadata
    case 0x07: return 15 // HDR Dynamic Metadata
    case 0x13: return 16 // Room Configuration
    case 0x14: return 17 // Speaker Location
    default: return 18 // unlisted / unknown extended tags
  }
}

/** Nav label for one data block. Vendor carriers reuse the OUI/kind labels. */
export function ctaBlockNavLabel(block: CEADataBlock): string {
  if (isVendorBlock(block)) return vendorBlockLabel(block)
  if (block.tag === 0x02) return 'Video Data Block'
  if (block.tag === 0x01) return 'Audio Data Block'
  if (block.tag === 0x04) return 'Speaker Allocation'
  if (block.tag === 0x05) return 'VESA Display Device'
  if (block.tag === 0x07) {
    switch ((block as { extendedTag?: number }).extendedTag) {
      case 0x00: return 'Video Capability'
      case 0x05: return 'Colorimetry'
      case 0x06: return 'HDR Static Metadata'
      case 0x07: return 'HDR Dynamic Metadata'
      case 0x0d: return 'Video Format Preference'
      case 0x0e: return 'YCbCr 4:2:0 Video'
      case 0x0f: return 'YCbCr 4:2:0 Capability Map'
      case 0x13: return 'Room Configuration'
      case 0x14: return 'Speaker Location'
      case 0x20: return 'InfoFrame'
    }
    const ext = (block as { extendedTag?: number }).extendedTag ?? 0
    return `Extended Block 0x${ext.toString(16).padStart(2, '0')}`
  }
  return `Unknown Block (tag 0x${block.tag.toString(16).padStart(2, '0')})`
}

/**
 * dataBlocks index where a new block should be inserted so the array stays in
 * canonical order: before the first existing block with a strictly greater
 * rank (same-rank blocks keep their seniority), or at the end when none is
 * greater. Display order of already-present blocks is never touched.
 */
export function ctaInsertionIndex(blocks: CEADataBlock[], block: CEADataBlock): number {
  const rank = ctaBlockRank(block)
  for (let i = 0; i < blocks.length; i++) {
    if (ctaBlockRank(blocks[i]) > rank) return i
  }
  return blocks.length
}