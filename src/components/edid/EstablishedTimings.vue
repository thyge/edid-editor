<script setup lang="ts">
import { computed } from 'vue'
import { EstablishedTiming } from 'edidts'
import type { EDIDViewModel } from '@/types/edid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

const props = defineProps<{ edid: EDIDViewModel }>()
const emit = defineEmits<{ update: [field: string, value: unknown] }>()

const allTimings = EstablishedTiming.TIMING_MAP.filter((t) => !t.name.includes('Reserved'))
const establishedTimingsI = allTimings.filter((t) => t.id <= 7)
const establishedTimingsII = allTimings.filter((t) => t.id >= 8 && t.id <= 15)
const manufacturerTimings = allTimings.filter((t) => t.id >= 16)

const activeIds = computed(() => new Set(props.edid.establishedTimings.map((t) => t.id)))

type TimingEntry = (typeof EstablishedTiming.TIMING_MAP)[number]

function toggleEstablished(entry: TimingEntry, checked: boolean) {
  const current = props.edid.establishedTimings
  let updated: EstablishedTiming[]
  if (checked) {
    updated = [...current, new EstablishedTiming(entry)]
  } else {
    updated = current.filter((t) => t.id !== entry.id)
  }
  emit('update', 'establishedTimings', updated)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Established Timings</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Established Timings I</h4>
        <div class="grid grid-cols-4 gap-x-4 gap-y-0">
          <label
            v-for="entry in establishedTimingsI"
            :key="entry.id"
            class="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <span class="text-xs">{{ entry.width }}×{{ entry.height }} @ {{ entry.refreshRate }}Hz</span>
            <Switch :model-value="activeIds.has(entry.id)" @update:model-value="(v: boolean) => toggleEstablished(entry, v)" />
          </label>
        </div>
      </section>

      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Established Timings II</h4>
        <div class="grid grid-cols-4 gap-x-4 gap-y-0">
          <label
            v-for="entry in establishedTimingsII"
            :key="entry.id"
            class="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <span class="text-xs">{{ entry.width }}×{{ entry.height }} @ {{ entry.refreshRate }}Hz</span>
            <Switch :model-value="activeIds.has(entry.id)" @update:model-value="(v: boolean) => toggleEstablished(entry, v)" />
          </label>
        </div>
      </section>

      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Manufacturer's Timings</h4>
        <div class="grid grid-cols-4 gap-x-4 gap-y-0">
          <label
            v-for="entry in manufacturerTimings"
            :key="entry.id"
            class="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <span class="text-xs">{{ entry.width }}×{{ entry.height }} @ {{ entry.refreshRate }}Hz</span>
            <Switch :model-value="activeIds.has(entry.id)" @update:model-value="(v: boolean) => toggleEstablished(entry, v)" />
          </label>
        </div>
      </section>
    </CardContent>
  </Card>
</template>
