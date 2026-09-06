<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdDynamicVideoTimingRangeLimitsBlock,
  type DisplayIdExtension,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent } from '../common/editorUtils'

const props = defineProps<{ displayId: DisplayIdExtension }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

function update(index: number, block: DisplayIdDynamicVideoTimingRangeLimitsBlock, patch: Partial<DisplayIdDynamicVideoTimingRangeLimitsBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}
</script>

<template>
  <Card>
    <CardHeader><CardTitle>Dynamic Range Limits</CardTitle></CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div v-for="{ block, index } in blocksByTag<DisplayIdDynamicVideoTimingRangeLimitsBlock>(props.displayId, DisplayIdDataBlockTag.DynamicVideoTimingRangeLimits)" :key="index" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <Input type="number" :model-value="block.minimumPixelClockKHz" @input="update(index, block, { minimumPixelClockKHz: numberFromEvent($event) })" />
          <Input type="number" :model-value="block.maximumPixelClockKHz" @input="update(index, block, { maximumPixelClockKHz: numberFromEvent($event) })" />
          <Input type="number" :model-value="block.minimumHorizontalFrequencyHz" @input="update(index, block, { minimumHorizontalFrequencyHz: numberFromEvent($event) })" />
          <Input type="number" :model-value="block.maximumHorizontalFrequencyHz" @input="update(index, block, { maximumHorizontalFrequencyHz: numberFromEvent($event) })" />
          <Input type="number" :model-value="block.minimumVerticalFrequencyHz" @input="update(index, block, { minimumVerticalFrequencyHz: numberFromEvent($event) })" />
          <Input type="number" :model-value="block.maximumVerticalFrequencyHz" @input="update(index, block, { maximumVerticalFrequencyHz: numberFromEvent($event) })" />
        </div>
        <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
          <span>Seamless Dynamic Video Timing</span>
          <Switch :model-value="block.seamlessDynamicVideoTiming" @update:model-value="(value: boolean) => update(index, block, { seamlessDynamicVideoTiming: value })" />
        </label>
      </div>
    </CardContent>
  </Card>
</template>
