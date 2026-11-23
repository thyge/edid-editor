<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { MicrosoftHMDVSDB } from 'edidts'
import { MICROSOFT_HMD_USE_CASES } from 'edidts'

/**
 * Microsoft HMD / specialized-monitor VSDB card. Byte 1 per Microsoft's spec
 * and edid-decode `cta_microsoft`: bit 6 Desktop Usage, bit 5 Third-Party
 * Usage (both defined from version 3), bits 4:0 the primary use case.
 */
const props = defineProps<{ fields: MicrosoftHMDVSDB }>()

const emit = defineEmits<{ update: [field: string, value: unknown] }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
const selectClass =
  'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

const hex2 = (n: number) => `0x${n.toString(16).toUpperCase().padStart(2, '0')}`

/** Defined use cases, plus the block's current value when it is not one of them. */
const useCaseOptions = computed(() => {
  const options = Object.entries(MICROSOFT_HMD_USE_CASES)
    .map(([k, v]) => ({ value: Number(k), label: `${hex2(Number(k))} — ${v}` }))
  if (!(props.fields.primaryUseCase in MICROSOFT_HMD_USE_CASES)) {
    options.push({ value: props.fields.primaryUseCase, label: `${hex2(props.fields.primaryUseCase)} — Undefined` })
  }
  return options.sort((a, b) => a.value - b.value)
})

function formatContainerId(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Version is a full byte; the use case is 5 bits. Bound both instead of letting them wrap. */
function onNumber(field: 'version' | 'primaryUseCase', v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  const max = field === 'version' ? 0xff : 0x1f
  emit('update', field, Number.isFinite(parsed) ? Math.max(0, Math.min(max, Math.round(parsed))) : 0)
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
        Version (0–255)
        <Input type="number" :min="0" :max="255" :step="1" :model-value="props.fields.version" @update:model-value="(v) => onNumber('version', v)" />
      </label>
      <div :class="rowClass">
        <span>Desktop Usage <span class="text-xs text-muted-foreground">(version 3+)</span></span>
        <Switch :model-value="props.fields.desktopUsage" @update:model-value="(v: boolean) => emit('update', 'desktopUsage', v)" />
      </div>
      <div :class="rowClass">
        <span>Third-Party Usage <span class="text-xs text-muted-foreground">(version 3+)</span></span>
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
