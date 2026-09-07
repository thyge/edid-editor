<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, HDRStaticMetadataDataBlock } from 'edidts'
import { EOTF_FLAGS } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

/**
 * HDR Static Metadata Data Block editor (tag 0x07 ext 0x06) — the HDR static
 * section of the former combined "HDR & Colorimetry" view, split per block so
 * each block has its own nav placement (TASK-114).
 */
const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

const hdrStatic = computed(() =>
  props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x06,
  ) as HDRStaticMetadataDataBlock | undefined,
)

/** Resolve the block's `dataBlocks` index and emit a prop-rooted edit path. */
function emitBlock(field: string, value: unknown) {
  if (!hdrStatic.value) return
  const idx = props.cea.dataBlocks.findIndex(b => b === hdrStatic.value)
  if (idx !== -1) emit('update', `dataBlocks.${idx}.${field}`, value)
}

function onNumber(field: string, v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  emitBlock(field, Number.isFinite(parsed) ? parsed : 0)
}

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
const labelClass = 'flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>HDR Static Metadata</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <p v-if="!hdrStatic" class="text-muted-foreground">No HDR Static Metadata block present.</p>
      <template v-else>
        <div class="grid grid-cols-2 gap-x-6 gap-y-1">
          <div v-for="flag in EOTF_FLAGS" :key="flag.key" :class="rowClass">
            <span>{{ flag.label }}</span>
            <Switch
              :model-value="(hdrStatic as unknown as Record<string, unknown>).eotf ? (hdrStatic.eotf as unknown as Record<string, boolean>)[flag.key] : false"
              @update:model-value="(v: boolean) => emitBlock(`eotf.${flag.key}`, v)"
            />
          </div>
          <div :class="rowClass">
            <span>Static Metadata Type 1</span>
            <Switch :model-value="hdrStatic.staticMetadataType1" @update:model-value="(v: boolean) => emitBlock('staticMetadataType1', v)" />
          </div>
        </div>

        <div v-if="hdrStatic.maxLuminance !== undefined || hdrStatic.minLuminance !== undefined" class="grid grid-cols-3 gap-x-6 gap-y-1">
          <label v-if="hdrStatic.maxLuminance !== undefined" :class="labelClass">
            Max Luminance (cd/m²)
            <Input type="number" :min="0" :step="1" :model-value="hdrStatic.maxLuminance" @update:model-value="(v) => onNumber('maxLuminance', v)" />
          </label>
          <label v-if="hdrStatic.maxFrameAvgLuminance !== undefined" :class="labelClass">
            Max Frame-Avg (cd/m²)
            <Input type="number" :min="0" :step="1" :model-value="hdrStatic.maxFrameAvgLuminance" @update:model-value="(v) => onNumber('maxFrameAvgLuminance', v)" />
          </label>
          <label v-if="hdrStatic.minLuminance !== undefined" :class="labelClass">
            Min Luminance (cd/m²)
            <Input type="number" :min="0" :step="0.0001" :model-value="hdrStatic.minLuminance" @update:model-value="(v) => onNumber('minLuminance', v)" />
          </label>
        </div>
      </template>
    </CardContent>
  </Card>
</template>