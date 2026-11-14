<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, RoomConfigurationDataBlock } from 'edidts'
import { SPEAKER_ALLOCATION_BITS } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { findExtendedDataBlockIndex } from '../common/editorUtils'
import { ctaAddBlockedReason } from './blockCapacity'

/**
 * Room Configuration Data Block editor (tag 0x07 ext 0x13). Layout per
 * edid-decode `cta_rcdb`: Display/Speaker/SLD flags + speaker count, a
 * 24-bit speaker presence mask (same bit order as the Speaker Allocation
 * block), then optional Xmax/Ymax/Zmax (dm) and Display X/Y/Z (fractions of
 * the max).
 */
const props = defineProps<{ cea: CEAExtensionBlock }>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

const blockIndex = computed(() => findExtendedDataBlockIndex(props.cea, 0x13))
const block = computed(() =>
  props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x13
  ) as RoomConfigurationDataBlock | undefined
)

/** Each optional coordinate triple adds 3 bytes. */
const addTripleBlockedReason = computed(() => ctaAddBlockedReason(props.cea, block.value, 3))

function emitField(field: string, value: unknown) {
  if (!block.value) return
  emit('update', `dataBlocks.${blockIndex.value}.${field}`, value)
}

function clampNumber(v: string | number, min: number, max: number, step = 1): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.round(n / step) * step))
}

function onSpeakerCount(v: string | number) {
  emitField('speakerCount', clampNumber(v, 1, 32))
}

function toggleMaskBit(bit: number, on: boolean) {
  if (!block.value) return
  const mask = block.value.speakerPresenceMask
  emitField('speakerPresenceMask', on ? mask | (1 << bit) : mask & ~(1 << bit))
}

type Triple = { x: number; y: number; z: number }

/** Xmax/Ymax/Zmax are bytes in decimeters. */
function onMax(axis: keyof Triple, v: string | number) {
  if (!block.value?.max) return
  emitField('max', { ...block.value.max, [axis]: clampNumber(v, 0, 255) })
}

/** Display X/Y/Z are signed 1.6 fixed point: −2 … +1.984 in steps of 1/64. */
function onDisplay(axis: keyof Triple, v: string | number) {
  if (!block.value?.displayPosition) return
  emitField('displayPosition', { ...block.value.displayPosition, [axis]: clampNumber(v, -2, 127 / 64, 1 / 64) })
}

function addMax() {
  if (addTripleBlockedReason.value) return
  emitField('max', { x: 0, y: 0, z: 0 })
}
function addDisplay() {
  if (addTripleBlockedReason.value) return
  emitField('displayPosition', { x: 0, y: 0, z: 0 })
}
function removeMax() {
  // Display X/Y/Z sit after Xmax/Ymax/Zmax on the wire, so they go too.
  emitField('displayPosition', undefined)
  emitField('max', undefined)
}
function removeDisplay() {
  emitField('displayPosition', undefined)
}

const labelClass = 'flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'
const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-1.5'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Room Configuration <span class="text-xs text-muted-foreground font-normal">(ext 0x13)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <p v-if="!block" class="text-muted-foreground">No Room Configuration Data Block present.</p>
      <template v-else>
        <div class="grid grid-cols-2 gap-x-6 gap-y-1">
          <div :class="rowClass">
            <span>Speaker count valid</span>
            <Switch :model-value="block.speaker" @update:model-value="(v: boolean) => emitField('speaker', v)" />
          </div>
          <label :class="labelClass">
            Speaker Count (1–32)
            <Input type="number" :min="1" :max="32" :step="1" :model-value="block.speakerCount" @update:model-value="onSpeakerCount" />
          </label>
          <div :class="rowClass">
            <span>Speaker Location block present (SLD)</span>
            <Switch :model-value="block.sld" @update:model-value="(v: boolean) => emitField('sld', v)" />
          </div>
          <div :class="rowClass">
            <span>Display coordinates valid</span>
            <Switch :model-value="block.display" @update:model-value="(v: boolean) => emitField('display', v)" />
          </div>
        </div>

        <div>
          <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Speaker Presence Mask</p>
          <div class="grid grid-cols-4 gap-x-4 gap-y-1">
            <label
              v-for="(bit, i) in SPEAKER_ALLOCATION_BITS"
              :key="bit.key"
              class="flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Switch
                :model-value="(block.speakerPresenceMask & (1 << i)) !== 0"
                @update:model-value="(v: boolean) => toggleMaskBit(i, v)"
              />
              <span>{{ bit.label }}</span>
            </label>
          </div>
        </div>

        <div class="border-t pt-3 space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-[11px] uppercase tracking-wide text-muted-foreground">Room size (Xmax / Ymax / Zmax, dm)</p>
            <Button v-if="block.max" variant="ghost" size="sm" class="h-7 px-2" @click="removeMax">Remove</Button>
          </div>
          <div v-if="block.max" class="grid grid-cols-3 gap-2">
            <label v-for="axis in (['x', 'y', 'z'] as const)" :key="axis" :class="labelClass">
              {{ axis.toUpperCase() }}max
              <Input type="number" :min="0" :max="255" :step="1" :model-value="block.max[axis]" @update:model-value="(v) => onMax(axis, v)" />
            </label>
          </div>
          <div v-else :title="addTripleBlockedReason ?? undefined">
            <Button variant="outline" size="sm" :disabled="addTripleBlockedReason !== null" @click="addMax">Add room size</Button>
          </div>
        </div>

        <div v-if="block.max" class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-[11px] uppercase tracking-wide text-muted-foreground">Display position (× max, −2 … 1.98)</p>
            <Button v-if="block.displayPosition" variant="ghost" size="sm" class="h-7 px-2" @click="removeDisplay">Remove</Button>
          </div>
          <div v-if="block.displayPosition" class="grid grid-cols-3 gap-2">
            <label v-for="axis in (['x', 'y', 'z'] as const)" :key="axis" :class="labelClass">
              Display {{ axis.toUpperCase() }}
              <Input type="number" :min="-2" :max="1.984375" :step="0.015625" :model-value="block.displayPosition[axis]" @update:model-value="(v) => onDisplay(axis, v)" />
            </label>
          </div>
          <div v-else :title="addTripleBlockedReason ?? undefined">
            <Button variant="outline" size="sm" :disabled="addTripleBlockedReason !== null" @click="addDisplay">Add display position</Button>
          </div>
        </div>
        <p v-if="addTripleBlockedReason && (!block.max || !block.displayPosition)" class="text-xs text-muted-foreground">
          {{ addTripleBlockedReason }}
        </p>
      </template>
    </CardContent>
  </Card>
</template>
