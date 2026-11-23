<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import type { DolbyVSDB } from 'edidts'
import { setDolbyVsvdbVersion } from 'edidts'

/**
 * Dolby Vision VSVDB card. The meaning of byte 0 bits 4:1 depends on the
 * version (edid-decode `cta_dolby_video`): v0 has 2160p60 + global dimming
 * there; v1 has 2160p60 + the DM version, with global dimming in byte 1
 * bit 0; v2 has backlight control + the DM version, with global dimming in
 * byte 1 bit 2. Later versions are not parsed.
 */
const props = defineProps<{ fields: DolbyVSDB }>()

const emit = defineEmits<{ update: [field: string, value: unknown] }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
const selectClass =
  'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

const version = computed(() => props.fields.version)
const hasDmVersion = computed(() => version.value === 1 || version.value === 2)
const known = computed(() => version.value <= 2)

/**
 * Changing the version only rewrites the version bits; the other bits are
 * re-read with the new version's layout. Emit every field of the result
 * (undefined for ones the new layout does not have).
 */
function onVersion(v: number) {
  const next = setDolbyVsvdbVersion(props.fields, v) as unknown as Record<string, unknown>
  const current = props.fields as unknown as Record<string, unknown>
  for (const key of new Set([...Object.keys(current), ...Object.keys(next)])) {
    if (current[key] !== next[key]) emit('update', key, next[key])
  }
}

function onDmVersion(code: number) {
  emit('update', 'dmVersion', Math.max(0, Math.min(7, Math.round(code))))
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Dolby Vision VSVDB <span class="text-xs text-muted-foreground font-normal">(OUI 00-D0-46)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-1 text-sm">
      <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Version
        <select :class="selectClass" :value="fields.version" @change="(e: Event) => onVersion(Number((e.target as HTMLSelectElement).value))">
          <option v-for="v in 8" :key="v - 1" :value="v - 1">Version {{ v - 1 }}</option>
        </select>
        <span class="normal-case font-normal tracking-normal">
          Changing the version keeps the bytes and re-reads them with that version's layout.
        </span>
      </label>
      <div :class="rowClass">
        <span>YUV 4:2:2 12-bit</span>
        <Switch :model-value="fields.supportsYUV422_12bit" @update:model-value="(v: boolean) => emit('update', 'supportsYUV422_12bit', v)" />
      </div>
      <div v-if="version === 0 || version === 1" :class="rowClass">
        <span>2160p60</span>
        <Switch :model-value="fields.supports2160p60" @update:model-value="(v: boolean) => emit('update', 'supports2160p60', v)" />
      </div>
      <div v-if="version === 2" :class="rowClass">
        <span>Backlight Control</span>
        <Switch :model-value="fields.supportsBacklightControl ?? false" @update:model-value="(v: boolean) => emit('update', 'supportsBacklightControl', v)" />
      </div>
      <label v-if="hasDmVersion" class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        DM Version
        <select :class="selectClass" :value="fields.dmVersion ?? 0" @change="(e: Event) => onDmVersion(Number((e.target as HTMLSelectElement).value))">
          <option v-for="c in 8" :key="c - 1" :value="c - 1">DM {{ c + 1 }}.x</option>
        </select>
      </label>
      <div v-if="known" :class="rowClass">
        <span>Global Dimming <span class="text-xs text-muted-foreground">({{ version === 0 ? 'byte 0 bit 2' : version === 1 ? 'byte 1 bit 0' : 'byte 1 bit 2' }})</span></span>
        <Switch :model-value="fields.supportsGlobalDimming" @update:model-value="(v: boolean) => emit('update', 'supportsGlobalDimming', v)" />
      </div>
      <p v-if="!known" class="text-xs text-muted-foreground">
        Version {{ version }} is not defined by the public Dolby Vision layout; its other bits are kept as they are.
      </p>
    </CardContent>
  </Card>
</template>
