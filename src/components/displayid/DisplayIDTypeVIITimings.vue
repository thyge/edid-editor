<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdExtension,
  type DisplayIdTypeVIIDetailedTiming,
  type DisplayIdTypeVIIDetailedTimingBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent, removeArrayItem, updateArrayItem } from './displayIdEditorUtils'

const props = defineProps<{ displayId: DisplayIdExtension }>()
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

function updateBlock(index: number, block: DisplayIdTypeVIIDetailedTimingBlock, timings: DisplayIdTypeVIIDetailedTiming[]) {
  emit('updateBlock', index, { ...block, timings } as DisplayIdTypeVIIDetailedTimingBlock)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Type VII Detailed Timings</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <section
        v-for="{ block, index } in blocksByTag<DisplayIdTypeVIIDetailedTimingBlock>(props.displayId, DisplayIdDataBlockTag.TypeVIIDetailedTiming)"
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
            <Input type="number" :model-value="timing.pixelClockKHz" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, pixelClockKHz: numberFromEvent($event) }))" />
            <Input type="number" min="0" max="15" :model-value="timing.aspectRatio" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, aspectRatio: numberFromEvent($event) }))" />
            <Input type="number" :model-value="timing.horizontalActive" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, horizontalActive: numberFromEvent($event) }))" />
            <Input type="number" :model-value="timing.horizontalBlanking" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, horizontalBlanking: numberFromEvent($event) }))" />
            <Input type="number" :model-value="timing.horizontalSyncOffset" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, horizontalSyncOffset: numberFromEvent($event) }))" />
            <Input type="number" :model-value="timing.horizontalSyncWidth" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, horizontalSyncWidth: numberFromEvent($event) }))" />
            <Input type="number" :model-value="timing.verticalActive" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, verticalActive: numberFromEvent($event) }))" />
            <Input type="number" :model-value="timing.verticalBlanking" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, verticalBlanking: numberFromEvent($event) }))" />
            <Input type="number" :model-value="timing.verticalSyncOffset" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, verticalSyncOffset: numberFromEvent($event) }))" />
            <Input type="number" :model-value="timing.verticalSyncWidth" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, verticalSyncWidth: numberFromEvent($event) }))" />
          </div>
          <div class="grid grid-cols-3 gap-3">
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Preferred</span>
              <Switch :checked="timing.preferred" @update:checked="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, preferred: value }))" />
            </label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Interlaced</span>
              <Switch :checked="timing.interlaced" @update:checked="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, interlaced: value }))" />
            </label>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">3D Stereo (0–3)</label>
              <Input type="number" min="0" max="3" :model-value="timing.stereo" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, stereo: numberFromEvent($event) }))" />
            </div>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Hsync +</span>
              <Switch :checked="timing.horizontalSyncPolarity" @update:checked="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, horizontalSyncPolarity: value }))" />
            </label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Vsync +</span>
              <Switch :checked="timing.verticalSyncPolarity" @update:checked="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, verticalSyncPolarity: value }))" />
            </label>
          </div>
        </div>
        <Button variant="outline" size="sm" @click="updateBlock(index, block, [...block.timings, defaultTiming()])">Add Timing</Button>
      </section>
    </CardContent>
  </Card>
</template>
