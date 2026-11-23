<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { HDR10PlusVSDB } from 'edidts'

/**
 * HDR10+ VSVDB card. Byte 0 per edid-decode `cta_hdr10plus`: bits 1:0
 * Application Version, bits 3:2 Full Frame Peak Luminance Index, bits 7:4
 * Peak Luminance Index.
 */
const props = defineProps<{ fields: HDR10PlusVSDB }>()

const emit = defineEmits<{ update: [field: string, value: unknown] }>()

/** Bound each input to its bit field instead of letting it spill into its neighbours. */
function onNumber(field: 'applicationVersion' | 'fullFramePeakLuminanceIndex' | 'peakLuminanceIndex', max: number, v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  emit('update', field, Number.isFinite(parsed) ? Math.max(0, Math.min(max, Math.round(parsed))) : 0)
}

function hexDump(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

const labelClass = 'flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>HDR10+ VSVDB <span class="text-xs text-muted-foreground font-normal">(OUI 90-84-8B)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-2 text-sm">
      <div class="grid grid-cols-3 gap-3">
        <label :class="labelClass">
          Application Version (0–3)
          <Input type="number" :min="0" :max="3" :step="1" :model-value="props.fields.applicationVersion" @update:model-value="(v) => onNumber('applicationVersion', 3, v)" />
        </label>
        <label :class="labelClass">
          Full Frame Peak Luminance Index (0–3)
          <Input type="number" :min="0" :max="3" :step="1" :model-value="props.fields.fullFramePeakLuminanceIndex ?? 0" @update:model-value="(v) => onNumber('fullFramePeakLuminanceIndex', 3, v)" />
        </label>
        <label :class="labelClass">
          Peak Luminance Index (0–15)
          <Input type="number" :min="0" :max="15" :step="1" :model-value="props.fields.peakLuminanceIndex ?? 0" @update:model-value="(v) => onNumber('peakLuminanceIndex', 15, v)" />
        </label>
      </div>
      <p class="text-muted-foreground">Vendor-specific trailing bytes (preserved for byte-exact round-trip):</p>
      <pre class="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto">{{ hexDump(props.fields.trailing) }}</pre>
    </CardContent>
  </Card>
</template>
