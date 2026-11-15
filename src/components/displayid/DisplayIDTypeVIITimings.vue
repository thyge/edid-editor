<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdSection,
  type DisplayIdTypeVIIDetailedTiming,
  type DisplayIdTypeVIIDetailedTimingBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent, removeArrayItem, updateArrayItem } from '../common/editorUtils'
import { useDisplayIdRoom } from './displayIdRoom'

const props = defineProps<{ section: DisplayIdSection; index?: number }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

/** One more 20-byte descriptor must fit the section's 0x70 block. */
const TIMING_BYTES = 20
const room = useDisplayIdRoom()

/** Byte 3 bit 7 is "preferred" before block revision 2 and "YCbCr 4:2:0"
 *  from revision 2 on (edid-decode parse_displayid_type_1_7_timing). */
function hasYcbcr420Flag(block: DisplayIdTypeVIIDetailedTimingBlock): boolean {
  return block.revision >= 2
}

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

function updateBlock(index: number, block: DisplayIdTypeVIIDetailedTimingBlock, timings: DisplayIdTypeVIIDetailedTiming[]) {
  emit('updateBlock', index, { ...block, timings } as DisplayIdTypeVIIDetailedTimingBlock)
}

/**
 * Encodable ranges of the Type VII 20-byte descriptor (DisplayID 2.0 §4.3.1,
 * per the type-vii-timing codec — NOT the 18-byte DTD widths):
 * values are stored with a −1 bias, so the maxima are the raw field widths
 * plus one — pixel clock 24-bit kHz, H/V active/blanking/sync-width 16-bit,
 * sync offsets 15-bit front-porch fields; aspect ratio is 4-bit, stereo 2-bit.
 */
const TYPE_VII_FIELD_MAX = {
  pixelClockKHz: 16_777_216,
  horizontalActive: 65_536,
  horizontalBlanking: 65_536,
  horizontalSyncOffset: 32_768,
  horizontalSyncWidth: 65_536,
  verticalActive: 65_536,
  verticalBlanking: 65_536,
  verticalSyncOffset: 32_768,
  verticalSyncWidth: 65_536,
  aspectRatio: 15,
  stereo: 3,
} as const

type TypeVIINumberField = keyof typeof TYPE_VII_FIELD_MAX

/** Clamp an edited value into the field's encodable range — the model never
 *  receives a value the encoder would silently truncate or wrap (negatives
 *  included, so masking can't wrap −1 into a large positive). */
function clampVII(field: TypeVIINumberField, v: number): number {
  const parsed = Math.round(v)
  return Number.isFinite(parsed) ? Math.max(0, Math.min(TYPE_VII_FIELD_MAX[field], parsed)) : 0
}

/** Update one numeric field of one Type VII timing, clamped to its range. */
function updateTiming(
  index: number,
  block: DisplayIdTypeVIIDetailedTimingBlock,
  timingIndex: number,
  field: TypeVIINumberField,
  value: number,
) {
  const timing = block.timings[timingIndex]
  if (!timing) return
  updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, [field]: clampVII(field, value) }))
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Type VII Detailed Timings</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <section
        v-for="{ block, index } in blocksByTag<DisplayIdTypeVIIDetailedTimingBlock>(props.section, DisplayIdDataBlockTag.TypeVIIDetailedTiming, props.index)"
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
            <Input type="number" min="0" :max="TYPE_VII_FIELD_MAX.pixelClockKHz" :model-value="timing.pixelClockKHz" @input="updateTiming(index, block, timingIndex, 'pixelClockKHz', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_VII_FIELD_MAX.aspectRatio" :model-value="timing.aspectRatio" @input="updateTiming(index, block, timingIndex, 'aspectRatio', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_VII_FIELD_MAX.horizontalActive" :model-value="timing.horizontalActive" @input="updateTiming(index, block, timingIndex, 'horizontalActive', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_VII_FIELD_MAX.horizontalBlanking" :model-value="timing.horizontalBlanking" @input="updateTiming(index, block, timingIndex, 'horizontalBlanking', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_VII_FIELD_MAX.horizontalSyncOffset" :model-value="timing.horizontalSyncOffset" @input="updateTiming(index, block, timingIndex, 'horizontalSyncOffset', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_VII_FIELD_MAX.horizontalSyncWidth" :model-value="timing.horizontalSyncWidth" @input="updateTiming(index, block, timingIndex, 'horizontalSyncWidth', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_VII_FIELD_MAX.verticalActive" :model-value="timing.verticalActive" @input="updateTiming(index, block, timingIndex, 'verticalActive', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_VII_FIELD_MAX.verticalBlanking" :model-value="timing.verticalBlanking" @input="updateTiming(index, block, timingIndex, 'verticalBlanking', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_VII_FIELD_MAX.verticalSyncOffset" :model-value="timing.verticalSyncOffset" @input="updateTiming(index, block, timingIndex, 'verticalSyncOffset', numberFromEvent($event))" />
            <Input type="number" min="0" :max="TYPE_VII_FIELD_MAX.verticalSyncWidth" :model-value="timing.verticalSyncWidth" @input="updateTiming(index, block, timingIndex, 'verticalSyncWidth', numberFromEvent($event))" />
          </div>
          <div class="grid grid-cols-3 gap-3">
            <label v-if="hasYcbcr420Flag(block)" class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50" title="Block revision 2+: byte 3 bit 7 means YCbCr 4:2:0 support">
              <span>YCbCr 4:2:0</span>
              <Switch :model-value="timing.ycbcr420 === true" @update:model-value="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, ycbcr420: value }))" />
            </label>
            <label v-else class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Preferred</span>
              <Switch :model-value="timing.preferred" @update:model-value="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, preferred: value }))" />
            </label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Interlaced</span>
              <Switch :model-value="timing.interlaced" @update:model-value="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, interlaced: value }))" />
            </label>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">3D Stereo (0–3)</label>
              <Input type="number" min="0" :max="TYPE_VII_FIELD_MAX.stereo" :model-value="timing.stereo" @input="updateTiming(index, block, timingIndex, 'stereo', numberFromEvent($event))" />
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
        <Button
          variant="outline"
          size="sm"
          :disabled="!room.fits(TIMING_BYTES)"
          :title="room.fits(TIMING_BYTES) ? undefined : room.noRoomTitle(TIMING_BYTES)"
          @click="updateBlock(index, block, [...block.timings, defaultTiming()])"
        >
          Add Timing
        </Button>
      </section>
    </CardContent>
  </Card>
</template>
