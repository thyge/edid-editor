<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { HDR10PlusVSDB } from 'edidts'

const props = defineProps<{ fields: HDR10PlusVSDB }>()

const emit = defineEmits<{ update: [field: string, value: unknown] }>()

function onApplicationVersion(v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  // Application Version occupies the full post-OUI byte 0 (0–255); the
  // trailing vendor bytes are preserved verbatim by the codec.
  emit('update', 'applicationVersion', Number.isFinite(parsed) ? Math.max(0, Math.min(255, Math.round(parsed))) : 0)
}

function hexDump(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>HDR10+ VSVDB <span class="text-xs text-muted-foreground font-normal">(OUI 90-84-8B)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-2 text-sm">
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Application Version (0–255)
        <Input type="number" :min="0" :max="255" :step="1" :model-value="props.fields.applicationVersion" @update:model-value="onApplicationVersion" />
      </label>
      <p class="text-muted-foreground">Vendor-specific trailing bytes (preserved for byte-exact round-trip):</p>
      <pre class="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto">{{ hexDump(props.fields.trailing) }}</pre>
    </CardContent>
  </Card>
</template>