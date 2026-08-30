import {
  isCEAExtension,
  isDisplayIdExtension,
  type EEDID,
} from 'edidts'

/**
 * A labelled byte span within the full EEDID blob. Regions produced by
 * {@link computeHexBlockRegions} tile `[0, totalLength)` contiguously — no gaps,
 * no overlaps — so the HexViewer can render every byte exactly once while
 * inserting a thin labelled divider before each top-level block.
 *
 * - `start` / `length` are absolute byte offsets within the full re-encoded
 *   blob (the same bytes `EEDID.encode` produces; the layout is a deterministic
 *   128-byte-per-block stride).
 * - `label` is the block name shown in the divider; an empty label suppresses
 *   the divider header (used for the fallback single-region render).
 * - `depth` drives divider indentation (always 0 for the top-level split; kept
 *   so future finer-grained sub-block regions can indent without an API change).
 */
export interface HexRegion {
  start: number
  length: number
  label: string
  depth: number
}

const BLOCK_SIZE = 128

function hex(n: number): string {
  return n.toString(16).toUpperCase()
}

/**
 * Compute top-level block-boundary regions for a parsed EEDID tree: one region
 * for the EDID base block and one per extension block (CTA-861, DisplayID, or a
 * generic "Extension (tag 0xXX)" for anything else). The regions tile
 * `[0, (1 + extensions.length) * 128)` contiguously with absolute byte offsets
 * and labels, so the HexViewer can render the whole blob with a thin labelled
 * divider before each block while keeping byte offsets exact. Pure and derived
 * solely from the parsed tree (no re-encode). Finer per-data-block splits can
 * be layered on later.
 */
export function computeHexBlockRegions(eedid: EEDID): HexRegion[] {
  const regions: HexRegion[] = [
    { start: 0, length: BLOCK_SIZE, label: 'EDID Base Block', depth: 0 },
  ]

  for (let i = 0; i < eedid.extensions.length; i++) {
    const ext = eedid.extensions[i]
    const extBase = (i + 1) * BLOCK_SIZE
    const label = isCEAExtension(ext)
      ? 'CTA-861 Extension'
      : isDisplayIdExtension(ext)
        ? 'DisplayID Extension'
        : `Extension (tag 0x${hex(ext.tag)})`
    regions.push({ start: extBase, length: BLOCK_SIZE, label, depth: 0 })
  }

  return regions
}