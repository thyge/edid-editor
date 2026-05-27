<script setup lang="ts">
import { computed } from 'vue'
import { VIC_TABLE, getVICDefinition } from 'edidts'
import type { CEAExtensionBlock, VideoDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

const videoBlock = computed(() =>
  props.cea.dataBlocks.find(b => b.tag === 0x02) as VideoDataBlock | undefined
)

const vics = computed(() => videoBlock.value?.vics ?? [])

const selectClass = 'flex h-8 w-full rounded-md border border-input dark:bg-input/30 bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

function getVicLabel(vic: number): string {
  const def = getVICDefinition(vic)
  if (!def) return `VIC ${vic} (Unknown)`
  return `${def.width}×${def.height}${def.interlaced ? 'i' : 'p'} @ ${def.refreshRate}Hz ${def.aspectRatio}`
}

function toggleNative(index: number, native: boolean) {
  const updated = vics.value.map((v, i) => i === index ? { ...v, native } : v)
  emit('update', 'videoBlock.vics', updated)
}

function removeVic(index: number) {
  const updated = vics.value.filter((_, i) => i !== index)
  emit('update', 'videoBlock.vics', updated)
}

function addVic(vicNumber: number) {
  const updated = [...vics.value, { vic: vicNumber, native: false }]
  emit('update', 'videoBlock.vics', updated)
}

const availableVics = computed(() =>
  VIC_TABLE.filter(v => !vics.value.some(sv => sv.vic === v.vic))
    .slice(0, 50)
)
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
            <span class="font-mono text-xs text-muted-foreground w-10 shrink-0">VIC {{ svd.vic }}</span>
            <span class="text-xs truncate">{{ getVicLabel(svd.vic) }}</span>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <label class="flex items-center gap-1.5 text-xs">
              <span class="text-muted-foreground">Native</span>
              <Switch :checked="svd.native" @update:checked="(v: boolean) => toggleNative(i, v)" />
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
        <select
          :class="selectClass"
          @change="(e: Event) => {
            const val = parseInt((e.target as HTMLSelectElement).value, 10)
            if (!isNaN(val)) { addVic(val); (e.target as HTMLSelectElement).value = '' }
          }"
        >
          <option value="">Select VIC...</option>
          <option v-for="vic in availableVics" :key="vic.vic" :value="vic.vic">
            VIC {{ vic.vic }} — {{ vic.name }}
          </option>
        </select>
      </div>
    </CardContent>
  </Card>
</template>
