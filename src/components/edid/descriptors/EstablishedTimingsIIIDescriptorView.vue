<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import type { EstablishedTimingsIIIDescriptor } from 'edidts'
import { Switch } from '@/components/ui/switch'

const props = defineProps<{ descriptor: EstablishedTimingsIIIDescriptor }>()
const emit = defineEmits<{ update: [descriptor: EstablishedTimingsIIIDescriptor] }>()

function clone(d: EstablishedTimingsIIIDescriptor): EstablishedTimingsIIIDescriptor {
  return { ...d, timings: [...d.timings] }
}

const local = reactive<EstablishedTimingsIIIDescriptor>(clone(props.descriptor))

watch(
  () => props.descriptor,
  (next) => {
    local.timings = [...next.timings]
  },
  { deep: true },
)

const set = computed(() => new Set(local.timings))

// 96 bits (bytes 6–17, bit index 0..95).
const bits = Array.from({ length: 96 }, (_, i) => i)

function emitUpdate() {
  emit('update', clone(local))
}

function toggleBit(bit: number, on: boolean) {
  const has = set.value.has(bit)
  if (on && !has) local.timings.push(bit)
  else if (!on && has) local.timings = local.timings.filter((b) => b !== bit)
  else return
  emitUpdate()
}
</script>

<template>
  <div class="space-y-2">
    <p class="text-[11px] uppercase tracking-wide text-muted-foreground">
      Established Timings III bitmap (bytes 6–17, bit index 0–95).
    </p>
    <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
      <label
        v-for="bit in bits"
        :key="bit"
        class="flex items-center gap-1.5 text-xs rounded px-1.5 py-1"
        :class="set.has(bit) ? 'bg-emerald-500/10' : 'bg-muted/30'"
      >
        <Switch :checked="set.has(bit)" @update:checked="(v: boolean) => toggleBit(bit, v)" />
        <span class="font-mono text-muted-foreground">{{ bit }}</span>
      </label>
    </div>
    <p v-if="local.timings.length === 0" class="text-muted-foreground">No bits set</p>
  </div>
</template>