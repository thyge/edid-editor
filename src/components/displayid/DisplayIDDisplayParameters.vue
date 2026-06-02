<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdDisplayParametersBlock,
  type DisplayIdExtensionBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent } from './displayIdEditorUtils'

const props = defineProps<{
  displayId: DisplayIdExtensionBlock
}>()

const emit = defineEmits<{
  updateBlock: [index: number, block: DisplayIdDataBlock]
}>()

function update(index: number, block: DisplayIdDisplayParametersBlock, patch: Partial<DisplayIdDisplayParametersBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Display Parameters</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <div
        v-for="{ block, index } in blocksByTag<DisplayIdDisplayParametersBlock>(props.displayId, DisplayIdDataBlockTag.DisplayParameters)"
        :key="index"
        class="space-y-6"
      >
        <section class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Horizontal Size (mm)</label>
            <Input type="number" min="0" max="65535" :model-value="block.horizontalImageSizeMm" @input="update(index, block, { horizontalImageSizeMm: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Vertical Size (mm)</label>
            <Input type="number" min="0" max="65535" :model-value="block.verticalImageSizeMm" @input="update(index, block, { verticalImageSizeMm: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Native Bit Depth</label>
            <Input type="number" min="0" max="255" :model-value="block.nativeColorBitDepth" @input="update(index, block, { nativeColorBitDepth: numberFromEvent($event) })" />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Dynamic Range</label>
            <Input type="number" min="0" max="255" :model-value="block.dynamicRange" @input="update(index, block, { dynamicRange: numberFromEvent($event) })" />
          </div>
        </section>

        <section class="grid grid-cols-2 gap-x-6 gap-y-2">
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
            <span>Audio Support</span>
            <Switch :checked="block.audioSupport" @update:checked="(value: boolean) => update(index, block, { audioSupport: value })" />
          </label>
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
            <span>Separate Audio Inputs</span>
            <Switch :checked="block.separateAudioInputs" @update:checked="(value: boolean) => update(index, block, { separateAudioInputs: value })" />
          </label>
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
            <span>Fixed Pixel Format</span>
            <Switch :checked="block.fixedPixelFormat" @update:checked="(value: boolean) => update(index, block, { fixedPixelFormat: value })" />
          </label>
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
            <span>Fixed Timing</span>
            <Switch :checked="block.fixedTiming" @update:checked="(value: boolean) => update(index, block, { fixedTiming: value })" />
          </label>
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
            <span>Deinterlacing</span>
            <Switch :checked="block.deinterlacing" @update:checked="(value: boolean) => update(index, block, { deinterlacing: value })" />
          </label>
        </section>
      </div>
    </CardContent>
  </Card>
</template>
