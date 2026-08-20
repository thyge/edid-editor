<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { DolbyVSDB } from 'edidts'

const props = defineProps<{ fields: DolbyVSDB }>()

const emit = defineEmits<{ update: [field: string, value: unknown] }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'

function onNumber(field: string, v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  // Version is a 3-bit field (0–7).
  emit('update', field, Number.isFinite(parsed) ? Math.max(0, Math.min(7, Math.round(parsed))) : 0)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Dolby Vision VSVDB <span class="text-xs text-muted-foreground font-normal">(OUI 00-D0-46)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-1 text-sm">
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Version (0–7)
        <Input type="number" :min="0" :max="7" :step="1" :model-value="props.fields.version" @update:model-value="(v) => onNumber('version', v)" />
      </label>
      <div :class="rowClass">
        <span>YUV 4:2:2 12-bit</span>
        <Switch :checked="props.fields.supportsYUV422_12bit" @update:checked="(v: boolean) => emit('update', 'supportsYUV422_12bit', v)" />
      </div>
      <div :class="rowClass">
        <span>2160p60</span>
        <Switch :checked="props.fields.supports2160p60" @update:checked="(v: boolean) => emit('update', 'supports2160p60', v)" />
      </div>
      <div :class="rowClass">
        <span>Global Dimming</span>
        <Switch :checked="props.fields.supportsGlobalDimming" @update:checked="(v: boolean) => emit('update', 'supportsGlobalDimming', v)" />
      </div>
    </CardContent>
  </Card>
</template>