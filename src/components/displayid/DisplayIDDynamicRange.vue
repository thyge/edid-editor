<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdDynamicVideoTimingRangeLimitsBlock,
  type DisplayIdSection,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent } from '../common/editorUtils'

/**
 * DisplayID 2.x Dynamic Video Timing Range Limits (tag 0x25): the 9-byte
 * layout edid-decode reads — pixel clock range (kHz, 24-bit + 1), vertical
 * refresh range (Hz) and the seamless-switch flag. Block revision 1 widens the
 * maximum refresh rate to 10 bits (up to 1023 Hz).
 */
const props = defineProps<{ section: DisplayIdSection; index?: number }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

type NumberField =
  | 'minimumPixelClockKHz'
  | 'maximumPixelClockKHz'
  | 'minimumVerticalFrequencyHz'
  | 'maximumVerticalFrequencyHz'

function fieldRange(field: NumberField, block: DisplayIdDynamicVideoTimingRangeLimitsBlock): [number, number] {
  switch (field) {
    case 'minimumPixelClockKHz':
    case 'maximumPixelClockKHz':
      return [1, 16_777_216]
    case 'minimumVerticalFrequencyHz':
      return [0, 255]
    case 'maximumVerticalFrequencyHz':
      return [0, block.revision !== 0 ? 1023 : 255]
  }
}

function updateField(index: number, block: DisplayIdDynamicVideoTimingRangeLimitsBlock, field: NumberField, value: number) {
  const [min, max] = fieldRange(field, block)
  const clamped = Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value))) : min
  emit('updateBlock', index, { ...block, [field]: clamped })
}

function update(index: number, block: DisplayIdDynamicVideoTimingRangeLimitsBlock, patch: Partial<DisplayIdDynamicVideoTimingRangeLimitsBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}

const FIELDS: ReadonlyArray<{ field: NumberField; label: string }> = [
  { field: 'minimumPixelClockKHz', label: 'Minimum pixel clock (kHz)' },
  { field: 'maximumPixelClockKHz', label: 'Maximum pixel clock (kHz)' },
  { field: 'minimumVerticalFrequencyHz', label: 'Minimum refresh rate (Hz)' },
  { field: 'maximumVerticalFrequencyHz', label: 'Maximum refresh rate (Hz)' },
]
</script>

<template>
  <Card>
    <CardHeader><CardTitle>Dynamic Video Timing Range Limits</CardTitle></CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div v-for="{ block, index } in blocksByTag<DisplayIdDynamicVideoTimingRangeLimitsBlock>(props.section, DisplayIdDataBlockTag.DynamicVideoTimingRangeLimits, props.index)" :key="index" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div v-for="{ field, label } in FIELDS" :key="field" class="space-y-1">
            <label class="text-xs text-muted-foreground">{{ label }}</label>
            <Input
              type="number"
              :min="fieldRange(field, block)[0]"
              :max="fieldRange(field, block)[1]"
              :model-value="block[field]"
              @input="updateField(index, block, field, numberFromEvent($event))"
            />
          </div>
        </div>
        <p v-if="block.revision === 0" class="text-xs text-muted-foreground">
          Block revision 0 limits the maximum refresh rate to 255 Hz.
        </p>
        <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
          <span>Seamless dynamic video timing change</span>
          <Switch :model-value="block.seamlessDynamicVideoTiming" @update:model-value="(value: boolean) => update(index, block, { seamlessDynamicVideoTiming: value })" />
        </label>
      </div>
    </CardContent>
  </Card>
</template>
