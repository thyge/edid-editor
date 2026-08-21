<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { DCMDescriptor } from 'edidts'
import { Input } from '@/components/ui/input'

type CoeffField = 'redA3' | 'redA2' | 'greenA3' | 'greenA2' | 'blueA3' | 'blueA2'

const props = defineProps<{ descriptor: DCMDescriptor }>()
const emit = defineEmits<{ update: [descriptor: DCMDescriptor] }>()

function clone(d: DCMDescriptor): DCMDescriptor {
  return { ...d }
}

const local = reactive<DCMDescriptor>(clone(props.descriptor))

watch(
  () => props.descriptor,
  (next) => Object.assign(local, clone(next)),
  { deep: true },
)

function emitUpdate() {
  emit('update', clone(local))
}

function onVersion(v: string | number) {
  const n = typeof v === 'number' ? v : Number(v)
  local.version = Number.isFinite(n) ? Math.max(0, Math.min(255, Math.round(n))) : 0
  emitUpdate()
}

function onCoeff(field: CoeffField, v: string | number) {
  const n = typeof v === 'number' ? v : Number(v)
  local[field] = Number.isFinite(n) ? Math.max(0, Math.min(65535, Math.round(n))) : 0
  emitUpdate()
}

const coeffFields: { field: CoeffField; label: string }[] = [
  { field: 'redA3', label: 'Red A3' },
  { field: 'redA2', label: 'Red A2' },
  { field: 'greenA3', label: 'Green A3' },
  { field: 'greenA2', label: 'Green A2' },
  { field: 'blueA3', label: 'Blue A3' },
  { field: 'blueA2', label: 'Blue A2' },
]
</script>

<template>
  <div class="space-y-3">
    <label class="flex flex-col gap-1 max-w-xs text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      Version (0–255)
      <Input type="number" :min="0" :max="255" :step="1" :model-value="local.version" @update:model-value="(v) => onVersion(v)" />
    </label>
    <div>
      <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Color Coefficients (uint16, little-endian bytes 6–17)</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <label
          v-for="c in coeffFields"
          :key="c.field"
          class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {{ c.label }}
          <Input type="number" :min="0" :max="65535" :step="1" :model-value="local[c.field]" @update:model-value="(v) => onCoeff(c.field, v)" />
        </label>
      </div>
    </div>
  </div>
</template>