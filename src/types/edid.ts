import type { EDID } from 'edidts'

export type EDIDViewModel = Pick<
  EDID,
  |
    'header'
  |
    'videoInput'
  |
    'screenSize'
  |
    'featureSupport'
  |
    'gamma'
  |
    'productName'
  |
    'colorCharacteristics'
  |
    'establishedTimings'
  |
    'standardTimings'
  |
    'detailedTimings'
  |
    'displayDescriptors'
  |
    'isValid'
  |
    'extensionBlocks'
  |
    'ceaExtension'
>
