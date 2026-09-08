<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  DISPLAY_ID_TIMING_CODE_TYPE_LABELS,
  type DisplayIdDataBlock,
  type DisplayIdSection,
  type DisplayIdTypeVIIIEnumeratedTimingCodeBlock,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { blocksByTag, numberFromEvent, removeArrayItem, updateArrayItem } from '../common/editorUtils'

const props = defineProps<{ section: DisplayIdSection; index?: number }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

// Timing-code-type labels are the shared DISPLAY_ID_TIMING_CODE_TYPE_LABELS
// (types.ts) — the same 2-bit code is used by the Stereo Display Interface
// 3D Timing Descriptor, so both components consume one lib export.

function updateBlock(index: number, block: DisplayIdTypeVIIIEnumeratedTimingCodeBlock, timingCodes: number[]) {
  emit('updateBlock', index, { ...block, timingCodes } as DisplayIdTypeVIIIEnumeratedTimingCodeBlock)
}

/** The code type (2 bits) and code size (bit 0) live in the block header flags
 *  byte, which the header encoder round-trips — patch them alongside the
 *  decoded fields so decode stays in sync (Type VIII codec: codeType =
 *  (flags >> 3) & 0x03, codeSize = flags & 1). */
function updateCodeType(index: number, block: DisplayIdTypeVIIIEnumeratedTimingCodeBlock, codeType: number) {
  emit('updateBlock', index, {
    ...block,
    codeType,
    flags: (block.flags & ~0x18) | (codeType << 3),
  } as DisplayIdTypeVIIIEnumeratedTimingCodeBlock)
}

/** Switching to 1-byte codes clamps existing values into the 8-bit encodable
 *  range instead of letting the encoder silently truncate them (TASK-107
 *  convention); the inputs immediately show the clamped values. */
function updateCodeSize(index: number, block: DisplayIdTypeVIIIEnumeratedTimingCodeBlock, codeSize: number) {
  const clamped = codeSize === 1
    ? block.timingCodes.map(code => Math.min(255, Math.max(0, code)))
    : block.timingCodes
  emit('updateBlock', index, {
    ...block,
    codeSize,
    flags: codeSize === 2 ? (block.flags | 0x01) : (block.flags & ~0x01),
    timingCodes: clamped,
  } as DisplayIdTypeVIIIEnumeratedTimingCodeBlock)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Type VIII Enumerated Timings</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <section
        v-for="{ block, index } in blocksByTag<DisplayIdTypeVIIIEnumeratedTimingCodeBlock>(props.section, DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode, props.index)"
        :key="index"
        class="space-y-3"
      >
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Timing code type</label>
            <select
              :value="block.codeType"
              class="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              @change="updateCodeType(index, block, numberFromEvent($event))"
            >
              <option v-for="(label, value) in DISPLAY_ID_TIMING_CODE_TYPE_LABELS" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Code size (bytes)</label>
            <select
              :value="block.codeSize"
              class="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              @change="updateCodeSize(index, block, numberFromEvent($event))"
            >
              <option :value="1">1</option>
              <option :value="2">2</option>
            </select>
          </div>
        </div>
        <div v-for="(code, codeIndex) in block.timingCodes" :key="codeIndex" class="flex items-center gap-2">
          <Input type="number" min="0" :max="block.codeSize === 2 ? 65535 : 255" :model-value="code" @input="updateBlock(index, block, updateArrayItem(block.timingCodes, codeIndex, numberFromEvent($event)))" />
          <Button variant="ghost" size="sm" class="text-destructive" @click="updateBlock(index, block, removeArrayItem(block.timingCodes, codeIndex))">Remove</Button>
        </div>
        <Button variant="outline" size="sm" @click="updateBlock(index, block, [...block.timingCodes, 0])">Add Code</Button>
      </section>
    </CardContent>
  </Card>
</template>