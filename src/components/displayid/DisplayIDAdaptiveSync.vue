<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdAdaptiveSyncBlock,
  type DisplayIdAdaptiveSyncDescriptor,
  type DisplayIdDataBlock,
  type DisplayIdSection,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { blocksByTag, numberFromEvent, removeArrayItem, updateArrayItem } from '../common/editorUtils'

/**
 * DisplayID 2.0 Adaptive Sync (tag 0x2b) — a list of 6-byte
 * operation-range descriptors (the only defined descriptor length, code 0 in
 * the block flags). Raw fields are edited directly: the 6.2 fixed-point bytes
 * (value = raw / 4 ms) and the 10-bit max refresh rate (Hz = raw + 1) get
 * derived displays next to their inputs; the codec preserves the reserved bits.
 */
const props = defineProps<{ section: DisplayIdSection; index?: number }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

function defaultDescriptor(): DisplayIdAdaptiveSyncDescriptor {
  return {
    range: true,
    successiveFrameIncTolerance: false,
    modes: 0,
    seamlessTransitionNotSupport: false,
    successiveFrameDecTolerance: false,
    maxSingleFrameInc: 0,
    minRefreshRate: 48,
    maxRefreshRateRaw: 143,
    maxSingleFrameDec: 0,
  }
}

function updateBlock(index: number, block: DisplayIdAdaptiveSyncBlock, descriptors: DisplayIdAdaptiveSyncDescriptor[]) {
  emit('updateBlock', index, { ...block, descriptors } as DisplayIdAdaptiveSyncBlock)
}

const MODES_MAX = 3
const MAX_REFRESH_RATE_RAW_MAX = 1023

function updateDescriptor(
  index: number,
  block: DisplayIdAdaptiveSyncBlock,
  descriptorIndex: number,
  patch: Partial<DisplayIdAdaptiveSyncDescriptor>,
) {
  const descriptor = block.descriptors[descriptorIndex]
  if (!descriptor) return
  updateBlock(index, block, updateArrayItem(block.descriptors, descriptorIndex, { ...descriptor, ...patch }))
}

/** Clamp a raw numeric field to its encodable range. */
function clamp(value: number, max: number): number {
  const parsed = Math.round(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.min(max, parsed)) : 0
}

/** Derived display of a 6.2 fixed-point byte: value in ms. */
function fixed62Label(raw: number): string {
  return (raw / 4).toFixed(2)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Adaptive Sync</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <section
        v-for="{ block, index } in blocksByTag<DisplayIdAdaptiveSyncBlock>(props.section, DisplayIdDataBlockTag.AdaptiveSync, props.index)"
        :key="index"
        class="space-y-3"
      >
        <p v-if="block.descriptors.length === 0" class="text-xs text-muted-foreground">
          This block's flags declare an unsupported descriptor length or the payload is not a whole
          number of 6-byte descriptors, so none were decoded (payload preserved verbatim).
        </p>
        <div
          v-for="(descriptor, descriptorIndex) in block.descriptors"
          :key="descriptorIndex"
          class="space-y-3 rounded-md border border-border p-3"
        >
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium">Descriptor {{ descriptorIndex + 1 }}</h4>
            <Button variant="ghost" size="sm" class="text-destructive" @click="updateBlock(index, block, removeArrayItem(block.descriptors, descriptorIndex))">Remove</Button>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Adaptive-sync mode (0–3)</label>
              <Input type="number" min="0" :max="MODES_MAX" :model-value="descriptor.modes" @input="updateDescriptor(index, block, descriptorIndex, { modes: clamp(numberFromEvent($event), MODES_MAX) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Min refresh rate (Hz)</label>
              <Input type="number" min="0" max="255" :model-value="descriptor.minRefreshRate" @input="updateDescriptor(index, block, descriptorIndex, { minRefreshRate: clamp(numberFromEvent($event), 255) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Max refresh rate (Hz; raw = Hz − 1)</label>
              <Input type="number" min="1" :max="MAX_REFRESH_RATE_RAW_MAX + 1" :model-value="descriptor.maxRefreshRateRaw + 1" @input="updateDescriptor(index, block, descriptorIndex, { maxRefreshRateRaw: clamp(numberFromEvent($event) - 1, MAX_REFRESH_RATE_RAW_MAX) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Max single frame increase (6.2; {{ fixed62Label(descriptor.maxSingleFrameInc) }} ms)</label>
              <Input type="number" min="0" max="255" :model-value="descriptor.maxSingleFrameInc" @input="updateDescriptor(index, block, descriptorIndex, { maxSingleFrameInc: clamp(numberFromEvent($event), 255) })" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Max single frame decrease (6.2; {{ fixed62Label(descriptor.maxSingleFrameDec) }} ms)</label>
              <Input type="number" min="0" max="255" :model-value="descriptor.maxSingleFrameDec" @input="updateDescriptor(index, block, descriptorIndex, { maxSingleFrameDec: clamp(numberFromEvent($event), 255) })" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Operation range support</span>
              <Switch :model-value="descriptor.range" @update:model-value="(value: boolean) => updateDescriptor(index, block, descriptorIndex, { range: value })" />
            </label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Successive frame increase tolerance</span>
              <Switch :model-value="descriptor.successiveFrameIncTolerance" @update:model-value="(value: boolean) => updateDescriptor(index, block, descriptorIndex, { successiveFrameIncTolerance: value })" />
            </label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Successive frame decrease tolerance</span>
              <Switch :model-value="descriptor.successiveFrameDecTolerance" @update:model-value="(value: boolean) => updateDescriptor(index, block, descriptorIndex, { successiveFrameDecTolerance: value })" />
            </label>
            <label class="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
              <span>Seamless transition NOT supported</span>
              <Switch :model-value="descriptor.seamlessTransitionNotSupport" @update:model-value="(value: boolean) => updateDescriptor(index, block, descriptorIndex, { seamlessTransitionNotSupport: value })" />
            </label>
          </div>
        </div>
        <!-- Adding into an invalid-flags/misaligned payload would re-encode a
             payload the decoder still refuses, a silent no-op — so the affordance
             only appears for the well-formed and the empty (freshly added) cases. -->
        <Button
          v-if="block.descriptors.length > 0 || block.payload.length === 0"
          variant="outline"
          size="sm"
          @click="updateBlock(index, block, [...block.descriptors, defaultDescriptor()])"
        >
          Add Descriptor
        </Button>
      </section>
    </CardContent>
  </Card>
</template>