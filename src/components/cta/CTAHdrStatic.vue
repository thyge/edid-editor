<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, HDRStaticMetadataDataBlock } from 'edidts'
import { EOTF_FLAGS, hdrLuminanceFromCode, hdrMinLuminanceFromCode } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

/**
 * HDR Static Metadata Data Block editor (tag 0x07 ext 0x06) — the HDR static
 * section of the former combined "HDR & Colorimetry" view, split per block so
 * each block has its own nav placement.
 *
 * The luminance bytes are edited as their raw code values (0–255), the way
 * they are stored; the cd/m² figure next to each is derived from the code.
 * Editing in cd/m² and rounding back would shift values the user never
 * touched (min luminance depends on the max-luminance code).
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

/** Code values are bytes: bound the input to 0–255. */
function onCode(field: string, v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  emitBlock(field, Number.isFinite(parsed) ? Math.max(0, Math.min(255, Math.round(parsed))) : 0)
}

function nits(value: number): string {
  return value >= 100 ? value.toFixed(1) : value >= 1 ? value.toFixed(3) : value.toFixed(5)
}

const maxNits = computed(() =>
  hdrStatic.value?.maxLuminanceCode !== undefined ? hdrLuminanceFromCode(hdrStatic.value.maxLuminanceCode) : undefined,
)
const frameAvgNits = computed(() =>
  hdrStatic.value?.maxFrameAvgLuminanceCode !== undefined
    ? hdrLuminanceFromCode(hdrStatic.value.maxFrameAvgLuminanceCode)
    : undefined,
)
const minNits = computed(() =>
  hdrStatic.value?.minLuminanceCode !== undefined
    ? hdrMinLuminanceFromCode(hdrStatic.value.maxLuminanceCode ?? 0, hdrStatic.value.minLuminanceCode)
    : undefined,
)

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

        <div
          v-if="hdrStatic.maxLuminanceCode !== undefined || hdrStatic.maxFrameAvgLuminanceCode !== undefined || hdrStatic.minLuminanceCode !== undefined"
          class="grid grid-cols-3 gap-x-6 gap-y-1"
        >
          <label v-if="hdrStatic.maxLuminanceCode !== undefined" :class="labelClass">
            Max Luminance (code 0–255)
            <Input type="number" :min="0" :max="255" :step="1" :model-value="hdrStatic.maxLuminanceCode" @update:model-value="(v) => onCode('maxLuminanceCode', v)" />
            <span class="normal-case font-normal tracking-normal">= {{ nits(maxNits!) }} cd/m²</span>
          </label>
          <label v-if="hdrStatic.maxFrameAvgLuminanceCode !== undefined" :class="labelClass">
            Max Frame-Avg (code 0–255)
            <Input type="number" :min="0" :max="255" :step="1" :model-value="hdrStatic.maxFrameAvgLuminanceCode" @update:model-value="(v) => onCode('maxFrameAvgLuminanceCode', v)" />
            <span class="normal-case font-normal tracking-normal">= {{ nits(frameAvgNits!) }} cd/m²</span>
          </label>
          <label v-if="hdrStatic.minLuminanceCode !== undefined" :class="labelClass">
            Min Luminance (code 0–255)
            <Input type="number" :min="0" :max="255" :step="1" :model-value="hdrStatic.minLuminanceCode" @update:model-value="(v) => onCode('minLuminanceCode', v)" />
            <span class="normal-case font-normal tracking-normal">= {{ nits(minNits!) }} cd/m²</span>
          </label>
        </div>
        <p class="text-xs text-muted-foreground/80">
          Max = 50 × 2^(code/32) cd/m²; min = max × (code/255)² / 100 (CTA-861-G §7.5.6).
        </p>
      </template>
    </CardContent>
  </Card>
</template>
