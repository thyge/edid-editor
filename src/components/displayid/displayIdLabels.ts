import {
  DISPLAY_ID_BLOCK_LABELS,
  DISPLAY_ID_V1_BLOCK_LABELS,
  DISPLAY_ID_V1_BLOCK_TAGS,
} from 'edidts'

/**
 * Label for a DisplayID data block of either tag space: v2.0
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

/**
 * Section ids are namespaced by the section's position in the DisplayID
 * extension's section chain: `displayid-s<sec>-overview` /
 * `displayid-s<sec>-header` / `displayid-s<sec>-b<block>` where `<sec>` is the
 * index into `DisplayIdExtension.sections` (0 = base section). This replaces
 * the pre-multi-section flat ids (`displayid-overview`, `displayid-header`,
 * `displayid-block-<idx>`).
 */
export const displayIdSectionIds = {
  /** Section id prefix shared by overview/header/block rows. */
  prefix: 'displayid-s',
  overview: (sectionIndex: number) => `displayid-s${sectionIndex}-overview`,
  header: (sectionIndex: number) => `displayid-s${sectionIndex}-header`,
} as const

/** Section id for the data block at `blockIndex` of chain section `sectionIndex`. */
export function displayIdBlockSectionId(sectionIndex: number, blockIndex: number): string {
  return `displayid-s${sectionIndex}-b${blockIndex}`
}

export interface DisplayIdSectionRoute {
  sectionIndex: number
  /** 'overview' | 'header' | the index of a data block in the section. */
  target: number | 'overview' | 'header'
}

/** Parse a section id back into its chain-section index and target. */
export function parseDisplayIdSectionId(id: string): DisplayIdSectionRoute | null {
  if (!id.startsWith(displayIdSectionIds.prefix)) return null
  const rest = id.slice(displayIdSectionIds.prefix.length)
  const match = /^(\d+)-(overview|header|b(\d+))$/.exec(rest)
  if (!match) return null
  const sectionIndex = Number(match[1])
  if (match[2] === 'overview' || match[2] === 'header') {
    return { sectionIndex, target: match[2] }
  }
  return { sectionIndex, target: Number(match[3]) }
}

export const addableDisplayIdBlocks = Object.entries(DISPLAY_ID_BLOCK_LABELS).map(([tag, label]) => ({
  tag: Number(tag),
  label,
}))

/** Add Block menu entries for DisplayID 1.x sections: only the
 *  five tags with structured codecs and editors — everything else
 *  in the v1.x tag space has no structured editor yet. */
export const addableDisplayIdV1Blocks = Object.values(DISPLAY_ID_V1_BLOCK_TAGS).map(tag => ({
  tag,
  label: DISPLAY_ID_V1_BLOCK_LABELS[tag] ?? `Unknown 0x${tag.toString(16).padStart(2, '0')}`,
}))

/** The Add Block menu is version-scoped: a v1.x section offers the
 *  v1.x tags, a v2.0 section the v2.0 tags — never a cross-version add. */
export function addableDisplayIdBlocksForSection(versionByte: number): { tag: number; label: string }[] {
  return versionByte < 0x20 ? addableDisplayIdV1Blocks : addableDisplayIdBlocks
}