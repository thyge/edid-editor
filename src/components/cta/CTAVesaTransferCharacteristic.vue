<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, VESADisplayTransferCharacteristicBlock } from 'edidts'
import { ExtensionBlockParser, VESA_TRANSFER_POINT_COUNTS, VESA_TRANSFER_TYPE_OPTIONS, makeVesaTransferCurve } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { updateArrayItem, findDataBlockIndex } from '../common/editorUtils'

const props = defineProps<{ cea: CEAExtensionBlock }>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

const blockIndex = computed(() => findDataBlockIndex(props.cea, 0x05))
const block = computed(() =>
  props.cea.dataBlocks.find(b => b.tag === 0x05) as VESADisplayTransferCharacteristicBlock | undefined
)

const selectClass =
  'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
const labelClass = 'flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'

// Each stored point can only move within what its byte can express: the
// first point is 0–63, and every later point is 0–255 above the one before.
function pointBounds(i: number): { min: number; max: number } {
  const points = block.value?.points ?? []
  if (i === 0) return { min: 0, max: 63 }
  const previous = points[i - 1] ?? 0
  return { min: previous, max: previous + 255 }
}

function setPoint(i: number, v: string | number) {
  if (!block.value) return
  const n = typeof v === 'number' ? v : Number(v)
  const { min, max } = pointBounds(i)
  const clamped = Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : min
  // Keep later points at the same height where possible: raising a point
  // must not push a following step below zero.
  const points = updateArrayItem(block.value.points, i, clamped).map((p, j, all) =>
    j > i ? Math.max(all[j - 1], Math.min(all[j - 1] + 255, p)) : p,
  )
  emit('update', `dataBlocks.${blockIndex.value}.points`, points)
}

// Switching the point count rebuilds a gamma 2.2 curve of that size; it is
// only offered when the extra bytes fit in the extension.
const freeBytes = computed(() => ExtensionBlockParser.getCeaFreePayloadBytes(props.cea))
function countFits(count: number): boolean {
  const current = block.value?.points.length ?? 0
  return count <= current || count - current <= freeBytes.value
}

function setCount(count: number) {
  if (!block.value || count === block.value.points.length || !countFits(count)) return
  emit('update', `dataBlocks.${blockIndex.value}.points`, makeVesaTransferCurve(count))
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>VESA Display Transfer Characteristic <span class="text-xs text-muted-foreground font-normal">(tag 5)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <p v-if="!block" class="text-muted-foreground">No VESA Display Transfer Characteristic Data Block present.</p>
      <template v-else>
        <div class="grid grid-cols-2 gap-x-6 gap-y-2">
          <label :class="labelClass">
            Channel
            <select
              :class="selectClass"
              :value="block.transferType"
              @change="(e: Event) => emit('update', `dataBlocks.${blockIndex}.transferType`, (e.target as HTMLSelectElement).value)"
            >
              <option v-for="opt in VESA_TRANSFER_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </label>
          <label :class="labelClass">
            Points
            <select
              :class="selectClass"
              :value="block.points.length"
              @change="(e: Event) => setCount(Number((e.target as HTMLSelectElement).value))"
            >
              <option
                v-if="!(VESA_TRANSFER_POINT_COUNTS as readonly number[]).includes(block.points.length)"
                :value="block.points.length"
              >
                {{ block.points.length + 1 }} (non-standard)
              </option>
              <option
                v-for="count in VESA_TRANSFER_POINT_COUNTS"
                :key="count"
                :value="count"
                :disabled="!countFits(count)"
              >
                {{ count + 1 }}{{ countFits(count) ? '' : ' — not enough room' }}
              </option>
            </select>
          </label>
        </div>

        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Curve (0–1023)</h4>
          <p class="text-xs text-muted-foreground mb-2">
            Changing the point count replaces the curve with a gamma 2.2 curve. The last point is always 1023.
          </p>
          <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
            <label
              v-for="(p, i) in block.points"
              :key="i"
              class="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              #{{ i + 1 }}
              <Input
                type="number"
                :min="pointBounds(i).min"
                :max="pointBounds(i).max"
                :step="1"
                :model-value="p"
                @update:model-value="(v) => setPoint(i, v)"
              />
            </label>
            <label class="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              #{{ block.points.length + 1 }}
              <Input :model-value="1023" readonly disabled />
            </label>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
