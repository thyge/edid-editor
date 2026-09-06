<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdExtension,
  type DisplayIdTypeIXFormulaBasedTiming,
  type DisplayIdTypeIXFormulaBasedTimingBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent, removeArrayItem, updateArrayItem } from '../common/editorUtils'

const props = defineProps<{ displayId: DisplayIdExtension }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

function defaultTiming(): DisplayIdTypeIXFormulaBasedTiming {
  return {
    formula: 1,
    ntscPullDown: false,
    stereo: 0,
    horizontalActive: 1920,
    verticalActive: 1080,
    refreshRateHz: 60,
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
          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Formula (0=std, 1=RB v1, 2=RB v2)</label>
              <Input type="number" min="0" max="7" :model-value="timing.formula" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, formula: numberFromEvent($event) }))" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">3D Stereo (0–3)</label>
              <Input type="number" min="0" max="3" :model-value="timing.stereo" @input="updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, stereo: numberFromEvent($event) }))" />
            </div>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>NTSC Pull-down</span>
              <Switch :model-value="timing.ntscPullDown" @update:model-value="(value: boolean) => updateBlock(index, block, updateArrayItem(block.timings, timingIndex, { ...timing, ntscPullDown: value }))" />
            </label>
          </div>
        </div>
        <Button variant="outline" size="sm" @click="updateBlock(index, block, [...block.timings, defaultTiming()])">Add Timing</Button>
      </section>
    </CardContent>
  </Card>
</template>
