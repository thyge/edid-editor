<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdChromaticity,
  type DisplayIdDataBlock,
  type DisplayIdDisplayParametersBlock,
  type DisplayIdExtension,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent } from '../common/editorUtils'

const props = defineProps<{
  displayId: DisplayIdExtension
}>()

const emit = defineEmits<{
  updateBlock: [index: number, block: DisplayIdDataBlock]
}>()

function update(index: number, block: DisplayIdDisplayParametersBlock, patch: Partial<DisplayIdDisplayParametersBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}

function updateChromaticity(
  index: number,
  block: DisplayIdDisplayParametersBlock,
  field: 'primary1' | 'primary2' | 'primary3' | 'whitePoint',
  axis: 'x' | 'y',
  value: number,
) {
  const current: DisplayIdChromaticity = { ...block[field], [axis]: value }
  update(index, block, { [field]: current } as Partial<DisplayIdDisplayParametersBlock>)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Display Parameters</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <div
        v-for="{ block, index } in blocksByTag<DisplayIdDisplayParametersBlock>(props.displayId, DisplayIdDataBlockTag.DisplayParameters)"
        :key="index"
        class="space-y-6"
      >
        <section class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Horizontal Image Size ({{ block.imageSizeInMm ? 'mm' : '0.1 mm' }})</label>
            <Input type="number" min="0" max="65535" :model-value="block.horizontalImageSizeMm" @input="update(index, block, { horizontalImageSizeMm: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Vertical Image Size ({{ block.imageSizeInMm ? 'mm' : '0.1 mm' }})</label>
            <Input type="number" min="0" max="65535" :model-value="block.verticalImageSizeMm" @input="update(index, block, { verticalImageSizeMm: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Horizontal Pixel Count</label>
            <Input type="number" min="0" max="65535" :model-value="block.horizontalPixelCount" @input="update(index, block, { horizontalPixelCount: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Vertical Pixel Count</label>
            <Input type="number" min="0" max="65535" :model-value="block.verticalPixelCount" @input="update(index, block, { verticalPixelCount: numberFromEvent($event) })" />
          </div>
        </section>

        <section class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Scan Orientation (0–7)</label>
            <Input type="number" min="0" max="7" :model-value="block.scanOrientation" @input="update(index, block, { scanOrientation: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Luminance Information (0–3)</label>
            <Input type="number" min="0" max="3" :model-value="block.luminanceInformation" @input="update(index, block, { luminanceInformation: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Native Color Depth (0–7)</label>
            <Input type="number" min="0" max="7" :model-value="block.nativeColorDepth" @input="update(index, block, { nativeColorDepth: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Display Device Technology (0–7)</label>
            <Input type="number" min="0" max="7" :model-value="block.displayDeviceTechnology" @input="update(index, block, { displayDeviceTechnology: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Gamma EOTF (0x64 = 2.00, 0xFF = undefined)</label>
            <Input type="number" min="0" max="255" :model-value="block.gammaEotf" @input="update(index, block, { gammaEotf: numberFromEvent($event) })" />
          </div>
        </section>

        <section class="grid grid-cols-2 gap-x-6 gap-y-2">
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
            <span>Color Info CIE 1976</span>
            <Switch :checked="block.colorInformationCie1976" @update:checked="(value: boolean) => update(index, block, { colorInformationCie1976: value })" />
          </label>
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
            <span>Audio Speaker Not Integrated</span>
            <Switch :checked="block.audioSpeakerNotIntegrated" @update:checked="(value: boolean) => update(index, block, { audioSpeakerNotIntegrated: value })" />
          </label>
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
            <span>Dark Theme Preference</span>
            <Switch :checked="block.displayDeviceThemePreference" @update:checked="(value: boolean) => update(index, block, { displayDeviceThemePreference: value })" />
          </label>
        </section>

        <section class="space-y-2">
          <p class="text-xs text-muted-foreground">Chromaticity (12-bit raw, value = raw / 4096)</p>
          <div class="grid grid-cols-2 gap-x-6 gap-y-4">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Primary 1 X</label>
              <Input type="number" min="0" max="4095" :model-value="block.primary1.x" @input="updateChromaticity(index, block, 'primary1', 'x', numberFromEvent($event))" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Primary 1 Y</label>
              <Input type="number" min="0" max="4095" :model-value="block.primary1.y" @input="updateChromaticity(index, block, 'primary1', 'y', numberFromEvent($event))" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Primary 2 X</label>
              <Input type="number" min="0" max="4095" :model-value="block.primary2.x" @input="updateChromaticity(index, block, 'primary2', 'x', numberFromEvent($event))" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Primary 2 Y</label>
              <Input type="number" min="0" max="4095" :model-value="block.primary2.y" @input="updateChromaticity(index, block, 'primary2', 'y', numberFromEvent($event))" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Primary 3 X</label>
              <Input type="number" min="0" max="4095" :model-value="block.primary3.x" @input="updateChromaticity(index, block, 'primary3', 'x', numberFromEvent($event))" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Primary 3 Y</label>
              <Input type="number" min="0" max="4095" :model-value="block.primary3.y" @input="updateChromaticity(index, block, 'primary3', 'y', numberFromEvent($event))" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">White Point X</label>
              <Input type="number" min="0" max="4095" :model-value="block.whitePoint.x" @input="updateChromaticity(index, block, 'whitePoint', 'x', numberFromEvent($event))" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">White Point Y</label>
              <Input type="number" min="0" max="4095" :model-value="block.whitePoint.y" @input="updateChromaticity(index, block, 'whitePoint', 'y', numberFromEvent($event))" />
            </div>
          </div>
        </section>

        <section class="space-y-2">
          <p class="text-xs text-muted-foreground">Luminance (IEEE 754 binary16 raw)</p>
          <div class="grid grid-cols-2 gap-x-6 gap-y-4">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Max Luminance (Full Coverage)</label>
              <Input type="number" min="0" max="65535" :model-value="block.maxLuminanceFullCoverage" @input="update(index, block, { maxLuminanceFullCoverage: numberFromEvent($event) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Max Luminance (10% Rect)</label>
              <Input type="number" min="0" max="65535" :model-value="block.maxLuminance10PercentRect" @input="update(index, block, { maxLuminance10PercentRect: numberFromEvent($event) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Min Luminance</label>
              <Input type="number" min="0" max="65535" :model-value="block.minLuminance" @input="update(index, block, { minLuminance: numberFromEvent($event) })" />
            </div>
          </div>
        </section>
      </div>
    </CardContent>
  </Card>
</template>