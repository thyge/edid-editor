<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdBrightnessLuminanceRangeBlock,
  type DisplayIdDataBlock,
  type DisplayIdSection,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { blocksByTag, numberFromEvent } from '../common/editorUtils'

/**
 * DisplayID 2.1 Brightness Luminance Range (tag 0x2e, fixed 6-byte payload).
 * Three 16-bit little-endian luminance values in 0.01 cd/m² units
 * (edid-decode parse_displayid_brightness_luminance_range); the raw values are
 * edited with the derived cd/m² display in the label.
 */
const props = defineProps<{ section: DisplayIdSection; index?: number }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

function update(index: number, block: DisplayIdBrightnessLuminanceRangeBlock, patch: Partial<DisplayIdBrightnessLuminanceRangeBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}

/** Clamp to the 16-bit encodable range. */
function clamp(value: number): number {
  const parsed = Math.round(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.min(65535, parsed)) : 0
}

/** Derived display of a 0.01 cd/m²-scaled value. */
function nitsLabel(raw: number): string {
  return (raw / 100).toFixed(2)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Brightness Luminance Range</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <div
        v-for="{ block, index } in blocksByTag<DisplayIdBrightnessLuminanceRangeBlock>(props.section, DisplayIdDataBlockTag.BrightnessLuminanceRange, props.index)"
        :key="index"
        class="grid grid-cols-3 gap-x-6 gap-y-4"
      >
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Min SDR luminance ({{ nitsLabel(block.minSdrLuminance) }} cd/m²)</label>
          <Input type="number" min="0" max="65535" :model-value="block.minSdrLuminance" @input="update(index, block, { minSdrLuminance: clamp(numberFromEvent($event)) })" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Max SDR luminance ({{ nitsLabel(block.maxSdrLuminance) }} cd/m²)</label>
          <Input type="number" min="0" max="65535" :model-value="block.maxSdrLuminance" @input="update(index, block, { maxSdrLuminance: clamp(numberFromEvent($event)) })" />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Max boost SDR luminance ({{ nitsLabel(block.maxBoostSdrLuminance) }} cd/m²)</label>
          <Input type="number" min="0" max="65535" :model-value="block.maxBoostSdrLuminance" @input="update(index, block, { maxBoostSdrLuminance: clamp(numberFromEvent($event)) })" />
        </div>
      </div>
    </CardContent>
  </Card>
</template>