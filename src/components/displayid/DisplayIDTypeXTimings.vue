<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdSection,
  type DisplayIdTypeXTimingBlock,
  type DisplayIdTypeXTimingDescriptor,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent, removeArrayItem, updateArrayItem } from '../common/editorUtils'
import { useDisplayIdRoom } from './displayIdRoom'

/**
 * DisplayID 2.0 Type X Timing (tag 0x2a) — a list of compact
 * formula-argument descriptors whose size (6–8 bytes) is carried in the block
 * flags; the codec (edidts type-x-timing.ts) stores `descriptorSize` decoded.
 * Fields beyond byte 5 only exist for the larger descriptor sizes; they render
 * only when the flags say they are present on the wire.
 */
const props = defineProps<{ section: DisplayIdSection; index?: number }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

function defaultTiming(): DisplayIdTypeXTimingDescriptor {
  return {
    timingFormula: 0,
    earlyVsync: false,
    rr1000div1001OrHblank: false,
    stereoSupport: 0,
    ycc420Support: false,
    horizontalActivePixels: 1920,
    verticalActiveLines: 1080,
    refreshRate: 60,
    deltaHblank: 0,
    additionalVblankTiming: 0,
    additionalMiniVblank: false,
  }
}

function updateBlock(index: number, block: DisplayIdTypeXTimingBlock, timings: DisplayIdTypeXTimingDescriptor[]) {
  emit('updateBlock', index, { ...block, timings } as DisplayIdTypeXTimingBlock)
}

/**
 * Field ranges per the codec. Active sizes and the refresh rate are stored
 * minus one (edid-decode: hact = 1 + raw, refresh = 1 + raw), so they run
 * from 1; the refresh rate has 8 bits in 6-byte descriptors and 10 bits in
 * 7/8-byte ones.
 */
const FIELD_MIN = {
  horizontalActivePixels: 1,
  verticalActiveLines: 1,
  refreshRate: 1,
  timingFormula: 0,
  stereoSupport: 0,
  deltaHblank: 0,
  additionalVblankTiming: 0,
} as const

type NumberField = keyof typeof FIELD_MIN

function fieldMax(field: NumberField, block: DisplayIdTypeXTimingBlock): number {
  switch (field) {
    case 'horizontalActivePixels':
    case 'verticalActiveLines':
      return 65_536
    case 'refreshRate':
      return block.descriptorSize >= 7 ? 1024 : 256
    case 'timingFormula':
    case 'deltaHblank':
    case 'additionalVblankTiming':
      return 7
    case 'stereoSupport':
      return 3
  }
}

function clampField(field: NumberField, block: DisplayIdTypeXTimingBlock, value: number): number {
  const parsed = Math.round(value)
  return Number.isFinite(parsed) ? Math.max(FIELD_MIN[field], Math.min(fieldMax(field, block), parsed)) : FIELD_MIN[field]
}

function updateTiming(
  index: number,
  block: DisplayIdTypeXTimingBlock,
  timingIndex: number,
  field: NumberField,
  value: number,
) {
  const timing = block.timings[timingIndex]
  if (!timing) return
  updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, [field]: clampField(field, block, value) }))
}

/** One more descriptor (6–8 bytes) must fit the section's 0x70 block. */
const room = useDisplayIdRoom()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Type X Timings</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <section
        v-for="{ block, index } in blocksByTag<DisplayIdTypeXTimingBlock>(props.section, DisplayIdDataBlockTag.TypeXTiming, props.index)"
        :key="index"
        class="space-y-3"
      >
        <p v-if="block.timings.length === 0 && block.payload.length > 0" class="text-xs text-muted-foreground">
          This block's flags declare an unsupported descriptor size or a payload that is not a whole
          number of descriptors, so no timings were decoded (payload preserved verbatim).
        </p>
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
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">H active (px)</label>
              <Input type="number" :min="FIELD_MIN.horizontalActivePixels" :max="fieldMax('horizontalActivePixels', block)" :model-value="timing.horizontalActivePixels" @input="updateTiming(index, block, timingIndex, 'horizontalActivePixels', numberFromEvent($event))" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">V active (lines)</label>
              <Input type="number" :min="FIELD_MIN.verticalActiveLines" :max="fieldMax('verticalActiveLines', block)" :model-value="timing.verticalActiveLines" @input="updateTiming(index, block, timingIndex, 'verticalActiveLines', numberFromEvent($event))" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Refresh rate (Hz, 1–{{ fieldMax('refreshRate', block) }})</label>
              <Input type="number" :min="FIELD_MIN.refreshRate" :max="fieldMax('refreshRate', block)" :model-value="timing.refreshRate" @input="updateTiming(index, block, timingIndex, 'refreshRate', numberFromEvent($event))" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Timing formula (0–7)</label>
              <Input type="number" :min="FIELD_MIN.timingFormula" :max="fieldMax('timingFormula', block)" :model-value="timing.timingFormula" @input="updateTiming(index, block, timingIndex, 'timingFormula', numberFromEvent($event))" />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Early vsync</span>
              <Switch :model-value="timing.earlyVsync" @update:model-value="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, earlyVsync: value }))" />
            </label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>1000/1001 rate or H-blank</span>
              <Switch :model-value="timing.rr1000div1001OrHblank" @update:model-value="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, rr1000div1001OrHblank: value }))" />
            </label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>YCC 4:2:0 support</span>
              <Switch :model-value="timing.ycc420Support" @update:model-value="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, ycc420Support: value }))" />
            </label>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">3D stereo support (0–3)</label>
              <Input type="number" min="0" :max="fieldMax('stereoSupport', block)" :model-value="timing.stereoSupport" @input="updateTiming(index, block, timingIndex, 'stereoSupport', numberFromEvent($event))" />
            </div>
            <!-- Extended fields only exist on the wire for the larger descriptor
                 sizes (flags-derived); editing them when absent would change
                 the payload length, so they stay hidden. -->
            <template v-if="block.descriptorSize >= 7">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Delta H-blank (0–7)</label>
                <Input type="number" min="0" :max="fieldMax('deltaHblank', block)" :model-value="timing.deltaHblank" @input="updateTiming(index, block, timingIndex, 'deltaHblank', numberFromEvent($event))" />
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Additional V-blank timing (0–7)</label>
                <Input type="number" min="0" :max="fieldMax('additionalVblankTiming', block)" :model-value="timing.additionalVblankTiming" @input="updateTiming(index, block, timingIndex, 'additionalVblankTiming', numberFromEvent($event))" />
              </div>
            </template>
            <label v-if="block.descriptorSize >= 8" class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Additional mini V-blank</span>
              <Switch :model-value="timing.additionalMiniVblank" @update:model-value="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, additionalMiniVblank: value }))" />
            </label>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="!room.fits(block.descriptorSize)"
          :title="room.fits(block.descriptorSize) ? undefined : room.noRoomTitle(block.descriptorSize)"
          @click="updateBlock(index, block, [...block.timings, defaultTiming()])"
        >
          Add Timing
        </Button>
      </section>
    </CardContent>
  </Card>
</template>