<script setup lang="ts">
import { computed } from 'vue'
import { AUDIO_FORMAT_CODES, AUDIO_SAMPLING_RATE_OPTIONS, AUDIO_BIT_DEPTH_OPTIONS } from 'edidts'
import type { CEAExtensionBlock, AudioDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { appendArrayItem, removeArrayItem, findDataBlockIndex } from '../common/editorUtils'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

const blockIndex = computed(() => findDataBlockIndex(props.cea, 0x01))
const audioBlock = computed(() =>
  props.cea.dataBlocks.find(b => b.tag === 0x01) as AudioDataBlock | undefined
)

const descriptors = computed(() => audioBlock.value?.descriptors ?? [])

const sampleRateLabels = AUDIO_SAMPLING_RATE_OPTIONS
const bitDepthLabels = AUDIO_BIT_DEPTH_OPTIONS

// Codes 1–14 are selectable; 15 (extension) is not user-addable here.
const formatOptions = AUDIO_FORMAT_CODES.filter(f => f.code >= 1 && f.code <= 14)

function commit(updated: AudioDataBlock['descriptors']) {
  emit('update', `dataBlocks.${blockIndex.value}.descriptors`, updated)
}

function toggleSampleRate(descIndex: number, rateKey: string, value: boolean) {
  const updated = descriptors.value.map((d, i) => {
    if (i !== descIndex) return d
    return { ...d, samplingRates: { ...d.samplingRates, [rateKey]: value } }
  })
  commit(updated)
}

function toggleBitDepth(descIndex: number, bdKey: string, value: boolean) {
  const updated = descriptors.value.map((d, i) => {
    if (i !== descIndex) return d
    return { ...d, bitDepths: { ...d.bitDepths!, [bdKey]: value } }
  })
  commit(updated)
}

function onChannels(descIndex: number, v: string | number) {
  const n = typeof v === 'number' ? v : Number(v)
  const channels = Number.isFinite(n) ? Math.max(1, Math.min(8, Math.round(n))) : 1
  const updated = descriptors.value.map((d, i) => (i === descIndex ? { ...d, channels } : d))
  commit(updated)
}

function onMaxBitrate(descIndex: number, v: string | number) {
  const n = typeof v === 'number' ? v : Number(v)
  const maxBitrate = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0
  const updated = descriptors.value.map((d, i) => (i === descIndex ? { ...d, maxBitrate } : d))
  commit(updated)
}

// Changing format restructures the format-specific fields: LPCM (code 1) uses
// bit depths; compressed formats use maxBitrate. Keeps the descriptor valid
// for the encoder (byte 3 is bit-depth byte vs max-bitrate byte).
function onFormat(descIndex: number, newFormat: number) {
  const updated = descriptors.value.map((d, i) => {
    if (i !== descIndex) return d
    if (newFormat === 1) {
      return { ...d, format: 1, bitDepths: { bd16: true, bd20: false, bd24: false }, maxBitrate: undefined }
    }
    return { ...d, format: newFormat, bitDepths: undefined, maxBitrate: d.maxBitrate ?? 0 }
  })
  commit(updated)
}

function removeDescriptor(index: number) {
  commit(removeArrayItem(descriptors.value, index))
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
  commit(appendArrayItem(descriptors.value, newDesc))
}

const selectClass = 'flex h-8 w-full rounded-md border border-input dark:bg-input/30 bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
const inlineSelectClass = 'flex h-8 rounded-md border border-input dark:bg-input/30 bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
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
          <div class="flex items-end justify-between gap-3 mb-3">
            <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex-1">
              Format
              <select
                :class="inlineSelectClass"
                :value="desc.format"
                @change="(e: Event) => onFormat(i, parseInt((e.target as HTMLSelectElement).value, 10))"
              >
                <option v-for="fmt in formatOptions" :key="fmt.code" :value="fmt.code">{{ fmt.name }}</option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">
              Channels (1–8)
              <Input type="number" :min="1" :max="8" :step="1" :model-value="desc.channels" @update:model-value="(v) => onChannels(i, v)" />
            </label>
            <Button
              variant="ghost"
              size="sm"
              class="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 self-end"
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
                    :model-value="(desc.samplingRates as Record<string, boolean>)[sr.key]"
                    @update:model-value="(v: boolean) => toggleSampleRate(i, sr.key, v)"
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
                    :model-value="(desc.bitDepths as Record<string, boolean>)[bd.key]"
                    @update:model-value="(v: boolean) => toggleBitDepth(i, bd.key, v)"
                  />
                  <span>{{ bd.label }}</span>
                </label>
              </div>
            </div>

            <div v-if="desc.maxBitrate !== undefined">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Max Bitrate (kHz)</p>
              <Input type="number" :min="0" :step="8" class="max-w-xs" :model-value="desc.maxBitrate" @update:model-value="(v) => onMaxBitrate(i, v)" />
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
