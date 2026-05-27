<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock } from 'edidts'
import type { VideoCapabilityDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

const vcdb = computed(() =>
  props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x00
  ) as VideoCapabilityDataBlock | undefined
)

const scanBehaviorOptions = [
  { value: 'not_supported', label: 'Not Supported' },
  { value: 'always_overscanned', label: 'Always Overscanned' },
  { value: 'always_underscanned', label: 'Always Underscanned' },
  { value: 'both', label: 'Both (Over & Under)' },
]

const selectClass = 'flex h-8 w-full rounded-md border border-input dark:bg-input/30 bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
const switchRowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2 hover:bg-muted/50 transition-colors'

function updateField(field: string, value: unknown) {
  emit('update', `videoCapability.${field}`, value)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Video Capability</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <template v-if="vcdb">
        <section>
          <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Scan Behavior</h4>
          <div class="grid grid-cols-3 gap-x-6 gap-y-3">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">CE Video</label>
              <select
                :value="vcdb.ceVideoScanBehavior"
                :class="selectClass"
                @change="(e: Event) => updateField('ceVideoScanBehavior', (e.target as HTMLSelectElement).value)"
              >
                <option v-for="opt in scanBehaviorOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">IT Video</label>
              <select
                :value="vcdb.itVideoScanBehavior"
                :class="selectClass"
                @change="(e: Event) => updateField('itVideoScanBehavior', (e.target as HTMLSelectElement).value)"
              >
                <option v-for="opt in scanBehaviorOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">PT Video</label>
              <select
                :value="vcdb.ptVideoScanBehavior"
                :class="selectClass"
                @change="(e: Event) => updateField('ptVideoScanBehavior', (e.target as HTMLSelectElement).value)"
              >
                <option v-for="opt in scanBehaviorOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>
        </section>

        <section>
          <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Quantization Range</h4>
          <div class="grid grid-cols-2 gap-x-6 gap-y-2">
            <label :class="switchRowClass">
              <div>
                <span>RGB Quantization Range Selectable</span>
                <p class="text-xs text-muted-foreground">QS bit</p>
              </div>
              <Switch
                :checked="vcdb.quantizationRangeSelectable"
                @update:checked="(v: boolean) => updateField('quantizationRangeSelectable', v)"
              />
            </label>
            <label :class="switchRowClass">
              <div>
                <span>YCC Quantization Range</span>
                <p class="text-xs text-muted-foreground">QY bit</p>
              </div>
              <Switch
                :checked="vcdb.quantizationRangeYCC"
                @update:checked="(v: boolean) => updateField('quantizationRangeYCC', v)"
              />
            </label>
          </div>
        </section>
      </template>
      <p v-else class="text-muted-foreground">No Video Capability Data Block present.</p>
    </CardContent>
  </Card>
</template>
