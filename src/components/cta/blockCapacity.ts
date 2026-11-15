import { ExtensionBlockParser } from 'edidts'
import type { CEADataBlock, CEAExtensionBlock } from 'edidts'

/** A CTA data block's 5-bit length field caps its body at 31 bytes. */
export const CTA_DATA_BLOCK_MAX_BODY = 31

/**
 * Why `extraBytes` more bytes cannot be added inside `block`, or null when
 * they fit. Used to disable the in-block "add" controls (VICs, audio
 * descriptors, SVRs, …) before an add would overflow the block's 5-bit length
 * field or the CTA-861 extension's shared payload area (which would otherwise
 * push the last detailed timing out of the 128-byte block).
 *
 * `cea` may be the one-block wrapper the DisplayID CTA view passes (no
 * `detailedTimings`); only the per-block limit applies there.
 */
export function ctaAddBlockedReason(
  cea: CEAExtensionBlock,
  block: CEADataBlock | undefined,
  extraBytes: number,
): string | null {
  if (!block) return null
  let body: number
  try {
    body = ExtensionBlockParser.getCeaEncodedBlockBytes(block) - 1
  } catch {
    return 'This block cannot be encoded in its current state.'
  }
  if (body + extraBytes > CTA_DATA_BLOCK_MAX_BODY) {
    return `A CTA data block holds at most ${CTA_DATA_BLOCK_MAX_BODY} bytes; this one already uses ${body}.`
  }
  if (Array.isArray(cea.detailedTimings)) {
    let free: number
    try {
      free = ExtensionBlockParser.getCeaFreePayloadBytes(cea)
    } catch {
      return 'The CTA-861 extension cannot be encoded in its current state.'
    }
    if (free < extraBytes) {
      return free <= 0
        ? 'The CTA-861 extension has no free bytes left. Remove a data block or detailed timing first.'
        : `The CTA-861 extension has only ${free} free byte${free === 1 ? '' : 's'} left.`
    }
  }
  return null
}
