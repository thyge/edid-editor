<script setup lang="ts">
import { computed } from 'vue'
import { getAudioFormatName, AUDIO_FORMAT_CODES } from 'edidts'
import type { CEAExtensionBlock, AudioDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

const audioBlock = computed(() =>
  props.cea.dataBlocks.find(b => b.tag === 0x01) as AudioDataBlock | undefined
)

const descriptors = computed(() => audioBlock.value?.descriptors ?? [])

const sampleRateLabels: { key: string; label: string }[] = [
  { key: 'sr32kHz', label: '32 kHz' },
  { key: 'sr44_1kHz', label: '44.1 kHz' },
  { key: 'sr48kHz', label: '48 kHz' },
  { key: 'sr88_2kHz', label: '88.2 kHz' },
  { key: 'sr96kHz', label: '96 kHz' },
  { key: 'sr176_4kHz', label: '176.4 kHz' },
  { key: 'sr192kHz', label: '192 kHz' },
]

const bitDepthLabels: { key: string; label: string }[] = [
  { key: 'bd16', label: '16-bit' },
  { key: 'bd20', label: '20-bit' },
  { key: 'bd24', label: '24-bit' },
]

function toggleSampleRate(descIndex: number, rateKey: string, value: boolean) {
  const updated = descriptors.value.map((d, i) => {
    if (i !== descIndex) return d
    return { ...d, samplingRates: { ...d.samplingRates, [rateKey]: value } }
  })
  emit('update', 'audioBlock.descriptors', updated)
}

function toggleBitDepth(descIndex: number, bdKey: string, value: boolean) {
  const updated = descriptors.value.map((d, i) => {
    if (i !== descIndex) return d
    return { ...d, bitDepths: { ...d.bitDepths, [bdKey]: value } }
  })
  emit('update', 'audioBlock.descriptors', updated)
}

function removeDescriptor(index: number) {
  const updated = descriptors.value.filter((_, i) => i !== index)
  emit('update', 'audioBlock.descriptors', updated)
}

function addDescriptor(formatCode: number) {
  const newDesc = {
    format: formatCode,
    channels: 2,
    samplingRates: {
      sr32kHz: false,
      sr44_1kHz: false,
      sr48kHz: true,
      sr88_2kHz: false,
      sr96kHz: false,
      sr176_4kHz: false,
      sr192kHz: false,
    },
    bitDepths: formatCode === 1 ? { bd16: true, bd20: false, bd24: false } : undefined,
    maxBitrate: formatCode !== 1 ? 0 : undefined,
  }
  emit('update', 'audioBlock.descriptors', [...descriptors.value, newDesc])
}

const selectClass = 'flex h-8 w-full rounded-md border border-input dark:bg-input/30 bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Audio Data Block (SADs)</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div v-if="descriptors.length > 0" class="space-y-3">
        <div
          v-for="(desc, i) in descriptors"
          :key="i"
          class="rounded-lg border border-border/40 p-3"
        >
          <div class="flex items-center justify-between mb-2">
            <div>
              <span class="font-medium">{{ getAudioFormatName(desc.format) }}</span>
              <span class="text-xs text-muted-foreground ml-2">{{ desc.channels }} channels</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              class="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
              @click="removeDescriptor(i)"
            >
              Remove
            </Button>
          </div>

          <div class="space-y-2">
            <div>
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Sampling Rates</p>
              <div class="flex flex-wrap gap-x-4 gap-y-1">
                <label
                  v-for="sr in sampleRateLabels"
                  :key="sr.key"
                  class="flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <Switch
                    :checked="(desc.samplingRates as Record<string, boolean>)[sr.key]"
                    @update:checked="(v: boolean) => toggleSampleRate(i, sr.key, v)"
                  />
                  <span>{{ sr.label }}</span>
                </label>
              </div>
            </div>

            <div v-if="desc.bitDepths">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Bit Depths</p>
              <div class="flex flex-wrap gap-x-4 gap-y-1">
                <label
                  v-for="bd in bitDepthLabels"
                  :key="bd.key"
                  class="flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <Switch
                    :checked="(desc.bitDepths as Record<string, boolean>)[bd.key]"
                    @update:checked="(v: boolean) => toggleBitDepth(i, bd.key, v)"
                  />
                  <span>{{ bd.label }}</span>
                </label>
              </div>
            </div>

            <div v-if="desc.maxBitrate !== undefined">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Max Bitrate</p>
              <span class="font-mono text-xs">{{ desc.maxBitrate }} kHz</span>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="text-muted-foreground">No audio descriptors present.</p>

      <div class="border-t pt-3">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Add Audio Format</h4>
        <select
          :class="selectClass"
          @change="(e: Event) => {
            const val = parseInt((e.target as HTMLSelectElement).value, 10)
            if (!isNaN(val)) { addDescriptor(val); (e.target as HTMLSelectElement).value = '' }
          }"
        >
          <option value="">Select format...</option>
          <option v-for="fmt in AUDIO_FORMAT_CODES.filter(f => f.code > 0)" :key="fmt.code" :value="fmt.code">
            {{ fmt.name }}
          </option>
        </select>
      </div>
    </CardContent>
  </Card>
</template>
