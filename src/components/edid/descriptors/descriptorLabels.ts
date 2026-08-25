/** Display-descriptor tag labels (EDID 1.4 §3.10.3). Shared by the left nav
 *  and the DisplayDescriptors view so the two never diverge. The edidts lib
 *  owns the tag enum; this is the display-label layer the UI needs until the
 *  lib exports labels directly (see backlog TASK-78). */

/** Canonical tag → display label. */
export const DESCRIPTOR_LABELS: Record<number, string> = {
  0xFF: 'Serial Number',
  0xFE: 'Data String',
  0xFD: 'Range Limits',
  0xFC: 'Product Name',
  0xFB: 'Color Points',
  0xFA: 'Standard Timing IDs',
  0xF9: 'Display Color Management',
  0xF8: 'CVT 3 Byte Codes',
  0xF7: 'Established Timings III',
}

/** Add-dropdown option list, in the spec's conventional display order. */
const DESCRIPTOR_TAG_ORDER = [0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA, 0xF9, 0xF8, 0xF7]
export const DESCRIPTOR_OPTIONS = DESCRIPTOR_TAG_ORDER.map((tag) => ({
  tag,
  label: DESCRIPTOR_LABELS[tag] ?? `Descriptor 0x${tag.toString(16).toUpperCase()}`,
}))

/** Human-readable label for any descriptor tag, including the manufacturer
 *  (0x00–0x0F) and reserved (0x11–0xF6) ranges not in DESCRIPTOR_LABELS. */
export function getDescriptorLabel(tag: number): string {
  if (tag >= 0x00 && tag <= 0x0F) return 'Manufacturer Descriptor'
  if (tag >= 0x11 && tag <= 0xF6) return 'Reserved Descriptor'
  return DESCRIPTOR_LABELS[tag] ?? `Descriptor 0x${tag.toString(16).toUpperCase()}`
}