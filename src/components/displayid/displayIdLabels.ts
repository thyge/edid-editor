import { DISPLAY_ID_BLOCK_LABELS, DisplayIdDataBlockTag } from 'edidts'

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
