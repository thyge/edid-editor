/**
 * Vendor-specific block labels for the CEA nav sub-group and per-block views
 * (TASK-102). Covers all three vendor carriers — tag 0x03 VSDBs, tag 0x07
 * ext 0x01 VSVDBs, and tag 0x07 ext 0x11 Vendor-Specific Audio — keyed by the
 * decoded `block.vendor.kind`, with OUI-rooted fallbacks for unregistered
 * vendors. Mirrors the displayIdLabels.ts label-map pattern.
 */
import type {
  VendorSpecificAudioDataBlock,
  VendorSpecificDataBlock,
  VendorSpecificVideoDataBlock,
} from 'edidts'

/** A vendor block of any carrier (VSDB, VSVDB, or vendor audio). */
export type VendorBlock =
  | VendorSpecificDataBlock
  | VendorSpecificVideoDataBlock
  | VendorSpecificAudioDataBlock

/** Type guard: is this CEA data block one of the three vendor carriers? */
export function isVendorBlock(b: unknown): b is VendorBlock {
  const t = b as { tag?: number; extendedTag?: number }
  return t?.tag === 0x03 ||
    (t?.tag === 0x07 && (t.extendedTag === 0x01 || t.extendedTag === 0x11))
}

/** Kind → display label for decoded vendor payloads (vsdb/ + vsvdb/ codecs). */
export const VENDOR_KIND_LABELS: Readonly<Record<string, string>> = {
  hdmi14: 'HDMI 1.4',
  hdmiForum: 'HDMI Forum',
  microsoftHmd: 'Microsoft HMD',
  amdFreeSync: 'AMD FreeSync',
  mhl: 'MHL',
  dolbyVsdb: 'Dolby Vision',
  hdr10PlusVsvdb: 'HDR10+',
}

/** Format a 24-bit IEEE OUI as the dashed hex form used across the app. */
export function ouiLabel(oui: number): string {
  return oui
    .toString(16)
    .toUpperCase()
    .padStart(6, '0')
    .replace(/^(..)(..)(..)$/, '$1-$2-$3')
}

/**
 * Nav label for any vendor-specific block (VSDB, VSVDB, or vendor audio):
 * the decoded kind's label when a codec matched, else an OUI-rooted fallback.
 */
export function vendorBlockLabel(block: VendorBlock): string {
  const kind = (block as { vendor?: { kind?: string } | null }).vendor?.kind
  if (kind && VENDOR_KIND_LABELS[kind]) return VENDOR_KIND_LABELS[kind]
  const oui = ouiLabel(block.ieeeOui)
  return block.tag === 0x07 && (block as { extendedTag?: number }).extendedTag === 0x11
    ? `Vendor Audio ${oui}`
    : `Vendor ${oui}`
}