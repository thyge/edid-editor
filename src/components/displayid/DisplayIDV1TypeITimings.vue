<script setup lang="ts">
import {
  DISPLAY_ID_V1_BLOCK_TAGS,
  type DisplayIdDataBlock,
  type DisplayIdSection,
  type DisplayIdTypeVIIDetailedTiming,
  type DisplayIdV1TypeIDetailedTimingBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent, removeArrayItem, updateArrayItem } from '../common/editorUtils'

/**
 * DisplayID 1.x Type 1 Detailed Timings (tag 0x03, TASK-125). The 20-byte
 * descriptor layout is identical to the v2.0 Type VII block — the model reuses
 * DisplayIdTypeVIIDetailedTiming — except the pixel clock is 10 kHz
 * resolution: the codec stores `pixelClockKHz = 10 * (1 + raw24)` and reverses
 * with `floor(kHz / 10) - 1`, so the UI quantizes edits to 10 kHz steps to
 * keep the value round-trip byte-identical.
 */
const props = defineProps<{ section: DisplayIdSection; index?: number }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

function defaultTiming(): DisplayIdTypeVIIDetailedTiming {
  return {
    pixelClockKHz: 148500,
    aspectRatio: 8,
    interlaced: false,
    stereo: 0,
    preferred: false,
    horizontalActive: 1920,
    horizontalBlanking: 280,
    horizontalSyncOffset: 44,
    horizontalSyncPolarity: true,
    horizontalSyncWidth: 56,
    verticalActive: 1080,
    verticalBlanking: 45,
    verticalSyncOffset: 4,
    verticalSyncPolarity: true,
    verticalSyncWidth: 5,
  }
}

function updateBlock(index: number, block: DisplayIdV1TypeIDetailedTimingBlock, timings: DisplayIdTypeVIIDetailedTiming[]) {
  emit('updateBlock', index, { ...block, timings } as DisplayIdV1TypeIDetailedTimingBlock)
}

/**
 * Encodable ranges of the shared 20-byte descriptor (same widths as the Type
 * VII codec — values stored with a −1 bias, so the maxima are the raw field
 * widths plus one). The one v1.x difference is the pixel clock: 10 kHz steps
 * over a 24-bit raw field, giving a 10 kHz–167,772,160 kHz range quantized to
 * multiples of 10.
 */
const TYPE_I_FIELD_MAX = {
  horizontalActive: 65_536,
  horizontalBlanking: 65_536,
  horizontalSyncOffset: 16_384,
  horizontalSyncWidth: 65_536,
  verticalActive: 65_536,
  verticalBlanking: 65_536,
  verticalSyncOffset: 16_384,
  verticalSyncWidth: 65_536,
  aspectRatio: 15,
  stereo: 3,
} as const

/** Max Type 1 pixel clock: 10 kHz × 2^24. */
const TYPE_I_PIXEL_CLOCK_MAX_KHZ = 167_772_160

type TypeINumberField = keyof typeof TYPE_I_FIELD_MAX

/** Clamp an edited value into the field's encodable range — the model never
 *  receives a value the encoder would silently truncate or wrap. */
function clampField(field: TypeINumberField, value: number): number {
  const parsed = Math.round(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.min(TYPE_I_FIELD_MAX[field], parsed)) : 0
}

/** Pixel clock: quantize to the codec's 10 kHz resolution and clamp to the
 *  24-bit raw range (TASK-107-style overflow guard, scaled for Type 1). */
function clampPixelClockKHz(value: number): number {
  const parsed = Math.round(value)
  if (!Number.isFinite(parsed)) return 10
  return Math.max(10, Math.min(TYPE_I_PIXEL_CLOCK_MAX_KHZ, Math.floor(parsed / 10) * 10))
}

