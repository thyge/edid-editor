import {
  DISPLAY_ID_BLOCK_LABELS,
  DISPLAY_ID_V1_BLOCK_LABELS,
} from 'edidts'

/**
 * Label for a DisplayID data block of either tag space (TASK-111): v2.0
 * (DISPLAY_ID_BLOCK_LABELS) first, then v1.x (DISPLAY_ID_V1_BLOCK_LABELS),
 * else a padded-hex fallback. The v1.x and v2.0 tag spaces don't overlap,
 * so order is only for lookup clarity.
 */
export function displayIdBlockLabel(tag: number): string {
  return (
    DISPLAY_ID_BLOCK_LABELS[tag as keyof typeof DISPLAY_ID_BLOCK_LABELS]
    ?? DISPLAY_ID_V1_BLOCK_LABELS[tag]
    ?? `Unknown 0x${tag.toString(16).padStart(2, '0')}`
  )
}

export const displayIdSectionIds = {
  overview: 'displayid-overview',
  header: 'displayid-header',
  /** Per-block section id prefix: displayid-block-<idx> (mirrors cea-block-<idx>, TASK-114). */
  blockPrefix: 'displayid-block-',
} as const

/** Section id for the DisplayID data block at `index` (TASK-123). */
export function displayIdBlockSectionId(index: number): string {
  return `${displayIdSectionIds.blockPrefix}${index}`
}

export const addableDisplayIdBlocks = Object.entries(DISPLAY_ID_BLOCK_LABELS).map(([tag, label]) => ({
  tag: Number(tag),
  label,
}))