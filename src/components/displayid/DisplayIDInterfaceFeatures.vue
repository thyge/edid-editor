<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdDisplayInterfaceFeaturesBlock,
  type DisplayIdExtensionBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { blocksByTag } from './displayIdEditorUtils'

const props = defineProps<{ displayId: DisplayIdExtensionBlock }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()
const depths = [6, 8, 10, 12]

function update(index: number, block: DisplayIdDisplayInterfaceFeaturesBlock, patch: Partial<DisplayIdDisplayInterfaceFeaturesBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}

function toggleDepth(block: DisplayIdDisplayInterfaceFeaturesBlock, depth: number, enabled: boolean): number[] {
  const next = enabled
    ? [...new Set([...block.supportedColorDepths, depth])]
    : block.supportedColorDepths.filter(value => value !== depth)
  return next.sort((a, b) => a - b)
}
</script>

<template>
  <Card>
    <CardHeader><CardTitle>Display Interface Features</CardTitle></CardHeader>
    <CardContent class="space-y-6 text-sm">
      <div v-for="{ block, index } in blocksByTag<DisplayIdDisplayInterfaceFeaturesBlock>(props.displayId, DisplayIdDataBlockTag.DisplayInterfaceFeatures)" :key="index" class="space-y-5">
        <section class="grid grid-cols-4 gap-3">
          <label v-for="depth in depths" :key="depth" class="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted/50">
            <Checkbox :model-value="block.supportedColorDepths.includes(depth)" @update:model-value="(value: boolean | 'indeterminate') => update(index, block, { supportedColorDepths: toggleDepth(block, depth, value === true) })" />
            <span>{{ depth }} bpc</span>
          </label>
        </section>
        <section class="grid grid-cols-2 gap-3">
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>RGB 4:4:4</span><Switch :checked="block.rgb444" @update:checked="(value: boolean) => update(index, block, { rgb444: value })" /></label>
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>YCbCr 4:4:4</span><Switch :checked="block.ycbcr444" @update:checked="(value: boolean) => update(index, block, { ycbcr444: value })" /></label>
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>YCbCr 4:2:2</span><Switch :checked="block.ycbcr422" @update:checked="(value: boolean) => update(index, block, { ycbcr422: value })" /></label>
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>YCbCr 4:2:0</span><Switch :checked="block.ycbcr420" @update:checked="(value: boolean) => update(index, block, { ycbcr420: value })" /></label>
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Audio On Interface</span><Switch :checked="block.audioOnInterface" @update:checked="(value: boolean) => update(index, block, { audioOnInterface: value })" /></label>
          <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"><span>Content Protection</span><Switch :checked="block.contentProtection" @update:checked="(value: boolean) => update(index, block, { contentProtection: value })" /></label>
        </section>
      </div>
    </CardContent>
  </Card>
</template>