/** Update one numeric field of one Type 1 timing, clamped to its range. */
function updateTiming(
  index: number,
  block: DisplayIdV1TypeIDetailedTimingBlock,
  timingIndex: number,
  field: TypeINumberField,
  value: number,
) {
  const timing = block.timings[timingIndex]
  if (!timing) return
  updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, [field]: clampField(field, value) }))
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Type 1 Detailed Timings (DisplayID 1.x)</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <section
        v-for="{ block, index } in blocksByTag<DisplayIdV1TypeIDetailedTimingBlock>(props.section, DISPLAY_ID_V1_BLOCK_TAGS.TypeIDetailedTiming, props.index)"
        :key="index"
        class="space-y-3"
      >
        <div
          v-for="(timing, timingIndex) in block.timings"
          :key="timingIndex"
          class="space-y-3 rounded-md border border-border p-3"
        >
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium">Timing {{ timingIndex + 1 }}</h4>
            <Button variant="ghost" size="sm" class="text-destructive" @click="updateBlock(index, block, removeArrayItem(block.timings, timingIndex))">Remove</Button>
          </div>
          <div class="grid grid-cols-4 gap-3">
            <Input type="number" min="10" :max="TYPE_I_PIXEL_CLOCK_MAX_KHZ" step="10" :model-value="timing.pixelClockKHz" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, pixelClockKHz: clampPixelClockKHz(numberFromEvent($event)) }))" />
            <Input type="number" min="0" :max="TYPE_I_FIELD_MAX.aspectRatio" :model-value="timing.aspectRatio" @input="updateTiming(index, block, timingIndex, 'aspectRatio', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_I_FIELD_MAX.horizontalActive" :model-value="timing.horizontalActive" @input="updateTiming(index, block, timingIndex, 'horizontalActive', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_I_FIELD_MAX.horizontalBlanking" :model-value="timing.horizontalBlanking" @input="updateTiming(index, block, timingIndex, 'horizontalBlanking', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_I_FIELD_MAX.horizontalSyncOffset" :model-value="timing.horizontalSyncOffset" @input="updateTiming(index, block, timingIndex, 'horizontalSyncOffset', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_I_FIELD_MAX.horizontalSyncWidth" :model-value="timing.horizontalSyncWidth" @input="updateTiming(index, block, timingIndex, 'horizontalSyncWidth', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_I_FIELD_MAX.verticalActive" :model-value="timing.verticalActive" @input="updateTiming(index, block, timingIndex, 'verticalActive', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_I_FIELD_MAX.verticalBlanking" :model-value="timing.verticalBlanking" @input="updateTiming(index, block, timingIndex, 'verticalBlanking', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_I_FIELD_MAX.verticalSyncOffset" :model-value="timing.verticalSyncOffset" @input="updateTiming(index, block, timingIndex, 'verticalSyncOffset', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_I_FIELD_MAX.verticalSyncWidth" :model-value="timing.verticalSyncWidth" @input="updateTiming(index, block, timingIndex, 'verticalSyncWidth', numberFromEvent($event))" />
          </div>
          <div class="grid grid-cols-3 gap-3">
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Preferred</span>
              <Switch :model-value="timing.preferred" @update:model-value="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, preferred: value }))" />
            </label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Interlaced</span>
              <Switch :model-value="timing.interlaced" @update:model-value="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, interlaced: value }))" />
            </label>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">3D Stereo (0–3)</label>
              <Input type="number" min="0" :max="TYPE_I_FIELD_MAX.stereo" :model-value="timing.stereo" @input="updateTiming(index, block, timingIndex, 'stereo', numberFromEvent($event))" />
            </div>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Hsync +</span>
              <Switch :model-value="timing.horizontalSyncPolarity" @update:model-value="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, horizontalSyncPolarity: value }))" />
            </label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Vsync +</span>
              <Switch :model-value="timing.verticalSyncPolarity" @update:model-value="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, verticalSyncPolarity: value }))" />
            </label>
          </div>
        </div>
        <Button variant="outline" size="sm" @click="updateBlock(index, block, [...block.timings, defaultTiming()])">Add Timing</Button>
      </section>
    </CardContent>
  </Card>
</template>