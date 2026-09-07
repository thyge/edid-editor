import {
  DISPLAY_ID_BLOCK_LABELS,
  DISPLAY_ID_V1_BLOCK_LABELS,
  DisplayIdDataBlockTag,
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
  product: 'displayid-product',
  parameters: 'displayid-parameters',
  typeVII: 'displayid-type-vii',
  typeVIII: 'displayid-type-viii',
  typeIX: 'displayid-type-ix',
  dynamicRange: 'displayid-dynamic-range',
  interfaceFeatures: 'displayid-interface-features',
  stereo: 'displayid-stereo',
  tiled: 'displayid-tiled',
  container: 'displayid-container',
  vendor: 'displayid-vendor',
  cta: 'displayid-cta',
} as const

export const displayIdBlockSectionByTag: Record<number, string> = {
  [DisplayIdDataBlockTag.ProductIdentification]: displayIdSectionIds.product,
  [DisplayIdDataBlockTag.DisplayParameters]: displayIdSectionIds.parameters,
  [DisplayIdDataBlockTag.TypeVIIDetailedTiming]: displayIdSectionIds.typeVII,
  [DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode]: displayIdSectionIds.typeVIII,
  [DisplayIdDataBlockTag.TypeIXFormulaBasedTiming]: displayIdSectionIds.typeIX,
  [DisplayIdDataBlockTag.DynamicVideoTimingRangeLimits]: displayIdSectionIds.dynamicRange,
  [DisplayIdDataBlockTag.DisplayInterfaceFeatures]: displayIdSectionIds.interfaceFeatures,
  [DisplayIdDataBlockTag.StereoDisplayInterface]: displayIdSectionIds.stereo,
  [DisplayIdDataBlockTag.TiledDisplayTopology]: displayIdSectionIds.tiled,
  [DisplayIdDataBlockTag.ContainerId]: displayIdSectionIds.container,
  [DisplayIdDataBlockTag.VendorSpecific]: displayIdSectionIds.vendor,
  [DisplayIdDataBlockTag.CtaDisplayId]: displayIdSectionIds.cta,
}

export const addableDisplayIdBlocks = Object.entries(DISPLAY_ID_BLOCK_LABELS).map(([tag, label]) => ({
  tag: Number(tag),
  label,
}))
