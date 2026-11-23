<script setup lang="ts">
import { computed } from 'vue'
import {
  AUDIO_FORMAT_CODES,
  EXTENDED_AUDIO_FORMAT_CODES,
  AUDIO_SAMPLING_RATE_OPTIONS,
  AUDIO_BIT_DEPTH_OPTIONS,
} from 'edidts'
import type { CEAExtensionBlock, AudioDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { appendArrayItem, removeArrayItem, findDataBlockIndex } from '../common/editorUtils'
import { ctaAddBlockedReason } from './blockCapacity'

type Descriptor = AudioDataBlock['descriptors'][number]

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

/** Each Short Audio Descriptor is 3 bytes; null when one more fits. */
const addBlockedReason = computed(() => ctaAddBlockedReason(props.cea, audioBlock.value, 3))

const sampleRateLabels = AUDIO_SAMPLING_RATE_OPTIONS
const bitDepthLabels = AUDIO_BIT_DEPTH_OPTIONS

/** Extended format code of L-PCM 3D Audio (5-bit channel count, LPCM sample sizes). */
const EXT_LPCM_3D = 13
/** Extended format code of MPEG-H 3D Audio (byte 1 bits 2:0 are the level). */
const EXT_MPEG_H = 11

const addableFormats = AUDIO_FORMAT_CODES.filter(f => f.code >= 1)

/** Format options for an existing descriptor (keeps a reserved code 0 visible). */
function formatOptionsFor(desc: Descriptor) {
  return AUDIO_FORMAT_CODES.filter(f => f.code >= 1 || f.code === desc.format)
}

function extOptionsFor(desc: Descriptor) {
  const known = EXTENDED_AUDIO_FORMAT_CODES.some(f => f.code === desc.extendedFormat)
  return known || desc.extendedFormat === undefined
    ? EXTENDED_AUDIO_FORMAT_CODES
    : [{ code: desc.extendedFormat, name: `Unknown (${desc.extendedFormat})` }, ...EXTENDED_AUDIO_FORMAT_CODES]
}

const isLpcm3d = (d: Descriptor) => d.format === 15 && d.extendedFormat === EXT_LPCM_3D
const isMpegH = (d: Descriptor) => d.format === 15 && d.extendedFormat === EXT_MPEG_H
const maxChannels = (d: Descriptor) => (isLpcm3d(d) ? 32 : 8)

function commit(updated: AudioDataBlock['descriptors']) {
  emit('update', `dataBlocks.${blockIndex.value}.descriptors`, updated)
}

function patch(descIndex: number, p: Partial<Descriptor>) {
  commit(descriptors.value.map((d, i) => (i === descIndex ? { ...d, ...p } : d)))
}

function toNumber(v: string | number, min: number, max: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : min
}

function toggleSampleRate(descIndex: number, rateKey: string, value: boolean) {
  const d = descriptors.value[descIndex]
  if (d) patch(descIndex, { samplingRates: { ...d.samplingRates, [rateKey]: value } })
}

function toggleBitDepth(descIndex: number, bdKey: string, value: boolean) {
  const d = descriptors.value[descIndex]
  if (d) patch(descIndex, { bitDepths: { ...d.bitDepths!, [bdKey]: value } })
}

function onChannels(descIndex: number, v: string | number) {
  const d = descriptors.value[descIndex]
  if (d) patch(descIndex, { channels: toNumber(v, 1, maxChannels(d)) })
}

/** MPEG-H 3D Audio carries its level (0–7) where other formats carry channels − 1. */
function onMpegHLevel(descIndex: number, v: string | number) {
  patch(descIndex, { channels: toNumber(v, 0, 7) + 1 })
}

/** Byte 3 for formats 2-8: max bit rate ÷ 8 kb/s, so 0–2040 in steps of 8. */
function onMaxBitrate(descIndex: number, v: string | number) {
  patch(descIndex, { maxBitrate: toNumber(v, 0, 255 * 8) })
}

function onProfile(descIndex: number, v: string | number) {
  patch(descIndex, { profile: toNumber(v, 0, 255) })
}

function onExtendedFormatValue(descIndex: number, v: string | number) {
  patch(descIndex, { extendedFormatValue: toNumber(v, 0, 7) })
}

/**
 * The fields that belong to `format` (and, for 15, the extension code): byte 3
 * is reinterpreted per format, so switching formats rebuilds those fields and
 * drops the ones the new format does not use. Byte 1/2 fields carry over.
 */
function formatFields(d: Descriptor, format: number, extendedFormat?: number): Descriptor {
  const base: Descriptor = {
    format,
    channels: Math.min(d.channels, 8),
    samplingRates: { ...d.samplingRates },
  }
  if (d.f17) base.f17 = true
  if (d.f27) base.f27 = true
  const depths = d.bitDepths ?? { bd16: true, bd20: false, bd24: false }
  if (format === 1) {
    base.bitDepths = { ...depths }
  } else if (format >= 2 && format <= 8) {
    base.maxBitrate = d.maxBitrate ?? 0
  } else if (format >= 9 && format <= 14) {
    base.profile = 0
  } else if (format === 15) {
    const ext = extendedFormat ?? 4
    base.extendedFormat = ext
    if (ext === EXT_LPCM_3D) {
      base.bitDepths = { ...depths }
      // F17/F27 become channel-count bits in L-PCM 3D Audio.
      delete base.f17
      delete base.f27
      base.channels = d.channels
    } else {
      base.extendedFormatValue = 0
    }
  }
  return base
}

function onFormat(descIndex: number, newFormat: number) {
  commit(descriptors.value.map((d, i) => (i === descIndex ? formatFields(d, newFormat) : d)))
}

function onExtendedFormat(descIndex: number, ext: number) {
  commit(descriptors.value.map((d, i) => (i === descIndex ? formatFields(d, 15, ext) : d)))
}

function removeDescriptor(index: number) {
  commit(removeArrayItem(descriptors.value, index))
}

function addDescriptor(formatCode: number) {
  if (addBlockedReason.value) return
  const blank: Descriptor = {
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
  }
  commit(appendArrayItem(descriptors.value, formatFields(blank, formatCode)))
}

const selectClass = 'flex h-8 w-full rounded-md border border-input dark:bg-input/30 bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50 disabled:cursor-not-allowed'
const inlineSelectClass = 'flex h-8 rounded-md border border-input dark:bg-input/30 bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
const fieldLabelClass = 'text-[11px] uppercase tracking-wide text-muted-foreground mb-1'
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
                <option v-for="fmt in formatOptionsFor(desc)" :key="fmt.code" :value="fmt.code">{{ fmt.name }}</option>
              </select>
            </label>
            <label
              v-if="desc.format === 15"
              class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex-1"
            >
              Extended Format
              <select
                :class="inlineSelectClass"
                :value="desc.extendedFormat"
                @change="(e: Event) => onExtendedFormat(i, parseInt((e.target as HTMLSelectElement).value, 10))"
              >
                <option v-for="fmt in extOptionsFor(desc)" :key="fmt.code" :value="fmt.code">{{ fmt.name }}</option>
              </select>
            </label>
            <label v-if="isMpegH(desc)" class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-32">
              MPEG-H Level (0–7)
              <Input type="number" :min="0" :max="7" :step="1" :model-value="desc.channels - 1" @update:model-value="(v) => onMpegHLevel(i, v)" />
            </label>
            <label v-else class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-32">
              Channels (1–{{ maxChannels(desc) }})
              <Input type="number" :min="1" :max="maxChannels(desc)" :step="1" :model-value="desc.channels" @update:model-value="(v) => onChannels(i, v)" />
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
              <p :class="fieldLabelClass">Sampling Rates</p>
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
              <p :class="fieldLabelClass">Bit Depths</p>
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

            <div v-if="desc.format >= 2 && desc.format <= 8">
              <p :class="fieldLabelClass">Max Bit Rate (kb/s, 0–2040)</p>
              <Input type="number" :min="0" :max="2040" :step="8" class="max-w-xs" :model-value="desc.maxBitrate ?? 0" @update:model-value="(v) => onMaxBitrate(i, v)" />
            </div>

            <div v-if="desc.format >= 9 && desc.format <= 14">
              <p :class="fieldLabelClass">Format-dependent value (byte 3, 0–255)</p>
              <Input type="number" :min="0" :max="255" :step="1" class="max-w-xs" :model-value="desc.profile ?? 0" @update:model-value="(v) => onProfile(i, v)" />
            </div>

            <div v-if="desc.format === 15 && !isLpcm3d(desc)">
              <p :class="fieldLabelClass">Extension-dependent value (byte 3 bits 2:0, 0–7)</p>
              <Input type="number" :min="0" :max="7" :step="1" class="max-w-xs" :model-value="desc.extendedFormatValue ?? 0" @update:model-value="(v) => onExtendedFormatValue(i, v)" />
            </div>
          </div>
        </div>
      </div>
      <p v-else class="text-muted-foreground">No audio descriptors present.</p>

      <div class="border-t pt-3">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Add Audio Format</h4>
        <select
          :class="selectClass"
          :disabled="addBlockedReason !== null"
          :title="addBlockedReason ?? undefined"
          @change="(e: Event) => {
            const val = parseInt((e.target as HTMLSelectElement).value, 10)
            if (!isNaN(val)) { addDescriptor(val); (e.target as HTMLSelectElement).value = '' }
          }"
        >
          <option value="">Select format...</option>
          <option v-for="fmt in addableFormats" :key="fmt.code" :value="fmt.code">
            {{ fmt.name }}
          </option>
        </select>
        <p v-if="addBlockedReason" class="mt-1 text-xs text-muted-foreground">{{ addBlockedReason }}</p>
      </div>
    </CardContent>
  </Card>
</template>
