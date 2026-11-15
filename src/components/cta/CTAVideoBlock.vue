<script setup lang="ts">
import { computed } from 'vue'
import { getVICDefinition, svdCanBeNative } from 'edidts'
import type { CEAExtensionBlock, VideoDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import VicPicker from '../common/VicPicker.vue'
import { appendArrayItem, removeArrayItem, findDataBlockIndex } from '../common/editorUtils'
import { ctaAddBlockedReason } from './blockCapacity'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

const blockIndex = computed(() => findDataBlockIndex(props.cea, 0x02))
const videoBlock = computed(() =>
  props.cea.dataBlocks.find(b => b.tag === 0x02) as VideoDataBlock | undefined
)

const vics = computed(() => videoBlock.value?.vics ?? [])
const vicsPath = computed(() => `dataBlocks.${blockIndex.value}.vics`)

/** Each SVD is one byte; null when one more fits in the block and the extension. */
const addBlockedReason = computed(() => ctaAddBlockedReason(props.cea, videoBlock.value, 1))

/** Native-flag tooltip: the SVD encoding can only flag VICs 1–64 as native. */
const NATIVE_ONLY_LOW_VICS = 'Only VICs 1–64 can be marked native (CTA-861 SVD encoding).'

function getVicLabel(vic: number): string {
  if (vic === 0 || vic === 128) return 'Reserved SVD value'
  const def = getVICDefinition(vic)
  if (!def) return `VIC ${vic} (Unknown)`
  return `${def.width}×${def.height}${def.interlaced ? 'i' : 'p'} @ ${def.refreshRate}Hz ${def.aspectRatio}`
}

function toggleNative(index: number, native: boolean) {
  const updated = vics.value.map((v, i) => i === index ? { ...v, native } : v)
  emit('update', vicsPath.value, updated)
}

function removeVic(index: number) {
  emit('update', vicsPath.value, removeArrayItem(vics.value, index))
}

function addVic(vicNumber: number | null) {
  if (vicNumber == null || addBlockedReason.value) return
  emit('update', vicsPath.value, appendArrayItem(vics.value, { vic: vicNumber, native: false, known: true }))
}

const usedVics = computed(() => vics.value.map(v => v.vic))
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>Video Data Block (SVDs)</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div v-if="vics.length > 0" class="space-y-1">
        <div
          v-for="(svd, i) in vics"
          :key="i"
          class="flex items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-2 hover:bg-muted/30 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0">
            <span class="font-mono text-xs text-muted-foreground w-14 shrink-0">VIC {{ svd.vic }}</span>
            <span class="text-xs truncate">{{ getVicLabel(svd.vic) }}</span>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <label
              class="flex items-center gap-1.5 text-xs"
              :title="svdCanBeNative(svd.vic) ? undefined : NATIVE_ONLY_LOW_VICS"
            >
              <span class="text-muted-foreground">Native</span>
              <Switch
                :model-value="svd.native"
                :disabled="!svdCanBeNative(svd.vic)"
                @update:model-value="(v: boolean) => toggleNative(i, v)"
              />
            </label>
            <Button
              variant="ghost"
              size="sm"
              class="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
              @click="removeVic(i)"
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
      <p v-else class="text-muted-foreground">No video descriptors present.</p>

      <div class="border-t pt-3">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Add Video Format</h4>
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
    </CardContent>
  </Card>
</template>
