<script setup lang="ts">
import type { CEAExtensionBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

// The CEA encoder recomputes dtdOffset from the live data-block layout and the
// DTD count is just detailedTimings.length (see ExtensionBlockParser.encodeCEA),
// so neither is surfaced here — the overview shows only what the user edits or
// can compare against the Header & Flags page.
function onNativeFormats(v: string | number) {
  const n = typeof v === 'number' ? v : Number(v)
  const max = props.cea.detailedTimings.length
  const clamped = Number.isFinite(n) ? Math.max(0, Math.min(15, Math.min(max, Math.round(n)))) : 0
  emit('update', 'nativeFormats', clamped)
}

const switchRowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>CEA Extension Overview</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Header</h4>
        <div class="grid grid-cols-2 gap-x-6 gap-y-2">
          <div :class="switchRowClass">
            <span class="text-muted-foreground">Revision</span>
            <span class="font-mono">{{ cea.revision }}</span>
          </div>
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground" title="Byte 3 bits 3:0 — number of native DTDs (first N DTDs are native)">
            Native DTDs (0–{{ Math.min(15, cea.detailedTimings.length) }})
            <Input type="number" :min="0" :max="Math.min(15, cea.detailedTimings.length)" :step="1" :model-value="cea.nativeFormats" @update:model-value="(v) => onNativeFormats(v)" />
          </label>
        </div>
      </section>

      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Capabilities</h4>
        <div class="grid grid-cols-2 gap-x-6 gap-y-1">
          <div :class="switchRowClass">
            <span>Underscan</span>
            <span :class="cea.underscan ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ cea.underscan ? 'Supported' : 'Not supported' }}
            </span>
          </div>
          <div :class="switchRowClass">
            <span>Basic Audio</span>
            <span :class="cea.basicAudio ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ cea.basicAudio ? 'Supported' : 'Not supported' }}
            </span>
          </div>
          <div :class="switchRowClass">
            <span>YCbCr 4:4:4</span>
            <span :class="cea.ycbcr444 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ cea.ycbcr444 ? 'Supported' : 'Not supported' }}
            </span>
          </div>
          <div :class="switchRowClass">
            <span>YCbCr 4:2:2</span>
            <span :class="cea.ycbcr422 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ cea.ycbcr422 ? 'Supported' : 'Not supported' }}
            </span>
          </div>
        </div>
      </section>
    </CardContent>
  </Card>
</template>
