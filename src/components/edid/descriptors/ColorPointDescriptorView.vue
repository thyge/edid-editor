<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ColorPointDescriptor } from 'edidts'
import { Input } from '@/components/ui/input'
import Slider from '@/components/ui/slider/Slider.vue'
import { Button } from '@/components/ui/button'

type ColorPoint = ColorPointDescriptor['colorPoints'][number]

const MAX_COLOR_POINTS = 2
const MAX_GAMMA = 3.54 // Spec limit imposed by encoded byte (0x00-0xFE)
const GAMMA_SLIDER_MAX = Math.round(MAX_GAMMA * 100)

const props = defineProps<{ descriptor: ColorPointDescriptor }>()
const emit = defineEmits<{ update: [ColorPointDescriptor] }>()

function clonePoints(points: ColorPoint[]): ColorPoint[] {
  return points.map((point) => ({ ...point }))
}

const localPoints = ref<ColorPoint[]>(clonePoints(props.descriptor.colorPoints))

watch(
  () => props.descriptor.colorPoints,
  (next) => {
    localPoints.value = clonePoints(next)
  },
  { deep: true }
)

const canAddPoint = computed(() => localPoints.value.length < MAX_COLOR_POINTS)

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeChromaticity(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Number(clamp(value, 0, 0.9999).toFixed(4))
}

function normalizeGamma(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Number(clamp(value, 1, MAX_GAMMA).toFixed(2))
}

function gammaToSliderValue(gamma: number): number {
  return gamma <= 0 ? 0 : Math.round(clamp(gamma, 1, MAX_GAMMA) * 100)
}

function sliderValueToGamma(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return clamp(value / 100, 1, MAX_GAMMA)
}

function emitUpdate() {
  const normalized = localPoints.value.map((point, idx) => ({
    index: idx + 1,
    whiteX: normalizeChromaticity(point.whiteX),
    whiteY: normalizeChromaticity(point.whiteY),
    gamma: normalizeGamma(point.gamma),
  }))
  emit('update', {
    ...props.descriptor,
    colorPoints: normalized,
  })
}

function parseNumeric(value: string | number): number {
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function updatePointField(pointIndex: number, field: keyof ColorPoint, value: string | number) {
  const parsed = parseNumeric(value)
  localPoints.value = localPoints.value.map((point, idx) => {
    if (idx !== pointIndex) return point
    return { ...point, [field]: parsed } as ColorPoint
  })
  emitUpdate()
}

function handleGammaSlider(pointIndex: number, values?: number[]) {
  if (!values?.length) return
  const raw = values[0]!
  const gamma = raw <= 0 ? 0 : sliderValueToGamma(raw)
  updatePointField(pointIndex, 'gamma', gamma)
}

function setNativeGamma(pointIndex: number) {
  updatePointField(pointIndex, 'gamma', 0)
}

function removePoint(pointIndex: number) {
  localPoints.value = localPoints.value.filter((_, idx) => idx !== pointIndex)
  emitUpdate()
}

function createDefaultPoint(index: number): ColorPoint {
  return {
    index,
    whiteX: 0.3127,
    whiteY: 0.329,
    gamma: 2.2,
  }
}

function addColorPoint() {
  if (!canAddPoint.value) return
  localPoints.value = [...localPoints.value, createDefaultPoint(localPoints.value.length + 1)]
  emitUpdate()
}

function formatGammaDisplay(point: ColorPoint): string {
  return point.gamma === 0 ? 'Native Panel' : `${point.gamma.toFixed(2)} γ`
}
</script>

<template>
  <div class="space-y-3 text-sm">
    <div class="space-y-1 text-xs text-muted-foreground">
      <p class="uppercase tracking-wide">Up to two supplemental white points may be defined.</p>
      <p>
        After editing, inspect the Color Characteristics view to see these points plotted on the CIE diagram.
      </p>
    </div>

    <div v-if="localPoints.length > 0" class="space-y-3">
      <div
        v-for="(point, i) in localPoints"
        :key="`point-${i}`"
        class="rounded-lg border border-border/60 p-3 space-y-3"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Color Point {{ i + 1 }}
            </p>
            <p class="text-xs text-muted-foreground/80">{{ formatGammaDisplay(point) }}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="text-destructive hover:text-destructive hover:bg-destructive/10"
            @click="removePoint(i)"
          >
            Remove
          </Button>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:col-span-2">
            <div class="flex items-center justify-between text-[11px] font-semibold">
              <span>Gamma</span>
              <button
                type="button"
                class="text-foreground/70 text-[11px] font-mono hover:text-primary"
                @click="setNativeGamma(i)"
              >
                {{ formatGammaDisplay(point) }}
              </button>
            </div>
            <div class="flex items-center gap-3">
              <Slider
                :model-value="[gammaToSliderValue(point.gamma)]"
                :min="0"
                :max="GAMMA_SLIDER_MAX"
                :step="1"
                class="flex-1"
                @update:model-value="(v?: number[]) => handleGammaSlider(i, v)"
              />
              <span class="text-[11px] font-mono w-16 text-right">
                {{ formatGammaDisplay(point) }}
              </span>
            </div>
          </div>
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            White X (0-1)
            <Input
              type="number"
              :min="0"
              :max="1"
              :step="0.0001"
              :model-value="point.whiteX"
              @update:model-value="(v) => updatePointField(i, 'whiteX', v)"
            />
          </label>
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            White Y (0-1)
            <Input
              type="number"
              :min="0"
              :max="1"
              :step="0.0001"
              :model-value="point.whiteY"
              @update:model-value="(v) => updatePointField(i, 'whiteY', v)"
            />
          </label>
        </div>
      </div>
    </div>

    <div v-else class="rounded-md border border-dashed border-border/60 p-4 text-center text-muted-foreground">
      No color points defined.
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <Button variant="outline" size="sm" :disabled="!canAddPoint" @click="addColorPoint">
        Add Color Point
      </Button>
      <p class="text-xs text-muted-foreground">{{ MAX_COLOR_POINTS - localPoints.length }} slots remaining</p>
    </div>
  </div>
</template>
