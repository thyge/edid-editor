<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  DISPLAY_ID_TIMING_CODE_TYPE_LABELS,
  type DisplayIdDataBlock,
  type DisplayIdExtension,
  type DisplayIdTypeVIIIEnumeratedTimingCodeBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { blocksByTag, numberFromEvent, removeArrayItem, updateArrayItem } from './displayIdEditorUtils'

const props = defineProps<{ displayId: DisplayIdExtension }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

// Timing-code-type labels are the shared DISPLAY_ID_TIMING_CODE_TYPE_LABELS
// (types.ts) — the same 2-bit code is used by the Stereo Display Interface
// 3D Timing Descriptor, so both components consume one lib export.

function updateBlock(index: number, block: DisplayIdTypeVIIIEnumeratedTimingCodeBlock, timingCodes: number[]) {
  emit('updateBlock', index, { ...block, timingCodes } as DisplayIdTypeVIIIEnumeratedTimingCodeBlock)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Type VIII Enumerated Timings</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <section
        v-for="{ block, index } in blocksByTag<DisplayIdTypeVIIIEnumeratedTimingCodeBlock>(props.displayId, DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode)"
        :key="index"
        class="space-y-3"
      >
        <p class="text-xs text-muted-foreground">
          Code type: {{ DISPLAY_ID_TIMING_CODE_TYPE_LABELS[block.codeType] ?? block.codeType }}
          ({{ block.codeSize }}-byte codes)
        </p>
        <div v-for="(code, codeIndex) in block.timingCodes" :key="codeIndex" class="flex items-center gap-2">
          <Input type="number" min="0" :max="block.codeSize === 2 ? 65535 : 255" :model-value="code" @input="updateBlock(index, block, updateArrayItem(block.timingCodes, codeIndex, numberFromEvent($event)))" />
          <Button variant="ghost" size="sm" class="text-destructive" @click="updateBlock(index, block, removeArrayItem(block.timingCodes, codeIndex))">Remove</Button>
        </div>
        <Button variant="outline" size="sm" @click="updateBlock(index, block, [...block.timingCodes, 0])">Add Code</Button>
      </section>
    </CardContent>
  </Card>
</template>
