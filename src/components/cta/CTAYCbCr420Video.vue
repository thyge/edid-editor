<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, YCbCr420VideoDataBlock } from 'edidts'
import { getVICDefinition, svdCanBeNative } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import VicPicker from '../common/VicPicker.vue'
import { ctaAddBlockedReason } from './blockCapacity'

/**
 * YCbCr 4:2:0 Video Data Block editor (tag 0x07 ext 0x0E) — the 4:2:0-only
 * formats section of the former combined "HDR & Colorimetry" view, split per
 * block so each block has its own nav placement. Its SVDs use the same byte
 * encoding as the Video Data Block (8K VICs 193+ have no native flag).
 */
const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

const ycbcr420Video = computed(() =>
  props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x0e,
  ) as YCbCr420VideoDataBlock | undefined,
)

/** Each SVD is one byte; null when one more fits in the block and the extension. */
const addBlockedReason = computed(() => ctaAddBlockedReason(props.cea, ycbcr420Video.value, 1))

const NATIVE_ONLY_LOW_VICS = 'Only VICs 1–64 can be marked native (CTA-861 SVD encoding).'

/** Resolve the block's `dataBlocks` index and emit a prop-rooted edit path. */
function emitBlock(value: YCbCr420VideoDataBlock['vics']) {
  if (!ycbcr420Video.value) return
  const idx = props.cea.dataBlocks.findIndex(b => b === ycbcr420Video.value)
  if (idx !== -1) emit('update', `dataBlocks.${idx}.vics`, value)
}

function toggleNative(index: number, native: boolean) {
  if (!ycbcr420Video.value) return
  emitBlock(ycbcr420Video.value.vics.map((v, i) => (i === index ? { ...v, native } : v)))
}

function removeVic(index: number) {
  if (!ycbcr420Video.value) return
  emitBlock(ycbcr420Video.value.vics.filter((_, i) => i !== index))
}

function addVic(vic: number | null) {
  if (!ycbcr420Video.value || vic == null || addBlockedReason.value) return
  emitBlock([...ycbcr420Video.value.vics, { vic, native: false, known: getVICDefinition(vic) !== undefined }])
}

const usedVics = computed(() => ycbcr420Video.value?.vics.map(v => v.vic) ?? [])

function vicLabel(vic: number): string {
  if (vic === 0 || vic === 128) return `VIC ${vic}: reserved SVD value`
  const def = getVICDefinition(vic)
  if (!def) return `VIC ${vic}`
  return `VIC ${vic}: ${def.width}×${def.height}${def.interlaced ? 'i' : 'p'} @ ${def.refreshRate}Hz`
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>YCbCr 4:2:0 Only Formats</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <p v-if="!ycbcr420Video" class="text-muted-foreground">No YCbCr 4:2:0 Video Data Block present.</p>
      <template v-else>
        <div v-if="ycbcr420Video.vics.length > 0" class="space-y-1">
          <div
            v-for="(v, i) in ycbcr420Video.vics"
            :key="i"
            class="flex items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-2"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="font-mono text-xs text-muted-foreground w-14 shrink-0">VIC {{ v.vic }}</span>
              <span class="text-xs truncate">{{ vicLabel(v.vic) }}</span>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <label class="flex items-center gap-1.5 text-xs" :title="svdCanBeNative(v.vic) ? undefined : NATIVE_ONLY_LOW_VICS">
                <span class="text-muted-foreground">Native</span>
                <Switch
                  :model-value="v.native"
                  :disabled="!svdCanBeNative(v.vic)"
                  @update:model-value="(val: boolean) => toggleNative(i, val)"
                />
              </label>
              <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2" @click="removeVic(i)">
                Remove
              </Button>
            </div>
          </div>
        </div>
        <div class="border-t pt-3">
          <div :title="addBlockedReason ?? undefined">
            <VicPicker
              :model-value="null"
              :dtd-encodable-only="false"
              :exclude="usedVics"
              :disabled="addBlockedReason !== null"
              placeholder="Select VIC…"
              @update:model-value="addVic"
            />
          </div>
          <p v-if="addBlockedReason" class="mt-1 text-xs text-muted-foreground">{{ addBlockedReason }}</p>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
