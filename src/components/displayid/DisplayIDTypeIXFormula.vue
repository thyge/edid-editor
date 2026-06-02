<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdExtensionBlock,
  type DisplayIdTypeIXFormulaBasedTiming,
  type DisplayIdTypeIXFormulaBasedTimingBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent, removeArrayItem, updateArrayItem } from './displayIdEditorUtils'

const props = defineProps<{ displayId: DisplayIdExtensionBlock }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

function defaultTiming(): DisplayIdTypeIXFormulaBasedTiming {
  return {
    horizontalActive: 1920,
    verticalActive: 1080,
    refreshRateHz: 60,
    preferred: false,
    reducedBlanking: true,
  }
}

function updateBlock(index: number, block: DisplayIdTypeIXFormulaBasedTimingBlock, timings: DisplayIdTypeIXFormulaBasedTiming[]) {
  emit('updateBlock', index, { ...block, timings } as DisplayIdTypeIXFormulaBasedTimingBlock)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Type IX Formula Timings</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <section
        v-for="{ block, index } in blocksByTag<DisplayIdTypeIXFormulaBasedTimingBlock>(props.displayId, DisplayIdDataBlockTag.TypeIXFormulaBasedTiming)"
        :key="index"
        class="space-y-3"
      >
        <div v-for="(timing, timingIndex) in block.timings" :key="timingIndex" class="space-y-3 rounded-md border border-border p-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium">Timing {{ timingIndex + 1 }}</h4>
            <Button variant="ghost" size="sm" class="text-destructive" @click="updateBlock(index, block, removeArrayItem(block.timings, timingIndex))">Remove</Button>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <Input type="number" :model-value="timing.horizontalActive" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, horizontalActive: numberFromEvent($event) }))" />
            <Input type="number" :model-value="timing.verticalActive" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, verticalActive: numberFromEvent($event) }))" />
            <Input type="number" :model-value="timing.refreshRateHz" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, refreshRateHz: numberFromEvent($event) }))" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Preferred</span>
              <Switch :checked="timing.preferred" @update:checked="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, preferred: value }))" />
            </label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Reduced Blanking</span>
              <Switch :checked="timing.reducedBlanking" @update:checked="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, reducedBlanking: value }))" />
            </label>
          </div>
        </div>
        <Button variant="outline" size="sm" @click="updateBlock(index, block, [...block.timings, defaultTiming()])">Add Timing</Button>
      </section>
    </CardContent>
  </Card>
</template>
