<script setup lang="ts">
import {
  DISPLAY_ID_V1_BLOCK_TAGS,
  type DisplayIdDataBlock,
  type DisplayIdSection,
  type DisplayIdV1DisplayParametersBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { blocksByTag, numberFromEvent } from '../common/editorUtils'

/**
 * DisplayID 1.x Display Parameters (tag 0x01, fixed 12-byte payload).
 * The model stores raw wire values (edidts v1-codecs.ts); labels document the
 * derived units — image size in 0.1 mm, gamma and aspect ratio as
 * (100 + byte) / 100, color depth nibbles as code + 1.
 */
const props = defineProps<{
  section: DisplayIdSection
  index?: number
}>()

const emit = defineEmits<{
  updateBlock: [index: number, block: DisplayIdDataBlock]
}>()

function update(index: number, block: DisplayIdV1DisplayParametersBlock, patch: Partial<DisplayIdV1DisplayParametersBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}

/** Clamp to the field's encodable range so the model never receives a value
 *  the encoder would silently truncate or wrap. */
function clamp(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(value)))
}

/** Derived display of the (100 + byte) / 100 gamma encoding; 255 = undefined. */
function gammaLabel(byte: number): string {
  return byte === 255 ? 'undefined' : ((100 + byte) / 100).toFixed(2)
}

/** Derived display of the (100 + byte) / 100 aspect-ratio encoding. */
function ratioLabel(byte: number): string {
  return ((100 + byte) / 100).toFixed(2)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Display Parameters (DisplayID 1.x)</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <div
        v-for="{ block, index } in blocksByTag<DisplayIdV1DisplayParametersBlock>(props.section, DISPLAY_ID_V1_BLOCK_TAGS.DisplayParameters, props.index)"
        :key="index"
        class="space-y-4"
      >
        <div class="grid grid-cols-4 gap-x-6 gap-y-4">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Horizontal image size (0.1 mm)</label>
            <Input type="number" min="0" max="65535" :model-value="block.horizontalImageSizeTenthsMm" @input="update(index, block, { horizontalImageSizeTenthsMm: clamp(numberFromEvent($event), 65535) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Vertical image size (0.1 mm)</label>
            <Input type="number" min="0" max="65535" :model-value="block.verticalImageSizeTenthsMm" @input="update(index, block, { verticalImageSizeTenthsMm: clamp(numberFromEvent($event), 65535) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Horizontal pixel count</label>
            <Input type="number" min="0" max="65535" :model-value="block.horizontalPixelCount" @input="update(index, block, { horizontalPixelCount: clamp(numberFromEvent($event), 65535) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Vertical pixel count</label>
            <Input type="number" min="0" max="65535" :model-value="block.verticalPixelCount" @input="update(index, block, { verticalPixelCount: clamp(numberFromEvent($event), 65535) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Feature support flags (0–255)</label>
            <Input type="number" min="0" max="255" :model-value="block.featureSupportFlags" @input="update(index, block, { featureSupportFlags: clamp(numberFromEvent($event), 255) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Gamma (255 = undefined; {{ gammaLabel(block.gamma) }})</label>
            <Input type="number" min="0" max="255" :model-value="block.gamma" @input="update(index, block, { gamma: clamp(numberFromEvent($event), 255) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Aspect ratio (byte; {{ ratioLabel(block.aspectRatio) }})</label>
            <Input type="number" min="0" max="255" :model-value="block.aspectRatio" @input="update(index, block, { aspectRatio: clamp(numberFromEvent($event), 255) })" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Native color depth code (depth = code + 1)</label>
            <Input type="number" min="0" max="15" :model-value="block.nativeColorDepthCode" @input="update(index, block, { nativeColorDepthCode: clamp(numberFromEvent($event), 15) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Overall color depth code (depth = code + 1)</label>
            <Input type="number" min="0" max="15" :model-value="block.overallColorDepthCode" @input="update(index, block, { overallColorDepthCode: clamp(numberFromEvent($event), 15) })" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>