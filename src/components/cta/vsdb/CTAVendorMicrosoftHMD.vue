<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { MicrosoftHMDVSDB } from 'edidts'
import { MICROSOFT_HMD_USE_CASES } from 'edidts'

const props = defineProps<{ fields: MicrosoftHMDVSDB }>()

const emit = defineEmits<{ update: [field: string, value: unknown] }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
const selectClass =
  'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

const useCaseOptions = Object.entries(MICROSOFT_HMD_USE_CASES)
  .map(([k, v]) => ({ value: Number(k), label: `0x${Number(k).toString(16).toUpperCase().padStart(2, '0')} — ${v}` }))
  .sort((a, b) => a.value - b.value)

function formatContainerId(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function onNumber(field: string, v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  emit('update', field, Number.isFinite(parsed) ? Math.round(parsed) : 0)
}

function onContainerId(text: string) {
  // Parse a hex string (separators optional) into up to 16 bytes, zero-padded.
  const hex = text.replace(/[^0-9a-fA-F]/g, '')
  const bytes: number[] = []
  for (let i = 0; i + 1 < hex.length && bytes.length < 16; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16))
  }
  while (bytes.length < 16) bytes.push(0)
  emit('update', 'containerId', new Uint8Array(bytes))
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Microsoft HMD VSDB <span class="text-xs text-muted-foreground font-normal">(OUI CA-12-5C)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-1 text-sm">
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Version
        <Input type="number" :min="0" :step="1" :model-value="props.fields.version" @update:model-value="(v) => onNumber('version', v)" />
      </label>
      <div :class="rowClass">
        <span>Desktop Usage</span>
        <Switch :model-value="props.fields.desktopUsage" @update:model-value="(v: boolean) => emit('update', 'desktopUsage', v)" />
      </div>
      <div :class="rowClass">
        <span>Non-Microsoft Usage</span>
        <Switch :model-value="props.fields.nonMicrosoftUsage" @update:model-value="(v: boolean) => emit('update', 'nonMicrosoftUsage', v)" />
      </div>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Primary Use Case
        <select :class="selectClass" :value="props.fields.primaryUseCase" @change="(e: Event) => onNumber('primaryUseCase', Number((e.target as HTMLSelectElement).value))">
          <option v-for="opt in useCaseOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Container ID (16-byte UUID hex)
        <Input :model-value="formatContainerId(props.fields.containerId)" @update:model-value="(v: string | number) => onContainerId(String(v))" />
      </label>
    </CardContent>
  </Card>
</template>