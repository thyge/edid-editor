<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdExtensionBlock,
  type DisplayIdStereoDisplayInterfaceBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { blocksByTag } from './displayIdEditorUtils'

const props = defineProps<{ displayId: DisplayIdExtensionBlock }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()
const stereoTypes = Array.from({ length: 8 }, (_, index) => index)

function update(index: number, block: DisplayIdStereoDisplayInterfaceBlock, patch: Partial<DisplayIdStereoDisplayInterfaceBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}
</script>

<template>
  <Card>
    <CardHeader><CardTitle>Stereo Display Interface</CardTitle></CardHeader>
    <CardContent class="space-y-5 text-sm">
      <div v-for="{ block, index } in blocksByTag<DisplayIdStereoDisplayInterfaceBlock>(props.displayId, DisplayIdDataBlockTag.StereoDisplayInterface)" :key="index" class="space-y-5">
        <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
          <span>Stereo Supported</span>
          <Switch :checked="block.stereoSupported" @update:checked="(value: boolean) => update(index, block, { stereoSupported: value })" />
        </label>
        <div class="grid grid-cols-4 gap-3">
          <label v-for="type in stereoTypes" :key="type" class="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted/50">
            <Checkbox
              :model-value="block.stereoTypes.includes(type)"
              @update:model-value="(value: boolean | 'indeterminate') => update(index, block, { stereoTypes: value === true ? [...new Set([...block.stereoTypes, type])].sort((a, b) => a - b) : block.stereoTypes.filter(item => item !== type) })"
            />
            <span>Type {{ type }}</span>
          </label>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
